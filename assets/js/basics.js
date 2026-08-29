/**
 * basics.js — Engine for the Basics pages (overview + topic).
 * Reads static data from basics-data.js; progress lives in progress-store.js
 * (map `basics`: key `topic:<id>` = learned, `items:<id>` = per-item ticks).
 * TTS calls speechSynthesis directly (US/UK accent switch) and uses its own
 * .basics-tts class so it never clashes with ui.js's global .audio-tts-btn.
 */
import { escapeHtml } from './utils.js';
import {
    initStore, onStoreAuthChanged, recordActivity,
    basicsTopicLearned, setBasicsTopicLearned, basicsItemSet, toggleBasicsItem
} from './progress-store.js';
import {
    BASICS_GROUPS, allTopics, countItems, findTopic, topicNeighbors
} from './basics-data.js';

const overviewEl = document.getElementById('basics-overview-container');
const topicEl = document.getElementById('basics-topic-container');

const SPEAKER_SVG = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>';

/* ================= TTS (US/UK) ================= */

let accent = 'us';
try { accent = localStorage.getItem('basics-accent') === 'uk' ? 'uk' : 'us'; } catch { /* ignore */ }

function langCode() { return accent === 'uk' ? 'en-GB' : 'en-US'; }

function speak(text) {
    if (!text || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const want = langCode().toLowerCase();
    utter.lang = langCode();
    const voices = window.speechSynthesis.getVoices();
    const match = voices.find(v => (v.lang || '').replace('_', '-').toLowerCase() === want);
    if (match) utter.voice = match;
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
}

/* Delegated: every .basics-tts button on either page */
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.basics-tts');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    speak(btn.dataset.say || '');
});

/* ================= Overview ================= */

function renderOverview() {
    if (!overviewEl) return;
    const flat = allTopics();
    const totalItems = flat.reduce((n, t) => n + countItems(t), 0);
    const learnedCount = flat.filter(t => basicsTopicLearned(t.id)).length;

    let html = `
        <section class="basics-hero">
            <h1 class="basics-hero-title">Language Basics</h1>
            <p class="basics-hero-desc">The building blocks of English: the alphabet, IPA sounds, question words,
                introductions and how to say every number with confidence.</p>
            <p class="basics-hero-meta">
                <span>${flat.length} topics</span><span class="basics-meta-dot">·</span>
                <span>${totalItems} items</span><span class="basics-meta-dot">·</span>
                <span>${learnedCount} learned</span>
            </p>
        </section>`;

    let n = 0;
    for (const group of BASICS_GROUPS) {
        html += `<section class="basics-group">
            <h2 class="basics-group-title">${escapeHtml(group.title)}</h2>
            <div class="basics-grid">`;
        for (const topic of group.topics) {
            n += 1;
            const total = countItems(topic);
            const learned = basicsTopicLearned(topic.id);
            const ticked = topic.layout === 'grid-check' ? basicsItemSet(topic.id).size : 0;
            html += `
                <a class="basics-card${learned ? ' is-learned' : ''}" href="basics_topic.html?id=${encodeURIComponent(topic.id)}">
                    <div class="basics-card-top">
                        <span class="basics-card-num">${String(n).padStart(2, '0')}</span>
                        ${learned ? '<span class="basics-card-check" title="Learned">&#10003;</span>' : ''}
                    </div>
                    <h3 class="basics-card-title">${escapeHtml(topic.title)}</h3>
                    <p class="basics-card-desc">${escapeHtml(topic.desc)}</p>
                    <div class="basics-card-meta">
                        <span>${total} items</span>
                        ${topic.layout === 'grid-check' && ticked ? `<span class="basics-card-ticked">${ticked}/${total} ticked</span>` : ''}
                    </div>
                </a>`;
        }
        html += `</div></section>`;
    }
    overviewEl.innerHTML = html;
}

/* ================= Topic page ================= */

function renderTopic() {
    if (!topicEl) return;
    const id = new URLSearchParams(location.search).get('id');
    const found = id ? findTopic(id) : null;
    if (!found) {
        topicEl.innerHTML = `<p class="basics-notfound">Topic not found.
            <a href="basics.html">&larr; Back to Basics</a></p>`;
        return;
    }
    const { topic } = found;
    const { prev, next } = topicNeighbors(topic.id);
    const learned = basicsTopicLearned(topic.id);
    const total = countItems(topic);

    document.title = `${topic.title} — Basics — Thor's Notes`;
    window.renderBreadcrumb?.([
        { label: 'Home', href: 'index.html' },
        { label: 'Basics', href: 'basics.html' },
        { label: topic.title }
    ]);

    let body = '';
    if (topic.layout === 'grid-check') body = gridCheckHtml(topic);
    else if (topic.layout === 'tabs') body = tabsHtml(topic);
    else body = `<div class="basics-table-wrap">${tableHtml(topic.items)}</div>`;

    topicEl.innerHTML = `
        <div class="basics-topic-head">
            <div class="basics-topic-headline">
                <span class="basics-topic-group">${escapeHtml(topic.groupTitle)}</span>
                <h1 class="basics-topic-title">${escapeHtml(topic.title)}</h1>
                <p class="basics-topic-desc">${escapeHtml(topic.desc)}</p>
                <p class="basics-topic-count">${total} items</p>
            </div>
            <div class="basics-topic-actions">
                <div class="basics-accent" role="group" aria-label="Choose accent">
                    <button type="button" class="basics-accent-btn${accent === 'us' ? ' active' : ''}" data-accent="us" title="American accent">US</button>
                    <button type="button" class="basics-accent-btn${accent === 'uk' ? ' active' : ''}" data-accent="uk" title="British accent">UK</button>
                </div>
                <button type="button" id="basics-learned-btn" class="basics-learned-btn${learned ? ' learned' : ''}" aria-pressed="${learned}">
                    ${learned ? '&#10003; Learned' : '&#9711; Mark as learned'}
                </button>
            </div>
        </div>
        ${body}
        <nav class="basics-pn" aria-label="Previous / next topic">
            ${prev ? `<a class="basics-pn-link basics-pn-prev" href="basics_topic.html?id=${encodeURIComponent(prev.id)}"><span class="basics-pn-dir">&#8592; Previous</span><span class="basics-pn-title">${escapeHtml(prev.title)}</span></a>` : '<span></span>'}
            ${next ? `<a class="basics-pn-link basics-pn-next" href="basics_topic.html?id=${encodeURIComponent(next.id)}"><span class="basics-pn-dir">Next &#8594;</span><span class="basics-pn-title">${escapeHtml(next.title)}</span></a>` : '<span></span>'}
        </nav>`;

    wireTopic(topic);
}

/* ---------- grid-check layout (Alphabet) ---------- */

function gridCheckHtml(topic) {
    const ticked = basicsItemSet(topic.id);
    const total = topic.items.length;
    const pct = total ? Math.round(ticked.size / total * 100) : 0;
    return `
        <div class="basics-grid-tools">
            <div class="basics-filter" role="group" aria-label="Filter">
                <button type="button" class="basics-filter-btn active" data-filter="all">All (${total})</button>
                <button type="button" class="basics-filter-btn" data-filter="todo">Not yet (${total - ticked.size})</button>
                <button type="button" class="basics-filter-btn" data-filter="done">Learned (${ticked.size})</button>
            </div>
            <div class="basics-progress" aria-label="Progress">
                <div class="basics-progress-bar"><span style="width:${pct}%"></span></div>
                <span class="basics-progress-label">${pct}%</span>
            </div>
        </div>
        <div class="basics-tiles" data-filter="all">
            ${topic.items.map(it => tileHtml(topic, it, ticked)).join('')}
        </div>`;
}

function tileHtml(topic, it, tickedSet) {
    const on = tickedSet.has(it.label);
    return `
        <div class="basics-tile${on ? ' ticked' : ''}" data-label="${escapeHtml(it.label)}"
            role="button" tabindex="0" aria-pressed="${on}" title="Click to mark as learned">
            <div class="basics-tile-top">
                <span class="basics-tile-label">${escapeHtml(it.label)}</span>
                <span class="basics-tile-check">&#10003;</span>
            </div>
            ${it.ipa ? `<div class="basics-tile-ipa">${escapeHtml(it.ipa)}</div>` : ''}
            ${it.usage ? `<div class="basics-tile-usage">${escapeHtml(it.usage)}</div>` : ''}
            ${it.note ? `<div class="basics-tile-note">${escapeHtml(it.note)}</div>` : ''}
            <button type="button" class="basics-tts" data-say="${escapeHtml(it.text)}" aria-label="Listen">${SPEAKER_SVG}</button>
        </div>`;
}

/* ---------- tabs layout ---------- */

function tabsHtml(topic) {
    const first = topic.tabs[0];
    return `
        <div class="basics-tabs" role="tablist" aria-label="Subsections">
            ${topic.tabs.map(t => `<button type="button" role="tab" class="basics-tab${t.id === first.id ? ' active' : ''}"
                aria-selected="${t.id === first.id}" data-tab="${escapeHtml(t.id)}">${escapeHtml(t.title)}</button>`).join('')}
        </div>
        <div class="basics-tab-body" id="basics-tab-body">
            <div class="basics-table-wrap">${tableHtml(first.items)}</div>
        </div>`;
}

/* ---------- table (tabs + list) ---------- */

const BASICS_COLS = [
    { key: 'label', th: '', cls: 'col-label' },
    { key: 'text', th: 'English', cls: 'col-text' },
    { key: 'ipa', th: 'IPA', cls: 'col-ipa' },
    { key: 'usage', th: 'Examples', cls: 'col-usage' },
    { key: 'note', th: 'Notes', cls: 'col-note' }
];

function tableHtml(items) {
    const cols = BASICS_COLS.filter(c => items.some(it => it[c.key]));
    return `<table class="basics-table">
        <thead><tr>${cols.map(c => `<th class="${c.cls}">${c.th}</th>`).join('')}</tr></thead>
        <tbody>${items.map(it => `<tr>${cols.map(c => {
            if (c.key === 'text') {
                return `<td class="${c.cls}"><span class="basics-item-text">${escapeHtml(it.text)}</span>`
                    + `<button type="button" class="basics-tts" data-say="${escapeHtml(it.text)}" aria-label="Listen">${SPEAKER_SVG}</button></td>`;
            }
            return `<td class="${c.cls}">${escapeHtml(it[c.key] || '')}</td>`;
        }).join('')}</tr>`).join('')}</tbody>
    </table>`;
}

/* ---------- topic wiring ---------- */

function wireTopic(topic) {
    const learnedBtn = document.getElementById('basics-learned-btn');
    learnedBtn?.addEventListener('click', function () {
        const now = !basicsTopicLearned(topic.id);
        setBasicsTopicLearned(topic.id, now);
        if (now) recordActivity(1);
        this.classList.toggle('learned', now);
        this.setAttribute('aria-pressed', String(now));
        this.innerHTML = now ? '&#10003; Learned' : '&#9711; Mark as learned';
    });

    topicEl.querySelectorAll('.basics-accent-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            accent = btn.dataset.accent === 'uk' ? 'uk' : 'us';
            try { localStorage.setItem('basics-accent', accent); } catch { /* ignore */ }
            topicEl.querySelectorAll('.basics-accent-btn').forEach(b =>
                b.classList.toggle('active', b === btn));
        });
    });

    topicEl.querySelectorAll('.basics-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const data = topic.tabs.find(t => t.id === tab.dataset.tab);
            if (!data) return;
            topicEl.querySelectorAll('.basics-tab').forEach(t => {
                t.classList.toggle('active', t === tab);
                t.setAttribute('aria-selected', String(t === tab));
            });
            const body = document.getElementById('basics-tab-body');
            if (body) body.innerHTML = `<div class="basics-table-wrap">${tableHtml(data.items)}</div>`;
        });
    });

    const tiles = topicEl.querySelector('.basics-tiles');
    if (tiles) {
        const ticked = basicsItemSet(topic.id);
        const updateTools = () => {
            const total = topic.items.length;
            const pct = total ? Math.round(ticked.size / total * 100) : 0;
            const bar = topicEl.querySelector('.basics-progress-bar span');
            const label = topicEl.querySelector('.basics-progress-label');
            if (bar) bar.style.width = `${pct}%`;
            if (label) label.textContent = `${pct}%`;
            const counts = { all: total, todo: total - ticked.size, done: ticked.size };
            topicEl.querySelectorAll('.basics-filter-btn').forEach(b => {
                b.textContent = `${b.dataset.filter === 'all' ? 'All' : b.dataset.filter === 'todo' ? 'Not yet' : 'Learned'} (${counts[b.dataset.filter]})`;
            });
        };
        const toggleTile = (tile) => {
            const lbl = tile.dataset.label;
            const on = !ticked.has(lbl);
            if (on) ticked.add(lbl); else ticked.delete(lbl);
            toggleBasicsItem(topic.id, lbl, on);
            tile.classList.toggle('ticked', on);
            tile.setAttribute('aria-pressed', String(on));
            updateTools();
        };
        tiles.addEventListener('click', (e) => {
            if (e.target.closest('.basics-tts')) return;
            const tile = e.target.closest('.basics-tile');
            if (tile) toggleTile(tile);
        });
        tiles.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            const tile = e.target.closest('.basics-tile');
            if (tile) { e.preventDefault(); toggleTile(tile); }
        });
        topicEl.querySelectorAll('.basics-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                tiles.dataset.filter = btn.dataset.filter;
                topicEl.querySelectorAll('.basics-filter-btn').forEach(b =>
                    b.classList.toggle('active', b === btn));
            });
        });
    }
}

/* ================= boot ================= */

initStore();
if (overviewEl) renderOverview();
if (topicEl) renderTopic();
/* Cloud merge happens after auth resolves — re-render so ✓/tick reflect it.
   The first callback fires synchronously with the pre-auth state; skip it. */
let firstCallback = true;
onStoreAuthChanged(() => {
    if (firstCallback) { firstCallback = false; return; }
    if (overviewEl) renderOverview();
    if (topicEl) renderTopic();
});
