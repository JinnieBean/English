/**
 * bookmarks.js — Bookmarked words page.
 * Reads allBookmarks() ({wordDocId: {word,def,example,pron,unitId}}),
 * groups entries by unit and offers remove + jump-back-to-unit actions.
 */
import {
    initStore, onStoreAuthChanged, allBookmarks, setBookmark
} from './progress-store.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-config.js';
import { escapeHtml } from './utils.js';

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

async function render() {
    const list = document.getElementById('bm-list');
    if (!list) return;

    const marks = Object.entries(allBookmarks());
    if (!marks.length) {
        list.innerHTML = `
            <div class="rv-empty">
                <span class="rv-empty-icon">&#9734;</span>
                <p>No bookmarked words yet. Open any unit and press the
                &#9734; button next to a word to keep it here.</p>
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
            .map(b => `
            <div class="vocab-item bm-item reveal">
                <button type="button" class="bookmark-btn active" data-id="${escapeHtml(b.id)}"
                    title="Remove bookmark" aria-label="Remove bookmark" aria-pressed="true">&#9733;</button>
                <div class="vocab-left">
                    <div class="vocab-word-group">
                        <span class="vocab-word">${escapeHtml(b.word || '')}</span>
                    </div>
                    <div class="vocab-audio-group">
                        <span class="vocab-pronunciation">${escapeHtml(b.pron || '')}</span>
                    </div>
                </div>
                <div class="vocab-right">
                    <p class="vocab-def">${escapeHtml(b.def || '')}</p>
                    ${b.example ? `<p class="vocab-example">${escapeHtml(b.example)}</p>` : ''}
                </div>
            </div>`).join('');
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
