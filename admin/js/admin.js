import {
    signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    collection, getDocs, setDoc, getDoc, addDoc, updateDoc, deleteDoc,
    doc, serverTimestamp, writeBatch
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db } from '../../assets/js/firebase-config.js';
import { escapeHtml, friendlyError, sanitizeRichText, applyAudioVersion } from '../../assets/js/utils.js';

/* =========================================================
   TINY MCE CLEANUP
   ========================================================= */
window.closeTinyMCEPopups = function () {
    try {
        if (typeof tinymce !== 'undefined' && tinymce.editors) {
            Array.from(tinymce.editors).forEach(ed => {
                if (ed && ed.fire) ed.fire('blur');
            });
            document.querySelectorAll('.tox-tinymce-aux').forEach(aux => {
                aux.innerHTML = '';
            });
        }
    } catch (e) {
        console.warn('Silent error in closeTinyMCEPopups:', e);
    }
};

/* =========================================================
   GENERIC UI HELPERS
   ========================================================= */

/** Close any modal overlay consistently (single source of truth). */
window.closeModalOverlay = function (modalOrId) {
    const modal = typeof modalOrId === 'string' ? document.getElementById(modalOrId) : modalOrId;
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
    window.closeTinyMCEPopups();
    window.isModalDirty = false;
};
// Legacy alias used by inline handlers
window.closeModal = function (id) { window.closeModalOverlay(id); };

function openModal(modal) {
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
    window.isModalDirty = false;
    const content = modal.querySelector('.modal-content');
    if (content) content.scrollTop = 0;
    setTimeout(() => {
        const target = modal.querySelector('form input[type="text"], form textarea') || modal.querySelector('form select, form input:not([type="hidden"]):not([type="checkbox"])');
        if (target) target.focus();
    }, 100);
}

/** Toast with optional action button (e.g. Undo). */
window.showToast = function (message, type = 'success', action = null) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;

    let icon = '';
    if (type === 'success') icon = '<i class="fas fa-check-circle" style="color: #4caf50;"></i>';
    else if (type === 'error') icon = '<i class="fas fa-exclamation-circle" style="color: #d32f2f;"></i>';
    else icon = '<i class="fas fa-info-circle" style="color: #2196f3;"></i>';

    const inner = document.createElement('div');
    inner.style.cssText = 'display:flex; align-items:center; gap:10px;';
    const ic = document.createElement('span');
    ic.innerHTML = icon;
    const msg = document.createElement('span');
    msg.className = 'toast-message';
    msg.textContent = message;
    inner.appendChild(ic);
    inner.appendChild(msg);

    if (action?.label) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'toast-action-btn';
        btn.textContent = action.label;
        btn.addEventListener('click', () => { action.onClick?.(); dismiss(); });
        inner.appendChild(btn);
    }

    toast.appendChild(inner);
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    let dismissed = false;
    const dismiss = () => {
        if (dismissed) return;
        dismissed = true;
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    };
    setTimeout(dismiss, action ? 6500 : 3000);
}

/** Promise-based confirmation dialog replacing native confirm(). */
let _confirmEls = null;
function ensureConfirmOverlay() {
    if (_confirmEls) return _confirmEls;
    const overlay = document.createElement('div');
    overlay.className = 'modal confirm-overlay';
    overlay.id = 'confirm-modal';
    overlay.innerHTML = `
        <div class="modal-content confirm-box" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <h3 id="confirm-title">Please confirm</h3>
            <p id="confirm-message"></p>
            <div class="confirm-actions">
                <button type="button" class="btn-secondary" id="confirm-cancel">Cancel</button>
                <button type="button" class="btn-danger" id="confirm-ok">Delete</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay._resolve?.(false);
    });
    document.getElementById('confirm-cancel').addEventListener('click', () => overlay._resolve?.(false));
    document.getElementById('confirm-ok').addEventListener('click', () => overlay._resolve?.(true));
    _confirmEls = overlay;
    return overlay;
}

function confirmDialog({ title = 'Please confirm', message = '', confirmText = 'Delete' } = {}) {
    const overlay = ensureConfirmOverlay();
    overlay.querySelector('#confirm-title').textContent = title;
    overlay.querySelector('#confirm-message').textContent = message;
    const okBtn = overlay.querySelector('#confirm-ok');
    okBtn.textContent = confirmText;
    okBtn.classList.toggle('btn-danger', confirmText === 'Delete');
    overlay.style.display = 'flex';
    document.body.classList.add('modal-open');
    okBtn.focus();
    return new Promise((resolve) => {
        overlay._resolve = (val) => {
            overlay._resolve = null;
            overlay.style.display = 'none';
            document.body.classList.remove('modal-open');
            resolve(val);
        };
    });
}

/** Form submit wrapper: prevents double-submit and shows busy state. */
function onSubmit(form, handler) {
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        if (btn && btn.dataset.busy === '1') return;
        let origHtml = '';
        if (btn) {
            origHtml = btn.innerHTML;
            btn.dataset.busy = '1';
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…';
        }
        try {
            await handler();
        } catch (err) {
            console.error(err);
            window.showToast(friendlyError(err), 'error');
        } finally {
            if (btn) {
                btn.dataset.busy = '';
                btn.disabled = false;
                btn.innerHTML = origHtml;
            }
        }
    });
}

/** Add audit timestamps to every write. */
function stampCreate(data) {
    return { ...data, status: data.status || 'published', createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
}
function stampUpdate(data) {
    return { ...data, updatedAt: serverTimestamp() };
}

/** Client-side duplicate detection against already-loaded data. */
function isDuplicate(items, match, excludeId) {
    return items.some(x => x.id !== excludeId && match(x));
}

function dupToast(label) {
    window.showToast(`A ${label} with these details already exists.`, 'error');
}

/** Delete helper: confirm dialog + undo toast. */
async function performDelete(collName, id, label, extraWarning = '') {
    const ok = await confirmDialog({
        title: `Delete this ${label}?`,
        message: `This will permanently remove the ${label}.${extraWarning ? ' ' + extraWarning : ''}`,
        confirmText: 'Delete'
    });
    if (!ok) return;
    try {
        const ref = doc(db, collName, id);
        const snap = await getDoc(ref);
        await deleteDoc(ref);
        if (snap.exists()) {
            const saved = snap.data();
            window.showToast(`${label} deleted.`, 'success', {
                label: 'Undo',
                onClick: async () => {
                    try {
                        await setDoc(ref, saved);
                        await reloadDataFor(collName);
                        window.showToast('Delete undone.', 'success');
                    } catch (err) {
                        console.error(err);
                        window.showToast(friendlyError(err), 'error');
                    }
                }
            });
        } else {
            window.showToast(`${label} deleted.`, 'success');
        }
        await reloadDataFor(collName);
    } catch (error) {
        console.error(error);
        window.showToast(friendlyError(error), 'error');
    }
}

/* =========================================================
   DOM ELEMENTS + GLOBAL STATE
   ========================================================= */
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const loginError = document.getElementById('login-error');

// Prevent negative numbers on all number inputs globally
document.addEventListener('keydown', (e) => {
    if (e.target && e.target.type === 'number') {
        if (e.key === '-' || e.key === 'e' || e.key === '+' || e.key === '.') {
            e.preventDefault();
        }
    }
});
document.addEventListener('input', (e) => {
    if (e.target && e.target.type === 'number') {
        if (e.target.value !== '' && parseInt(e.target.value) < 1) {
            e.target.value = 1;
        }
    }
});

const navItems = document.querySelectorAll('.nav-item');
const tabPanes = document.querySelectorAll('.tab-pane');

const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
const adminSidebar = document.getElementById('admin-sidebar');
if (sidebarToggleBtn && adminSidebar) {
    if (localStorage.getItem('admin-sidebar-collapsed') === 'true') {
        adminSidebar.classList.add('collapsed');
    }
    sidebarToggleBtn.addEventListener('click', () => {
        adminSidebar.classList.toggle('collapsed');
        localStorage.setItem('admin-sidebar-collapsed', String(adminSidebar.classList.contains('collapsed')));
    });
}

// Modal dirty tracking
window.isModalDirty = false;
document.addEventListener('input', (e) => {
    if (e.target.closest('.modal')) window.isModalDirty = true;
});
document.addEventListener('change', (e) => {
    if (e.target.closest('.modal')) window.isModalDirty = true;
});

const closeBtns = document.querySelectorAll('.close-modal');
closeBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
        if (window.isModalDirty) {
            const ok = await confirmDialog({
                title: 'Discard changes?',
                message: 'You have unsaved changes. Close anyway?',
                confirmText: 'Discard'
            });
            if (!ok) return;
        }
        window.closeModalOverlay(e.target.getAttribute('data-target'));
    });
});

// Esc closes the topmost open modal (with dirty check)
document.addEventListener('keydown', async (e) => {
    if (e.key !== 'Escape') return;
    const openModals = [...document.querySelectorAll('.modal')].filter(m => m.style.display === 'flex');
    if (!openModals.length) return;
    const top = openModals[openModals.length - 1];
    if (top.id === 'confirm-modal') { top._resolve?.(false); return; }
    if (window.isModalDirty) {
        const ok = await confirmDialog({
            title: 'Discard changes?',
            message: 'You have unsaved changes. Close anyway?',
            confirmText: 'Discard'
        });
        if (!ok) return;
    }
    window.closeModalOverlay(top);
});

/* =========================================================
   PAGINATION
   ========================================================= */
const paginationState = {
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

function addPaginationControls() {
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
function applyPagination(tab, list) {
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

function resetPage(tab) {
    if (paginationState[tab]) paginationState[tab].page = 1;
}

/* =========================================================
   DATA STATE + LOADING
   ========================================================= */
let booksData = [];
let unitsData = [];
let vocabData = [];
let phrasalData = [];
let prepData = [];
let wordformData = [];
let patternData = [];
let lexicalData = [];

async function fetchAll(name) {
    const snap = await getDocs(collection(db, name));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function loadData() {
    const results = await Promise.allSettled([
        fetchAll("books"), fetchAll("units"), fetchAll("vocabularies"),
        fetchAll("phrasal_verbs"), fetchAll("prep_phrases"), fetchAll("word_formations"),
        fetchAll("word_patterns"), fetchAll("lexical_expansions")
    ]);
    const names = ["books", "units", "vocabularies", "phrasal_verbs", "prep_phrases", "word_formations", "word_patterns", "lexical_expansions"];
    results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
            assignData(names[i], r.value);
        } else {
            console.error(`Error loading ${names[i]}:`, r.reason);
            window.showToast(`Could not load ${names[i]}: ${friendlyError(r.reason)}`, 'error');
        }
    });

    renderBooks();
    renderUnits();
    populateBookSelects();
    populateUnitSelects();
    addPaginationControls();
    renderVocab();
    renderPhrasal();
    renderPrep();
    renderWordform();
    renderPattern();
    renderLexical();
    updateDashboardStats();
}

function assignData(name, value) {
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

/** Reload only what a given collection affects. */
async function reloadDataFor(collName) {
    try {
        if (collName === 'grammar_categories' || collName === 'grammar_lessons' || collName === 'grammar_units') {
            await loadGrammarData();
            return;
        }
        if (collName === 'pronunciation_categories' || collName === 'pronunciation_lessons' || collName === 'pronunciation_units') {
            await loadPronunciationData();
            return;
        }
        const targets = {
            books: ["books"], units: ["units"],
            vocabularies: ["vocabularies"], phrasal_verbs: ["phrasal_verbs"],
            prep_phrases: ["prep_phrases"], word_formations: ["word_formations"],
            word_patterns: ["word_patterns"], lexical_expansions: ["lexical_expansions"]
        };
        const names = targets[collName] || Object.values(targets).flat();
        const unique = [...new Set(names)];
        const values = await Promise.all(unique.map(fetchAll));
        values.forEach((v, i) => assignData(unique[i], v));
        renderBooks(); renderUnits();
        populateBookSelects(); populateUnitSelects();
        renderVocab(); renderPhrasal(); renderPrep(); renderWordform(); renderPattern(); renderLexical();
        updateDashboardStats();
    } catch (err) {
        console.error(err);
        window.showToast(friendlyError(err), 'error');
    }
}

/* =========================================================
   TABS
   ========================================================= */
// Real implementations are attached after the tree managers are created below.
let loadGrammarData = async () => {};
let loadPronunciationData = async () => {};

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(nav => nav.classList.remove('active'));
        tabPanes.forEach(tab => tab.style.display = 'none');

        item.classList.add('active');
        document.getElementById(item.getAttribute('data-tab')).style.display = 'block';

        // Lazy-load heavy tabs on first visit
        if (item.dataset.tab === 'tab-grammar') {
            initTinyMCE();
            loadGrammarData();
        } else if (item.dataset.tab === 'tab-pronunciation') {
            initTinyMCE();
            loadPronunciationData();
        }
    });
});

/* =========================================================
   AUTH
   ========================================================= */
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'flex';
        const emailEl = document.getElementById('admin-user-email');
        if (emailEl) emailEl.textContent = user.email || '';
        if (emailEl) emailEl.title = `Signed in as ${user.email || 'unknown'}`;
        loadData();
    } else {
        loginSection.style.display = 'flex';
        dashboardSection.style.display = 'none';
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.innerText = '';
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error(error);
        loginError.innerText = friendlyError(error);
    }
});

logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

/* =========================================================
   BOOKS
   ========================================================= */
const bookModal = document.getElementById('book-modal');
const bookForm = document.getElementById('book-form');

document.getElementById('add-book-btn').addEventListener('click', () => {
    document.getElementById('book-id').value = '';
    bookForm.reset();
    document.getElementById('book-status').value = 'published';
    document.getElementById('book-order').value = booksData.length > 0 ? Math.max(...booksData.map(b => b.order || 0)) + 1 : 1;
    updateBookPreview();
    document.getElementById('book-modal-title').innerText = 'Add New Book';
    openModal(bookModal);
});

// Cover image preview
function updateBookPreview() {
    const preview = document.getElementById('book-image-preview');
    const urlInput = document.getElementById('book-image');
    if (preview && urlInput) preview.src = urlInput.value.trim() || 'assets/images/book_cover.png';
}
document.getElementById('book-image')?.addEventListener('input', updateBookPreview);
document.getElementById('book-image')?.addEventListener('change', updateBookPreview);

onSubmit(bookForm, async () => {
    const id = document.getElementById('book-id').value;
    const bookData = {
        title: document.getElementById('book-title').value.trim(),
        subtitle: document.getElementById('book-subtitle').value.trim(),
        desc: document.getElementById('book-desc').value.trim(),
        image: document.getElementById('book-image').value.trim(),
        order: parseInt(document.getElementById('book-order').value) || 1,
        status: document.getElementById('book-status').value
    };
    if (!bookData.title) { window.showToast('Book title is required.', 'error'); return; }
    if (isDuplicate(booksData, b => (b.title || '').toLowerCase() === bookData.title.toLowerCase(), id)) {
        dupToast('book'); return;
    }

    if (id) {
        await updateDoc(doc(db, "books", id), stampUpdate(bookData));
    } else {
        await addDoc(collection(db, "books"), stampCreate(bookData));
    }
    window.closeModalOverlay(bookModal);
    await reloadDataFor(id ? "books" : null);
    window.showToast('Saved!', 'success');
});

function renderBooks() {
    const list = document.getElementById('books-list');
    if (!list) return;
    const searchTerm = document.getElementById('search-book')?.value.toLowerCase() || '';

    const filtered = booksData.filter(b => (b.title || '').toLowerCase().includes(searchTerm));
    filtered.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (!filtered.length) {
        list.innerHTML = `<tr><td colspan="4" class="empty-row">No books found.</td></tr>`;
        return;
    }

    list.innerHTML = filtered.map(b => `
        <tr>
            <td>${b.order || 0}</td>
            <td><img src="${escapeHtml(b.image || 'assets/images/book_cover.png')}" alt="" style="height: 40px; border-radius: 4px;" onerror="this.style.visibility='hidden'"></td>
            <td><strong>${escapeHtml(b.title)}</strong> ${b.status === 'draft' ? '<span class="badge badge-draft">Draft</span>' : ''}${b.subtitle ? `<br><small>${escapeHtml(b.subtitle)}</small>` : ''}</td>
            <td>
                <button class="btn-secondary btn-small" onclick="editBook('${b.id}')">Edit</button>
                <button class="btn-secondary btn-small" onclick="duplicateBook('${b.id}')">Duplicate</button>
                <button class="btn-danger btn-small" onclick="deleteBook('${b.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

window.editBook = (id) => {
    const b = booksData.find(x => x.id === id);
    if (b) {
        document.getElementById('book-id').value = b.id;
        document.getElementById('book-title').value = b.title || '';
        document.getElementById('book-subtitle').value = b.subtitle || '';
        document.getElementById('book-desc').value = b.desc || '';
        document.getElementById('book-image').value = b.image || 'assets/images/book_cover.png';
        document.getElementById('book-order').value = b.order || 1;
        document.getElementById('book-status').value = b.status || 'published';
        updateBookPreview();
        document.getElementById('book-modal-title').innerText = 'Edit Book';
        openModal(bookModal);
    }
};

window.duplicateBook = async (id) => {
    const b = booksData.find(x => x.id === id);
    if (!b) return;
    const { id: _omit, createdAt: _c, updatedAt: _u, ...rest } = b;
    rest.title = (b.title || 'Untitled') + ' (copy)';
    try {
        await addDoc(collection(db, "books"), stampCreate(rest));
        await reloadDataFor("books");
        window.showToast('Book duplicated.', 'success');
    } catch (err) {
        console.error(err);
        window.showToast(friendlyError(err), 'error');
    }
};

window.deleteBook = async (id) => {
    const count = unitsData.filter(u => u.bookId === id).length;
    const warning = count > 0
        ? `${count} unit${count > 1 ? 's' : ''} still belong${count > 1 ? '' : 's'} to this book and will be orphaned.`
        : '';
    await performDelete("books", id, 'book', warning);
};

document.getElementById('search-book')?.addEventListener('input', renderBooks);

/* =========================================================
   UNITS
   ========================================================= */
const unitModal = document.getElementById('unit-modal');
const unitForm = document.getElementById('unit-form');

function populateBookSelects() {
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
    else if (lastSelectedBookId) formSelect.value = lastSelectedBookId;
}

let lastSelectedBookId = null;

document.getElementById('add-unit-btn').addEventListener('click', () => {
    document.getElementById('unit-id').value = '';
    unitForm.reset();
    if (lastSelectedBookId) document.getElementById('unit-book').value = lastSelectedBookId;
    document.getElementById('unit-status').value = 'published';
    document.getElementById('unit-order').value = unitsData.length > 0 ? Math.max(...unitsData.map(u => u.order || 0)) + 1 : 1;
    document.getElementById('unit-modal-title').innerText = 'Add New Unit';
    openModal(unitModal);
});

onSubmit(unitForm, async () => {
    const id = document.getElementById('unit-id').value;
    const bookId = document.getElementById('unit-book').value;
    const title = document.getElementById('unit-title').value.trim();
    const order = parseInt(document.getElementById('unit-order').value);

    const sectionCheckboxes = document.querySelectorAll('input[name="unit-section"]:checked');
    const sections = Array.from(sectionCheckboxes).map(cb => cb.value);

    lastSelectedBookId = bookId;

    const unitData = { bookId, title, order, sections, status: document.getElementById('unit-status').value };
    if (!title) { window.showToast('Unit title is required.', 'error'); return; }
    if (!bookId) { window.showToast('Please select a book.', 'error'); return; }
    if (isDuplicate(unitsData, u => u.bookId === bookId && (u.title || '').toLowerCase() === title.toLowerCase(), id)) {
        dupToast('unit'); return;
    }

    if (id) {
        await updateDoc(doc(db, "units", id), stampUpdate(unitData));
    } else {
        await addDoc(collection(db, "units"), stampCreate(unitData));
    }
    window.closeModalOverlay(unitModal);
    await reloadDataFor("units");
    window.showToast('Saved!', 'success');
});

document.getElementById('search-unit')?.addEventListener('input', renderUnits);
document.getElementById('sort-unit')?.addEventListener('change', renderUnits);
document.getElementById('filter-unit-book')?.addEventListener('change', renderUnits);

function renderUnits() {
    const list = document.getElementById('units-list');
    if (!list) return;
    const searchQuery = document.getElementById('search-unit')?.value.toLowerCase() || '';
    const sortValue = document.getElementById('sort-unit')?.value || 'default';
    const bookFilter = document.getElementById('filter-unit-book')?.value || 'all';

    let filteredData = unitsData.filter(u => (u.title || '').toLowerCase().includes(searchQuery));
    if (bookFilter !== 'all') {
        filteredData = filteredData.filter(u => u.bookId === bookFilter);
    }

    if (sortValue === 'az') filteredData.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    else if (sortValue === 'za') filteredData.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
    else filteredData.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (!filteredData.length) {
        list.innerHTML = `<tr><td colspan="4" class="empty-row">No units found.</td></tr>`;
        return;
    }

    list.innerHTML = filteredData.map(unit => {
        const book = booksData.find(b => b.id === unit.bookId);
        return `
            <tr>
                <td>${unit.order || 0}</td>
                <td>${book ? escapeHtml(book.title) : '<em>No Book</em>'}</td>
                <td><strong>${escapeHtml(unit.title)}</strong> ${unit.status === 'draft' ? '<span class="badge badge-draft">Draft</span>' : ''}</td>
                <td>
                    <button class="btn-secondary btn-small" onclick="editUnit('${unit.id}')">Edit</button>
                    <button class="btn-secondary btn-small" onclick="duplicateUnit('${unit.id}')">Duplicate</button>
                    <button class="btn-danger btn-small" onclick="deleteUnit('${unit.id}')">Delete</button>
                </td>
            </tr>`;
    }).join('');
}

window.editUnit = (id) => {
    const unit = unitsData.find(u => u.id === id);
    if (unit) {
        document.getElementById('unit-id').value = unit.id;
        document.getElementById('unit-book').value = unit.bookId || '';
        document.getElementById('unit-title').value = unit.title || '';
        document.getElementById('unit-order').value = unit.order || 1;
        document.getElementById('unit-status').value = unit.status || 'published';

        document.querySelectorAll('input[name="unit-section"]').forEach(cb => cb.checked = false);
        if (unit.sections) {
            unit.sections.forEach(sec => {
                const cb = document.querySelector(`input[name="unit-section"][value="${sec}"]`);
                if (cb) cb.checked = true;
            });
        }

        document.getElementById('unit-modal-title').innerText = 'Edit Unit';
        openModal(unitModal);
    }
};

window.duplicateUnit = async (id) => {
    const u = unitsData.find(x => x.id === id);
    if (!u) return;
    const { id: _omit, createdAt: _c, updatedAt: _u, ...rest } = u;
    rest.title = (u.title || 'Unit') + ' (copy)';
    try {
        await addDoc(collection(db, "units"), stampCreate(rest));
        await reloadDataFor("units");
        window.showToast('Unit duplicated.', 'success');
    } catch (err) {
        console.error(err);
        window.showToast(friendlyError(err), 'error');
    }
};

window.deleteUnit = async (id) => {
    const children =
        vocabData.filter(v => v.unitId === id).length +
        phrasalData.filter(v => v.unitId === id).length +
        prepData.filter(v => v.unitId === id).length +
        wordformData.filter(v => v.unitId === id).length +
        patternData.filter(v => v.unitId === id).length +
        lexicalData.filter(v => v.unitId === id).length;
    const warning = children > 0
        ? `${children} linked record${children > 1 ? 's' : ''} (vocabulary, phrases…) will be orphaned.`
        : '';
    await performDelete("units", id, 'unit', warning);
};

/* =========================================================
   SHARED UNIT SELECT POPULATION
   ========================================================= */
const unitSelectConfigs = [
    { key: 'vocab', selectId: 'vocab-unit-id', filterId: 'filter-unit-select' },
    { key: 'phrasal', selectId: 'phrasal-unit-id', filterId: 'filter-unit-select-phrasal' },
    { key: 'prep', selectId: 'prep-unit-id', filterId: 'filter-unit-select-prep' },
    { key: 'wordform', selectId: 'wordform-unit-id', filterId: 'filter-unit-select-wordform' },
    { key: 'pattern', selectId: 'pattern-unit', filterId: 'filter-unit-select-pattern' },
    { key: 'lexical', selectId: 'lexical-unit-id', filterId: 'filter-unit-select-lexical' }
];

const lastUnitSelections = {};

unitSelectConfigs.forEach(({ key, selectId }) => {
    lastUnitSelections[key] = localStorage.getItem(`admin-last-${key}-unit-id`) || '';
    const sel = document.getElementById(selectId);
    if (sel) {
        sel.addEventListener('change', () => rememberUnitSelection(key, sel.value));
    }
});

function rememberUnitSelection(key, value) {
    if (!value) return;
    lastUnitSelections[key] = value;
    localStorage.setItem(`admin-last-${key}-unit-id`, value);
}

function applySavedUnitSelect(selectEl, key) {
    const savedId = lastUnitSelections[key];
    if (selectEl && savedId && Array.from(selectEl.options).some(o => o.value === savedId)) {
        selectEl.value = savedId;
    }
}

function populateUnitSelects() {
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

/* =========================================================
   VOCABULARY
   ========================================================= */
const vocabModal = document.getElementById('vocab-modal');
const vocabForm = document.getElementById('vocab-form');

document.getElementById('add-vocab-btn').addEventListener('click', () => {
    document.getElementById('vocab-id').value = '';
    vocabForm.reset();
    applySavedUnitSelect(document.getElementById('vocab-unit-id'), 'vocab');
    document.getElementById('vocab-status').value = 'published';
    document.getElementById('vocab-modal-title').innerText = 'Add New Vocabulary';
    openModal(vocabModal);
});

onSubmit(vocabForm, async () => {
    const id = document.getElementById('vocab-id').value;
    const newVocab = {
        unitId: document.getElementById('vocab-unit-id').value,
        word: document.getElementById('vocab-word').value.trim(),
        pos: document.getElementById('vocab-pos').value.trim(),
        pron: document.getElementById('vocab-pron').value.trim(),
        audio: document.getElementById('vocab-audio').value.trim(),
        def: document.getElementById('vocab-def').value.trim(),
        example: document.getElementById('vocab-example').value.trim(),
        status: document.getElementById('vocab-status').value
    };

    rememberUnitSelection('vocab', newVocab.unitId);
    if (!newVocab.word) { window.showToast('Word is required.', 'error'); return; }
    if (!newVocab.unitId) { window.showToast('Please select a unit.', 'error'); return; }
    if (isDuplicate(vocabData, v => v.unitId === newVocab.unitId && (v.word || '').toLowerCase() === newVocab.word.toLowerCase(), id)) {
        dupToast('vocabulary entry'); return;
    }

    if (id) {
        await updateDoc(doc(db, "vocabularies", id), stampUpdate(newVocab));
    } else {
        await addDoc(collection(db, "vocabularies"), stampCreate(newVocab));
    }
    window.closeModalOverlay(vocabModal);
    await reloadDataFor("vocabularies");
    window.showToast('Saved!', 'success');
});

// Audio test-play button (plays with the current Longman version applied,
// exactly like the study site will)
document.getElementById('vocab-audio-test')?.addEventListener('click', () => {
    const raw = document.getElementById('vocab-audio').value.trim();
    if (!raw) { window.showToast('Enter an audio URL first.', 'info'); return; }
    const url = applyAudioVersion(raw);
    const audio = new Audio(url);
    audio.play().catch(() => window.showToast('Could not play this audio URL.', 'error'));
});

document.getElementById('filter-unit-select').addEventListener('change', renderVocab);
document.getElementById('search-vocab').addEventListener('input', () => { resetPage('vocab'); renderVocab(); });
document.getElementById('sort-vocab').addEventListener('change', renderVocab);

function renderVocab() {
    const list = document.getElementById('vocab-list');
    if (!list) return;
    const filter = document.getElementById('filter-unit-select').value;
    const searchQuery = document.getElementById('search-vocab').value.toLowerCase();
    const sortValue = document.getElementById('sort-vocab').value;

    let filtered = filter === 'all' ? vocabData : vocabData.filter(v => v.unitId === filter);
    filtered = filtered.filter(v =>
        (v.word || '').toLowerCase().includes(searchQuery) ||
        (v.def || '').toLowerCase().includes(searchQuery));

    if (sortValue === 'az') filtered.sort((a, b) => (a.word || '').localeCompare(b.word || ''));
    else if (sortValue === 'za') filtered.sort((a, b) => (b.word || '').localeCompare(a.word || ''));

    const pageItems = applyPagination('vocab', filtered);
    if (!pageItems.length) {
        list.innerHTML = `<tr><td colspan="5" class="empty-row">${filtered.length === 0 ? 'No vocabulary found.' : 'No vocabulary on this page.'}</td></tr>`;
        return;
    }

    list.innerHTML = pageItems.map(v => {
        const unitName = unitsData.find(u => u.id === v.unitId)?.title || 'Unknown';
        return `
            <tr>
                <td><strong>${escapeHtml(v.word)}</strong> ${v.status === 'draft' ? '<span class="badge badge-draft">Draft</span>' : ''}</td>
                <td>${escapeHtml(v.pos)}</td>
                <td>${escapeHtml(v.pron)}</td>
                <td>${escapeHtml(unitName)}</td>
                <td>
                    <button class="btn-secondary btn-small" onclick="editVocab('${v.id}')">Edit</button>
                    <button class="btn-secondary btn-small" onclick="duplicateVocab('${v.id}')">Duplicate</button>
                    <button class="btn-danger btn-small" onclick="deleteVocab('${v.id}')">Delete</button>
                </td>
            </tr>`;
    }).join('');
}

window.editVocab = (id) => {
    const v = vocabData.find(v => v.id === id);
    if (v) {
        document.getElementById('vocab-id').value = v.id;
        document.getElementById('vocab-unit-id').value = v.unitId || '';
        document.getElementById('vocab-word').value = v.word || '';
        document.getElementById('vocab-pos').value = v.pos || '';
        document.getElementById('vocab-pron').value = v.pron || '';
        document.getElementById('vocab-audio').value = v.audio || '';
        document.getElementById('vocab-def').value = v.def || '';
        document.getElementById('vocab-example').value = v.example || '';
        document.getElementById('vocab-status').value = v.status || 'published';
        document.getElementById('vocab-modal-title').innerText = 'Edit Vocabulary';
        openModal(vocabModal);
    }
};

window.duplicateVocab = async (id) => {
    const v = vocabData.find(x => x.id === id);
    if (!v) return;
    const { id: _o, createdAt: _c, updatedAt: _u, ...rest } = v;
    try {
        await addDoc(collection(db, "vocabularies"), stampCreate(rest));
        await reloadDataFor("vocabularies");
        window.showToast('Entry duplicated.', 'success');
    } catch (err) { console.error(err); window.showToast(friendlyError(err), 'error'); }
};

window.deleteVocab = (id) => performDelete("vocabularies", id, 'word');

/* =========================================================
   PHRASAL VERBS
   ========================================================= */
const phrasalModal = document.getElementById('phrasal-modal');
const phrasalForm = document.getElementById('phrasal-form');

document.getElementById('add-phrasal-btn').addEventListener('click', () => {
    document.getElementById('phrasal-id').value = '';
    phrasalForm.reset();
    applySavedUnitSelect(document.getElementById('phrasal-unit-id'), 'phrasal');
    document.getElementById('phrasal-status').value = 'published';
    document.getElementById('phrasal-modal-title').innerText = 'Add Phrasal Verb';
    openModal(phrasalModal);
});

onSubmit(phrasalForm, async () => {
    const id = document.getElementById('phrasal-id').value;
    const newPhrasal = {
        unitId: document.getElementById('phrasal-unit-id').value,
        word: document.getElementById('phrasal-word').value.trim(),
        pron: document.getElementById('phrasal-pron').value.trim(),
        def: document.getElementById('phrasal-def').value.trim(),
        example: document.getElementById('phrasal-example').value.trim(),
        status: document.getElementById('phrasal-status').value
    };

    rememberUnitSelection('phrasal', newPhrasal.unitId);
    if (!newPhrasal.word) { window.showToast('Phrasal verb is required.', 'error'); return; }
    if (isDuplicate(phrasalData, p => p.unitId === newPhrasal.unitId && (p.word || '').toLowerCase() === newPhrasal.word.toLowerCase(), id)) {
        dupToast('phrasal verb'); return;
    }

    if (id) {
        await updateDoc(doc(db, "phrasal_verbs", id), stampUpdate(newPhrasal));
    } else {
        await addDoc(collection(db, "phrasal_verbs"), stampCreate(newPhrasal));
    }
    window.closeModalOverlay(phrasalModal);
    await reloadDataFor("phrasal_verbs");
    window.showToast('Saved!', 'success');
});

document.getElementById('filter-unit-select-phrasal').addEventListener('change', renderPhrasal);
document.getElementById('search-phrasal').addEventListener('input', () => { resetPage('phrasal'); renderPhrasal(); });
document.getElementById('sort-phrasal').addEventListener('change', renderPhrasal);

function renderPhrasal() {
    const list = document.getElementById('phrasal-list');
    if (!list) return;
    const filter = document.getElementById('filter-unit-select-phrasal').value;
    const searchQuery = document.getElementById('search-phrasal').value.toLowerCase();
    const sortValue = document.getElementById('sort-phrasal').value;

    let filtered = filter === 'all' ? phrasalData : phrasalData.filter(p => p.unitId === filter);
    filtered = filtered.filter(p =>
        (p.word || '').toLowerCase().includes(searchQuery) ||
        (p.def || '').toLowerCase().includes(searchQuery));

    if (sortValue === 'az') filtered.sort((a, b) => (a.word || '').localeCompare(b.word || ''));
    else if (sortValue === 'za') filtered.sort((a, b) => (b.word || '').localeCompare(a.word || ''));

    const pageItems = applyPagination('phrasal', filtered);
    if (!pageItems.length) {
        list.innerHTML = `<tr><td colspan="4" class="empty-row">No phrasal verbs found.</td></tr>`;
        return;
    }

    list.innerHTML = pageItems.map(p => {
        const unitName = unitsData.find(u => u.id === p.unitId)?.title || 'Unknown';
        return `
            <tr>
                <td><strong>${escapeHtml(p.word)}</strong> ${p.status === 'draft' ? '<span class="badge badge-draft">Draft</span>' : ''}<br><small>${escapeHtml(p.pron)}</small></td>
                <td>${escapeHtml(unitName)}</td>
                <td>${escapeHtml((p.def || '').slice(0, 120))}${(p.def || '').length > 120 ? '…' : ''}</td>
                <td>
                    <button class="btn-secondary btn-small" onclick="editPhrasal('${p.id}')">Edit</button>
                    <button class="btn-secondary btn-small" onclick="duplicatePhrasal('${p.id}')">Duplicate</button>
                    <button class="btn-danger btn-small" onclick="deletePhrasal('${p.id}')">Delete</button>
                </td>
            </tr>`;
    }).join('');
}

window.editPhrasal = (id) => {
    const p = phrasalData.find(p => p.id === id);
    if (p) {
        document.getElementById('phrasal-id').value = p.id;
        document.getElementById('phrasal-unit-id').value = p.unitId || '';
        document.getElementById('phrasal-word').value = p.word || '';
        document.getElementById('phrasal-pron').value = p.pron || '';
        document.getElementById('phrasal-def').value = p.def || '';
        document.getElementById('phrasal-example').value = p.example || '';
        document.getElementById('phrasal-status').value = p.status || 'published';
        document.getElementById('phrasal-modal-title').innerText = 'Edit Phrasal Verb';
        openModal(phrasalModal);
    }
};

window.duplicatePhrasal = async (id) => {
    const p = phrasalData.find(x => x.id === id);
    if (!p) return;
    const { id: _o, createdAt: _c, updatedAt: _u, ...rest } = p;
    try {
        await addDoc(collection(db, "phrasal_verbs"), stampCreate(rest));
        await reloadDataFor("phrasal_verbs");
        window.showToast('Phrasal verb duplicated.', 'success');
    } catch (err) { console.error(err); window.showToast(friendlyError(err), 'error'); }
};

window.deletePhrasal = (id) => performDelete("phrasal_verbs", id, 'phrasal verb');

/* =========================================================
   PREPOSITIONAL PHRASES
   ========================================================= */
const prepModal = document.getElementById('prep-modal');
const prepForm = document.getElementById('prep-form');

document.getElementById('add-prep-btn').addEventListener('click', () => {
    document.getElementById('prep-id').value = '';
    prepForm.reset();
    applySavedUnitSelect(document.getElementById('prep-unit-id'), 'prep');
    document.getElementById('prep-status').value = 'published';
    document.getElementById('prep-modal-title').innerText = 'Add Phrase';
    openModal(prepModal);
});

onSubmit(prepForm, async () => {
    const id = document.getElementById('prep-id').value;
    const newPrep = {
        unitId: document.getElementById('prep-unit-id').value,
        word: document.getElementById('prep-word').value.trim(),
        def: document.getElementById('prep-def').value.trim(),
        example: document.getElementById('prep-example').value.trim(),
        status: document.getElementById('prep-status').value
    };

    rememberUnitSelection('prep', newPrep.unitId);
    if (!newPrep.word) { window.showToast('Phrase is required.', 'error'); return; }
    if (isDuplicate(prepData, p => p.unitId === newPrep.unitId && (p.word || '').toLowerCase() === newPrep.word.toLowerCase(), id)) {
        dupToast('phrase'); return;
    }

    if (id) {
        await updateDoc(doc(db, "prep_phrases", id), stampUpdate(newPrep));
    } else {
        await addDoc(collection(db, "prep_phrases"), stampCreate(newPrep));
    }
    window.closeModalOverlay(prepModal);
    await reloadDataFor("prep_phrases");
    window.showToast('Saved!', 'success');
});

document.getElementById('filter-unit-select-prep').addEventListener('change', renderPrep);
document.getElementById('search-prep').addEventListener('input', () => { resetPage('prep'); renderPrep(); });
document.getElementById('sort-prep').addEventListener('change', renderPrep);

function renderPrep() {
    const list = document.getElementById('prep-list');
    if (!list) return;
    const filter = document.getElementById('filter-unit-select-prep').value;
    const searchQuery = document.getElementById('search-prep').value.toLowerCase();
    const sortValue = document.getElementById('sort-prep').value;

    let filtered = filter === 'all' ? prepData : prepData.filter(p => p.unitId === filter);
    filtered = filtered.filter(p =>
        (p.word || '').toLowerCase().includes(searchQuery) ||
        (p.def || '').toLowerCase().includes(searchQuery));

    if (sortValue === 'az') filtered.sort((a, b) => (a.word || '').localeCompare(b.word || ''));
    else if (sortValue === 'za') filtered.sort((a, b) => (b.word || '').localeCompare(a.word || ''));

    const pageItems = applyPagination('prep', filtered);
    if (!pageItems.length) {
        list.innerHTML = `<tr><td colspan="4" class="empty-row">No phrases found.</td></tr>`;
        return;
    }

    list.innerHTML = pageItems.map(p => {
        const unitName = unitsData.find(u => u.id === p.unitId)?.title || 'Unknown';
        return `
            <tr>
                <td><strong>${escapeHtml(p.word)}</strong> ${p.status === 'draft' ? '<span class="badge badge-draft">Draft</span>' : ''}</td>
                <td>${escapeHtml(unitName)}</td>
                <td>${escapeHtml((p.def || '').slice(0, 120))}${(p.def || '').length > 120 ? '…' : ''}</td>
                <td>
                    <button class="btn-secondary btn-small" onclick="editPrep('${p.id}')">Edit</button>
                    <button class="btn-secondary btn-small" onclick="duplicatePrep('${p.id}')">Duplicate</button>
                    <button class="btn-danger btn-small" onclick="deletePrep('${p.id}')">Delete</button>
                </td>
            </tr>`;
    }).join('');
}

window.editPrep = (id) => {
    const p = prepData.find(p => p.id === id);
    if (p) {
        document.getElementById('prep-id').value = p.id;
        document.getElementById('prep-unit-id').value = p.unitId || '';
        document.getElementById('prep-word').value = p.word || '';
        document.getElementById('prep-def').value = p.def || '';
        document.getElementById('prep-example').value = p.example || '';
        document.getElementById('prep-status').value = p.status || 'published';
        document.getElementById('prep-modal-title').innerText = 'Edit Phrase';
        openModal(prepModal);
    }
};

window.duplicatePrep = async (id) => {
    const p = prepData.find(x => x.id === id);
    if (!p) return;
    const { id: _o, createdAt: _c, updatedAt: _u, ...rest } = p;
    try {
        await addDoc(collection(db, "prep_phrases"), stampCreate(rest));
        await reloadDataFor("prep_phrases");
        window.showToast('Phrase duplicated.', 'success');
    } catch (err) { console.error(err); window.showToast(friendlyError(err), 'error'); }
};

window.deletePrep = (id) => performDelete("prep_phrases", id, 'phrase');

/* =========================================================
   WORD FORMATION
   ========================================================= */
const wordformModal = document.getElementById('wordform-modal');
const wordformForm = document.getElementById('wordform-form');
const wordformContainer = document.getElementById('wordform-forms-container');
const wordformOverviewContainer = document.getElementById('wordform-overview-container');
let formIdCounter = 0;

function focusNewRow(row) {
    if (!row) return;
    row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const input = row.querySelector('input, textarea');
    if (input) input.focus();
}

function addOverviewRow(pos = '', words = '') {
    const row = document.createElement('div');
    row.className = 'wf-overview-row';
    row.style.cssText = 'display:flex; gap:0.5rem;';
    row.innerHTML = `
        <input type="text" class="input-field wf-overview-pos" placeholder="(noun)" value="${escapeHtml(pos)}" style="width: 100px;" required>
        <input type="text" class="input-field wf-overview-words" placeholder="act, action" value="${escapeHtml(words)}" style="flex: 1;" required>
        <button type="button" class="btn-secondary btn-danger btn-small" onclick="this.parentElement.remove()">X</button>
    `;
    wordformOverviewContainer.appendChild(row);
}

function addWordformRow(title = '', audios = [], definitions = '', examples = '') {
    formIdCounter++;
    const rowId = `wf-row-${formIdCounter}`;
    const row = document.createElement('div');
    row.className = 'wf-complex-row';

    let wordVal = title;
    let posVal = '';
    if (title) {
        const parts = title.trim().split(' ');
        if (parts.length > 1) {
            const lastPart = parts[parts.length - 1];
            if (['v', 'n', 'adj', 'adv', 'prep', 'conj', 'pron', 'det'].includes(lastPart.toLowerCase())) {
                posVal = lastPart;
                wordVal = parts.slice(0, -1).join(' ');
            }
        }
    }

    row.innerHTML = `
        <button type="button" class="btn-secondary btn-danger btn-small wf-remove-btn" onclick="this.parentElement.remove()">Remove Form</button>
        <div class="form-row">
            <div class="input-group flex-1">
                <label>Word</label>
                <input type="text" class="input-field wf-word" value="${escapeHtml(wordVal)}" required>
            </div>
            <div class="input-group" style="width: 200px;">
                <label>Part of Speech (POS)</label>
                <input type="text" class="input-field wf-pos" value="${escapeHtml(posVal)}">
            </div>
        </div>
        <div class="input-group">
            <label>Audios</label>
            <div id="${rowId}-audios" style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom: 0.5rem;"></div>
            <button type="button" class="btn-secondary btn-small" onclick="window.addAudioToRow('${rowId}', '', '', true)">+ Add Audio</button>
        </div>
        <div class="input-group">
            <label>Definitions</label>
            <textarea class="input-field wf-defs" rows="3">${escapeHtml(definitions)}</textarea>
        </div>
        <div class="input-group">
            <label>Examples</label>
            <textarea class="input-field wf-examples" rows="3">${escapeHtml(examples)}</textarea>
        </div>
    `;
    wordformContainer.appendChild(row);

    if (audios && audios.length > 0) {
        audios.forEach(a => window.addAudioToRow(rowId, a.pron, a.url));
    } else {
        window.addAudioToRow(rowId);
    }
}

window.addAudioToRow = function (rowId, pron = '', url = '', shouldFocus = false) {
    const container = document.getElementById(`${rowId}-audios`);
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'wf-audio-row';
    div.style.cssText = 'display:flex; gap:0.5rem;';
    div.innerHTML = `
        <input type="text" class="input-field wf-audio-pron" placeholder="Pronunciation (/ækt/)" value="${escapeHtml(pron)}" style="flex:1;">
        <input type="text" class="input-field wf-audio-url" placeholder="Audio URL" value="${escapeHtml(url)}" style="flex:2;">
        <button type="button" class="btn-secondary btn-danger btn-small" onclick="this.parentElement.remove()">X</button>
    `;
    container.appendChild(div);
    if (shouldFocus) {
        div.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        div.querySelector('.wf-audio-pron').focus();
    }
}

document.getElementById('add-overview-btn').addEventListener('click', () => {
    addOverviewRow();
    focusNewRow(wordformOverviewContainer.lastElementChild);
});

document.getElementById('add-wordform-btn').addEventListener('click', () => {
    addWordformRow();
    focusNewRow(wordformContainer.lastElementChild);
});

document.getElementById('add-new-wordform-btn').addEventListener('click', () => {
    document.getElementById('wordform-id').value = '';
    wordformForm.reset();
    applySavedUnitSelect(document.getElementById('wordform-unit-id'), 'wordform');
    document.getElementById('wordform-status').value = 'published';

    wordformOverviewContainer.innerHTML = '';
    addOverviewRow();

    wordformContainer.innerHTML = '';
    addWordformRow();

    document.getElementById('wordform-modal-title').innerText = 'Add Word Formation';
    openModal(wordformModal);
});

onSubmit(wordformForm, async () => {
    const id = document.getElementById('wordform-id').value;

    const overviewRows = wordformOverviewContainer.querySelectorAll('.wf-overview-row');
    let overviews = [];
    overviewRows.forEach(r => {
        const p = r.querySelector('.wf-overview-pos').value.trim();
        const w = r.querySelector('.wf-overview-words').value.trim();
        if (p && w) overviews.push({ pos: p, words: w });
    });

    const rows = wordformContainer.querySelectorAll('.wf-complex-row');
    let forms = [];
    rows.forEach(r => {
        const word = r.querySelector('.wf-word').value.trim();
        const pos = r.querySelector('.wf-pos').value.trim();
        const title = pos ? (word + ' ' + pos) : word;
        const defs = r.querySelector('.wf-defs').value.trim();
        const examples = r.querySelector('.wf-examples').value.trim();

        let audios = [];
        r.querySelectorAll('.wf-audio-row').forEach(ar => {
            const pron = ar.querySelector('.wf-audio-pron').value.trim();
            const url = ar.querySelector('.wf-audio-url').value.trim();
            if (pron || url) audios.push({ pron, url });
        });

        if (title) forms.push({ title, definitions: defs, examples: examples, audios });
    });

    const newWf = {
        unitId: document.getElementById('wordform-unit-id').value,
        rootWord: document.getElementById('wordform-root').value.trim(),
        overviews,
        forms,
        status: document.getElementById('wordform-status').value
    };

    rememberUnitSelection('wordform', newWf.unitId);
    if (!newWf.rootWord) { window.showToast('Root word is required.', 'error'); return; }
    if (isDuplicate(wordformData, w => w.unitId === newWf.unitId && (w.rootWord || '').toLowerCase() === newWf.rootWord.toLowerCase(), id)) {
        dupToast('word formation'); return;
    }

    if (id) {
        await updateDoc(doc(db, "word_formations", id), stampUpdate(newWf));
    } else {
        await addDoc(collection(db, "word_formations"), stampCreate(newWf));
    }
    window.closeModalOverlay(wordformModal);
    await reloadDataFor("word_formations");
    window.showToast('Saved!', 'success');
});

document.getElementById('filter-unit-select-wordform').addEventListener('change', renderWordform);
document.getElementById('search-wordform').addEventListener('input', () => { resetPage('wordform'); renderWordform(); });
document.getElementById('sort-wordform').addEventListener('change', renderWordform);

function renderWordform() {
    const list = document.getElementById('wordform-list');
    if (!list) return;
    const filter = document.getElementById('filter-unit-select-wordform').value;
    const searchQuery = document.getElementById('search-wordform').value.toLowerCase();
    const sortValue = document.getElementById('sort-wordform').value;

    let filtered = filter === 'all' ? wordformData : wordformData.filter(w => w.unitId === filter);
    filtered = filtered.filter(w => (w.rootWord || '').toLowerCase().includes(searchQuery));

    if (sortValue === 'az') filtered.sort((a, b) => (a.rootWord || '').localeCompare(b.rootWord || ''));
    else if (sortValue === 'za') filtered.sort((a, b) => (b.rootWord || '').localeCompare(a.rootWord || ''));

    const pageItems = applyPagination('wordform', filtered);
    if (!pageItems.length) {
        list.innerHTML = `<tr><td colspan="3" class="empty-row">No word formations found.</td></tr>`;
        return;
    }

    list.innerHTML = pageItems.map(w => {
        const unitName = unitsData.find(u => u.id === w.unitId)?.title || 'Unknown';
        return `
            <tr>
                <td><strong>${escapeHtml(w.rootWord)}</strong> ${w.status === 'draft' ? '<span class="badge badge-draft">Draft</span>' : ''}</td>
                <td>${escapeHtml(unitName)}</td>
                <td>
                    <button class="btn-secondary btn-small" onclick="editWordform('${w.id}')">Edit</button>
                    <button class="btn-secondary btn-small" onclick="duplicateWordform('${w.id}')">Duplicate</button>
                    <button class="btn-danger btn-small" onclick="deleteWordform('${w.id}')">Delete</button>
                </td>
            </tr>`;
    }).join('');
}

window.editWordform = (id) => {
    const w = wordformData.find(w => w.id === id);
    if (w) {
        document.getElementById('wordform-id').value = w.id;
        document.getElementById('wordform-unit-id').value = w.unitId || '';
        document.getElementById('wordform-root').value = w.rootWord || '';
        document.getElementById('wordform-status').value = w.status || 'published';

        wordformOverviewContainer.innerHTML = '';
        if (w.overviews && w.overviews.length > 0) {
            w.overviews.forEach(o => addOverviewRow(o.pos, o.words));
        } else {
            addOverviewRow();
        }

        wordformContainer.innerHTML = '';
        if (w.forms && w.forms.length > 0) {
            w.forms.forEach(f => addWordformRow(f.title, f.audios, f.definitions, f.examples));
        } else {
            addWordformRow();
        }

        document.getElementById('wordform-modal-title').innerText = 'Edit Word Formation';
        openModal(wordformModal);
    }
};

window.duplicateWordform = async (id) => {
    const w = wordformData.find(x => x.id === id);
    if (!w) return;
    const { id: _o, createdAt: _c, updatedAt: _u, ...rest } = w;
    rest.rootWord = (w.rootWord || 'root') + '-copy';
    try {
        await addDoc(collection(db, "word_formations"), stampCreate(rest));
        await reloadDataFor("word_formations");
        window.showToast('Word formation duplicated.', 'success');
    } catch (err) { console.error(err); window.showToast(friendlyError(err), 'error'); }
};

window.deleteWordform = (id) => performDelete("word_formations", id, 'word formation');

/* =========================================================
   WORD PATTERNS
   ========================================================= */
const patternModal = document.getElementById('pattern-modal');
const patternForm = document.getElementById('pattern-form');

document.getElementById('add-pattern-btn').addEventListener('click', () => {
    document.getElementById('pattern-id').value = '';
    patternForm.reset();
    applySavedUnitSelect(document.getElementById('pattern-unit'), 'pattern');
    document.getElementById('pattern-status').value = 'published';
    document.getElementById('pattern-modal-title').innerText = 'Add New Word Pattern';
    openModal(patternModal);
});

onSubmit(patternForm, async () => {
    const id = document.getElementById('pattern-id').value;
    const payload = {
        unitId: document.getElementById('pattern-unit').value,
        word: document.getElementById('pattern-word').value.trim(),
        pos: document.getElementById('pattern-pos').value.trim(),
        pattern: document.getElementById('pattern-pattern').value.trim(),
        def: document.getElementById('pattern-def').value.trim(),
        example: document.getElementById('pattern-example').value.trim(),
        status: document.getElementById('pattern-status').value
    };

    rememberUnitSelection('pattern', payload.unitId);
    if (!payload.word) { window.showToast('Word is required.', 'error'); return; }
    if (isDuplicate(patternData, p => p.unitId === payload.unitId && (p.word || '').toLowerCase() === payload.word.toLowerCase(), id)) {
        dupToast('word pattern'); return;
    }

    if (id) {
        await updateDoc(doc(db, "word_patterns", id), stampUpdate(payload));
    } else {
        await addDoc(collection(db, "word_patterns"), stampCreate(payload));
    }
    window.closeModalOverlay(patternModal);
    await reloadDataFor("word_patterns");
    window.showToast('Saved!', 'success');
});

document.getElementById('filter-unit-select-pattern').addEventListener('change', renderPattern);
document.getElementById('search-pattern').addEventListener('input', () => { resetPage('pattern'); renderPattern(); });
document.getElementById('sort-pattern').addEventListener('change', renderPattern);

function renderPattern() {
    const list = document.getElementById('pattern-list');
    if (!list) return;
    const filter = document.getElementById('filter-unit-select-pattern').value;
    const searchQuery = document.getElementById('search-pattern').value.toLowerCase();
    const sortValue = document.getElementById('sort-pattern').value;

    let filtered = filter === 'all' ? patternData : patternData.filter(p => p.unitId === filter);
    filtered = filtered.filter(p => (p.word || '').toLowerCase().includes(searchQuery));

    if (sortValue === 'az') filtered.sort((a, b) => (a.word || '').localeCompare(b.word || ''));
    else if (sortValue === 'za') filtered.sort((a, b) => (b.word || '').localeCompare(a.word || ''));

    // FIX: pagination now actually slices the list for this tab
    const pageItems = applyPagination('pattern', filtered);
    if (!pageItems.length) {
        list.innerHTML = `<tr><td colspan="3" class="empty-row">No word patterns found.</td></tr>`;
        return;
    }

    list.innerHTML = pageItems.map(p => {
        const unitName = unitsData.find(u => u.id === p.unitId)?.title || 'Unknown';
        return `
            <tr>
                <td><strong>${escapeHtml(p.word)}</strong> <small>${escapeHtml(p.pos)}</small>${p.status === 'draft' ? ' <span class="badge badge-draft">Draft</span>' : ''}<br><small>${escapeHtml(p.pattern)}</small></td>
                <td>${escapeHtml(unitName)}</td>
                <td>
                    <button class="btn-secondary btn-small" onclick="editPattern('${p.id}')">Edit</button>
                    <button class="btn-secondary btn-small" onclick="duplicatePattern('${p.id}')">Duplicate</button>
                    <button class="btn-danger btn-small" onclick="deletePattern('${p.id}')">Delete</button>
                </td>
            </tr>`;
    }).join('');
}

window.editPattern = (id) => {
    const p = patternData.find(x => x.id === id);
    if (p) {
        document.getElementById('pattern-id').value = p.id;
        document.getElementById('pattern-unit').value = p.unitId || '';
        document.getElementById('pattern-word').value = p.word || '';
        document.getElementById('pattern-pos').value = p.pos || '';
        document.getElementById('pattern-pattern').value = p.pattern || '';
        document.getElementById('pattern-def').value = p.def || '';
        document.getElementById('pattern-example').value = p.example || '';
        document.getElementById('pattern-status').value = p.status || 'published';
        document.getElementById('pattern-modal-title').innerText = 'Edit Word Pattern';
        openModal(patternModal);
    }
};

window.duplicatePattern = async (id) => {
    const p = patternData.find(x => x.id === id);
    if (!p) return;
    const { id: _o, createdAt: _c, updatedAt: _u, ...rest } = p;
    try {
        await addDoc(collection(db, "word_patterns"), stampCreate(rest));
        await reloadDataFor("word_patterns");
        window.showToast('Pattern duplicated.', 'success');
    } catch (err) { console.error(err); window.showToast(friendlyError(err), 'error'); }
};

window.deletePattern = (id) => performDelete("word_patterns", id, 'pattern');

/* =========================================================
   LEXICAL EXPANSION
   ========================================================= */
const lexicalModal = document.getElementById('lexical-modal');
const lexicalForm = document.getElementById('lexical-form');
const lexicalWordsContainer = document.getElementById('lexical-words-container');

window.addLexicalWordRow = function (word = '', pos = '', pron = '', audio = '', def = '', example = '') {
    const rowId = 'lexical-word-' + Date.now() + Math.random().toString(36).slice(2, 11);
    const div = document.createElement('div');
    div.className = 'lexical-word-row';
    div.dataset.rowId = rowId;
    div.innerHTML = `
        <button type="button" class="btn-secondary btn-danger btn-small lx-remove-btn" onclick="this.parentElement.remove()">Remove</button>
        <input type="hidden" class="lx-audio" value="${escapeHtml(audio)}">
        <div class="form-row" style="margin-bottom: 0.5rem; padding-right: 4rem;">
            <div class="input-group flex-1">
                <label>Word</label>
                <input type="text" class="input-field lx-word" placeholder="Word" value="${escapeHtml(word)}">
            </div>
            <div class="input-group" style="width: 100px;">
                <label>POS</label>
                <input type="text" class="input-field lx-pos" placeholder="POS" value="${escapeHtml(pos)}">
            </div>
        </div>
        <div class="input-group" style="margin-bottom: 0.5rem;">
            <label>Pronunciation / Notes</label>
            <textarea class="lx-pron" rows="2" placeholder="Pronunciation / Notes">${escapeHtml(pron)}</textarea>
        </div>
        <div class="input-group" style="margin-bottom: 0.5rem;">
            <label>Definition</label>
            <textarea class="lx-def" rows="2" placeholder="Definition">${escapeHtml(def)}</textarea>
        </div>
        <div class="input-group" style="margin-bottom: 0;">
            <label>Example</label>
            <textarea class="lx-example" rows="2" placeholder="Example">${escapeHtml(example)}</textarea>
        </div>
    `;
    lexicalWordsContainer.appendChild(div);
};

if (document.getElementById('add-lexical-word-btn')) {
    document.getElementById('add-lexical-word-btn').addEventListener('click', () => {
        addLexicalWordRow();
        focusNewRow(lexicalWordsContainer.lastElementChild);
    });
}

if (document.getElementById('add-lexical-btn')) {
    document.getElementById('add-lexical-btn').addEventListener('click', () => {
        document.getElementById('lexical-id').value = '';
        lexicalForm.reset();
        applySavedUnitSelect(document.getElementById('lexical-unit-id'), 'lexical');
        document.getElementById('lexical-status').value = 'published';
        lexicalWordsContainer.innerHTML = '';
        addLexicalWordRow();
        document.getElementById('lexical-modal-title').innerText = 'Add Lexical Expansion';
        openModal(lexicalModal);
    });
}

if (lexicalForm) {
    onSubmit(lexicalForm, async () => {
        const id = document.getElementById('lexical-id').value;
        const unitId = document.getElementById('lexical-unit-id').value;
        const textLeft = document.getElementById('lexical-text-left').value;
        const alignLeft = document.getElementById('lexical-align-left').value;
        const textRight = document.getElementById('lexical-text-right').value;
        const alignRight = document.getElementById('lexical-align-right').value;

        const words = [];
        lexicalWordsContainer.querySelectorAll('.lexical-word-row').forEach(r => {
            const w = r.querySelector('.lx-word').value.trim();
            const p = r.querySelector('.lx-pos').value.trim();
            const pr = r.querySelector('.lx-pron').value.trim();
            const au = r.querySelector('.lx-audio')?.value.trim() || '';
            const d = r.querySelector('.lx-def').value.trim();
            const ex = r.querySelector('.lx-example').value.trim();
            if (w) words.push({ word: w, pos: p, pron: pr, audio: au, def: d, example: ex });
        });

        const payload = { unitId, textLeft, alignLeft, textRight, alignRight, words, status: document.getElementById('lexical-status').value };

        rememberUnitSelection('lexical', unitId);
        if (!unitId) { window.showToast('Please select a unit.', 'error'); return; }

        try {
            if (id) {
                await updateDoc(doc(db, "lexical_expansions", id), stampUpdate(payload));
            } else {
                await addDoc(collection(db, "lexical_expansions"), stampCreate(payload));
            }
            window.closeModalOverlay(lexicalModal);
            await reloadDataFor("lexical_expansions");
            window.showToast('Saved!', 'success');
        } catch (err) { console.error(err); window.showToast(friendlyError(err), 'error'); }
    });
}

if (document.getElementById('filter-unit-select-lexical')) {
    document.getElementById('filter-unit-select-lexical').addEventListener('change', () => renderLexical());
}

function renderLexical() {
    const list = document.getElementById('lexical-list');
    if (!list) return;
    const filter = document.getElementById('filter-unit-select-lexical').value;

    let filtered = filter === 'all' ? lexicalData : lexicalData.filter(p => p.unitId === filter);
    filtered.sort((a, b) => (a.textLeft || '').localeCompare(b.textLeft || ''));

    // FIX: pagination now actually slices the list for this tab
    const pageItems = applyPagination('lexical', filtered);
    if (!pageItems.length) {
        list.innerHTML = `<tr><td colspan="3" class="empty-row">No lexical expansions found.</td></tr>`;
        return;
    }

    list.innerHTML = pageItems.map(p => {
        const unitName = unitsData.find(u => u.id === p.unitId)?.title || 'Unknown';
        return `
            <tr>
                <td>${escapeHtml(unitName)} ${p.status === 'draft' ? '<span class="badge badge-draft">Draft</span>' : ''}</td>
                <td><pre style="font-family:inherit; font-size: 0.8rem; max-width: 300px; max-height: 100px; overflow: hidden; margin:0;">${escapeHtml((p.textLeft || '').slice(0, 200))}</pre></td>
                <td>
                    <button class="btn-secondary btn-small" onclick="editLexical('${p.id}')">Edit</button>
                    <button class="btn-secondary btn-small" onclick="duplicateLexical('${p.id}')">Duplicate</button>
                    <button class="btn-danger btn-small" onclick="deleteLexical('${p.id}')">Delete</button>
                </td>
            </tr>`;
    }).join('');
}

window.editLexical = (id) => {
    const p = lexicalData.find(x => x.id === id);
    if (p) {
        document.getElementById('lexical-id').value = p.id;
        document.getElementById('lexical-unit-id').value = p.unitId || '';
        document.getElementById('lexical-text-left').value = p.textLeft || '';
        document.getElementById('lexical-align-left').value = p.alignLeft || 'left';
        document.getElementById('lexical-text-right').value = p.textRight || '';
        document.getElementById('lexical-align-right').value = p.alignRight || 'left';
        document.getElementById('lexical-status').value = p.status || 'published';

        lexicalWordsContainer.innerHTML = '';
        if (p.words && p.words.length > 0) {
            p.words.forEach(w => addLexicalWordRow(w.word, w.pos, w.pron, w.audio, w.def, w.example));
        } else {
            addLexicalWordRow();
        }

        document.getElementById('lexical-modal-title').innerText = 'Edit Lexical Expansion';
        openModal(lexicalModal);
    }
};

window.duplicateLexical = async (id) => {
    const p = lexicalData.find(x => x.id === id);
    if (!p) return;
    const { id: _o, createdAt: _c, updatedAt: _u, ...rest } = p;
    try {
        await addDoc(collection(db, "lexical_expansions"), stampCreate(rest));
        await reloadDataFor("lexical_expansions");
        window.showToast('Lexical expansion duplicated.', 'success');
    } catch (err) { console.error(err); window.showToast(friendlyError(err), 'error'); }
};

window.deleteLexical = (id) => performDelete("lexical_expansions", id, 'lexical expansion');

/* =========================================================
   GRAMMAR MANAGEMENT
   ========================================================= */

// --- Shared tree CRUD factory (used by Grammar AND Pronunciation) ---
function makeTreeManager(cfg) {
    const state = { categories: [], lessons: [], units: [] };

    const catList = document.getElementById(cfg.catListId);
    const lessonList = document.getElementById(cfg.lessonListId);
    const unitList = document.getElementById(cfg.unitListId);

    async function loadData() {
        try {
            const [cats, les, unis] = await Promise.all([
                fetchAll(cfg.categories),
                fetchAll(cfg.lessons),
                fetchAll(cfg.units)
            ]);
            state.categories = cats;
            state.lessons = les;
            state.units = unis;
            renderCategories();
            updateCatSelects();
            renderLessons();
            renderUnits();
            updateUnitSelects();
            updateDashboardStats();
        } catch (e) {
            console.error(`Error loading ${cfg.label} data:`, e);
            window.showToast(`Could not load ${cfg.label} data: ${friendlyError(e)}`, 'error');
        }
    }

    function renderCategories() {
        if (!catList) return;
        if (!state.categories.length) {
            catList.innerHTML = `<tr><td colspan="3" class="empty-row">No categories yet.</td></tr>`;
            return;
        }
        catList.innerHTML = state.categories.map(cat => `
            <tr>
                <td>${cat.order || 0}</td>
                <td><strong>${escapeHtml(cat.title)}</strong></td>
                <td>
                    <button class="btn-secondary btn-small" onclick="${cfg.fnPrefix}EditCat('${cat.id}')">Edit</button>
                    <button class="btn-danger btn-small" onclick="${cfg.fnPrefix}DeleteCat('${cat.id}')">Delete</button>
                </td>
            </tr>`).join('');
    }

    function updateCatSelects() {
        const filterCat = document.getElementById(cfg.filterCatId);
        const lessonCat = document.getElementById(cfg.lessonCatId);
        const unitCatFilter = document.getElementById(cfg.unitCatFilterId);
        const unitCat = document.getElementById(cfg.unitCatId);

        const optList = state.categories.map(cat => `<option value="${cat.id}">${escapeHtml(cat.title)}</option>`).join('');

        if (filterCat) {
            const cur = filterCat.value;
            filterCat.innerHTML = '<option value="all">All Categories</option>' + optList;
            filterCat.value = cur || 'all';
        }
        if (lessonCat) {
            const cur = lessonCat.value;
            lessonCat.innerHTML = optList;
            if (cur) lessonCat.value = cur;
        }
        if (unitCatFilter) {
            const cur = unitCatFilter.value;
            unitCatFilter.innerHTML = '<option value="all">All Categories</option>' + optList;
            unitCatFilter.value = cur || 'all';
        }
        if (unitCat) {
            const cur = unitCat.value;
            unitCat.innerHTML = '<option value="">-- Select to filter lessons --</option>' + optList;
            unitCat.value = cur || '';
        }
    }

    function updateUnitSelects(selectedCat = null) {
        const unitLesFilter = document.getElementById(cfg.unitLesFilterId);
        const unitLes = document.getElementById(cfg.unitLesId);

        const sortedLessons = [...state.lessons].sort((a, b) => (a.order || 0) - (b.order || 0));

        if (unitLesFilter) {
            const cur = unitLesFilter.value;
            unitLesFilter.innerHTML = '<option value="all">All Lessons</option>';
            const filterCatId = document.getElementById(cfg.unitCatFilterId)?.value;
            const lessonsForFilter = filterCatId && filterCatId !== 'all'
                ? sortedLessons.filter(l => l.categoryId === filterCatId)
                : sortedLessons;
            unitLesFilter.innerHTML += lessonsForFilter.map(l => `<option value="${l.id}">${escapeHtml(l.title)}</option>`).join('');
            unitLesFilter.value = cur || 'all';
        }

        if (unitLes) {
            const cur = unitLes.value;
            unitLes.innerHTML = '';
            const lessonsForForm = selectedCat
                ? sortedLessons.filter(l => l.categoryId === selectedCat)
                : sortedLessons;
            unitLes.innerHTML += lessonsForForm.map(l => `<option value="${l.id}">${escapeHtml(l.title)}</option>`).join('');
            if (cur) unitLes.value = cur;
        }
    }

    function renderLessons() {
        if (!lessonList) return;
        const filterId = document.getElementById(cfg.filterCatId)?.value || 'all';

        let filtered = filterId !== 'all'
            ? state.lessons.filter(l => l.categoryId === filterId)
            : state.lessons;
        filtered.sort((a, b) => (a.order || 0) - (b.order || 0));

        if (!filtered.length) {
            lessonList.innerHTML = `<tr><td colspan="4" class="empty-row">No lessons yet.</td></tr>`;
            return;
        }

        lessonList.innerHTML = filtered.map(les => {
            const catName = state.categories.find(c => c.id === les.categoryId)?.title || 'Unknown';
            return `
            <tr>
                <td>${les.order || 0}</td>
                <td><span class="badge">${escapeHtml(catName)}</span></td>
                <td><strong>${escapeHtml(les.title)}</strong> ${les.status === 'draft' ? '<span class="badge badge-draft">Draft</span>' : ''}</td>
                <td>
                    <button class="btn-secondary btn-small" onclick="${cfg.fnPrefix}EditLesson('${les.id}')">Edit</button>
                    <button class="btn-danger btn-small" onclick="${cfg.fnPrefix}DeleteLesson('${les.id}')">Delete</button>
                </td>
            </tr>`;
        }).join('');
    }

    function renderUnits() {
        if (!unitList) return;
        const filterCatId = document.getElementById(cfg.unitCatFilterId)?.value || 'all';
        const filterLesId = document.getElementById(cfg.unitLesFilterId)?.value || 'all';

        let filtered = state.units;
        if (filterLesId !== 'all') {
            filtered = filtered.filter(u => u.lessonId === filterLesId);
        } else if (filterCatId !== 'all') {
            const allowedLessons = state.lessons.filter(l => l.categoryId === filterCatId).map(l => l.id);
            filtered = filtered.filter(u => allowedLessons.includes(u.lessonId));
        }
        filtered.sort((a, b) => (a.order || 0) - (b.order || 0));

        if (!filtered.length) {
            unitList.innerHTML = `<tr><td colspan="4" class="empty-row">No units yet.</td></tr>`;
            return;
        }

        unitList.innerHTML = filtered.map(unit => {
            const lessonName = state.lessons.find(l => l.id === unit.lessonId)?.title || 'Unknown';
            return `
            <tr>
                <td>${unit.order || 0}</td>
                <td><span class="badge badge-muted">${escapeHtml(lessonName)}</span></td>
                <td><strong>${escapeHtml(unit.title)}</strong> ${unit.status === 'draft' ? '<span class="badge badge-draft">Draft</span>' : ''}</td>
                <td>
                    <button class="btn-secondary btn-small" onclick="${cfg.fnPrefix}EditUnit('${unit.id}')">Edit</button>
                    <button class="btn-danger btn-small" onclick="${cfg.fnPrefix}DeleteUnit('${unit.id}')">Delete</button>
                </td>
            </tr>`;
        }).join('');
    }

    // Wire filters
    document.getElementById(cfg.filterCatId)?.addEventListener('change', renderLessons);
    document.getElementById(cfg.unitCatFilterId)?.addEventListener('change', () => {
        updateUnitSelects();
        renderUnits();
        updateDashboardStats();
    });
    document.getElementById(cfg.unitLesFilterId)?.addEventListener('change', renderUnits);
    document.getElementById(cfg.unitCatId)?.addEventListener('change', (e) => updateUnitSelects(e.target.value));

    // Add buttons
    document.getElementById(cfg.addCatBtnId)?.addEventListener('click', () => {
        document.getElementById(cfg.catFormId).reset();
        document.getElementById(cfg.catIdField).value = '';
        document.getElementById(cfg.catOrderField).value = state.categories.length > 0 ? Math.max(...state.categories.map(c => c.order || 0)) + 1 : 1;
        document.getElementById(cfg.catTitleFieldId).innerText = 'Add Category';
        openModal(document.getElementById(cfg.catModalId));
    });

    document.getElementById(cfg.addLessonBtnId)?.addEventListener('click', () => {
        const lastCat = document.getElementById(cfg.lessonCatId).value;
        document.getElementById(cfg.lessonFormId).reset();
        if (lastCat) document.getElementById(cfg.lessonCatId).value = lastCat;
        document.getElementById(cfg.lessonIdField).value = '';
        document.getElementById(cfg.lessonOrderField).value = state.lessons.length > 0 ? Math.max(...state.lessons.map(l => l.order || 0)) + 1 : 1;
        document.getElementById(cfg.lessonStatusId).value = 'published';
        if (typeof tinymce !== 'undefined' && tinymce.get(cfg.lessonContentId)) {
            tinymce.get(cfg.lessonContentId).setContent('');
        } else {
            const ta = document.getElementById(cfg.lessonContentId);
            if (ta) ta.value = '';
        }
        document.getElementById(cfg.lessonTitleFieldId).innerText = 'Add Lesson';
        openModal(document.getElementById(cfg.lessonModalId));
    });

    document.getElementById(cfg.addUnitBtnId)?.addEventListener('click', () => {
        const lastLes = document.getElementById(cfg.unitLesId).value;
        const lastCat = document.getElementById(cfg.unitCatId).value;
        document.getElementById(cfg.unitFormId).reset();
        if (lastLes) document.getElementById(cfg.unitLesId).value = lastLes;
        if (lastCat) document.getElementById(cfg.unitCatId).value = lastCat;
        document.getElementById(cfg.unitIdField).value = '';
        document.getElementById(cfg.unitOrderField).value = state.units.length > 0 ? Math.max(...state.units.map(u => u.order || 0)) + 1 : 1;
        document.getElementById(cfg.unitStatusId).value = 'published';
        if (typeof tinymce !== 'undefined' && tinymce.get(cfg.unitContentId)) {
            tinymce.get(cfg.unitContentId).setContent('');
        } else {
            const ta = document.getElementById(cfg.unitContentId);
            if (ta) ta.value = '';
        }
        document.getElementById(cfg.unitTitleFieldId).innerText = 'Add Unit';
        openModal(document.getElementById(cfg.unitModalId));
    });

    // Category submit
    const catForm = document.getElementById(cfg.catFormId);
    onSubmit(catForm, async () => {
        const id = document.getElementById(cfg.catIdField).value;
        const title = document.getElementById(cfg.catTitleInputId).value.trim();
        const order = parseInt(document.getElementById(cfg.catOrderField).value) || 0;
        if (!title) { window.showToast('Category title is required.', 'error'); return; }
        if (isDuplicate(state.categories, c => (c.title || '').toLowerCase() === title.toLowerCase(), id)) {
            dupToast('category'); return;
        }
        if (id) {
            await updateDoc(doc(db, cfg.categories, id), stampUpdate({ title, order }));
        } else {
            await addDoc(collection(db, cfg.categories), stampCreate({ title, order }));
        }
        window.closeModalOverlay(document.getElementById(cfg.catModalId));
        await loadData();
        window.showToast('Saved!', 'success');
    });

    // Lesson submit
    const lessonForm = document.getElementById(cfg.lessonFormId);
    onSubmit(lessonForm, async () => {
        const id = document.getElementById(cfg.lessonIdField).value;
        const categoryId = document.getElementById(cfg.lessonCatId).value;
        const title = document.getElementById(cfg.lessonTitleInputId).value.trim();
        const author = '';
        const order = parseInt(document.getElementById(cfg.lessonOrderField).value) || 0;
        const status = document.getElementById(cfg.lessonStatusId).value;
        const rawContent = typeof tinymce !== 'undefined' && tinymce.get(cfg.lessonContentId)
            ? tinymce.get(cfg.lessonContentId).getContent()
            : (document.getElementById(cfg.lessonContentId)?.value || '');
        const content = sanitizeRichText(rawContent);

        if (!categoryId) { window.showToast('Please select a category.', 'error'); return; }
        if (!title) { window.showToast('Lesson title is required.', 'error'); return; }
        if (isDuplicate(state.lessons, l => l.categoryId === categoryId && (l.title || '').toLowerCase() === title.toLowerCase(), id)) {
            dupToast('lesson'); return;
        }

        if (id) {
            await updateDoc(doc(db, cfg.lessons, id), stampUpdate({ categoryId, title, author, order, content, status }));
        } else {
            await addDoc(collection(db, cfg.lessons), stampCreate({ categoryId, title, author, order, content, status }));
        }
        window.closeModalOverlay(document.getElementById(cfg.lessonModalId));
        await loadData();
        window.showToast('Saved!', 'success');
    });

    // Unit submit
    const unitForm = document.getElementById(cfg.unitFormId);
    onSubmit(unitForm, async () => {
        const id = document.getElementById(cfg.unitIdField).value;
        const lessonId = document.getElementById(cfg.unitLesId).value;
        const title = document.getElementById(cfg.unitTitleInputId).value.trim();
        const author = '';
        const order = parseInt(document.getElementById(cfg.unitOrderField).value) || 0;
        const status = document.getElementById(cfg.unitStatusId).value;
        const rawContent = typeof tinymce !== 'undefined' && tinymce.get(cfg.unitContentId)
            ? tinymce.get(cfg.unitContentId).getContent()
            : (document.getElementById(cfg.unitContentId)?.value || '');
        const content = sanitizeRichText(rawContent);

        if (!lessonId) { window.showToast('Please select a Lesson.', 'error'); return; }
        if (!title) { window.showToast('Unit title is required.', 'error'); return; }
        if (isDuplicate(state.units, u => u.lessonId === lessonId && (u.title || '').toLowerCase() === title.toLowerCase(), id)) {
            dupToast('unit'); return;
        }

        if (id) {
            await updateDoc(doc(db, cfg.units, id), stampUpdate({ lessonId, title, author, order, content, status }));
        } else {
            await addDoc(collection(db, cfg.units), stampCreate({ lessonId, title, author, order, content, status }));
        }
        window.closeModalOverlay(document.getElementById(cfg.unitModalId));
        await loadData();
        window.showToast('Saved!', 'success');
    });

    // Edit/delete exposed functions
    window[cfg.fnPrefix + 'EditCat'] = function (id) {
        const cat = state.categories.find(c => c.id === id);
        if (!cat) return;
        document.getElementById(cfg.catIdField).value = cat.id;
        document.getElementById(cfg.catTitleInputId).value = cat.title || '';
        document.getElementById(cfg.catOrderField).value = cat.order || 0;
        document.getElementById(cfg.catTitleFieldId).innerText = 'Edit Category';
        openModal(document.getElementById(cfg.catModalId));
    };

    window[cfg.fnPrefix + 'DeleteCat'] = async function (id) {
        const childCount = state.lessons.filter(l => l.categoryId === id).length;
        const warning = childCount > 0 ? `${childCount} lesson${childCount > 1 ? 's' : ''} in this category will be orphaned.` : '';
        await performDelete(cfg.categories, id, 'category', warning);
    };

    window[cfg.fnPrefix + 'EditLesson'] = async function (id) {
        const les = state.lessons.find(l => l.id === id);
        if (!les) return;
        document.getElementById(cfg.lessonIdField).value = les.id;
        document.getElementById(cfg.lessonCatId).value = les.categoryId || '';
        document.getElementById(cfg.lessonTitleInputId).value = les.title || '';
        document.getElementById(cfg.lessonOrderField).value = les.order || 0;
        document.getElementById(cfg.lessonStatusId).value = les.status || 'published';

        if (typeof tinymce !== 'undefined' && tinymce.get(cfg.lessonContentId)) {
            tinymce.get(cfg.lessonContentId).setContent(les.content || '');
        } else {
            const ta = document.getElementById(cfg.lessonContentId);
            if (ta) ta.value = les.content || '';
        }
        document.getElementById(cfg.lessonTitleFieldId).innerText = 'Edit Lesson';
        openModal(document.getElementById(cfg.lessonModalId));
    };

    window[cfg.fnPrefix + 'DeleteLesson'] = async function (id) {
        const childCount = state.units.filter(u => u.lessonId === id).length;
        const warning = childCount > 0 ? `${childCount} unit${childCount > 1 ? 's' : ''} in this lesson will be orphaned.` : '';
        await performDelete(cfg.lessons, id, 'lesson', warning);
    };

    window[cfg.fnPrefix + 'EditUnit'] = async function (id) {
        const unit = state.units.find(u => u.id === id);
        if (!unit) return;
        document.getElementById(cfg.unitIdField).value = unit.id;

        const lesson = state.lessons.find(l => l.id === unit.lessonId);
        if (lesson) {
            document.getElementById(cfg.unitCatId).value = lesson.categoryId;
            updateUnitSelects(lesson.categoryId);
        }

        document.getElementById(cfg.unitLesId).value = unit.lessonId || '';
        document.getElementById(cfg.unitTitleInputId).value = unit.title || '';
        document.getElementById(cfg.unitOrderField).value = unit.order || 0;
        document.getElementById(cfg.unitStatusId).value = unit.status || 'published';

        if (typeof tinymce !== 'undefined' && tinymce.get(cfg.unitContentId)) {
            tinymce.get(cfg.unitContentId).setContent(unit.content || '');
        } else {
            const ta = document.getElementById(cfg.unitContentId);
            if (ta) ta.value = unit.content || '';
        }
        document.getElementById(cfg.unitTitleFieldId).innerText = 'Edit Unit';
        openModal(document.getElementById(cfg.unitModalId));
    };

    window[cfg.fnPrefix + 'DeleteUnit'] = async function (id) {
        await performDelete(cfg.units, id, 'unit');
    };

    return { loadData, state };
}

/* ---- TinyMCE init (kept config) ---- */
let tinymceInitialized = false;
function initTinyMCE() {
    if (tinymceInitialized || typeof tinymce === 'undefined') return;
    tinymce.init({
        selector: '.tinymce-editor',
        plugins: 'lists link image media table code help wordcount fullscreen',
        toolbar_sticky: false,
        toolbar_mode: 'wrap',
        toolbar: 'fullscreen | undo redo | fontfamily fontsize blocks | bold italic forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | removeformat | code | help',
        font_size_formats: '10pt 12pt 14pt 16pt 18pt 20pt 22pt 24pt 26pt 28pt 30pt 32pt 34pt 36pt',
        font_family_formats: 'Zeequada=Zeequada,sans-serif; Urbanist=Urbanist,sans-serif; Playfair Display=Playfair Display,serif; Roboto=Roboto,sans-serif; Open Sans="Open Sans",sans-serif; Lato=Lato,sans-serif; Montserrat=Montserrat,sans-serif; Oswald=Oswald,sans-serif; Arial=arial,helvetica,sans-serif; Comic Sans MS=comic sans ms,sans-serif; Courier New=courier new,courier; Georgia=georgia,palatino; Helvetica=helvetica; Impact=impact,chicago; Tahoma=tahoma,arial,helvetica,sans-serif; Times New Roman=times new roman,times; Trebuchet MS=trebuchet ms,geneva; Verdana=verdana,geneva',
        color_map: [
            "000000", "Black", "993300", "Burnt orange", "333300", "Dark olive",
            "003300", "Dark green", "003366", "Dark azure", "000080", "Navy Blue",
            "333399", "Indigo", "333333", "Very dark gray", "800000", "Maroon",
            "FF6600", "Orange", "808000", "Olive", "008000", "Green", "008080", "Teal",
            "0000FF", "Blue", "666699", "Grayish blue", "808080", "Gray", "FF0000", "Red",
            "FF9900", "Amber", "99CC00", "Yellow green", "339966", "Sea green",
            "33CCCC", "Turquoise", "3366FF", "Royal blue", "800080", "Purple",
            "999999", "Medium gray", "FF00FF", "Magenta", "FFCC00", "Gold",
            "FFFF00", "Yellow", "00FF00", "Lime", "00FFFF", "Aqua", "00CCFF", "Sky blue",
            "993366", "Red violet", "FFFFFF", "White", "FF99CC", "Pink", "FFCC99", "Peach",
            "FFFF99", "Light yellow", "CCFFCC", "Pale green", "CCFFFF", "Pale cyan",
            "99CCFF", "Light sky blue", "CC99FF", "Plum"
        ],
        custom_colors: true,
        extended_valid_elements: 'span[style|class|id]',
        menubar: true,
        height: 400,
        promotion: false,
        image_advtab: true,
        media_live_embeds: true,
        content_style: "@font-face { font-family: 'Zeequada'; src: url('../assets/fonts/Zeequada-Regular.otf'); } @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Urbanist:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&display=swap'); body { font-family: 'Urbanist', sans-serif; font-size: 1.15rem; line-height: 1.6; } h1, h2, h3, h4, h5, h6 { font-family: 'Playfair Display', serif; margin-top: 1.5rem; margin-bottom: 1rem; font-weight: 600; }",
        setup: function (editor) {
            editor.on('change keyup', function () {
                window.isModalDirty = true;
            });
        }
    });
    tinymceInitialized = true;
}

/* ---- Instantiate managers ---- */
const grammarManager = makeTreeManager({
    label: 'Grammar',
    fnPrefix: 'g',
    categories: 'grammar_categories', lessons: 'grammar_lessons', units: 'grammar_units',
    catListId: 'grammar-cat-list', lessonListId: 'grammar-lesson-list', unitListId: 'grammar-unit-list',
    filterCatId: 'filter-grammar-cat', lessonCatId: 'grammar-lesson-category',
    unitCatFilterId: 'filter-grammar-unit-cat', unitCatId: 'grammar-unit-category',
    unitLesFilterId: 'filter-grammar-unit-les', unitLesId: 'grammar-unit-lesson',
    catModalId: 'grammar-cat-modal', catFormId: 'grammar-cat-form', catIdField: 'grammar-cat-id',
    catTitleInputId: 'grammar-cat-title', catOrderField: 'grammar-cat-order', catTitleFieldId: 'grammar-cat-modal-title',
    lessonModalId: 'grammar-lesson-modal', lessonFormId: 'grammar-lesson-form', lessonIdField: 'grammar-lesson-id',
    lessonTitleInputId: 'grammar-lesson-title', lessonOrderField: 'grammar-lesson-order',
    lessonStatusId: 'grammar-lesson-status', lessonContentId: 'grammar-lesson-content', lessonTitleFieldId: 'grammar-lesson-modal-title',
    unitModalId: 'grammar-unit-modal', unitFormId: 'grammar-unit-form', unitIdField: 'grammar-unit-id',
    unitTitleInputId: 'grammar-unit-title', unitOrderField: 'grammar-unit-order',
    unitStatusId: 'grammar-unit-status', unitContentId: 'grammar-unit-content', unitTitleFieldId: 'grammar-unit-modal-title',
    addCatBtnId: 'add-grammar-cat-btn', addLessonBtnId: 'add-grammar-lesson-btn', addUnitBtnId: 'add-grammar-unit-btn'
});
loadGrammarData = () => grammarManager.loadData();

const pronunciationManager = makeTreeManager({
    label: 'Pronunciation',
    fnPrefix: 'p',
    categories: 'pronunciation_categories', lessons: 'pronunciation_lessons', units: 'pronunciation_units',
    catListId: 'pronunciation-cat-list', lessonListId: 'pronunciation-lesson-list', unitListId: 'pronunciation-unit-list',
    filterCatId: 'filter-pronunciation-cat', lessonCatId: 'pronunciation-lesson-category',
    unitCatFilterId: 'filter-pronunciation-unit-cat', unitCatId: 'pronunciation-unit-category',
    unitLesFilterId: 'filter-pronunciation-unit-les', unitLesId: 'pronunciation-unit-lesson',
    catModalId: 'pronunciation-cat-modal', catFormId: 'pronunciation-cat-form', catIdField: 'pronunciation-cat-id',
    catTitleInputId: 'pronunciation-cat-title', catOrderField: 'pronunciation-cat-order', catTitleFieldId: 'pronunciation-cat-modal-title',
    lessonModalId: 'pronunciation-lesson-modal', lessonFormId: 'pronunciation-lesson-form', lessonIdField: 'pronunciation-lesson-id',
    lessonTitleInputId: 'pronunciation-lesson-title', lessonOrderField: 'pronunciation-lesson-order',
    lessonStatusId: 'pronunciation-lesson-status', lessonContentId: 'pronunciation-lesson-content', lessonTitleFieldId: 'pronunciation-lesson-modal-title',
    unitModalId: 'pronunciation-unit-modal', unitFormId: 'pronunciation-unit-form', unitIdField: 'pronunciation-unit-id',
    unitTitleInputId: 'pronunciation-unit-title', unitOrderField: 'pronunciation-unit-order',
    unitStatusId: 'pronunciation-unit-status', unitContentId: 'pronunciation-unit-content', unitTitleFieldId: 'pronunciation-unit-modal-title',
    addCatBtnId: 'add-pronunciation-cat-btn', addLessonBtnId: 'add-pronunciation-lesson-btn', addUnitBtnId: 'add-pronunciation-unit-btn'
});
loadPronunciationData = () => pronunciationManager.loadData();

/* =========================================================
   DATA TOOLS — Export / Import JSON
   ========================================================= */
const ALL_COLLECTIONS = [
    'books', 'units', 'vocabularies', 'phrasal_verbs', 'prep_phrases',
    'word_formations', 'word_patterns', 'lexical_expansions',
    'grammar_categories', 'grammar_lessons', 'grammar_units',
    'pronunciation_categories', 'pronunciation_lessons', 'pronunciation_units'
];

document.getElementById('export-all-btn')?.addEventListener('click', async () => {
    try {
        window.showToast('Collecting data…', 'info');
        const dump = {};
        for (const name of ALL_COLLECTIONS) {
            const snap = await getDocs(collection(db, name));
            dump[name] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
        const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `thors-notes-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        window.showToast('Export complete.', 'success');
    } catch (err) {
        console.error(err);
        window.showToast(friendlyError(err), 'error');
    }
});

function stripMeta(obj) {
    const { id, createdAt, updatedAt, ...clean } = obj;
    return clean;
}

document.getElementById('import-btn')?.addEventListener('click', async () => {
    const collName = document.getElementById('import-collection')?.value;
    const fileInput = document.getElementById('import-file');
    const file = fileInput?.files?.[0];
    if (!collName || !file) {
        window.showToast('Choose a collection and a JSON file first.', 'info');
        return;
    }
    try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        let docs = Array.isArray(parsed) ? parsed : (Array.isArray(parsed[collName]) ? parsed[collName] : null);
        if (!docs) {
            window.showToast('JSON format not recognised — expected an array of documents.', 'error');
            return;
        }
        docs = docs.filter(d => d && typeof d === 'object');
        if (!docs.length) { window.showToast('The file contains no documents.', 'error'); return; }

        const existingIds = new Set((await fetchAll(collName)).map(d => d.id));
        const newCount = docs.filter(d => !d.id || !existingIds.has(d.id)).length;
        const updateCount = docs.length - newCount;

        const ok = await confirmDialog({
            title: `Import into "${collName}"?`,
            message: `${docs.length} documents found — ${newCount} will be created, ${updateCount} existing will be overwritten by ID.`,
            confirmText: 'Import'
        });
        if (!ok) return;

        let done = 0;
        const CHUNK = 300;
        for (let i = 0; i < docs.length; i += CHUNK) {
            const batch = writeBatch(db);
            for (const raw of docs.slice(i, i + CHUNK)) {
                const data = { ...stripMeta(raw), updatedAt: serverTimestamp() };
                const isNew = !raw.id || !existingIds.has(raw.id);
                if (isNew) data.createdAt = serverTimestamp();
                const ref = raw.id ? doc(db, collName, raw.id) : doc(collection(db, collName));
                batch.set(ref, data, { merge: false });
            }
            await batch.commit();
            done += Math.min(CHUNK, docs.length - i);
            window.showToast(`Imported ${done}/${docs.length}…`, 'info');
        }
        fileInput.value = '';
        await reloadDataFor(null);
        window.showToast(`Import complete — ${docs.length} documents written.`, 'success');
    } catch (err) {
        console.error(err);
        window.showToast(friendlyError(err), 'error');
    }
});

/* =========================================================
   AUDIO URL MAINTENANCE — bulk regex find & replace
   Scans every audio-bearing field:
     vocabularies.audio · word_formations.forms[].audios[].url
     lexical_expansions.words[].audio
   ========================================================= */
const AUDIO_COLLECTIONS = ['vocabularies', 'word_formations', 'lexical_expansions'];

const AUDIO_DATA_BY_COLL = () => ({
    vocabularies: vocabData,
    word_formations: wordformData,
    lexical_expansions: lexicalData
});

/** Deep-clone a doc, run replacer over its audio URLs.
 *  Returns { out, urlsChanged } — out is null when nothing matched. */
function mapAudioUrls(collName, data, replacer) {
    let urlsChanged = 0;
    let out;
    if (collName === 'vocabularies' && data.audio) {
        const nv = replacer(data.audio);
        if (nv !== data.audio) { out = { ...data, audio: nv }; urlsChanged++; }
    } else if (collName === 'word_formations' && Array.isArray(data.forms)) {
        let forms = data.forms, touched = false;
        forms = forms.map(f => {
            if (!Array.isArray(f.audios)) return f;
            const audios = f.audios.map(a => {
                if (!a.url) return a;
                const nv = replacer(a.url);
                if (nv !== a.url) { urlsChanged++; touched = true; return { ...a, url: nv }; }
                return a;
            });
            return touched ? { ...f, audios } : f;
        });
        if (urlsChanged > 0) out = { ...data, forms };
    } else if (collName === 'lexical_expansions' && Array.isArray(data.words)) {
        let words = data.words, touched = false;
        words = words.map(w => {
            if (!w.audio) return w;
            const nv = replacer(w.audio);
            if (nv !== w.audio) { urlsChanged++; touched = true; return { ...w, audio: nv }; }
            return w;
        });
        if (urlsChanged > 0) out = { ...data, words };
    }
    return { out, urlsChanged };
}

function getAudioReplacer() {
    const findInput = document.getElementById('audio-find');
    const replaceInput = document.getElementById('audio-replace');
    const pattern = findInput?.value.trim();
    const replacement = replaceInput?.value ?? '';
    if (!pattern) {
        window.showToast('Enter a "Find" regular expression first.', 'info');
        return null;
    }
    let regex;
    try {
        regex = new RegExp(pattern, 'g');
    } catch (err) {
        window.showToast(`Invalid regular expression: ${friendlyError(err)}`, 'error');
        return null;
    }
    return (url) => url.replace(regex, replacement);
}

document.getElementById('audio-preview-btn')?.addEventListener('click', () => {
    const replacer = getAudioReplacer();
    if (!replacer) return;

    const statusEl = document.getElementById('audio-tool-status');
    const dataByColl = AUDIO_DATA_BY_COLL();
    let totalDocs = 0, totalUrls = 0;
    const perColl = [];

    AUDIO_COLLECTIONS.forEach(coll => {
        let docs = 0, urls = 0;
        (dataByColl[coll] || []).forEach(d => {
            const { urlsChanged } = mapAudioUrls(coll, d, replacer);
            if (urlsChanged > 0) { docs++; urls += urlsChanged; }
        });
        if (docs > 0) perColl.push(`${coll}: ${docs} doc(s), ${urls} URL(s)`);
        totalDocs += docs; totalUrls += urls;
    });

    if (statusEl) {
        statusEl.textContent = totalDocs
            ? `Matched ${totalDocs} document(s), ${totalUrls} URL(s). Review then press "Apply to database".`
            : 'No matching audio URLs found.';
    }
    window.showToast(
        totalDocs
            ? `Found ${totalUrls} URL(s) across ${totalDocs} document(s) — ${perColl.join(' | ')}`
            : 'No matching audio URLs found.',
        totalDocs ? 'info' : 'error'
    );
});

document.getElementById('audio-apply-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('audio-apply-btn');
    if (btn?.dataset.busy === '1') return;
    const replacer = getAudioReplacer();
    if (!replacer) return;

    const dataByColl = AUDIO_DATA_BY_COLL();
    const pending = []; // [{ coll, id, field, value }]
    let totalDocs = 0, totalUrls = 0;

    AUDIO_COLLECTIONS.forEach(coll => {
        (dataByColl[coll] || []).forEach(d => {
            const { out, urlsChanged } = mapAudioUrls(coll, d, replacer);
            if (!out) return;
            totalDocs++; totalUrls += urlsChanged;
            const field = coll === 'vocabularies' ? 'audio' : coll === 'word_formations' ? 'forms' : 'words';
            pending.push({ coll, id: d.id, field, value: out[field], label: coll === 'vocabularies' ? out.audio : `${out[field]?.length ?? 0} item(s)` });
        });
    });

    if (!pending.length) {
        window.showToast('No matching audio URLs found.', 'info');
        return;
    }

    const ok = await confirmDialog({
        title: 'Rewrite audio URLs?',
        message: `${totalDocs} document(s) will be updated (${totalUrls} URL(s)). This cannot be undone with Undo — export a backup first if unsure.`,
        confirmText: 'Update'
    });
    if (!ok) return;

    let origHtml = '';
    if (btn) { origHtml = btn.innerHTML; btn.dataset.busy = '1'; btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating…'; }

    try {
        const CHUNK = 300;
        let written = 0;
        for (let i = 0; i < pending.length; i += CHUNK) {
            const batch = writeBatch(db);
            for (const item of pending.slice(i, i + CHUNK)) {
                batch.update(doc(db, item.coll, item.id), { [item.field]: item.value, updatedAt: serverTimestamp() });
            }
            await batch.commit();
            written += Math.min(CHUNK, pending.length - i);
            window.showToast(`Updated ${written}/${pending.length} documents…`, 'info');
        }
        await reloadDataFor(null);
        const statusEl = document.getElementById('audio-tool-status');
        if (statusEl) statusEl.textContent = '';
        window.showToast(`Done — ${totalDocs} document(s) updated, ${totalUrls} URL(s) rewritten.`, 'success');
    } catch (err) {
        console.error(err);
        window.showToast(friendlyError(err), 'error');
    } finally {
        if (btn) { btn.dataset.busy = ''; btn.disabled = false; btn.innerHTML = origHtml; }
    }
});

/* =========================================================
   DASHBOARD STATS
   ========================================================= */
function updateDashboardStats() {
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val ?? 0;
    };
    set('stat-books', booksData.length);
    set('stat-units', unitsData.length);
    set('stat-vocab', vocabData.length);
    set('stat-phrasal', phrasalData.length);
    set('stat-grammar', grammarManager?.state.lessons.length ?? '...');
    set('stat-pronunciation', pronunciationManager?.state.lessons.length ?? '...');
}

// Load grammar/pronunciation once at startup so dashboard stats are accurate
setTimeout(() => {
    if (auth.currentUser) {
        loadGrammarData();
        loadPronunciationData();
    }
}, 2500);

/* =========================================================
   DARK MODE
   ========================================================= */
const dmBtn = document.getElementById('admin-dark-mode-btn');
if (dmBtn) {
    dmBtn.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('admin-theme-dark', 'false');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('admin-theme-dark', 'true');
        }
    });
}
