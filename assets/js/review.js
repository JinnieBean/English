/**
 * review.js — "Review today"
 * Two buckets:
 *   dueToday — SRS words whose next review date has arrived
 *   upcoming — words still in rotation but scheduled for later days
 *              ("Practice early" lets learners rehearse before due date)
 */
import {
    initStore, srsDueList, srsCounts, totalKnown, todayKey
} from './progress-store.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-config.js';

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
    const byUnit = new Map();
    entries.forEach(e => {
        if (!e.unitId) return;
        if (!byUnit.has(e.unitId)) byUnit.set(e.unitId, new Set());
        byUnit.get(e.unitId).add(e.id);
    });

    const wanted = new Set(entries.map(e => e.id));
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

    words.sort((a, b) => (a.word || '').localeCompare(b.word || ''));
    return words;
}

function renderPreview(words) {
    if (!words.length || !listContainer) { listContainer.innerHTML = ''; return; }
    listContainer.innerHTML = `
        <div style="margin-top:.5rem;">
            ${words.map(v => `
                <div class="vocab-item">
                    <div class="vocab-left">
                        <div class="vocab-word-group">
                            <span class="vocab-word">${v.word || ''}</span>
                        </div>
                        <div class="vocab-audio-group">
                            <span class="vocab-pronunciation">${v.pron || ''}</span>
                        </div>
                    </div>
                    <div class="vocab-right">
                        <p class="vocab-def">${v.def || ''}</p>
                    </div>
                </div>`).join('')}
        </div>`;
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

function chip(label, value) {
    return `<span class="rv-chip"><strong>${value}</strong> ${label}</span>`;
}

function render() {
    const todayIso = todayKey();
    const dueEntries = srsDueList(todayIso).filter(e => e.next !== '9999-12-31');
    const counts = srsCounts();
    const upcomingCount = Math.max(0, counts.learning - dueEntries.length);

    if (!summaryEl || !actionsEl) return;

    // Nothing studied at all yet
    if (totalKnown() === 0 && counts.learning === 0) {
        summaryEl.innerHTML =
            'Your review schedule is empty. Study a unit first &mdash; open ' +
            '<a href="book.html">Vocabulary</a>, pick a book and practise its flashcards. ' +
            'Words you mark as <em>Learning</em> or <em>Known</em> will appear here on their scheduled days.';
        actionsEl.innerHTML = `<a href="book.html" class="btn-retry" style="text-decoration:none;">Start learning</a>`;
        listContainer.innerHTML = '';
        _dueWords = []; _upcomingWords = [];
        return;
    }

    summaryEl.innerHTML = [
        chip('due today', dueEntries.length),
        chip('in rotation', counts.learning),
        chip('known overall', totalKnown())
    ].join('<span class="rv-sep">·</span>');

    const buttons = [];
    if (dueEntries.length) {
        buttons.push(`<button id="start-review-btn" class="btn-retry" style="text-decoration:none;">Start due review (${dueEntries.length})</button>`);
    }
    if (upcomingCount > 0) {
        buttons.push(`<button id="practice-upcoming-btn" class="btn-secondary rv-secondary" style="width:auto;">Practice upcoming (${upcomingCount})</button>`);
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
            // Far-future "today" returns every scheduled word; exclude graduated
            const allScheduled = srsDueList('9999-12-30').filter(e => e.next !== '9999-12-31');
            const upcomingEntries = allScheduled.filter(e => !dueEntries.some(d => d.id === e.id));
            _upcomingWords = await loadWordsFor(upcomingEntries);
            const b2 = document.getElementById('practice-upcoming-btn');
            if (b2) b2.onclick = () => startSession(_upcomingWords);
        }
    })();

    listContainer.innerHTML = '';
    if (dueEntries.length) {
        loadWordsFor(dueEntries).then(renderPreview);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initStore();
    render();

    // Refresh numbers shortly after any flashcard session closes
    let lastOpen = false;
    setInterval(() => {
        const isOpen = document.getElementById('flashcard-overlay')?.classList.contains('active');
        if (lastOpen && !isOpen) setTimeout(render, 300); // just closed → refresh
        lastOpen = !!isOpen;
    }, 1000);
});
