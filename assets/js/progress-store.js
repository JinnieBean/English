/**
 * progress-store.js — Unified learner progress store (local-first + optional cloud sync).
 *
 * Canonical shape (mirrored to Firestore users/{uid}/data/main when signed in):
 * {
 *   progress: { [unitId]: { known: [wordId...] } },
 *   bookmarks:{ [wordDocId]: {word,def,example,pron,unitId} },
 *   srs:      { [wordDocId]: { box, next:'YYYY-MM-DD', unitId } },
 *   activity: { 'YYYY-MM-DD': count }
 * }
 *
 * Legacy keys (progress-${unitId} arrays, vocab-bookmarks object) are migrated
 * once on first run. SRS intervals: 1 -> 3 -> 7 -> 14 days, then graduated.
 */
import { auth, db } from './firebase-config.js';
import {
    signInWithPopup, signInWithRedirect, getRedirectResult,
    GoogleAuthProvider, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const LS_KEY = 'tn-store-v1';
const LS_OWNER = 'tn-store-v1-owner'; // uid the local copy belongs to (null = anonymous)
export const SRS_INTERVALS = [1, 3, 7, 14]; // days per box

function blankState() {
    return { progress: {}, bookmarks: {}, srs: {}, activity: {} };
}

let state = null;
let currentUser = null;
let syncTimer = null;
let initialized = false;
let authResolved = false; // true once Firebase has restored/confirmed the session
const authCallbacks = [];
const authErrorCallbacks = [];

function localOwner() {
    try { return localStorage.getItem(LS_OWNER) || null; } catch { return null; }
}
function setLocalOwner(uid) {
    try {
        if (uid) localStorage.setItem(LS_OWNER, uid);
        else localStorage.removeItem(LS_OWNER);
    } catch { /* ignore */ }
}

/* ================= local persistence ================= */

function hydrate() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) { state = { ...blankState(), ...JSON.parse(raw) }; return; }
    } catch { /* corrupted -> rebuild */ }
    state = blankState();
    migrateLegacy();
    persistNow();
}

/** One-time migration from the pre-store localStorage keys. */
function migrateLegacy() {
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k || !k.startsWith('progress-')) continue;
            const unitId = k.slice('progress-'.length);
            let arr = [];
            try { arr = JSON.parse(localStorage.getItem(k) || '[]'); } catch { continue; }
            if (Array.isArray(arr) && unitId) {
                state.progress[unitId] = { known: [...new Set(arr)] };
            }
        }
        const bm = JSON.parse(localStorage.getItem('vocab-bookmarks') || '{}');
        Object.entries(bm).forEach(([id, val]) => { if (val) state.bookmarks[id] = val; });
    } catch { /* best effort */ }
}

export function persistNow() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch { /* quota */ }
}

function scheduleSync() {
    persistNow();
    if (!currentUser) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(pushToCloud, 1500);
}

/* ================= cloud sync ================= */

async function pushToCloud() {
    if (!currentUser || !state) return;
    try {
        await setDoc(doc(db, 'users', currentUser.uid, 'data', 'main'),
            { ...state, updatedAt: serverTimestamp() });
    } catch (e) {
        console.warn('[tn-store] cloud sync skipped:', e?.code || e?.message);
    }
}

async function pullAndMerge(uid) {
    try {
        const snap = await getDoc(doc(db, 'users', uid, 'data', 'main'));
        if (!snap.exists()) { await pushToCloud(); return; }
        const remote = snap.data();
        const merged = blankState();

        const unitIds = new Set([
            ...Object.keys(remote.progress || {}),
            ...Object.keys(state.progress || {})
        ]);
        unitIds.forEach(u => {
            const known = new Set([
                ...(remote.progress?.[u]?.known || []),
                ...(state.progress?.[u]?.known || [])
            ]);
            merged.progress[u] = { known: [...known] };
        });

        merged.srs = { ...(state.srs || {}) };
        Object.entries(remote.srs || {}).forEach(([id, r]) => {
            const l = merged.srs[id];
            const better = !l ||
                (r.box || 0) > (l.box || 0) ||
                ((r.box || 0) === (l.box || 0) && (r.next || '') > (l.next || ''));
            if (better) merged.srs[id] = r;
        });

        merged.bookmarks = { ...(remote.bookmarks || {}) };
        Object.entries(state.bookmarks || {}).forEach(([id, v]) => { merged.bookmarks[id] = v; });

        merged.activity = { ...(state.activity || {}) };
        Object.entries(remote.activity || {}).forEach(([d, c]) => {
            merged.activity[d] = Math.max(merged.activity[d] || 0, c || 0);
        });

        state = merged;
        persistNow();
        await pushToCloud();
    } catch (e) {
        console.warn('[tn-store] merge skipped:', e?.code || e?.message);
    }
}

/* ================= known words / badges ================= */

export function getKnownSet(unitId) {
    return new Set(state?.progress?.[unitId]?.known || []);
}

export function markKnown(unitId, wordId, isKnown) {
    if (!unitId) return;
    const entry = state.progress[unitId] || (state.progress[unitId] = { known: [] });
    const set = new Set(entry.known || []);
    if (isKnown) set.add(wordId); else set.delete(wordId);
    entry.known = [...set];
    scheduleSync();
}

export function totalKnown() {
    let n = 0;
    Object.values(state.progress || {}).forEach(p => { n += (p.known || []).length; });
    return n;
}

export function allProgress() { return state.progress || {}; }

/* ================= bookmarks ================= */

export function allBookmarks() { return state.bookmarks || {}; }
export function getBookmark(wordId) { return state.bookmarks?.[wordId] || null; }
export function setBookmark(wordId, data) {
    if (data) state.bookmarks[wordId] = data;
    else delete state.bookmarks[wordId];
    scheduleSync();
}

/* ================= activity & streak ================= */

export function todayKey(d = new Date()) { return d.toISOString().slice(0, 10); }

export function recordActivity(n = 1) {
    const k = todayKey();
    state.activity[k] = (state.activity[k] || 0) + n;
    scheduleSync();
}

export function getActivityMap() { return state.activity || {}; }

export function getStreak() {
    let streak = 0;
    const d = new Date();
    if (!((state.activity || {})[todayKey(d)] > 0)) d.setDate(d.getDate() - 1);
    while ((state.activity || {})[todayKey(d)] > 0) { streak++; d.setDate(d.getDate() - 1); }
    return streak;
}

/* ================= SRS ================= */

export function srsEntry(wordId) { return state.srs?.[wordId] || null; }

export function srsDueList(todayIso = todayKey()) {
    return Object.entries(state.srs || {})
        .filter(([, e]) => (e.next || '') <= todayIso && e.next !== '' )
        .map(([id, e]) => ({ id, ...e }));
}

export function srsCounts() {
    let learning = 0, due = 0;
    const t = todayKey();
    Object.values(state.srs || {}).forEach(e => {
        if (e.next === '9999-12-31') return;
        if ((e.box || 0) >= 0 && e.next) {
            learning++;
            if ((e.next || '') <= t) due++;
        }
    });
    return { learning, due };
}

/** Grade a word after a flashcard/quiz answer and advance its SRS box. */
export function srsGrade(wordId, unitId, wasKnown) {
    const e = state.srs[wordId] || { box: 0, next: '', unitId: unitId || null };
    const d = new Date();
    if (wasKnown) {
        e.box = (e.box || 0) + 1;
        const days = SRS_INTERVALS[Math.min(e.box - 1, SRS_INTERVALS.length - 1)];
        d.setDate(d.getDate() + days);
        e.next = d.toISOString().slice(0, 10);
        if (e.box > SRS_INTERVALS.length) e.next = '9999-12-31'; // graduated
    } else {
        e.box = 0;
        d.setDate(d.getDate() + 1);
        e.next = d.toISOString().slice(0, 10);
    }
    e.unitId = unitId || e.unitId || null;
    state.srs[wordId] = e;
    recordActivity(1);
    scheduleSync();
    return e;
}

/* ================= auth ================= */

export function getUser() { return currentUser; }

/** True once Firebase has resolved the initial auth state (session restored
 *  or confirmed signed-out). UI should hold off rendering auth-dependent
 *  states until then to avoid a "Sign in" flash on navigation. */
export function isAuthResolved() { return authResolved; }

/**
 * Google sign-in with resilient fallbacks:
 *  1. Try the popup (nicest UX).
 *  2. If the environment blocks popups or the domain isn't authorized
 *     (e.g. 127.0.0.1 is NOT auto-authorized like localhost is), fall back
 *     to a full-page redirect flow which survives those restrictions.
 * Returns 'popup' | 'redirecting'. Throws for user-cancelled or hard errors.
 */
export async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
        await signInWithPopup(auth, provider);
        return 'popup';
    } catch (err) {
        const code = err?.code || '';
        if (code === 'auth/popup-closed-by-user') throw err; // deliberate close — do nothing
        const fallbackable = new Set([
            'auth/popup-blocked',
            'auth/cancelled-popup-request',
            'auth/unauthorized-domain',
            'auth/operation-not-supported-in-this-environment',
            'auth/internal-error'
        ]);
        if (fallbackable.has(code)) {
            await signInWithRedirect(auth, provider);
            return 'redirecting'; // page navigates away; onAuthStateChanged resumes after return
        }
        throw err;
    }
}

export async function signOutUser() {
    await signOut(auth);
}

export function onStoreAuthChanged(cb) {
    authCallbacks.push(cb);
    if (initialized) cb(currentUser);
}

/** Subscribe to sign-in errors coming from the redirect flow. */
export function onAuthError(cb) {
    authErrorCallbacks.push(cb);
}

export function initStore() {
    if (initialized) return;
    initialized = true;
    hydrate();
    onAuthStateChanged(auth, async (u) => {
        currentUser = u;
        authResolved = true;
        if (u) {
            const owner = localOwner();
            if (owner && owner !== u.uid) {
                // Another account last used this browser — never merge their
                // local data into this account; start from the cloud copy.
                state = blankState();
                persistNow();
            }
            setLocalOwner(u.uid);
            await pullAndMerge(u.uid);
        } else {
            // Signed out: account data lives in the cloud only; this device
            // starts a fresh anonymous (local-only) state.
            state = blankState();
            persistNow();
            setLocalOwner(null);
        }
        authCallbacks.forEach(cb => { try { cb(currentUser); } catch {} });
    });

    // Flush pending cloud writes when the page is hidden/closed so the last
    // graded cards are not lost to the 1.5s debounce.
    const flushSync = () => {
        if (!syncTimer) return;
        clearTimeout(syncTimer);
        syncTimer = null;
        pushToCloud();
    };
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') flushSync();
    });
    window.addEventListener('pagehide', flushSync);

    // Surface errors from the full-page redirect sign-in flow
    try {
        getRedirectResult(auth).catch(err => {
            authErrorCallbacks.forEach(cb => { try { cb(err); } catch {} });
        });
    } catch { /* noop */ }
}
