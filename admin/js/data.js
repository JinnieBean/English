import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from '../../assets/js/firebase-config.js';
import { escapeHtml } from '../../assets/js/utils.js';

/* =========================================================
   PAGINATION
   ========================================================= */
export const paginationState = {
    vocab: { page: 1, limit: 50 },
    phrasal: { page: 1, limit: 50 },
    prep: { page: 1, limit: 50 },
    wordform: { page: 1, limit: 50 },
    pattern: { page: 1, limit: 50 },
    lexical: { page: 1, limit: 50 }
};

const PAG_RENDER_FN = {
    vocab: 'renderVocab', phrasal: 'renderPhrasal', prep: 'renderPrep',
    wordform: 'renderWordform', pattern: 'renderPattern', lexical: 'renderLexical'
};

export function addPaginationControls() {
    Object.keys(PAG_RENDER_FN).forEach(tab => {
        const tableContainer = document.querySelector(`#tab-${tab} .table-container`);
        if (tableContainer && !document.getElementById(`pagination-${tab}`)) {
            const pag = document.createElement('div');
            pag.className = 'pagination-controls';
            pag.id = `pagination-${tab}`;
            pag.innerHTML = `
                <div class="pagination-info" id="pag-info-${tab}">Showing 0 - 0 of 0</div>
                <div class="pagination-buttons">
                    <button class="btn-secondary btn-small" id="pag-prev-${tab}">&lt; Prev</button>
                    <span id="pag-page-${tab}">Page 1</span>
                    <button class="btn-secondary btn-small" id="pag-next-${tab}">Next &gt;</button>
                </div>
                <div class="pagination-limit">
                    <select id="pag-limit-${tab}" class="input-field">
                        <option value="20">20 per page</option>
                        <option value="50" selected>50 per page</option>
                        <option value="100">100 per page</option>
                        <option value="999999">All</option>
                    </select>
                </div>`;
            tableContainer.parentElement.appendChild(pag);

            document.getElementById(`pag-prev-${tab}`).addEventListener('click', () => {
                if (paginationState[tab].page > 1) {
                    paginationState[tab].page--;
                    window[PAG_RENDER_FN[tab]]();
                }
            });
            document.getElementById(`pag-next-${tab}`).addEventListener('click', () => {
                if (paginationState[tab].page < paginationState[tab].maxPage) {
                    paginationState[tab].page++;
                    window[PAG_RENDER_FN[tab]]();
                }
            });
            document.getElementById(`pag-limit-${tab}`).addEventListener('change', (e) => {
                paginationState[tab].limit = parseInt(e.target.value);
                paginationState[tab].page = 1;
                window[PAG_RENDER_FN[tab]]();
            });
        }
    });
}

/** Slice a filtered list for the given tab and update its controls. */
export function applyPagination(tab, list) {
    const state = paginationState[tab];
    state.maxPage = Math.max(1, Math.ceil(list.length / state.limit));
    if (state.page > state.maxPage) state.page = state.maxPage;
    const startIdx = (state.page - 1) * state.limit;
    const endIdx = startIdx + state.limit;

    const infoEl = document.getElementById(`pag-info-${tab}`);
    const pageEl = document.getElementById(`pag-page-${tab}`);
    const prevBtn = document.getElementById(`pag-prev-${tab}`);
    const nextBtn = document.getElementById(`pag-next-${tab}`);

    if (infoEl) infoEl.innerText = `Showing ${list.length > 0 ? startIdx + 1 : 0} - ${Math.min(endIdx, list.length)} of ${list.length}`;
    if (pageEl) pageEl.innerText = `Page ${state.page} / ${state.maxPage}`;
    if (prevBtn) prevBtn.disabled = state.page <= 1;
    if (nextBtn) nextBtn.disabled = state.page >= state.maxPage;

    return list.slice(startIdx, endIdx);
}

export function resetPage(tab) {
    if (paginationState[tab]) paginationState[tab].page = 1;
}

// ---------- Data state ----------
/* =========================================================
   DATA STATE + LOADING
   ========================================================= */
export let booksData = [];
export let unitsData = [];
export let vocabData = [];
export let phrasalData = [];
export let prepData = [];
export let wordformData = [];
export let patternData = [];
export let lexicalData = [];

export async function fetchAll(name) {
    const snap = await getDocs(collection(db, name));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export function assignData(name, value) {
    switch (name) {
        case "books": booksData = value; break;
        case "units": unitsData = value; break;
        case "vocabularies": vocabData = value; break;
        case "phrasal_verbs": phrasalData = value; break;
        case "prep_phrases": prepData = value; break;
        case "word_formations": wordformData = value; break;
        case "word_patterns": patternData = value; break;
        case "lexical_expansions": lexicalData = value; break;
    }
}

// Cross-tab mutable session bits (objects so imported bindings stay writable)
export const sessionState = { lastSelectedBookId: null };

// ---------- Shared unit select population ----------
/* =========================================================
   SHARED UNIT SELECT POPULATION
   ========================================================= */
export const unitSelectConfigs = [
    { key: 'vocab', selectId: 'vocab-unit-id', filterId: 'filter-unit-select' },
    { key: 'phrasal', selectId: 'phrasal-unit-id', filterId: 'filter-unit-select-phrasal' },
    { key: 'prep', selectId: 'prep-unit-id', filterId: 'filter-unit-select-prep' },
    { key: 'wordform', selectId: 'wordform-unit-id', filterId: 'filter-unit-select-wordform' },
    { key: 'pattern', selectId: 'pattern-unit', filterId: 'filter-unit-select-pattern' },
    { key: 'lexical', selectId: 'lexical-unit-id', filterId: 'filter-unit-select-lexical' }
];

export const lastUnitSelections = {};

unitSelectConfigs.forEach(({ key, selectId }) => {
    lastUnitSelections[key] = localStorage.getItem(`admin-last-${key}-unit-id`) || '';
    const sel = document.getElementById(selectId);
    if (sel) {
        sel.addEventListener('change', () => rememberUnitSelection(key, sel.value));
    }
});

export function rememberUnitSelection(key, value) {
    if (!value) return;
    lastUnitSelections[key] = value;
    localStorage.setItem(`admin-last-${key}-unit-id`, value);
}

export function applySavedUnitSelect(selectEl, key) {
    const savedId = lastUnitSelections[key];
    if (selectEl && savedId && Array.from(selectEl.options).some(o => o.value === savedId)) {
        selectEl.value = savedId;
    }
}

export function populateUnitSelects() {
    const options = [...unitsData]
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(u => `<option value="${u.id}">${escapeHtml(u.title)}</option>`)
        .join('');

    unitSelectConfigs.forEach(({ key, selectId, filterId }) => {
        const formSelect = document.getElementById(selectId);
        const filterSelect = document.getElementById(filterId);

        if (filterSelect) {
            const currentFilter = filterSelect.value;
            filterSelect.innerHTML = `<option value="all">All Units</option>` + options;
            if (currentFilter && currentFilter !== 'all') filterSelect.value = currentFilter;
        }
        if (formSelect) {
            formSelect.innerHTML = options;
            applySavedUnitSelect(formSelect, key);
        }
    });
}
export function populateBookSelects() {
    const filterSelect = document.getElementById('filter-unit-book');
    const formSelect = document.getElementById('unit-book');

    if (!filterSelect || !formSelect) return;

    const sorted = [...booksData].sort((a, b) => (a.order || 0) - (b.order || 0));
    const options = sorted.map(b => `<option value="${b.id}">${escapeHtml(b.title)}</option>`).join('');

    const currentFilter = filterSelect.value;
    filterSelect.innerHTML = `<option value="all">All Books</option>` + options;
    if (currentFilter && currentFilter !== 'all') filterSelect.value = currentFilter;

    const currentForm = formSelect.value;
    formSelect.innerHTML = options;
    if (currentForm) formSelect.value = currentForm;
    else if (sessionState.lastSelectedBookId) formSelect.value = sessionState.lastSelectedBookId;
}

