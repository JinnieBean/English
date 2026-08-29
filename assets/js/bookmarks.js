/**
 * bookmarks.js — Bookmarked words page.
 * Reads allBookmarks() ({bmId: {word,def,example,pron,unitId,src?,sid?}}),
 * groups entries by unit and offers remove + jump-back-to-unit actions,
 * a flashcard/quiz session over the starred cards, and TXT/JSON export.
 */
import {
    initStore, onStoreAuthChanged, allBookmarks, setBookmark
} from './progress-store.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-config.js';
import { escapeHtml } from './utils.js';

/* src tag -> the unit_* page that hosts the row (for jump-back links) */
const SRC_PAGE = {
    undefined: 'unit_detail.html',
    phrasal: 'unit_phrasal.html',
    prep: 'unit_prep.html',
    pattern: 'unit_pattern.html',
    wordform: 'unit_wordform.html',
    lexical: 'unit_lexical.html'
};
const SRC_LABEL = {
    phrasal: 'Phrasal', prep: 'Prep phrase', pattern: 'Pattern',
    wordform: 'Word form', lexical: 'Lexical'
};

async function fetchUnitTitles() {
    try {
        const snap = await getDocs(collection(db, 'units'));
        const titles = {};
        snap.docs.forEach(d => { titles[d.id] = d.data().title; });
        return titles;
    } catch {
        return {}; // unit titles are cosmetic — fall back to raw ids
    }
}

/** Flashcard-shaped card from a stored bookmark (self-contained payload). */
function cardFromBookmark(id, b) {
    return {
        id: b.sid || id,
        word: b.word || '', def: b.def || '', example: b.example || '',
        pron: b.pron || '', audio: '', unitId: b.unitId || null,
        src: b.src || undefined
    };
}

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

function hiddenToolBtn(id, cls) {
    let btn = document.getElementById(id);
    if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.id = id;
        btn.className = cls;
        btn.style.display = 'none';
        document.body.appendChild(btn);
    }
    return btn;
}

function startFlashcards(cards) {
    ensureFlashcardOverlay();
    const toggle = hiddenToolBtn('flashcard-toggle-btn', 'flashcard-toggle-btn');
    window.initFlashcard(cards, null); // per-card grading (unitId from payload)
    toggle.click();
}

function startQuiz(cards) {
    const toggle = hiddenToolBtn('quiz-toggle-btn', 'flashcard-toggle-btn');
    window.initQuiz(cards);
    toggle.click();
}

function downloadFile(name, text, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

function exportTxt(marks) {
    const body = marks.map(([id, b]) => {
        const tag = b.src ? ` [${SRC_LABEL[b.src] || b.src}]` : '';
        const ex = b.example ? `\n    ${b.example}` : '';
        return `${b.word || id}${tag} — ${b.def || ''}${ex}`;
    }).join('\n');
    downloadFile('bookmarks.txt', body, 'text/plain;charset=utf-8');
}

function exportJson(marks) {
    const data = marks.map(([id, b]) => ({ id, ...b }));
    downloadFile('bookmarks.json', JSON.stringify(data, null, 2), 'application/json');
}

function renderToolbar(marks) {
    const bar = document.getElementById('bm-toolbar');
    if (!bar) return;
    if (!marks.length) { bar.innerHTML = ''; return; }
    const cards = marks.map(([id, b]) => cardFromBookmark(id, b)).filter(c => c.word && c.def);
    bar.innerHTML = `
        <div class="bm-tools">
            <button type="button" class="flashcard-toggle-btn" id="bm-fc-btn" ${cards.length ? '' : 'disabled'}>&#127924; Flashcards (${cards.length})</button>
            ${cards.length >= 4 ? '<button type="button" class="flashcard-toggle-btn" id="bm-qz-btn">&#10067; Quiz</button>' : ''}
            <span class="bm-tools-spacer"></span>
            <button type="button" class="rv-secondary" id="bm-export-txt">&#8681; Export .txt</button>
            <button type="button" class="rv-secondary" id="bm-export-json">&#8681; Export .json</button>
        </div>`;
    bar.querySelector('#bm-fc-btn')?.addEventListener('click', () => startFlashcards(cards));
    bar.querySelector('#bm-qz-btn')?.addEventListener('click', () => startQuiz(cards));
    bar.querySelector('#bm-export-txt')?.addEventListener('click', () => exportTxt(marks));
    bar.querySelector('#bm-export-json')?.addEventListener('click', () => exportJson(marks));
}

async function render() {
    const list = document.getElementById('bm-list');
    if (!list) return;

    const marks = Object.entries(allBookmarks());
    renderToolbar(marks);
    if (!marks.length) {
        list.innerHTML = `
            <div class="rv-empty">
                <span class="rv-empty-icon">&#9734;</span>
                <p>No bookmarked words yet. Open any unit and press the
                &#9734; button next to a word to keep it here.
                Stars work on all six unit tabs &mdash; vocabulary, phrasal verbs,
                prepositional phrases, word forms, patterns and lexical expansions.</p>
                <a href="book.html" class="btn-retry">Browse vocabulary</a>
            </div>`;
        return;
    }

    const titles = await fetchUnitTitles();

    const groups = {};
    marks.forEach(([id, b]) => {
        const key = b?.unitId || '_other';
        (groups[key] ||= []).push({ id, ...(b || {}) });
    });

    const groupIds = Object.keys(groups).sort((a, b) => {
        if (a === '_other') return 1;
        if (b === '_other') return -1;
        return (titles[a] || a).localeCompare(titles[b] || b);
    });

    list.innerHTML = groupIds.map(uid => {
        const title = uid === '_other' ? 'Other words' : (titles[uid] || 'Unit');
        const unitLink = uid === '_other' ? '' :
            `<a class="bm-unit-link" href="unit_detail.html?id=${encodeURIComponent(uid)}">Open unit &rarr;</a>`;
        const rows = groups[uid]
            .sort((a, b) => (a.word || '').localeCompare(b.word || ''))
            .map(b => {
                const page = SRC_PAGE[b.src] || 'unit_detail.html';
                const jump = uid === '_other' ? '' :
                    `<a class="bm-jump" href="${page}?id=${encodeURIComponent(uid)}" title="Open in unit">&#8599;</a>`;
                return `
            <div class="vocab-item bm-item reveal">
                <button type="button" class="bookmark-btn active" data-id="${escapeHtml(b.id)}"
                    title="Remove bookmark" aria-label="Remove bookmark" aria-pressed="true">&#9733;</button>
                <div class="vocab-left">
                    <div class="vocab-word-group">
                        <span class="vocab-word">${escapeHtml(b.word || '')}</span>
                        ${b.src ? `<span class="rv-src">${escapeHtml(SRC_LABEL[b.src] || b.src)}</span>` : ''}
                        ${jump}
                    </div>
                    <div class="vocab-audio-group">
                        <span class="vocab-pronunciation">${escapeHtml(b.pron || '')}</span>
                    </div>
                </div>
                <div class="vocab-right">
                    <p class="vocab-def">${escapeHtml(b.def || '')}</p>
                    ${b.example ? `<p class="vocab-example">${escapeHtml(b.example)}</p>` : ''}
                </div>
            </div>`;
            }).join('');
        return `
            <section class="bm-group">
                <div class="bm-group-head">
                    <h3 class="bm-unit-title">${escapeHtml(title)} <span class="bm-count">${groups[uid].length}</span></h3>
                    ${unitLink}
                </div>
                ${rows}
            </section>`;
    }).join('');

    list.querySelectorAll('.bookmark-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setBookmark(btn.dataset.id, null);
            render();
        });
    });

    requestAnimationFrame(() => window.initRevealAnimations?.());
}

document.addEventListener('DOMContentLoaded', () => {
    initStore();
    render();
    // cloud merge may add/remove bookmarks once the session resolves
    onStoreAuthChanged(() => render());
});
