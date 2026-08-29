/**
 * utils.js — Shared helpers used by both the public site and the admin panel.
 */

/**
 * Escape a string for safe interpolation into HTML.
 * Use this for ALL Firestore-sourced text rendered via innerHTML.
 */
export function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Debounce: delay fn execution until `ms` of silence. */
export function debounce(fn, ms = 250) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

/** Format seconds as m:ss. */
export function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

/** Normalize a string for accent-insensitive (Vietnamese friendly) search. */
export function normalizeSearch(s) {
    return (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd');
}

/** Map a Firestore error to a short, human-friendly message. */
export function friendlyError(err) {
    const code = err?.code || '';
    const msg = err?.message || String(err || '');
    if (code.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
        return 'Permission denied — check Firestore rules.';
    }
    if (code.includes('unavailable') || code.includes('network')) {
        return 'Network error — check your connection and retry.';
    }
    if (code.includes('too-many-requests')) {
        return 'Too many attempts — please wait a moment.';
    }
    if (code.includes('wrong-password')) return 'Wrong password.';
    if (code.includes('user-not-found')) return 'No account found with this email.';
    if (code.includes('invalid-credential') || code.includes('invalid-login-credentials')) {
        return 'Invalid email or password.';
    }
    // Strip technical prefixes like "Failed to save book.: "
    return msg.replace(/^[^:]+:\s*/, '').slice(0, 160);
}

/** Minimal HTML sanitiser for admin-authored rich text (TinyMCE output).
 *  Removes script/style blocks, on* attributes and javascript: URLs while
 *  keeping ordinary formatting tags intact. */
export function sanitizeRichText(html) {
    if (!html) return '';
    let out = String(html);
    out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    out = out.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
    out = out.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    out = out.replace(/(href|src)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*'|javascript:[^\s>]*)/gi, '$1="#"');
    return out;
}

/* =========================================================
   LONGMAN AUDIO VERSION HANDLING
   ldoceonline.com rotates its audio URLs' ?version= query
   (e.g. beat1.mp3?version=1.2.89 -> ?version=1.2.90).
   Old URLs stored in the database keep working because every
   player normalises the URL through applyAudioVersion().
   When Longman bumps the version, ONLY this constant changes.
   ========================================================= */
export const AUDIO_VERSION = '1.2.91';

const AUDIO_VERSIONED_HOST = /(^|\.)ldoceonline\.com$/i;

/** Force the current audio version onto a Longman audio URL.
 *  Non-Longman URLs are returned untouched. */
export function applyAudioVersion(url) {
    if (!url || typeof url !== 'string') return url;
    try {
        const u = new URL(url);
        if (!AUDIO_VERSIONED_HOST.test(u.hostname)) return url;
        u.searchParams.delete('version');
        u.searchParams.set('version', AUDIO_VERSION);
        return u.toString();
    } catch {
        return url;
    }
}

/* =========================================================
   RESUME — remembers the last studied unit/lesson per device
   (localStorage only; it's a convenience shortcut, not data)
   ========================================================= */
const LAST_STUDIED_KEY = 'tn-last-studied';

export function recordLastStudied(entry) {
    try { localStorage.setItem(LAST_STUDIED_KEY, JSON.stringify(entry)); } catch { /* ignore */ }
}

export function getLastStudied(maxAgeDays = 30) {
    try {
        const e = JSON.parse(localStorage.getItem(LAST_STUDIED_KEY) || 'null');
        if (!e || !e.page || !e.id) return null;
        if (Date.now() - (e.ts || 0) > maxAgeDays * 864e5) return null;
        return e;
    } catch { return null; }
}
