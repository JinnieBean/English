/**
 * review.js — "Review today"
 * Two buckets:
 *   dueToday — SRS words whose next review date has arrived
 *   upcoming — words still in rotation but scheduled for later days
 *              ("Practice early" lets learners rehearse before due date)
 */
import {
    initStore, srsDueList, totalKnown, todayKey,
    onStoreAuthChanged, getUser, isAuthResolved
} from './progress-store.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-config.js';
import { escapeHtml } from './utils.js';
import { isLoadable, loadSrcCards } from './card-loader.js';

const summaryEl = document.getElementById('review-summary');
const actionsEl = document.getElementById('review-actions');
const listContainer = document.getElementById('review-list-container');

let _dueWords = [];
let _upcomingWords = [];

function ensureFlashcardOverlay() {
    if (document.getElementById('flashcard-overlay')) return;
    document.body.insertAdjacentHTML('beforeend', `
        <div class="flashcard-overlay" id="flashcard-overlay" aria-hidden="true">
            <div class="flashcard-modal" role="dialog" aria-modal="true" aria-label="Flashcard practice">
                <button class="flashcard-close" id="flashcard-close" data-fc-action="close" aria-label="Close">&times;</button>
                <div class="flashcard-counter" id="fc-counter" aria-live="polite">1 / 1</div>
                <div class="flashcard-progress-bar">
                    <div class="flashcard-progress-fill" id="fc-progress-fill" style="width:0%"></div>
                </div>
                <div class="flashcard-card" id="flashcard-card-area"></div>
                <div class="flashcard-actions"></div>
            </div>
        </div>`);
}

async function loadWordsFor(entries) {
    const vocabEntries = entries.filter(e => !e.src);
    const srcEntries = entries.filter(e => e.src);

    const byUnit = new Map();
    vocabEntries.forEach(e => {
        if (!e.unitId) return;
        if (!byUnit.has(e.unitId)) byUnit.set(e.unitId, new Set());
        byUnit.get(e.unitId).add(e.id);
    });

    const wanted = new Set(vocabEntries.map(e => e.id));
    const words = [];

    await Promise.all([...byUnit.keys()].map(async unitId => {
        try {
            const snap = await getDocs(query(collection(db, 'vocabularies'), where('unitId', '==', unitId)));
            snap.docs.forEach(d => {
                if (!wanted.has(d.id)) return;
                const v = { id: d.id, ...d.data() };
                if (v.status === 'draft') return;
                words.push(v);
            });
        } catch (e) {
            console.warn('[review] failed to load unit', unitId, e);
        }
    }));

    // src-tagged cards (phrasal/prep/pattern/wordform/lexical + lesson cards)
    // are rebuilt by the shared card-loader.
    try {
        words.push(...await loadSrcCards(srcEntries));
    } catch (e) {
        console.warn('[review] failed to load src cards', e);
    }

    words.sort((a, b) => (a.word || '').localeCompare(b.word || ''));
    return words;
}

function renderPreview(words) {
    if (!listContainer) return;
    if (!words.length) {
        listContainer.innerHTML = '';
        return;
    }
    listContainer.innerHTML = `
        <section class="rv-panel">
            <h3 class="rv-panel-title">Due today &mdash; preview</h3>
            ${words.map(v => `
                <div class="rv-word-row">
                    <div class="rv-word-main">
                        <span class="rv-word">${escapeHtml(v.word || '')}</span>
                        <span class="rv-pron">${escapeHtml(v.pron || '')}</span>
                        ${v.src ? `<span class="rv-src">${escapeHtml(v.src.replace(/_/g, ' '))}</span>` : ''}
                    </div>
                    <p class="rv-def">${escapeHtml(v.def || '')}</p>
                </div>`).join('')}
        </section>`;
}

/** Start a mixed-unit flashcard session (unitId=null → per-card grading). */
function startSession(words) {
    ensureFlashcardOverlay();
    let btn = document.getElementById('flashcard-toggle-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'flashcard-toggle-btn';
        btn.className = 'flashcard-toggle-btn';
        btn.style.display = 'none';
        document.body.appendChild(btn);
    }
    window.initFlashcard(words, null); // explicit null → per-card unit grading
    btn.click();
}

/* ---------- rendering ---------- */

function setStat(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = String(value);
}

function renderSyncNote() {
    const el = document.getElementById('review-sync-note');
    if (!el) return;
    if (!isAuthResolved()) {
        el.innerHTML = 'Checking sync status&hellip;';
        return;
    }
    const u = getUser();
    el.innerHTML = u
        ? `&#9729; Synced to <strong>${escapeHtml(u.email || 'your account')}</strong>`
        : '&#128190; Local only &mdash; sign in with Google (sidebar) to sync your review schedule across devices.';
}

function renderEmptySchedule() {
    summaryEl.innerHTML = '';
    actionsEl.innerHTML = '';
    if (listContainer) listContainer.innerHTML = `
        <div class="rv-empty">
            <span class="rv-empty-icon">&#128218;</span>
            <p>Your review schedule is empty. Study a unit first &mdash; open
            <a href="book.html">Vocabulary</a>, pick a book and practise its flashcards.
            Words you mark as <em>Known</em> or <em>Still learning</em> will appear here
            on their scheduled days.</p>
            <a href="book.html" class="btn-retry">Start learning</a>
        </div>`;
}

function render() {
    if (!summaryEl || !actionsEl) return;

    // Hold off until the session is resolved so the numbers don't flash
    // local→cloud. The auth callback re-triggers render() once settled.
    if (!isAuthResolved()) {
        summaryEl.innerHTML = 'Checking your schedule&hellip;';
        actionsEl.innerHTML = '';
        if (listContainer) listContainer.innerHTML = '';
        return;
    }

    const todayIso = todayKey();
    // Graduated words are out; every other card is loadable — vocabularies
    // directly, src-tagged ones rebuilt through card-loader.js.
    const loadable = isLoadable;
    const dueEntries = srsDueList(todayIso).filter(loadable);
    const scheduled = srsDueList('9999-12-30').filter(loadable);
    const upcomingEntries = scheduled.filter(e => (e.next || '') > todayIso);
    const upcomingCount = upcomingEntries.length;

    setStat('rv-due', dueEntries.length);
    setStat('rv-rotation', scheduled.length);
    setStat('rv-known', totalKnown());
    renderSyncNote();

    // Nothing studied at all yet
    if (totalKnown() === 0 && scheduled.length === 0) {
        renderEmptySchedule();
        _dueWords = []; _upcomingWords = [];
        return;
    }

    summaryEl.innerHTML = dueEntries.length
        ? `<strong>${dueEntries.length}</strong> word${dueEntries.length === 1 ? '' : 's'} waiting for you today.`
        : 'All caught up for today &mdash; nice work!';

    const buttons = [];
    if (dueEntries.length) {
        buttons.push(`<button id="start-review-btn" class="btn-retry">Start due review (${dueEntries.length})</button>`);
    }
    if (upcomingCount > 0) {
        buttons.push(`<button id="practice-upcoming-btn" class="rv-secondary">Practice upcoming (${upcomingCount})</button>`);
    }
    actionsEl.innerHTML = buttons.join(' ');

    // wire buttons asynchronously (word loading)
    (async () => {
        if (dueEntries.length) {
            _dueWords = await loadWordsFor(dueEntries);
            const b = document.getElementById('start-review-btn');
            if (b) b.onclick = () => startSession(_dueWords);
        }
        if (upcomingCount > 0) {
            _upcomingWords = await loadWordsFor(upcomingEntries);
            const b2 = document.getElementById('practice-upcoming-btn');
            if (b2) b2.onclick = () => startSession(_upcomingWords);
        }
    })();

    if (dueEntries.length) {
        loadWordsFor(dueEntries).then(renderPreview);
    } else {
        renderPreview([]);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initStore();
    render();

    // Re-render once the cloud copy is merged in after sign-in/sign-out
    onStoreAuthChanged(() => render());

    // Refresh numbers shortly after any flashcard session closes
    let lastOpen = false;
    setInterval(() => {
        const isOpen = document.getElementById('flashcard-overlay')?.classList.contains('active');
        if (lastOpen && !isOpen) setTimeout(render, 300); // just closed → refresh
        lastOpen = !!isOpen;
    }, 1000);
});
