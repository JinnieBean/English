import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { adminAuth as auth, adminDb as db } from './admin-firebase.js';
import { escapeHtml, friendlyError, applyAudioVersion } from '../../assets/js/utils.js';
import { hooks, openModal, onSubmit, stampCreate, stampUpdate, isDuplicate, dupToast, performDelete, assetUrl, publicUrlFor, enableDragReorder, confirmDialog, logAudit } from './common.js';
import {
    booksData, unitsData, vocabData, phrasalData, prepData, wordformData, patternData, lexicalData,
    applyPagination, resetPage, populateUnitSelects,
    rememberUnitSelection, applySavedUnitSelect, sessionState
} from './data.js';

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
    if (preview && urlInput) preview.src = assetUrl(urlInput.value.trim());
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
    await logAudit(id ? 'update' : 'create', 'books', id, bookData.title);
    window.closeModalOverlay(bookModal);
    await hooks.reload(id ? "books" : null);
    window.showToast('Saved!', 'success');
});

export function renderBooks() {
    const list = document.getElementById('books-list');
    if (!list) return;
    const searchTerm = document.getElementById('search-book')?.value.toLowerCase() || '';

    const filtered = booksData.filter(b => (b.title || '').toLowerCase().includes(searchTerm));
    filtered.sort((a, b) => (a.order || 0) - (b.order || 0));

    if (!filtered.length) {
        list.innerHTML = `<tr><td colspan="5" class="empty-row">No books found.</td></tr>`;
        return;
    }

    list.innerHTML = filtered.map(b => `
        <tr draggable="true" data-id="${b.id}">
            <td class="col-check"><input type="checkbox" class="bulk-check" data-tab="books" data-id="${b.id}"></td>
            <td data-inline="1" data-tab="books" data-id="${b.id}" data-field="order">${b.order || 0}</td>
            <td><img src="${escapeHtml(assetUrl(b.image))}" alt="" loading="lazy" decoding="async" style="height: 40px; border-radius: 4px;" onerror="this.style.visibility='hidden'"></td>
            <td data-inline="1" data-tab="books" data-id="${b.id}" data-field="title"><strong>${escapeHtml(b.title)}</strong> ${b.status === 'draft' ? '<span class="badge badge-draft">Draft</span>' : ''}${b.subtitle ? `<br><small>${escapeHtml(b.subtitle)}</small>` : ''}</td>
            <td>
                ${viewBtn('books', b)}
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
        document.getElementById('book-image').value = b.image || 'assets/images/book_cover.webp';
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
        const ref = await addDoc(collection(db, "books"), stampCreate(rest));
        await logAudit('duplicate', 'books', ref.id, rest.title);
        await hooks.reload("books");
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


document.getElementById('add-unit-btn').addEventListener('click', () => {
    document.getElementById('unit-id').value = '';
    unitForm.reset();
    if (sessionState.lastSelectedBookId) document.getElementById('unit-book').value = sessionState.lastSelectedBookId;
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

    sessionState.lastSelectedBookId = bookId;

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
    await logAudit(id ? 'update' : 'create', 'units', id, title);
    window.closeModalOverlay(unitModal);
    await hooks.reload("units");
    window.showToast('Saved!', 'success');
});

document.getElementById('search-unit')?.addEventListener('input', renderUnits);
document.getElementById('sort-unit')?.addEventListener('change', renderUnits);
document.getElementById('filter-unit-book')?.addEventListener('change', renderUnits);

export function renderUnits() {
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
        list.innerHTML = `<tr><td colspan="5" class="empty-row">No units found.</td></tr>`;
        return;
    }

    list.innerHTML = filteredData.map(unit => {
        const book = booksData.find(b => b.id === unit.bookId);
        return `
            <tr draggable="true" data-id="${unit.id}">
                <td class="col-check"><input type="checkbox" class="bulk-check" data-tab="units" data-id="${unit.id}"></td>
                <td data-inline="1" data-tab="units" data-id="${unit.id}" data-field="order">${unit.order || 0}</td>
                <td>${book ? escapeHtml(book.title) : '<em>No Book</em>'}</td>
                <td data-inline="1" data-tab="units" data-id="${unit.id}" data-field="title"><strong>${escapeHtml(unit.title)}</strong> ${unit.status === 'draft' ? '<span class="badge badge-draft">Draft</span>' : ''}</td>
                <td>
                    ${viewBtn('units', unit)}
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
        await hooks.reload("units");
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
    await logAudit(id ? 'update' : 'create', 'vocabularies', id, newVocab.word);
    window.closeModalOverlay(vocabModal);
    await hooks.reload("vocabularies");
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

export function renderVocab() {
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
        list.innerHTML = `<tr><td colspan="6" class="empty-row">${filtered.length === 0 ? 'No vocabulary found.' : 'No vocabulary on this page.'}</td></tr>`;
        return;
    }

    list.innerHTML = pageItems.map(v => {
        const unitName = unitsData.find(u => u.id === v.unitId)?.title || 'Unknown';
        return `
            <tr>
                <td><input type="checkbox" class="bulk-check" data-tab="vocab" data-id="${v.id}"></td>
                <td data-inline="1" data-tab="vocab" data-id="${v.id}" data-field="word"><strong>${escapeHtml(v.word)}</strong> ${v.status === 'draft' ? '<span class="badge badge-draft">Draft</span>' : ''}</td>
                <td>${escapeHtml(v.pos)}</td>
                <td>${escapeHtml(v.pron)}</td>
                <td>${escapeHtml(unitName)}</td>
                <td>
                    ${viewBtn('vocabularies', v)}
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
        const ref = await addDoc(collection(db, "vocabularies"), stampCreate(rest));
        await logAudit('duplicate', 'vocabularies', ref.id, rest.word);
        await hooks.reload("vocabularies");
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
    await logAudit(id ? 'update' : 'create', 'phrasal_verbs', id, newPhrasal.word);
    window.closeModalOverlay(phrasalModal);
    await hooks.reload("phrasal_verbs");
    window.showToast('Saved!', 'success');
});

document.getElementById('filter-unit-select-phrasal').addEventListener('change', renderPhrasal);
document.getElementById('search-phrasal').addEventListener('input', () => { resetPage('phrasal'); renderPhrasal(); });
document.getElementById('sort-phrasal').addEventListener('change', renderPhrasal);

export function renderPhrasal() {
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
                <td><input type="checkbox" class="bulk-check" data-tab="phrasal" data-id="${p.id}"></td>
                <td data-inline="1" data-tab="phrasal" data-id="${p.id}" data-field="word"><strong>${escapeHtml(p.word)}</strong> ${p.status === 'draft' ? '<span class="badge badge-draft">Draft</span>' : ''}</td>
                <td>${escapeHtml(p.pron)}</td>
                <td>${escapeHtml(unitName)}</td>
                <td>
                    ${viewBtn('phrasal_verbs', p)}
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
        const ref = await addDoc(collection(db, "phrasal_verbs"), stampCreate(rest));
        await logAudit('duplicate', 'phrasal_verbs', ref.id, rest.word);
        await hooks.reload("phrasal_verbs");
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
    await logAudit(id ? 'update' : 'create', 'prep_phrases', id, newPrep.word);
    window.closeModalOverlay(prepModal);
    await hooks.reload("prep_phrases");
    window.showToast('Saved!', 'success');
});

document.getElementById('filter-unit-select-prep').addEventListener('change', renderPrep);
document.getElementById('search-prep').addEventListener('input', () => { resetPage('prep'); renderPrep(); });
document.getElementById('sort-prep').addEventListener('change', renderPrep);

export function renderPrep() {
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
                <td><input type="checkbox" class="bulk-check" data-tab="prep" data-id="${p.id}"></td>
                <td data-inline="1" data-tab="prep" data-id="${p.id}" data-field="word"><strong>${escapeHtml(p.word)}</strong> ${p.status === 'draft' ? '<span class="badge badge-draft">Draft</span>' : ''}</td>
                <td>${escapeHtml(unitName)}</td>
                <td>${escapeHtml((p.def || '').slice(0, 120))}${(p.def || '').length > 120 ? '…' : ''}</td>
                <td>
                    ${viewBtn('prep_phrases', p)}
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
        const ref = await addDoc(collection(db, "prep_phrases"), stampCreate(rest));
        await logAudit('duplicate', 'prep_phrases', ref.id, rest.word);
        await hooks.reload("prep_phrases");
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
    await logAudit(id ? 'update' : 'create', 'word_formations', id, newWf.rootWord);
    window.closeModalOverlay(wordformModal);
    await hooks.reload("word_formations");
    window.showToast('Saved!', 'success');
});

document.getElementById('filter-unit-select-wordform').addEventListener('change', renderWordform);
document.getElementById('search-wordform').addEventListener('input', () => { resetPage('wordform'); renderWordform(); });
document.getElementById('sort-wordform').addEventListener('change', renderWordform);

export function renderWordform() {
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
                <td><input type="checkbox" class="bulk-check" data-tab="wordform" data-id="${w.id}"></td>
                <td data-inline="1" data-tab="wordform" data-id="${w.id}" data-field="rootWord"><strong>${escapeHtml(w.rootWord)}</strong> ${w.status === 'draft' ? '<span class="badge badge-draft">Draft</span>' : ''}</td>
                <td>${escapeHtml(unitName)}</td>
                <td>
                    ${viewBtn('word_formations', w)}
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
        const ref = await addDoc(collection(db, "word_formations"), stampCreate(rest));
        await logAudit('duplicate', 'word_formations', ref.id, rest.rootWord);
        await hooks.reload("word_formations");
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
    await logAudit(id ? 'update' : 'create', 'word_patterns', id, payload.word);
    window.closeModalOverlay(patternModal);
    await hooks.reload("word_patterns");
    window.showToast('Saved!', 'success');
});

document.getElementById('filter-unit-select-pattern').addEventListener('change', renderPattern);
document.getElementById('search-pattern').addEventListener('input', () => { resetPage('pattern'); renderPattern(); });
document.getElementById('sort-pattern').addEventListener('change', renderPattern);

export function renderPattern() {
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
                <td><input type="checkbox" class="bulk-check" data-tab="pattern" data-id="${p.id}"></td>
                <td data-inline="1" data-tab="pattern" data-id="${p.id}" data-field="word"><strong>${escapeHtml(p.word)}</strong> <small>${escapeHtml(p.pos)}</small>${p.status === 'draft' ? ' <span class="badge badge-draft">Draft</span>' : ''}<br><small>${escapeHtml(p.pattern)}</small></td>
                <td>${escapeHtml(unitName)}</td>
                <td>
                    ${viewBtn('word_patterns', p)}
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
        const ref = await addDoc(collection(db, "word_patterns"), stampCreate(rest));
        await logAudit('duplicate', 'word_patterns', ref.id, rest.word);
        await hooks.reload("word_patterns");
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
            <label>Audio URL (Link to .mp3)</label>
            <input type="url" class="input-field lx-audio" placeholder="https://.../audio.mp3" value="${escapeHtml(audio)}">
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
            await logAudit(id ? 'update' : 'create', 'lexical_expansions', id, payload.textLeft);
            window.closeModalOverlay(lexicalModal);
            await hooks.reload("lexical_expansions");
            window.showToast('Saved!', 'success');
        } catch (err) { console.error(err); window.showToast(friendlyError(err), 'error'); }
    });
}

if (document.getElementById('filter-unit-select-lexical')) {
    document.getElementById('filter-unit-select-lexical').addEventListener('change', () => renderLexical());
}

export function renderLexical() {
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
                <td><input type="checkbox" class="bulk-check" data-tab="lexical" data-id="${p.id}"></td>
                <td>${escapeHtml(unitName)} ${p.status === 'draft' ? '<span class="badge badge-draft">Draft</span>' : ''}</td>
                <td><pre style="font-family:inherit; font-size: 0.8rem; max-width: 300px; max-height: 100px; overflow: hidden; margin:0;">${escapeHtml((p.textLeft || '').slice(0, 200))}</pre></td>
                <td>
                    ${viewBtn('lexical_expansions', p)}
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
        const ref = await addDoc(collection(db, "lexical_expansions"), stampCreate(rest));
        await logAudit('duplicate', 'lexical_expansions', ref.id, rest.textLeft);
        await hooks.reload("lexical_expansions");
        window.showToast('Lexical expansion duplicated.', 'success');
    } catch (err) { console.error(err); window.showToast(friendlyError(err), 'error'); }
};

window.deleteLexical = (id) => performDelete("lexical_expansions", id, 'lexical expansion');


// Pagination controls invoke these via window[PAG_RENDER_FN]
window.renderVocab = renderVocab;
window.renderPhrasal = renderPhrasal;
window.renderPrep = renderPrep;
window.renderWordform = renderWordform;
window.renderPattern = renderPattern;
window.renderLexical = renderLexical;


// =========================================================
// VIEW-ON-SITE · BULK ACTIONS · INLINE EDIT · DRAG REORDER
// ========================================================= */
const BULK_COLL = {
    books: 'books', units: 'units', vocab: 'vocabularies',
    phrasal: 'phrasal_verbs', prep: 'prep_phrases', wordform: 'word_formations',
    pattern: 'word_patterns', lexical: 'lexical_expansions'
};

const viewBtn = (coll, item) => {
    const u = publicUrlFor(coll, item);
    return u ? `<a class="btn-secondary btn-small view-site-btn" href="${escapeHtml(u)}"
        target="_blank" rel="noopener" title="View on site">&#8599;</a>` : '';
};

/* ---------- bulk selection bar ---------- */
let _bulkBar = null;
function refreshBulkBar() {
    const checked = [...document.querySelectorAll('.bulk-check:checked')];
    if (!_bulkBar) return;
    _bulkBar.hidden = checked.length === 0;
    const countEl = _bulkBar.querySelector('.bulk-count');
    if (countEl) countEl.textContent = `${checked.length} selected`;
    const tab = checked[0]?.dataset.tab;
    _bulkBar.querySelectorAll('[data-bulk-action]').forEach(b => {
        b.disabled = !checked.length;
        b.dataset.tab = tab || '';
    });
}

function getSelection() {
    const checked = [...document.querySelectorAll('.bulk-check:checked')];
    const tab = checked[0]?.dataset.tab;
    return { tab, coll: BULK_COLL[tab], ids: checked.map(c => c.dataset.id).filter(Boolean) };
}

async function bulkDelete() {
    const { tab, coll, ids } = getSelection();
    if (!coll || !ids.length) return;
    const ok = await confirmDialog({
        title: `Delete ${ids.length} item(s)?`,
        message: `This permanently removes ${ids.length} ${BULK_COLL[tab]} record(s).`,
        confirmText: 'Delete'
    });
    if (!ok) return;
    try {
        const batch = writeBatch(db);
        ids.forEach(id => batch.delete(doc(db, coll, id)));
        await batch.commit();
        await logAudit('bulk-delete', coll, ids.join(','), `${ids.length} items`);
        window.showToast(`Deleted ${ids.length} item(s).`, 'success');
        await hooks.reload(coll);
    } catch (err) { console.error(err); window.showToast(friendlyError(err), 'error'); }
}

async function bulkSetStatus(status) {
    const { tab, coll, ids } = getSelection();
    if (!coll || !ids.length) return;
    try {
        const batch = writeBatch(db);
        ids.forEach(id => batch.update(doc(db, coll, id), { status, updatedAt: serverTimestamp() }));
        await batch.commit();
        await logAudit(`set-${status}`, coll, ids.join(','), `${ids.length} items`);
        window.showToast(`${ids.length} item(s) marked ${status}.`, 'success');
        await hooks.reload(coll);
    } catch (err) { console.error(err); window.showToast(friendlyError(err), 'error'); }
}

function ensureBulkBar() {
    if (_bulkBar) return;
    _bulkBar = document.getElementById('bulk-bar');
    if (!_bulkBar) {
        _bulkBar = document.createElement('div');
        _bulkBar.className = 'bulk-bar';
        _bulkBar.hidden = true;
        _bulkBar.innerHTML = `
            <span class="bulk-count">0 selected</span>
            <button type="button" class="btn-secondary btn-small" data-bulk-action="draft">Draft</button>
            <button type="button" class="btn-secondary btn-small" data-bulk-action="publish">Publish</button>
            <button type="button" class="btn-danger btn-small" data-bulk-action="delete">Delete</button>
            <button type="button" class="btn-secondary btn-small" data-bulk-action="clear">Clear</button>`;
        document.body.appendChild(_bulkBar);
    }
    if (_bulkBar.dataset.wired === '1') return;
    _bulkBar.dataset.wired = '1';
    const addBtns = () => {
        if (_bulkBar.querySelector('[data-bulk-action]')) return;
        ['draft|Draft', 'publish|Publish', 'delete|Delete'].forEach(pair => {
            const [act, label] = pair.split('|');
            const b = document.createElement('button');
            b.type = 'button';
            b.className = act === 'delete' ? 'btn-danger btn-small' : 'btn-secondary btn-small';
            b.dataset.bulkAction = act;
            b.textContent = label;
            _bulkBar.appendChild(b);
        });
        const clear = document.createElement('button');
        clear.type = 'button'; clear.className = 'btn-secondary btn-small';
        clear.dataset.bulkAction = 'clear'; clear.textContent = 'Clear';
        _bulkBar.appendChild(clear);
    };
    addBtns();
    _bulkBar.addEventListener('click', (e) => {
        const act = e.target.closest('[data-bulk-action]')?.dataset.bulkAction;
        if (!act) return;
        if (act === 'clear') { document.querySelectorAll('.bulk-check:checked').forEach(c => c.checked = false); }
        else if (act === 'delete') bulkDelete();
        else if (act === 'draft') bulkSetStatus('draft');
        else if (act === 'publish') bulkSetStatus('published');
        refreshBulkBar();
    });
}
ensureBulkBar();

document.addEventListener('change', (e) => {
    if (e.target.classList?.contains('bulk-check')) refreshBulkBar();
    if (e.target.id?.startsWith('check-all-')) {
        const tab = e.target.id.replace('check-all-', '');
        document.querySelectorAll(`.bulk-check[data-tab="${tab}"]`)
            .forEach(cb => { cb.checked = e.target.checked; });
        refreshBulkBar();
    }
});

/* ---------- inline quick-edit (double-click Title / Order cells) ---------- */
const TREE_COLL = {
    Grammar: { cat: 'grammar_categories', lesson: 'grammar_lessons', unit: 'grammar_units' },
    Pronunciation: { cat: 'pronunciation_categories', lesson: 'pronunciation_lessons', unit: 'pronunciation_units' }
};

document.addEventListener('dblclick', async (e) => {
    const td = e.target.closest('td[data-inline="1"]');
    if (!td || td.querySelector('input')) return;
    const { tab, id, field } = td.dataset;
    let coll;
    if (td.dataset.treeTab) {
        const map = TREE_COLL[td.dataset.treeTab];
        if (!map) return;
        coll = map[td.dataset.kind];
        if (!coll || field !== 'title') return;
    } else {
        coll = BULK_COLL[tab];
        if (!coll) return;
        if (field === 'title') {
            // vocab-family uses word/rootWord field names
            field = ({ books: 'title', units: 'title', vocab: 'word',
                       phrasal: 'word', prep: 'word',
                       pattern: 'word', wordform: 'rootWord' })[tab] || field;
        }
    }

    const orig = td.innerHTML;
    const cur = td.textContent.trim();
    td.innerHTML = `<input type="text" class="input-field" style="padding:.25rem .5rem;"
        value="${cur.replace(/"/g, '&quot;')}">`;
    const input = td.querySelector('input');
    input.focus(); input.select();

    let settled = false;
    const cancel = () => { if (!settled) { settled = true; td.innerHTML = orig; } };
    const commit = async () => {
        if (settled) return;
        let v = input.value.trim();
        if (field === 'order') v = parseInt(v, 10) || 1;
        if (!v) { cancel(); return; }
        settled = true;
        try {
            await updateDoc(doc(db, coll, id), field === 'order' ? { order: v } : { [field]: v });
            await logAudit('inline-edit', coll, id, `${field}=${v}`);
            await hooks.reload(coll);
            window.showToast('Updated.', 'success');
        } catch (err) {
            console.error(err);
            window.showToast(friendlyError(err), 'error');
            td.innerHTML = orig;
        }
    };
    input.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') { ev.preventDefault(); commit(); }
        else if (ev.key === 'Escape') cancel();
    });
    input.addEventListener('blur', cancel);
});

/* ---------- drag reorder: books & units ---------- */
function wireReorder(tbodyId, coll, listGetter) {
    const tb = document.getElementById(tbodyId);
    if (!tb || tb.dataset.reorderWired === '1') return;
    tb.dataset.reorderWired = '1';
    enableDragReorder(tb, async (ids) => {
        const items = listGetter();
        const batch = writeBatch(db);
        let changed = 0;
        ids.forEach((id, i) => {
            const it = items.find(x => x.id === id);
            if (it && (it.order || 0) !== i + 1) {
                batch.update(doc(db, coll, id), { order: i + 1 });
                changed++;
            }
        });
        if (!changed) return;
        try {
            await batch.commit();
            await logAudit('reorder', coll, ids.join(','), `${changed} order updates`);
            window.showToast(`Reordered ${changed} item(s).`, 'success');
            await hooks.reload(coll);
        } catch (err) { console.error(err); window.showToast(friendlyError(err), 'error'); }
    });
}
wireReorder('books-list', 'books', () => booksData);
wireReorder('units-list', 'units', () => unitsData);
