/**
 * review.js — "Review today": SRS words due across all studied units.
 * Reuses the flashcard session engine from ui.js.
 */
import {
    initStore, onStoreAuthChanged, srsDueList, todayKey
} from './progress-store.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-config.js';

const summaryEl = document.getElementById('review-summary');
const startBtn = document.getElementById('start-review-btn');
const listContainer = document.getElementById('review-list-container');

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

async function loadDueWords(dueEntries) {
    const byUnit = new Map();
    dueEntries.forEach(e => {
        if (!e.unitId) return;
        if (!byUnit.has(e.unitId)) byUnit.set(e.unitId, new Set());
        byUnit.get(e.unitId).add(e.id);
    });

    const wanted = new Set(dueEntries.map(e => e.id));
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

function renderDuePreview(words) {
    if (!words.length || !listContainer) return;
    listContainer.innerHTML = `
        <div class="reveal visible" style="margin-top: .5rem;">
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
    listContainer.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
}

async function run(todayIso) {
    const dueEntries = srsDueList(todayIso).filter(e => e.next !== '9999-12-31');

    if (!dueEntries.length) {
        summaryEl.innerHTML = '&#127881; Nothing due today — come back tomorrow or keep learning new units!';
        return;
    }

    summaryEl.textContent = `You have ${dueEntries.length} word${dueEntries.length > 1 ? 's' : ''} due for review.`;
    const words = await loadDueWords(dueEntries);

    if (!words.length) {
        summaryEl.textContent = 'Due words could not be loaded (they may have been deleted).';
        return;
    }

    renderDuePreview(words);
    startBtn.hidden = false;
    startBtn.textContent = `Start review (${words.length} words)`;

    startBtn.onclick = () => {
        ensureFlashcardOverlay();
        // ui.js binds the session to this button id
        let btn = document.getElementById('flashcard-toggle-btn');
        if (!btn) {
            btn = document.createElement('button');
            btn.type = 'button';
            btn.id = 'flashcard-toggle-btn';
            btn.className = 'flashcard-toggle-btn';
            btn.style.display = 'none';
            document.body.appendChild(btn);
        }
        window.initFlashcard(words, null);
        btn.click();
        startBtn.hidden = true;
        summaryEl.textContent = 'Session in progress — grading updates each word\u2019s next review date.';
    };
}

document.addEventListener('DOMContentLoaded', async () => {
    initStore();
    const todayIso = todayKey();
    await run(todayIso);
    // Re-run once auth state settles so merged remote data is included
    onStoreAuthChanged(() => { /* store already re-hydrated; refresh counts */ });
});
