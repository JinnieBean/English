/**
 * search.js — full search results page (search.html?q=...).
 * Uses the shared search-index.js (same data the header dropdown uses),
 * but renders every match grouped by type instead of only the top 12.
 */
import { ensureSearchIndex, searchItems } from './search-index.js';
import { escapeHtml, debounce } from './utils.js';

const input = document.getElementById('sr-input');
const head = document.getElementById('sr-head');
const box = document.getElementById('sr-results');

let items = null;

function highlight(text, term) {
    const s = String(text || '');
    const idx = s.toLowerCase().indexOf(term);
    if (!term || idx === -1) return escapeHtml(s);
    return escapeHtml(s.slice(0, idx)) + '<mark>' +
        escapeHtml(s.slice(idx, idx + term.length)) + '</mark>' +
        escapeHtml(s.slice(idx + term.length));
}

function render(termRaw) {
    const term = String(termRaw || '').toLowerCase().trim();
    if (!term) {
        head.textContent = '';
        box.innerHTML = '<p class="empty-state">Type something to search.</p>';
        return;
    }
    const hits = searchItems(items || [], term);
    head.innerHTML = hits.length
        ? `${hits.length} result${hits.length === 1 ? '' : 's'} for &ldquo;${escapeHtml(termRaw.trim())}&rdquo;`
        : `No matches for &ldquo;${escapeHtml(termRaw.trim())}&rdquo;.`;
    if (!hits.length) {
        box.innerHTML = '<p class="empty-state">Try a shorter word, or check the spelling.</p>';
        return;
    }

    const groups = {};
    hits.forEach(it => { (groups[it.t] ||= []).push(it); });

    box.innerHTML = Object.entries(groups).map(([type, list]) => `
        <section class="sr-group">
            <h3 class="sr-group-title">${escapeHtml(type)} <span class="bm-count">${list.length}</span></h3>
            ${list.map(it => `
                <a class="sr-row" href="${escapeHtml(it.url)}">
                    <span class="sr-label">${highlight(it.label, term)}</span>
                    ${it.sub ? `<span class="sr-sub">${escapeHtml(it.sub)}</span>` : ''}
                    ${it.d ? `<span class="sr-def">${highlight(it.d, term)}</span>` : ''}
                </a>`).join('')}
        </section>`).join('');
}

async function run(term) {
    if (!items) {
        box.innerHTML = '<div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text short"></div>';
        items = (await ensureSearchIndex()) || [];
        if (!items.length) {
            box.innerHTML = '<p class="empty-state">Search is unavailable right now — please check your connection.</p>';
            return;
        }
    }
    render(term);
}

document.addEventListener('DOMContentLoaded', () => {
    const initial = new URLSearchParams(location.search).get('q') || '';
    input.value = initial;

    const onInput = debounce(() => {
        const q = input.value.trim();
        const url = q ? `search.html?q=${encodeURIComponent(q)}` : 'search.html';
        history.replaceState(null, '', url);
        run(q);
    }, 250);
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); onInput(); }
    });

    if (initial) run(initial);
    input.focus();
});
