import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, setDoc, getDoc, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBiGp-ZZD0Yq-Tok2aAOwVbxXMmq7eRZuM",
    authDomain: "english-study-68459.firebaseapp.com",
    projectId: "english-study-68459",
    storageBucket: "english-study-68459.firebasestorage.app",
    messagingSenderId: "1048895043926",
    appId: "1:1048895043926:web:06c3c04a722e2f3f647ef7"
};

window.closeTinyMCEPopups = function() {
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
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

// Tabs
const navItems = document.querySelectorAll('.nav-item');
const tabPanes = document.querySelectorAll('.tab-pane');

// Sidebar Toggle
const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
const adminSidebar = document.getElementById('admin-sidebar');
if (sidebarToggleBtn && adminSidebar) {
    if (localStorage.getItem('admin-sidebar-collapsed') === 'true') {
        adminSidebar.classList.add('collapsed');
    }
    sidebarToggleBtn.addEventListener('click', () => {
        adminSidebar.classList.toggle('collapsed');
        localStorage.setItem('admin-sidebar-collapsed', adminSidebar.classList.contains('collapsed'));
    });
}

// State

const paginationState = {
    vocab: { page: 1, limit: 50, maxPage: 1 },
    phrasal: { page: 1, limit: 50, maxPage: 1 },
    prep: { page: 1, limit: 50, maxPage: 1 },
    wordform: { page: 1, limit: 50, maxPage: 1 },
    pattern: { page: 1, limit: 50, maxPage: 1 },
    lexical: { page: 1, limit: 50, maxPage: 1 }
};

function addPaginationControls() {
    const tabs = ['vocab', 'phrasal', 'prep', 'wordform', 'pattern', 'lexical'];
    tabs.forEach(tab => {
        const tableContainer = document.querySelector(`#tab-${tab} .table-container`);
        if (tableContainer && !document.getElementById(`pagination-${tab}`)) {
            const pag = document.createElement('div');
            pag.className = 'pagination-controls';
            pag.id = `pagination-${tab}`;
            pag.style = "display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; font-size: 0.9rem; color: #555;";
            pag.innerHTML = `
                <div class="pagination-info" id="pag-info-${tab}">Showing 0 - 0 of 0</div>
                <div class="pagination-buttons" style="display: flex; gap: 0.5rem; align-items: center;">
                    <button class="btn-secondary btn-small" id="pag-prev-${tab}" style="padding: 0.2rem 0.5rem;">&lt; Prev</button>
                    <span id="pag-page-${tab}" style="font-weight: 500;">Page 1</span>
                    <button class="btn-secondary btn-small" id="pag-next-${tab}" style="padding: 0.2rem 0.5rem;">Next &gt;</button>
                </div>
                <div class="pagination-limit">
                    <select id="pag-limit-${tab}" class="input-field" style="padding: 0.2rem; margin:0; width: auto;">
                        <option value="20">20 per page</option>
                        <option value="50" selected>50 per page</option>
                        <option value="100">100 per page</option>
                        <option value="999999">All</option>
                    </select>
                </div>
            `;
            tableContainer.parentElement.appendChild(pag);
            
            document.getElementById(`pag-prev-${tab}`).addEventListener('click', () => {
                if (paginationState[tab].page > 1) {
                    paginationState[tab].page--;
                    const renderFn = tab === 'wordform' ? 'renderWordform' : `render${tab.charAt(0).toUpperCase() + tab.slice(1)}`;
                    window[renderFn]();
                }
            });
            document.getElementById(`pag-next-${tab}`).addEventListener('click', () => {
                if (paginationState[tab].page < paginationState[tab].maxPage) {
                    paginationState[tab].page++;
                    const renderFn = tab === 'wordform' ? 'renderWordform' : `render${tab.charAt(0).toUpperCase() + tab.slice(1)}`;
                    window[renderFn]();
                }
            });
            document.getElementById(`pag-limit-${tab}`).addEventListener('change', (e) => {
                paginationState[tab].limit = parseInt(e.target.value);
                paginationState[tab].page = 1;
                const renderFn = tab === 'wordform' ? 'renderWordform' : `render${tab.charAt(0).toUpperCase() + tab.slice(1)}`;
                window[renderFn]();
            });
        }
    });
}

let booksData = [];
let unitsData = [];
let vocabData = [];
let phrasalData = [];
let prepData = [];
let wordformData = [];
let patternData = [];
let lexicalData = [];

// --- Tabs Logic ---
navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(nav => nav.classList.remove('active'));
        tabPanes.forEach(tab => tab.style.display = 'none');
        
        item.classList.add('active');
        document.getElementById(item.getAttribute('data-tab')).style.display = 'block';
    });
});

// Modals
window.isModalDirty = false;
document.addEventListener('input', (e) => {
    if (e.target.closest('.modal')) window.isModalDirty = true;
});
document.addEventListener('change', (e) => {
    if (e.target.closest('.modal')) window.isModalDirty = true;
});

const closeBtns = document.querySelectorAll('.close-modal');
closeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        if (window.isModalDirty) {
            if (!confirm("You have unsaved changes. Are you sure you want to close?")) return;
        }
        const targetId = e.target.getAttribute('data-target');
        const modal = document.getElementById(targetId);
        if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
        window.closeTinyMCEPopups();
        window.isModalDirty = false;
    });
});
// window click to close modal disabled
// window.addEventListener('click', (e) => { ... });

window.showToast = function(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    
    let icon = '';
    if (type === 'success') icon = '<i class="fas fa-check-circle" style="color: #4caf50;"></i>';
    else if (type === 'error') icon = '<i class="fas fa-exclamation-circle" style="color: #d32f2f;"></i>';
    else icon = '<i class="fas fa-info-circle" style="color: #2196f3;"></i>';
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            ${icon}
            <span class="toast-message">${message}</span>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

// --- Auth Logic ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'flex';
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
        loginError.innerText = "Login failed. Please check your email/password.";
        console.error(error);
    }
});

logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// --- Data Loading ---
async function loadData() {
    try {
        // Load Books
        const booksSnapshot = await getDocs(collection(db, "books"));
        booksData = booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Load Units
        const unitsSnapshot = await getDocs(collection(db, "units"));
        unitsData = unitsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Load Vocab
        const vocabSnapshot = await getDocs(collection(db, "vocabularies"));
        vocabData = vocabSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Load Phrasal Verbs
        const phrasalSnapshot = await getDocs(collection(db, "phrasal_verbs"));
        phrasalData = phrasalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Load Prepositional Phrases
        const prepSnapshot = await getDocs(collection(db, "prep_phrases"));
        prepData = prepSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Load Word Formations
        const wfSnapshot = await getDocs(collection(db, "word_formations"));
        wordformData = wfSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Load Word Patterns
        const patternSnapshot = await getDocs(collection(db, "word_patterns"));
        patternData = patternSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Load Lexical Expansions
        const lexicalSnapshot = await getDocs(collection(db, "lexical_expansions"));
        lexicalData = lexicalSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        renderBooks();
        renderUnits();
        populateBookSelects();
        populateUnitSelects();
        renderVocab();
        renderPhrasal();
        renderPrep();
        renderWordform();
        renderPattern();
        renderLexical();
        updateDashboardStats();
        addPaginationControls();
    } catch (error) {
        console.error("Error loading data:", error);
        window.showToast("Cannot load data from Database: " + (error.message || error), 'error');
    }
}

// --- Books Logic ---
const bookModal = document.getElementById('book-modal');
const bookForm = document.getElementById('book-form');

document.getElementById('add-book-btn').addEventListener('click', () => {
    document.getElementById('book-id').value = '';
    bookForm.reset();
    document.getElementById('book-order').value = booksData.length > 0 ? Math.max(...booksData.map(b => b.order || 0)) + 1 : 1;
    document.getElementById('book-modal-title').innerText = 'Add New Book';
    bookModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
});

bookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('book-id').value;
    const bookData = {
        title: document.getElementById('book-title').value.trim(),
        subtitle: document.getElementById('book-subtitle').value.trim(),
        desc: document.getElementById('book-desc').value.trim(),
        image: document.getElementById('book-image').value.trim(),
        order: parseInt(document.getElementById('book-order').value) || 1
    };

    try {
        if (id) {
            await updateDoc(doc(db, "books", id), bookData);
        } else {
            await addDoc(collection(db, "books"), bookData);
        }
        bookModal.style.display = 'none'; document.body.classList.remove('modal-open'); window.closeTinyMCEPopups(); window.isModalDirty = false;
        await loadData();
        window.showToast('Saved!', 'success');
    } catch (error) { console.error(error); window.showToast("Failed to save book.: " + (error.message || error), 'error'); }
});

function renderBooks() {
    const list = document.getElementById('books-list');
    const searchTerm = document.getElementById('search-book')?.value.toLowerCase() || '';
    
    let filtered = booksData.filter(b => b.title.toLowerCase().includes(searchTerm));
    filtered.sort((a, b) => (a.order || 0) - (b.order || 0));

    list.innerHTML = '';
    filtered.forEach(b => {
        list.innerHTML += `
            <tr>
                <td>${b.order || 0}</td>
                <td><img src="${b.image || 'assets/images/book_cover.png'}" alt="cover" style="height: 40px; border-radius: 4px;"></td>
                <td>${b.title} ${b.subtitle ? `<br><small style="color: #666;">${b.subtitle}</small>` : ''}</td>
                <td>
                    <button class="btn-secondary btn-small" onclick="editBook('${b.id}')">Edit</button>
                    <button class="btn-danger btn-small" onclick="deleteBook('${b.id}')">Delete</button>
                </td>
            </tr>
        `;
    });
}

window.editBook = (id) => {
    const b = booksData.find(x => x.id === id);
    if (b) {
        document.getElementById('book-id').value = b.id;
        document.getElementById('book-title').value = b.title;
        document.getElementById('book-subtitle').value = b.subtitle || '';
        document.getElementById('book-desc').value = b.desc || '';
        document.getElementById('book-image').value = b.image || 'assets/images/book_cover.png';
        document.getElementById('book-order').value = b.order || 1;
        
        document.getElementById('book-modal-title').innerText = 'Edit Book';
        bookModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
    }
};

window.deleteBook = async (id) => {
    if (confirm("Are you sure you want to delete this Book? Make sure no units belong to it first!")) {
        try {
            await deleteDoc(doc(db, "books", id));
            await loadData();
            window.showToast('Deleted!', 'success');
        } catch (error) { console.error(error); window.showToast("Failed to delete book.: " + (error.message || error), 'error'); }
    }
};

document.getElementById('search-book')?.addEventListener('input', renderBooks);

// --- Units Logic ---
const unitModal = document.getElementById('unit-modal');
const unitForm = document.getElementById('unit-form');

function populateBookSelects() {
    const filterSelect = document.getElementById('filter-unit-book');
    const formSelect = document.getElementById('unit-book');
    
    if(!filterSelect || !formSelect) return;

    const options = booksData.sort((a,b) => (a.order||0) - (b.order||0)).map(b => `<option value="${b.id}">${b.title}</option>`).join('');
    
    const currentFilter = filterSelect.value;
    filterSelect.innerHTML = `<option value="all">All Books</option>` + options;
    if(currentFilter && currentFilter !== 'all') {
        filterSelect.value = currentFilter;
    }

    const currentForm = formSelect.value;
    formSelect.innerHTML = options;
    if(currentForm) {
        formSelect.value = currentForm;
    } else if (lastSelectedBookId) {
        formSelect.value = lastSelectedBookId;
    }
}

let lastSelectedBookId = null;

document.getElementById('add-unit-btn').addEventListener('click', () => {
    document.getElementById('unit-id').value = '';
    unitForm.reset();
    if(lastSelectedBookId) document.getElementById('unit-book').value = lastSelectedBookId;
    document.getElementById('unit-order').value = unitsData.length > 0 ? Math.max(...unitsData.map(u => u.order || 0)) + 1 : 1;
    document.getElementById('unit-modal-title').innerText = 'Add New Unit';
    unitModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
});

unitForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('unit-id').value;
    const bookId = document.getElementById('unit-book').value;
    const title = document.getElementById('unit-title').value.trim();
    const order = parseInt(document.getElementById('unit-order').value);
    
    const sectionCheckboxes = document.querySelectorAll('input[name="unit-section"]:checked');
    const sections = Array.from(sectionCheckboxes).map(cb => cb.value);

    lastSelectedBookId = bookId; // Remember for next time
    
    const unitData = { bookId, title, order, sections };

    try {
        if (id) {
            // Update
            await updateDoc(doc(db, "units", id), unitData);
        } else {
            // Create
            await addDoc(collection(db, "units"), unitData);
        }
        unitModal.style.display = 'none'; document.body.classList.remove('modal-open'); window.closeTinyMCEPopups(); window.isModalDirty = false;
        await loadData();
        window.showToast('Saved!', 'success');
    } catch (error) { console.error(error); window.showToast("Error saving Unit!: " + (error.message || error), 'error'); }
});

document.getElementById('search-unit')?.addEventListener('input', renderUnits);
document.getElementById('sort-unit')?.addEventListener('change', renderUnits);
document.getElementById('filter-unit-book')?.addEventListener('change', renderUnits);

function renderUnits() {
    const list = document.getElementById('units-list');
    if (!list) return;
    const searchQuery = document.getElementById('search-unit')?.value.toLowerCase() || '';
    const sortValue = document.getElementById('sort-unit')?.value || 'az';
    const bookFilter = document.getElementById('filter-unit-book')?.value || 'all';
    list.innerHTML = '';
    
    let filteredData = unitsData.filter(u => u.title.toLowerCase().includes(searchQuery));
    if (bookFilter !== 'all') {
        filteredData = filteredData.filter(u => u.bookId === bookFilter);
    }
    
    if (sortValue === 'az') {
        filteredData.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortValue === 'za') {
        filteredData.sort((a, b) => b.title.localeCompare(a.title));
    } else {
        filteredData.sort((a, b) => a.order - b.order);
    }

    filteredData.forEach(unit => {
        const book = booksData.find(b => b.id === unit.bookId);
        list.innerHTML += `
            <tr>
                <td>${unit.order || 0}</td>
                <td>${book ? book.title : '<em>No Book</em>'}</td>
                <td>${unit.title}</td>
                <td>
                    <button class="btn-secondary btn-small" onclick="editUnit('${unit.id}')">Edit</button>
                    <button class="btn-secondary btn-danger btn-small" onclick="deleteUnit('${unit.id}')">Delete</button>
                </td>
            </tr>
        `;
    });
}

window.editUnit = (id) => {
    const unit = unitsData.find(u => u.id === id);
    if(unit) {
        document.getElementById('unit-id').value = unit.id;
        document.getElementById('unit-book').value = unit.bookId || '';
        document.getElementById('unit-title').value = unit.title;
        document.getElementById('unit-order').value = unit.order || 1;
        
        // Reset checkboxes
        document.querySelectorAll('input[name="unit-section"]').forEach(cb => cb.checked = false);
        // Check selected
        if (unit.sections) {
            unit.sections.forEach(sec => {
                const cb = document.querySelector(`input[name="unit-section"][value="${sec}"]`);
                if (cb) cb.checked = true;
            });
        }

        document.getElementById('unit-modal-title').innerText = 'Edit Unit';
        unitModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
    }
};

window.deleteUnit = async (id) => {
    if(confirm('Are you sure you want to delete this unit? All vocabs will need to be reassigned manually.')) {
        try {
            await deleteDoc(doc(db, "units", id));
            await loadData();
            window.showToast('Deleted!', 'success');
        } catch (error) {
            console.error("Error deleting Unit:", error);
        }
    }
}

// --- Vocab Logic ---
const vocabModal = document.getElementById('vocab-modal');
const vocabForm = document.getElementById('vocab-form');

function populateUnitSelects() {
    const filterSelect = document.getElementById('filter-unit-select');
    const formSelect = document.getElementById('vocab-unit-id');
    const filterSelectPhrasal = document.getElementById('filter-unit-select-phrasal');
    const formSelectPhrasal = document.getElementById('phrasal-unit-id');
    const filterSelectPrep = document.getElementById('filter-unit-select-prep');
    const formSelectPrep = document.getElementById('prep-unit-id');
    const filterSelectWordform = document.getElementById('filter-unit-select-wordform');
    const formSelectWordform = document.getElementById('wordform-unit-id');
    const filterSelectPattern = document.getElementById('filter-unit-select-pattern');
    const formSelectPattern = document.getElementById('pattern-unit');
    const filterSelectLexical = document.getElementById('filter-unit-select-lexical');
    const formSelectLexical = document.getElementById('lexical-unit-id');
    
    const options = unitsData.sort((a,b) => a.order - b.order).map(u => `<option value="${u.id}">${u.title}</option>`).join('');
    
    // Keep current option if filter is selected
    const currentFilter = filterSelect.value;
    filterSelect.innerHTML = `<option value="all">All Units</option>` + options;
    if(currentFilter && currentFilter !== 'all') {
        filterSelect.value = currentFilter;
    }
    
    const currentFilterPhrasal = filterSelectPhrasal.value;
    filterSelectPhrasal.innerHTML = `<option value="all">All Units</option>` + options;
    if(currentFilterPhrasal && currentFilterPhrasal !== 'all') {
        filterSelectPhrasal.value = currentFilterPhrasal;
    }

    const currentFilterPrep = filterSelectPrep.value;
    filterSelectPrep.innerHTML = `<option value="all">All Units</option>` + options;
    if(currentFilterPrep && currentFilterPrep !== 'all') {
        filterSelectPrep.value = currentFilterPrep;
    }

    const currentFilterWordform = filterSelectWordform.value;
    filterSelectWordform.innerHTML = `<option value="all">All Units</option>` + options;
    if(currentFilterWordform && currentFilterWordform !== 'all') {
        filterSelectWordform.value = currentFilterWordform;
    }

    const currentFilterPattern = filterSelectPattern ? filterSelectPattern.value : null;
    if (filterSelectPattern) filterSelectPattern.innerHTML = `<option value="all">All Units</option>` + options;
    if (filterSelectPattern && currentFilterPattern && currentFilterPattern !== 'all') {
        filterSelectPattern.value = currentFilterPattern;
    }

    const currentFilterLexical = filterSelectLexical ? filterSelectLexical.value : null;
    if (filterSelectLexical) filterSelectLexical.innerHTML = `<option value="all">All Units</option>` + options;
    if (filterSelectLexical && currentFilterLexical && currentFilterLexical !== 'all') {
        filterSelectLexical.value = currentFilterLexical;
    }

    formSelect.innerHTML = options;
    formSelectPhrasal.innerHTML = options;
    formSelectPrep.innerHTML = options;
    formSelectWordform.innerHTML = options;
    if (formSelectPattern) formSelectPattern.innerHTML = options;
    if (formSelectLexical) formSelectLexical.innerHTML = options;
}

document.getElementById('add-vocab-btn').addEventListener('click', () => {
    const lastUnit = document.getElementById('vocab-unit-id').value;
    document.getElementById('vocab-id').value = '';
    vocabForm.reset();
    if(lastUnit) document.getElementById('vocab-unit-id').value = lastUnit;
    document.getElementById('vocab-modal-title').innerText = 'Add New Vocabulary';
    vocabModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
});

vocabForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('vocab-id').value;
    const newVocab = {
        unitId: document.getElementById('vocab-unit-id').value,
        word: document.getElementById('vocab-word').value,
        pos: document.getElementById('vocab-pos').value,
        pron: document.getElementById('vocab-pron').value,
        audio: document.getElementById('vocab-audio').value,
        def: document.getElementById('vocab-def').value,
        example: document.getElementById('vocab-example').value
    };
    
    try {
        if (id) {
            await updateDoc(doc(db, "vocabularies", id), newVocab);
        } else {
            await addDoc(collection(db, "vocabularies"), newVocab);
        }
        vocabModal.style.display = 'none'; document.body.classList.remove('modal-open'); window.closeTinyMCEPopups(); window.isModalDirty = false;
        await loadData();
        window.showToast('Saved!', 'success');
    } catch (error) { console.error(error); window.showToast("Error saving vocabulary!: " + (error.message || error), 'error'); }
});

document.getElementById('filter-unit-select').addEventListener('change', renderVocab);
document.getElementById('search-vocab').addEventListener('input', () => {
        if (paginationState['vocab']) paginationState['vocab'].page = 1;
        renderVocab();
    });
document.getElementById('sort-vocab').addEventListener('change', renderVocab);

function renderVocab() {
    const list = document.getElementById('vocab-list');
    const filter = document.getElementById('filter-unit-select').value;
    const searchQuery = document.getElementById('search-vocab').value.toLowerCase();
    const sortValue = document.getElementById('sort-vocab').value;
    list.innerHTML = '';
    
    let filteredVocab = filter === 'all' ? vocabData : vocabData.filter(v => v.unitId === filter);
    filteredVocab = filteredVocab.filter(v => v.word.toLowerCase().includes(searchQuery) || (v.def && v.def.toLowerCase().includes(searchQuery)));
    
    if (sortValue === 'az') {
        filteredVocab.sort((a, b) => a.word.localeCompare(b.word));
    } else if (sortValue === 'za') {
        filteredVocab.sort((a, b) => b.word.localeCompare(a.word));
    }
    
    
    const state = paginationState['vocab'];
    if (state) {
        state.maxPage = Math.ceil(filteredVocab.length / state.limit) || 1;
        if (state.page > state.maxPage) state.page = state.maxPage;
        const startIdx = (state.page - 1) * state.limit;
        const endIdx = startIdx + state.limit;

        const infoEl = document.getElementById('pag-info-vocab');
        const pageEl = document.getElementById('pag-page-vocab');
        const prevBtn = document.getElementById('pag-prev-vocab');
        const nextBtn = document.getElementById('pag-next-vocab');
        
        if (infoEl) infoEl.innerText = `Showing ${ filteredVocab.length > 0 ? startIdx + 1 : 0 } - ${Math.min(endIdx, filteredVocab.length)} of ${ filteredVocab.length }`;
        if (pageEl) pageEl.innerText = `Page ${state.page} / ${state.maxPage}`;
        if (prevBtn) prevBtn.disabled = state.page === 1;
        if (nextBtn) nextBtn.disabled = state.page === state.maxPage;

        filteredVocab = filteredVocab.slice(startIdx, endIdx);
    }
    
    filteredVocab.forEach(v => {
        const unitName = unitsData.find(u => u.id === v.unitId)?.title || 'Unknown';
        list.innerHTML += `
            <tr>
                <td><strong>${v.word}</strong></td>
                <td>${v.pos}</td>
                <td>${v.pron}</td>
                <td>${unitName}</td>
                <td>
                    <button class="btn-secondary btn-small" onclick="editVocab('${v.id}')">Edit</button>
                    <button class="btn-secondary btn-danger btn-small" onclick="deleteVocab('${v.id}')">Delete</button>
                </td>
            </tr>
        `;
    });
}

window.editVocab = (id) => {
    const v = vocabData.find(v => v.id === id);
    if(v) {
        document.getElementById('vocab-id').value = v.id;
        document.getElementById('vocab-unit-id').value = v.unitId;
        document.getElementById('vocab-word').value = v.word;
        document.getElementById('vocab-pos').value = v.pos;
        document.getElementById('vocab-pron').value = v.pron;
        document.getElementById('vocab-audio').value = v.audio;
        document.getElementById('vocab-def').value = v.def;
        document.getElementById('vocab-example').value = v.example;
        document.getElementById('vocab-modal-title').innerText = 'Edit Vocabulary';
        vocabModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
    }
};

window.deleteVocab = async (id) => {
    if(confirm('Are you sure you want to delete this word?')) {
        try {
            await deleteDoc(doc(db, "vocabularies", id));
            await loadData();
            window.showToast('Deleted!', 'success');
        } catch (error) {
            console.error("Error deleting vocabulary:", error);
        }
    }
}

// --- Phrasal Verbs Logic ---
const phrasalModal = document.getElementById('phrasal-modal');
const phrasalForm = document.getElementById('phrasal-form');

document.getElementById('add-phrasal-btn').addEventListener('click', () => {
    const lastUnit = document.getElementById('phrasal-unit-id').value;
    document.getElementById('phrasal-id').value = '';
    phrasalForm.reset();
    if(lastUnit) document.getElementById('phrasal-unit-id').value = lastUnit;
    document.getElementById('phrasal-modal-title').innerText = 'Add Phrasal Verb';
    phrasalModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
});

phrasalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('phrasal-id').value;
    const newPhrasal = {
        unitId: document.getElementById('phrasal-unit-id').value,
        word: document.getElementById('phrasal-word').value,
        pron: document.getElementById('phrasal-pron').value,
        def: document.getElementById('phrasal-def').value,
        example: document.getElementById('phrasal-example').value
    };
    
    try {
        if (id) {
            await updateDoc(doc(db, "phrasal_verbs", id), newPhrasal);
        } else {
            await addDoc(collection(db, "phrasal_verbs"), newPhrasal);
        }
        phrasalModal.style.display = 'none'; document.body.classList.remove('modal-open'); window.closeTinyMCEPopups(); window.isModalDirty = false;
        await loadData();
        window.showToast('Saved!', 'success');
    } catch (error) { console.error(error); window.showToast("Error saving Phrasal Verb!: " + (error.message || error), 'error'); }
});

document.getElementById('filter-unit-select-phrasal').addEventListener('change', renderPhrasal);
document.getElementById('search-phrasal').addEventListener('input', () => {
        if (paginationState['phrasal']) paginationState['phrasal'].page = 1;
        renderPhrasal();
    });
document.getElementById('sort-phrasal').addEventListener('change', renderPhrasal);

function renderPhrasal() {
    const list = document.getElementById('phrasal-list');
    const filter = document.getElementById('filter-unit-select-phrasal').value;
    const searchQuery = document.getElementById('search-phrasal').value.toLowerCase();
    const sortValue = document.getElementById('sort-phrasal').value;
    list.innerHTML = '';
    
    let filteredPhrasal = filter === 'all' ? phrasalData : phrasalData.filter(p => p.unitId === filter);
    filteredPhrasal = filteredPhrasal.filter(p => p.word.toLowerCase().includes(searchQuery) || (p.def && p.def.toLowerCase().includes(searchQuery)));

    if (sortValue === 'az') {
        filteredPhrasal.sort((a, b) => a.word.localeCompare(b.word));
    } else if (sortValue === 'za') {
        filteredPhrasal.sort((a, b) => b.word.localeCompare(a.word));
    }
    
    
    const state = paginationState['phrasal'];
    if (state) {
        state.maxPage = Math.ceil(filteredPhrasal.length / state.limit) || 1;
        if (state.page > state.maxPage) state.page = state.maxPage;
        const startIdx = (state.page - 1) * state.limit;
        const endIdx = startIdx + state.limit;

        const infoEl = document.getElementById('pag-info-phrasal');
        const pageEl = document.getElementById('pag-page-phrasal');
        const prevBtn = document.getElementById('pag-prev-phrasal');
        const nextBtn = document.getElementById('pag-next-phrasal');
        
        if (infoEl) infoEl.innerText = `Showing ${ filteredPhrasal.length > 0 ? startIdx + 1 : 0 } - ${Math.min(endIdx, filteredPhrasal.length)} of ${ filteredPhrasal.length }`;
        if (pageEl) pageEl.innerText = `Page ${state.page} / ${state.maxPage}`;
        if (prevBtn) prevBtn.disabled = state.page === 1;
        if (nextBtn) nextBtn.disabled = state.page === state.maxPage;

        filteredPhrasal = filteredPhrasal.slice(startIdx, endIdx);
    }
    
    filteredPhrasal.forEach(p => {
        const unitName = unitsData.find(u => u.id === p.unitId)?.title || 'Unknown';
        list.innerHTML += `
            <tr>
                <td><strong>${p.word}</strong></td>
                <td>${p.pron}</td>
                <td>${unitName}</td>
                <td>
                    <button class="btn-secondary btn-small" onclick="editPhrasal('${p.id}')">Edit</button>
                    <button class="btn-secondary btn-danger btn-small" onclick="deletePhrasal('${p.id}')">Delete</button>
                </td>
            </tr>
        `;
    });
}

window.editPhrasal = (id) => {
    const p = phrasalData.find(p => p.id === id);
    if(p) {
        document.getElementById('phrasal-id').value = p.id;
        document.getElementById('phrasal-unit-id').value = p.unitId;
        document.getElementById('phrasal-word').value = p.word;
        document.getElementById('phrasal-pron').value = p.pron;
        document.getElementById('phrasal-def').value = p.def;
        document.getElementById('phrasal-example').value = p.example;
        document.getElementById('phrasal-modal-title').innerText = 'Edit Phrasal Verb';
        phrasalModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
    }
};

window.deletePhrasal = async (id) => {
    if(confirm('Are you sure you want to delete this phrasal verb?')) {
        try {
            await deleteDoc(doc(db, "phrasal_verbs", id));
            await loadData();
            window.showToast('Deleted!', 'success');
        } catch (error) {
            console.error("Error deleting Phrasal Verb:", error);
        }
    }
}

// --- Prepositional Phrases Logic ---
const prepModal = document.getElementById('prep-modal');
const prepForm = document.getElementById('prep-form');

document.getElementById('add-prep-btn').addEventListener('click', () => {
    const lastUnit = document.getElementById('prep-unit-id').value;
    document.getElementById('prep-id').value = '';
    prepForm.reset();
    if(lastUnit) document.getElementById('prep-unit-id').value = lastUnit;
    document.getElementById('prep-modal-title').innerText = 'Add Phrase';
    prepModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
});

prepForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('prep-id').value;
    const newPrep = {
        unitId: document.getElementById('prep-unit-id').value,
        word: document.getElementById('prep-word').value,
        def: document.getElementById('prep-def').value,
        example: document.getElementById('prep-example').value
    };
    
    try {
        if (id) {
            await updateDoc(doc(db, "prep_phrases", id), newPrep);
        } else {
            await addDoc(collection(db, "prep_phrases"), newPrep);
        }
        prepModal.style.display = 'none'; document.body.classList.remove('modal-open'); window.closeTinyMCEPopups(); window.isModalDirty = false;
        await loadData();
        window.showToast('Saved!', 'success');
    } catch (error) { console.error(error); window.showToast("Error saving Phrase!: " + (error.message || error), 'error'); }
});

document.getElementById('filter-unit-select-prep').addEventListener('change', renderPrep);
document.getElementById('search-prep').addEventListener('input', () => {
        if (paginationState['prep']) paginationState['prep'].page = 1;
        renderPrep();
    });
document.getElementById('sort-prep').addEventListener('change', renderPrep);

function renderPrep() {
    const list = document.getElementById('prep-list');
    const filter = document.getElementById('filter-unit-select-prep').value;
    const searchQuery = document.getElementById('search-prep').value.toLowerCase();
    const sortValue = document.getElementById('sort-prep').value;
    list.innerHTML = '';
    
    let filteredPrep = filter === 'all' ? prepData : prepData.filter(p => p.unitId === filter);
    filteredPrep = filteredPrep.filter(p => p.word.toLowerCase().includes(searchQuery) || (p.def && p.def.toLowerCase().includes(searchQuery)));

    if (sortValue === 'az') {
        filteredPrep.sort((a, b) => a.word.localeCompare(b.word));
    } else if (sortValue === 'za') {
        filteredPrep.sort((a, b) => b.word.localeCompare(a.word));
    }
    
    
    const state = paginationState['prep'];
    if (state) {
        state.maxPage = Math.ceil(filteredPrep.length / state.limit) || 1;
        if (state.page > state.maxPage) state.page = state.maxPage;
        const startIdx = (state.page - 1) * state.limit;
        const endIdx = startIdx + state.limit;

        const infoEl = document.getElementById('pag-info-prep');
        const pageEl = document.getElementById('pag-page-prep');
        const prevBtn = document.getElementById('pag-prev-prep');
        const nextBtn = document.getElementById('pag-next-prep');
        
        if (infoEl) infoEl.innerText = `Showing ${ filteredPrep.length > 0 ? startIdx + 1 : 0 } - ${Math.min(endIdx, filteredPrep.length)} of ${ filteredPrep.length }`;
        if (pageEl) pageEl.innerText = `Page ${state.page} / ${state.maxPage}`;
        if (prevBtn) prevBtn.disabled = state.page === 1;
        if (nextBtn) nextBtn.disabled = state.page === state.maxPage;

        filteredPrep = filteredPrep.slice(startIdx, endIdx);
    }
    
    filteredPrep.forEach(p => {
        const unitName = unitsData.find(u => u.id === p.unitId)?.title || 'Unknown';
        list.innerHTML += `
            <tr>
                <td><strong>${p.word}</strong></td>
                <td>${unitName}</td>
                <td>
                    <button class="btn-secondary btn-small" onclick="editPrep('${p.id}')">Edit</button>
                    <button class="btn-secondary btn-danger btn-small" onclick="deletePrep('${p.id}')">Delete</button>
                </td>
            </tr>
        `;
    });
}

window.editPrep = (id) => {
    const p = prepData.find(p => p.id === id);
    if(p) {
        document.getElementById('prep-id').value = p.id;
        document.getElementById('prep-unit-id').value = p.unitId;
        document.getElementById('prep-word').value = p.word;
        document.getElementById('prep-def').value = p.def;
        document.getElementById('prep-example').value = p.example;
        document.getElementById('prep-modal-title').innerText = 'Edit Phrase';
        prepModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
    }
};

window.deletePrep = async (id) => {
    if(confirm('Are you sure you want to delete this phrase?')) {
        try {
            await deleteDoc(doc(db, "prep_phrases", id));
            await loadData();
            window.showToast('Deleted!', 'success');
        } catch (error) {
            console.error("Error deleting Phrase:", error);
        }
    }
}

// --- Word Formation Logic ---
const wordformModal = document.getElementById('wordform-modal');
const wordformForm = document.getElementById('wordform-form');
const wordformContainer = document.getElementById('wordform-forms-container');
const wordformOverviewContainer = document.getElementById('wordform-overview-container');
let formIdCounter = 0;

function addOverviewRow(pos = '', words = '') {
    const row = document.createElement('div');
    row.className = 'wf-overview-row';
    row.style.display = 'flex';
    row.style.gap = '0.5rem';
    row.innerHTML = `
        <input type="text" class="input-field wf-overview-pos" placeholder="(noun)" value="${pos.replace(/"/g, '&quot;')}" style="width: 100px;" required>
        <input type="text" class="input-field wf-overview-words" placeholder="act, action" value="${words.replace(/"/g, '&quot;')}" style="flex: 1;" required>
        <button type="button" class="btn-secondary btn-danger btn-small" onclick="this.parentElement.remove()">X</button>
    `;
    wordformOverviewContainer.appendChild(row);
}

function addWordformRow(title = '', audios = [], definitions = '', examples = '') {
    formIdCounter++;
    const rowId = `wf-row-${formIdCounter}`;
    const row = document.createElement('div');
    row.className = 'wf-complex-row';
    row.style.border = '1px solid #ccc';
    row.style.padding = '1rem';
    row.style.borderRadius = '4px';
    row.style.marginBottom = '1rem';
    row.style.position = 'relative';


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
        <button type="button" class="btn-secondary btn-danger btn-small" style="position:absolute; top: 1rem; right: 1rem;" onclick="this.parentElement.remove()">Remove Form</button>
        <div class="form-row">
            <div class="input-group flex-1">
                <label>Word</label>
                <input type="text" class="input-field wf-word" value="${wordVal.replace(/"/g, '&quot;')}" required>
            </div>
            <div class="input-group" style="width: 200px;">
                <label>Part of Speech (POS)</label>
                <input type="text" class="input-field wf-pos" value="${posVal.replace(/"/g, '&quot;')}">
            </div>
        </div>
        <div class="input-group">
            <label>Audios</label>
            <div id="${rowId}-audios" style="display:flex; flex-direction:column; gap:0.5rem; margin-bottom: 0.5rem;"></div>
            <button type="button" class="btn-secondary btn-small" onclick="window.addAudioToRow('${rowId}')">+ Add Audio</button>
        </div>
        <div class="input-group">
            <label>Definitions</label>
            <textarea class="input-field wf-defs" rows="3">${definitions}</textarea>
        </div>
        <div class="input-group">
            <label>Examples</label>
            <textarea class="input-field wf-examples" rows="3">${examples}</textarea>
        </div>
    `;
    wordformContainer.appendChild(row);
    
    if (audios && audios.length > 0) {
        audios.forEach(a => window.addAudioToRow(rowId, a.pron, a.url));
    } else {
        window.addAudioToRow(rowId);
    }
}

window.addAudioToRow = function(rowId, pron = '', url = '') {
    const container = document.getElementById(`${rowId}-audios`);
    if(!container) return;
    const div = document.createElement('div');
    div.className = 'wf-audio-row';
    div.style.display = 'flex';
    div.style.gap = '0.5rem';
    div.innerHTML = `
        <input type="text" class="input-field wf-audio-pron" placeholder="Pronunciation (/ækt/)" value="${pron.replace(/"/g, '&quot;')}" style="flex:1;">
        <input type="text" class="input-field wf-audio-url" placeholder="Audio URL" value="${url.replace(/"/g, '&quot;')}" style="flex:2;">
        <button type="button" class="btn-secondary btn-danger btn-small" onclick="this.parentElement.remove()">X</button>
    `;
    container.appendChild(div);
}

document.getElementById('add-overview-btn').addEventListener('click', () => {
    addOverviewRow();
});

document.getElementById('add-wordform-btn').addEventListener('click', () => {
    addWordformRow();
});

document.getElementById('add-new-wordform-btn').addEventListener('click', () => {
    const lastUnit = document.getElementById('wordform-unit-id').value;
    document.getElementById('wordform-id').value = '';
    wordformForm.reset();
    if(lastUnit) document.getElementById('wordform-unit-id').value = lastUnit;
    
    wordformOverviewContainer.innerHTML = '';
    addOverviewRow(); // add at least 1 row default
    
    wordformContainer.innerHTML = '';
    addWordformRow(); // add at least 1 row default
    
    document.getElementById('wordform-modal-title').innerText = 'Add Word Formation';
    wordformModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
});

wordformForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('wordform-id').value;
    
    // Gather all overviews
    const overviewRows = wordformOverviewContainer.querySelectorAll('.wf-overview-row');
    let overviews = [];
    overviewRows.forEach(r => {
        const p = r.querySelector('.wf-overview-pos').value.trim();
        const w = r.querySelector('.wf-overview-words').value.trim();
        if (p && w) {
            overviews.push({ pos: p, words: w });
        }
    });

    // Gather all detailed forms
    const rows = wordformContainer.querySelectorAll('.wf-complex-row');
    let forms = [];
    rows.forEach(r => {
        const word = r.querySelector('.wf-word').value.trim();
        const pos = r.querySelector('.wf-pos').value.trim();
        const title = pos ? (word + ' ' + pos) : word;
        const defs = r.querySelector('.wf-defs').value.trim();
        const examples = r.querySelector('.wf-examples').value.trim();
        
        let audios = [];
        const audioRows = r.querySelectorAll('.wf-audio-row');
        audioRows.forEach(ar => {
            const pron = ar.querySelector('.wf-audio-pron').value.trim();
            const url = ar.querySelector('.wf-audio-url').value.trim();
            if(pron || url) {
                audios.push({ pron, url });
            }
        });
        
        if (title) {
            forms.push({ title, definitions: defs, examples: examples, audios });
        }
    });

    const newWf = {
        unitId: document.getElementById('wordform-unit-id').value,
        rootWord: document.getElementById('wordform-root').value,
        overviews: overviews,
        forms: forms
    };
    
    try {
        if (id) {
            await updateDoc(doc(db, "word_formations", id), newWf);
        } else {
            await addDoc(collection(db, "word_formations"), newWf);
        }
        wordformModal.style.display = 'none'; document.body.classList.remove('modal-open'); window.closeTinyMCEPopups(); window.isModalDirty = false;
        await loadData();
        window.showToast('Saved!', 'success');
    } catch (error) { console.error(error); window.showToast("Error saving Word Formation!: " + (error.message || error), 'error'); }
});

document.getElementById('filter-unit-select-wordform').addEventListener('change', renderWordform);
document.getElementById('search-wordform').addEventListener('input', () => {
        if (paginationState['wordform']) paginationState['wordform'].page = 1;
        renderWordform();
    });
document.getElementById('sort-wordform').addEventListener('change', renderWordform);

function renderWordform() {
    const list = document.getElementById('wordform-list');
    const filter = document.getElementById('filter-unit-select-wordform').value;
    const searchQuery = document.getElementById('search-wordform').value.toLowerCase();
    const sortValue = document.getElementById('sort-wordform').value;
    list.innerHTML = '';
    
    let filteredWf = filter === 'all' ? wordformData : wordformData.filter(w => w.unitId === filter);
    filteredWf = filteredWf.filter(w => w.rootWord.toLowerCase().includes(searchQuery));

    if (sortValue === 'az') {
        filteredWf.sort((a, b) => a.rootWord.localeCompare(b.rootWord));
    } else if (sortValue === 'za') {
        filteredWf.sort((a, b) => b.rootWord.localeCompare(a.rootWord));
    }
    
    
    const state = paginationState['wordform'];
    if (state) {
        state.maxPage = Math.ceil(filteredWf.length / state.limit) || 1;
        if (state.page > state.maxPage) state.page = state.maxPage;
        const startIdx = (state.page - 1) * state.limit;
        const endIdx = startIdx + state.limit;

        const infoEl = document.getElementById('pag-info-wordform');
        const pageEl = document.getElementById('pag-page-wordform');
        const prevBtn = document.getElementById('pag-prev-wordform');
        const nextBtn = document.getElementById('pag-next-wordform');
        
        if (infoEl) infoEl.innerText = `Showing ${ filteredWf.length > 0 ? startIdx + 1 : 0 } - ${Math.min(endIdx, filteredWf.length)} of ${ filteredWf.length }`;
        if (pageEl) pageEl.innerText = `Page ${state.page} / ${state.maxPage}`;
        if (prevBtn) prevBtn.disabled = state.page === 1;
        if (nextBtn) nextBtn.disabled = state.page === state.maxPage;

        filteredWf = filteredWf.slice(startIdx, endIdx);
    }
    
    filteredWf.forEach(w => {
        const unitName = unitsData.find(u => u.id === w.unitId)?.title || 'Unknown';
        list.innerHTML += `
            <tr>
                <td><strong>${w.rootWord}</strong></td>
                <td>${unitName}</td>
                <td>
                    <button class="btn-secondary btn-small" onclick="editWordform('${w.id}')">Edit</button>
                    <button class="btn-secondary btn-danger btn-small" onclick="deleteWordform('${w.id}')">Delete</button>
                </td>
            </tr>
        `;
    });
}

window.editWordform = (id) => {
    const w = wordformData.find(w => w.id === id);
    if(w) {
        document.getElementById('wordform-id').value = w.id;
        document.getElementById('wordform-unit-id').value = w.unitId;
        document.getElementById('wordform-root').value = w.rootWord;
        
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
        wordformModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
    }
};

window.deleteWordform = async (id) => {
    if(confirm('Are you sure you want to delete this word formation?')) {
        try {
            await deleteDoc(doc(db, "word_formations", id));
            await loadData();
            window.showToast('Deleted!', 'success');
        } catch (error) {
            console.error("Error deleting Word formation:", error);
        }
    }
}


// --- Word Patterns Logic ---
const patternModal = document.getElementById('pattern-modal');
const patternForm = document.getElementById('pattern-form');

document.getElementById('add-pattern-btn').addEventListener('click', () => {
    const lastUnit = document.getElementById('pattern-unit').value;
    document.getElementById('pattern-id').value = '';
    patternForm.reset();
    if(lastUnit) document.getElementById('pattern-unit').value = lastUnit;
    document.getElementById('pattern-modal-title').innerText = 'Add New Word Pattern';
    patternModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
});

patternForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('pattern-id').value;
    const unitId = document.getElementById('pattern-unit').value;
    const word = document.getElementById('pattern-word').value;
    const pos = document.getElementById('pattern-pos').value;
    const pattern = document.getElementById('pattern-pattern').value;
    const def = document.getElementById('pattern-def').value;
    const example = document.getElementById('pattern-example').value;
    
    const payload = { unitId, word, pos, pattern, def, example };
    
    try {
        if (id) {
            await updateDoc(doc(db, "word_patterns", id), payload);
        } else {
            await addDoc(collection(db, "word_patterns"), payload);
        }
        patternModal.style.display = 'none'; document.body.classList.remove('modal-open'); window.closeTinyMCEPopups(); window.isModalDirty = false;
        await loadData();
        window.showToast('Saved!', 'success');
    } catch (error) { console.error(error); window.showToast("Error saving Word Pattern!: " + (error.message || error), 'error'); }
});

document.getElementById('filter-unit-select-pattern').addEventListener('change', renderPattern);
document.getElementById('search-pattern').addEventListener('input', () => {
        if (paginationState['pattern']) paginationState['pattern'].page = 1;
        renderPattern();
    });
document.getElementById('sort-pattern').addEventListener('change', renderPattern);

function renderPattern() {
    const list = document.getElementById('pattern-list');
    if(!list) return;
    const filter = document.getElementById('filter-unit-select-pattern').value;
    const searchQuery = document.getElementById('search-pattern').value.toLowerCase();
    const sortValue = document.getElementById('sort-pattern').value;
    list.innerHTML = '';
    
    let filteredData = filter === 'all' ? patternData : patternData.filter(p => p.unitId === filter);
    filteredData = filteredData.filter(p => p.word.toLowerCase().includes(searchQuery));

    if (sortValue === 'az') {
        filteredData.sort((a, b) => a.word.localeCompare(b.word));
    } else if (sortValue === 'za') {
        filteredData.sort((a, b) => b.word.localeCompare(a.word));
    }
    
    filteredData.forEach(p => {
        const unitName = unitsData.find(u => u.id === p.unitId)?.title || 'Unknown';
        list.innerHTML += `
            <tr>
                <td><strong>${p.word}</strong> <span style="font-size: 0.9em; color: #666;">${p.pos}</span><br><small>${p.pattern}</small></td>
                <td>${unitName}</td>
                <td>
                    <button class="btn-secondary btn-small" onclick="editPattern('${p.id}')">Edit</button>
                    <button class="btn-secondary btn-danger btn-small" onclick="deletePattern('${p.id}')">Delete</button>
                </td>
            </tr>
        `;
    });
}

window.editPattern = (id) => {
    const p = patternData.find(x => x.id === id);
    if(p) {
        document.getElementById('pattern-id').value = p.id;
        document.getElementById('pattern-unit').value = p.unitId;
        document.getElementById('pattern-word').value = p.word;
        document.getElementById('pattern-pos').value = p.pos;
        document.getElementById('pattern-pattern').value = p.pattern;
        document.getElementById('pattern-def').value = p.def;
        document.getElementById('pattern-example').value = p.example;
        
        document.getElementById('pattern-modal-title').innerText = 'Edit Word Pattern';
        patternModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
    }
};

window.deletePattern = async (id) => {
    if(confirm("Are you sure you want to delete this pattern?")) {
        try {
            await deleteDoc(doc(db, "word_patterns", id));
            await loadData();
            window.showToast('Deleted!', 'success');
        } catch (error) { console.error(error); window.showToast("Error deleting!: " + (error.message || error), 'error'); }
    }
};


// --- Lexical Expansion Logic ---
const lexicalModal = document.getElementById('lexical-modal');
const lexicalForm = document.getElementById('lexical-form');
const lexicalWordsContainer = document.getElementById('lexical-words-container');

window.addLexicalWordRow = function(word = '', pos = '', pron = '', audio = '', def = '', example = '') {
    const rowId = 'lexical-word-' + Date.now() + Math.random().toString(36).substr(2, 9);
    const div = document.createElement('div');
    div.className = 'lexical-word-row';
    div.style.border = '1px solid #ddd';
    div.style.padding = '0.5rem';
    div.style.borderRadius = '4px';
    div.style.position = 'relative';
    div.innerHTML = `
        <button type="button" class="btn-secondary btn-danger btn-small" style="position: absolute; top: 0.5rem; right: 0.5rem;" onclick="this.parentElement.remove()">Remove</button>
        <div class="form-row" style="margin-bottom: 0.5rem; padding-right: 4rem;">
            <div class="input-group flex-1">
                <label>Word</label>
                <input type="text" class="input-field lx-word" placeholder="Word" value="${word.replace(/"/g, '&quot;')}">
            </div>
            <div class="input-group" style="width: 100px;">
                <label>POS</label>
                <input type="text" class="input-field lx-pos" placeholder="POS" value="${pos.replace(/"/g, '&quot;')}">
            </div>
        </div>
        <div class="input-group" style="margin-bottom: 0.5rem;">
            <label>Pronunciation / Notes</label>
            <textarea class="lx-pron" rows="2" placeholder="Pronunciation / Notes">${pron}</textarea>
        </div>
        <div class="input-group" style="margin-bottom: 0.5rem;">
            <label>Definition</label>
            <textarea class="lx-def" rows="2" placeholder="Definition">${def}</textarea>
        </div>
        <div class="input-group" style="margin-bottom: 0;">
            <label>Example</label>
            <textarea class="lx-example" rows="2" placeholder="Example">${example}</textarea>
        </div>
    `;
    lexicalWordsContainer.appendChild(div);
};

if (document.getElementById('add-lexical-word-btn')) {
    document.getElementById('add-lexical-word-btn').addEventListener('click', () => {
        addLexicalWordRow();
    });
}

if (document.getElementById('add-lexical-btn')) {
    document.getElementById('add-lexical-btn').addEventListener('click', () => {
        const lastUnit = document.getElementById('lexical-unit-id').value;
        document.getElementById('lexical-id').value = '';
        lexicalForm.reset();
        if(lastUnit) document.getElementById('lexical-unit-id').value = lastUnit;
        lexicalWordsContainer.innerHTML = '';
        addLexicalWordRow();
        document.getElementById('lexical-modal-title').innerText = 'Add Lexical Expansion';
        lexicalModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
    });
}

if (lexicalForm) {
    lexicalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('lexical-id').value;
        const unitId = document.getElementById('lexical-unit-id').value;
        const textLeft = document.getElementById('lexical-text-left').value;
        const alignLeft = document.getElementById('lexical-align-left').value;
        const textRight = document.getElementById('lexical-text-right').value;
        const alignRight = document.getElementById('lexical-align-right').value;

        const wordRows = lexicalWordsContainer.querySelectorAll('.lexical-word-row');
        let words = [];
        wordRows.forEach(r => {
            const w = r.querySelector('.lx-word').value.trim();
            const p = r.querySelector('.lx-pos').value.trim();
            const pr = r.querySelector('.lx-pron').value.trim();
            const d = r.querySelector('.lx-def').value.trim();
            const ex = r.querySelector('.lx-example').value.trim();
            if (w) {
                words.push({ word: w, pos: p, pron: pr, def: d, example: ex });
            }
        });

        const payload = { unitId, textLeft, alignLeft, textRight, alignRight, words };

        try {
            if (id) {
                await updateDoc(doc(db, "lexical_expansions", id), payload);
            } else {
                await addDoc(collection(db, "lexical_expansions"), payload);
            }
            lexicalModal.style.display = 'none'; document.body.classList.remove('modal-open'); window.closeTinyMCEPopups(); window.isModalDirty = false;
            await loadData();
        window.showToast('Saved!', 'success');
        } catch (error) { console.error(error); window.showToast("Error saving Lexical Expansion!: " + (error.message || error), 'error'); }
    });
}

if (document.getElementById('filter-unit-select-lexical')) {
    document.getElementById('filter-unit-select-lexical').addEventListener('change', () => renderLexical());
}

function renderLexical() {
    const list = document.getElementById('lexical-list');
    if(!list) return;
    const filter = document.getElementById('filter-unit-select-lexical').value;
    list.innerHTML = '';
    
    let filteredData = filter === 'all' ? lexicalData : lexicalData.filter(p => p.unitId === filter);

    filteredData.forEach(p => {
        const unitName = unitsData.find(u => u.id === p.unitId)?.title || 'Unknown';
        list.innerHTML += `
            <tr>
                <td>${unitName}</td>
                <td><pre style="font-family:inherit; font-size: 0.8rem; max-width: 300px; max-height: 100px; overflow: hidden; margin:0;">${p.textLeft || ''}</pre></td>
                <td>
                    <button class="btn-secondary btn-small" onclick="editLexical('${p.id}')">Edit</button>
                    <button class="btn-secondary btn-danger btn-small" onclick="deleteLexical('${p.id}')">Delete</button>
                </td>
            </tr>
        `;
    });
};

window.editLexical = (id) => {
    const p = lexicalData.find(x => x.id === id);
    if(p) {
        document.getElementById('lexical-id').value = p.id;
        document.getElementById('lexical-unit-id').value = p.unitId;
        document.getElementById('lexical-text-left').value = p.textLeft || '';
        document.getElementById('lexical-align-left').value = p.alignLeft || 'left';
        document.getElementById('lexical-text-right').value = p.textRight || '';
        document.getElementById('lexical-align-right').value = p.alignRight || 'left';
        
        lexicalWordsContainer.innerHTML = '';
        if(p.words && p.words.length > 0) {
            p.words.forEach(w => addLexicalWordRow(w.word, w.pos, w.pron, w.audio, w.def, w.example));
        } else {
            addLexicalWordRow();
        }

        document.getElementById('lexical-modal-title').innerText = 'Edit Lexical Expansion';
        lexicalModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
    }
};

window.deleteLexical = async (id) => {
    if(confirm("Are you sure you want to delete this Lexical Expansion?")) {
        try {
            await deleteDoc(doc(db, "lexical_expansions", id));
            await loadData();
            window.showToast('Deleted!', 'success');
        } catch (error) { console.error(error); window.showToast("Error deleting!: " + (error.message || error), 'error'); }
    }
};


// =========================================================
// GRAMMAR MANAGEMENT LOGIC
// =========================================================

// State
let grammarCategoriesData = [];
let grammarLessonsData = [];
let grammarUnitsData = [];

// DOM Elements
const grammarCatList = document.getElementById('grammar-cat-list');
const grammarLessonList = document.getElementById('grammar-lesson-list');
const grammarUnitList = document.getElementById('grammar-unit-list');
const filterGrammarCat = document.getElementById('filter-grammar-cat');
const filterGrammarUnitCat = document.getElementById('filter-grammar-unit-cat');
const filterGrammarUnitLes = document.getElementById('filter-grammar-unit-les');

const grammarCatModal = document.getElementById('grammar-cat-modal');
const grammarCatForm = document.getElementById('grammar-cat-form');

const grammarLessonModal = document.getElementById('grammar-lesson-modal');
const grammarLessonForm = document.getElementById('grammar-lesson-form');

const grammarUnitModal = document.getElementById('grammar-unit-modal');
const grammarUnitForm = document.getElementById('grammar-unit-form');

// Initialize TinyMCE
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
            "000000", "Black",
            "993300", "Burnt orange",
            "333300", "Dark olive",
            "003300", "Dark green",
            "003366", "Dark azure",
            "000080", "Navy Blue",
            "333399", "Indigo",
            "333333", "Very dark gray",
            "800000", "Maroon",
            "FF6600", "Orange",
            "808000", "Olive",
            "008000", "Green",
            "008080", "Teal",
            "0000FF", "Blue",
            "666699", "Grayish blue",
            "808080", "Gray",
            "FF0000", "Red",
            "FF9900", "Amber",
            "99CC00", "Yellow green",
            "339966", "Sea green",
            "33CCCC", "Turquoise",
            "3366FF", "Royal blue",
            "800080", "Purple",
            "999999", "Medium gray",
            "FF00FF", "Magenta",
            "FFCC00", "Gold",
            "FFFF00", "Yellow",
            "00FF00", "Lime",
            "00FFFF", "Aqua",
            "00CCFF", "Sky blue",
            "993366", "Red violet",
            "FFFFFF", "White",
            "FF99CC", "Pink",
            "FFCC99", "Peach",
            "FFFF99", "Light yellow",
            "CCFFCC", "Pale green",
            "CCFFFF", "Pale cyan",
            "99CCFF", "Light sky blue",
            "CC99FF", "Plum"
        ],
        custom_colors: true,
        extended_valid_elements: 'span[style|class|id]',
        menubar: true,
        height: 400,
        promotion: false,
        image_advtab: true,
        media_live_embeds: true,
        content_style: "@font-face { font-family: 'Zeequada'; src: url('../assets/fonts/Zeequada-Regular.otf'); } @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Urbanist:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,500&family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;500;700&family=Lato:wght@300;400;700&family=Montserrat:wght@300;400;500;600;700&family=Oswald:wght@300;400;500;600;700&display=swap'); body { font-family: 'Urbanist', sans-serif; font-size: 1.15rem; line-height: 1.6; } h1, h2, h3, h4, h5, h6 { font-family: 'Playfair Display', serif; margin-top: 1.5rem; margin-bottom: 1rem; font-weight: 600; }",
        setup: function (editor) {
            editor.on('change keyup', function () {
                window.isModalDirty = true;
            });
        }
    });
    tinymceInitialized = true;
}

// Ensure TinyMCE is initialized when switching to Grammar or Pronunciation tab
document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    item.addEventListener('click', () => {
        if (item.dataset.tab === 'tab-grammar') {
            initTinyMCE();
            loadGrammarData();
        } else if (item.dataset.tab === 'tab-pronunciation') {
            initTinyMCE();
            if (typeof loadPronunciationData === 'function') loadPronunciationData(); // Assuming loadPronData is the function for Pronunciation
        }
    });
});

async function loadGrammarData() {
    try {
        // Load Categories
        const catSnap = await getDocs(collection(db, 'grammar_categories'));
        grammarCategoriesData = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        grammarCategoriesData.sort((a,b) => (a.order || 0) - (b.order || 0));
        
        renderGrammarCategories();
        updateGrammarCatSelects();

        // Load Lessons
        const lesSnap = await getDocs(collection(db, 'grammar_lessons'));
        grammarLessonsData = lesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Load Units
        const uniSnap = await getDocs(collection(db, 'grammar_units'));
        grammarUnitsData = uniSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        renderGrammarLessons();
        renderGrammarUnits();
        updateDashboardStats();
        updateGrammarUnitSelects();
    } catch (e) {
        console.error("Error loading Grammar Data:", e);
    }
}

function renderGrammarCategories() {
    if (!grammarCatList) return;
    grammarCatList.innerHTML = '';
    grammarCategoriesData.forEach(cat => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cat.order || 0}</td>
            <td><strong>${cat.title}</strong></td>
            <td>
                <button class="btn-secondary btn-small" onclick="editGrammarCat('${cat.id}')">Edit</button>
                <button class="btn-secondary btn-danger btn-small" onclick="deleteGrammarCat('${cat.id}')">Delete</button>
            </td>
        `;
        grammarCatList.appendChild(tr);
    });
}

function updateGrammarCatSelects() {
    const filterCat = document.getElementById('filter-grammar-cat');
    const lessonCat = document.getElementById('grammar-lesson-category');
    const unitCatFilter = document.getElementById('filter-grammar-unit-cat');
    const unitCat = document.getElementById('grammar-unit-category');
    
    if (filterCat) {
        const currentFilter = filterCat.value;
        filterCat.innerHTML = '<option value="all">All Categories</option>';
        grammarCategoriesData.forEach(cat => {
            filterCat.innerHTML += `<option value="${cat.id}">${cat.title}</option>`;
        });
        filterCat.value = currentFilter || 'all';
    }

    if (lessonCat) {
        const currentLessonCat = lessonCat.value;
        lessonCat.innerHTML = '';
        grammarCategoriesData.forEach(cat => {
            lessonCat.innerHTML += `<option value="${cat.id}">${cat.title}</option>`;
        });
        if (currentLessonCat) lessonCat.value = currentLessonCat;
    }

    if (unitCatFilter) {
        const currentFilter = unitCatFilter.value;
        unitCatFilter.innerHTML = '<option value="all">All Categories</option>';
        grammarCategoriesData.forEach(cat => {
            unitCatFilter.innerHTML += `<option value="${cat.id}">${cat.title}</option>`;
        });
        unitCatFilter.value = currentFilter || 'all';
    }
    
    if (unitCat) {
        const currentFilter = unitCat.value;
        unitCat.innerHTML = '<option value="">-- Select to filter lessons --</option>';
        grammarCategoriesData.forEach(cat => {
            unitCat.innerHTML += `<option value="${cat.id}">${cat.title}</option>`;
        });
        unitCat.value = currentFilter || '';
    }
}

function updateGrammarUnitSelects(selectedCat = null) {
    const unitLesFilter = document.getElementById('filter-grammar-unit-les');
    const unitLes = document.getElementById('grammar-unit-lesson');
    
    let filteredLessons = grammarLessonsData;
    filteredLessons.sort((a,b) => (a.order || 0) - (b.order || 0));

    if (unitLesFilter) {
        const currentFilter = unitLesFilter.value;
        unitLesFilter.innerHTML = '<option value="all">All Lessons</option>';
        let filterCatId = document.getElementById('filter-grammar-unit-cat')?.value;
        let lessonsForFilter = filterCatId && filterCatId !== 'all' ? filteredLessons.filter(l => l.categoryId === filterCatId) : filteredLessons;
        lessonsForFilter.forEach(les => {
            unitLesFilter.innerHTML += `<option value="${les.id}">${les.title}</option>`;
        });
        unitLesFilter.value = currentFilter || 'all';
    }

    if (unitLes) {
        const currentLes = unitLes.value;
        unitLes.innerHTML = '';
        let lessonsForForm = selectedCat ? filteredLessons.filter(l => l.categoryId === selectedCat) : filteredLessons;
        lessonsForForm.forEach(les => {
            unitLes.innerHTML += `<option value="${les.id}">${les.title}</option>`;
        });
        if (currentLes) unitLes.value = currentLes;
    }
}

function renderGrammarLessons() {
    if (!grammarLessonList) return;
    const filterId = document.getElementById('filter-grammar-cat')?.value || 'all';
    
    let filtered = grammarLessonsData;
    if (filterId !== 'all') {
        filtered = filtered.filter(l => l.categoryId === filterId);
    }
    
    filtered.sort((a,b) => (a.order || 0) - (b.order || 0));

    grammarLessonList.innerHTML = '';
    filtered.forEach(les => {
        const catName = grammarCategoriesData.find(c => c.id === les.categoryId)?.title || 'Unknown';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${les.order || 0}</td>
            <td><span class="badge">${catName}</span></td>
            <td><strong>${les.title}</strong></td>
            <td>
                <button class="btn-secondary btn-small" onclick="editGrammarLesson('${les.id}')">Edit</button>
                <button class="btn-secondary btn-danger btn-small" onclick="deleteGrammarLesson('${les.id}')">Delete</button>
            </td>
        `;
        grammarLessonList.appendChild(tr);
    });
}

function renderGrammarUnits() {
    if (!grammarUnitList) return;
    const filterCatId = document.getElementById('filter-grammar-unit-cat')?.value || 'all';
    const filterLesId = document.getElementById('filter-grammar-unit-les')?.value || 'all';
    
    let filtered = grammarUnitsData;
    
    if (filterLesId !== 'all') {
        filtered = filtered.filter(u => u.lessonId === filterLesId);
    } else if (filterCatId !== 'all') {
        const allowedLessons = grammarLessonsData.filter(l => l.categoryId === filterCatId).map(l => l.id);
        filtered = filtered.filter(u => allowedLessons.includes(u.lessonId));
    }
    
    filtered.sort((a,b) => (a.order || 0) - (b.order || 0));

    grammarUnitList.innerHTML = '';
    filtered.forEach(unit => {
        const lesson = grammarLessonsData.find(l => l.id === unit.lessonId);
        const lessonName = lesson ? lesson.title : 'Unknown';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${unit.order || 0}</td>
            <td><span class="badge" style="background: #eef2f6; color: #4a7578;">${lessonName}</span></td>
            <td><strong>${unit.title}</strong></td>
            <td>
                <button class="btn-secondary btn-small" onclick="editGrammarUnit('${unit.id}')">Edit</button>
                <button class="btn-secondary btn-danger btn-small" onclick="deleteGrammarUnit('${unit.id}')">Delete</button>
            </td>
        `;
        grammarUnitList.appendChild(tr);
    });
}

if (filterGrammarCat) {
    filterGrammarCat.addEventListener('change', renderGrammarLessons);
}
if (filterGrammarUnitCat) {
    filterGrammarUnitCat.addEventListener('change', () => {
        updateGrammarUnitSelects();
        renderGrammarUnits();
        updateDashboardStats();
    });
}
if (filterGrammarUnitLes) {
    filterGrammarUnitLes.addEventListener('change', renderGrammarUnits);
}
if (document.getElementById('grammar-unit-category')) {
    document.getElementById('grammar-unit-category').addEventListener('change', (e) => {
        updateGrammarUnitSelects(e.target.value);
    });
}

// Category CRUD
if (document.getElementById('add-grammar-cat-btn')) {
    document.getElementById('add-grammar-cat-btn').addEventListener('click', () => {
        grammarCatForm.reset();
        document.getElementById('grammar-cat-id').value = '';
        document.getElementById('grammar-cat-order').value = grammarCategoriesData.length > 0 ? Math.max(...grammarCategoriesData.map(c => c.order || 0)) + 1 : 1;
        document.getElementById('grammar-cat-modal-title').innerText = 'Add Category';
        grammarCatModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
    });
}

if (grammarCatForm) {
    grammarCatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('grammar-cat-id').value;
        const title = document.getElementById('grammar-cat-title').value.trim();
        const order = parseInt(document.getElementById('grammar-cat-order').value) || 0;

        try {
            if (id) {
                await updateDoc(doc(db, "grammar_categories", id), { title, order });
            } else {
                await addDoc(collection(db, "grammar_categories"), { title, order });
            }
            grammarCatModal.style.display = 'none'; document.body.classList.remove('modal-open'); window.closeTinyMCEPopups(); window.isModalDirty = false;
            loadGrammarData();
            window.showToast('Saved!', 'success');
        } catch (err) { console.error(err); window.showToast("Error saving category!: " + (err.message || err), 'error'); }
    });
}

window.editGrammarCat = function(id) {
    const cat = grammarCategoriesData.find(c => c.id === id);
    if (!cat) return;
    document.getElementById('grammar-cat-id').value = cat.id;
    document.getElementById('grammar-cat-title').value = cat.title;
    document.getElementById('grammar-cat-order').value = cat.order || 0;
    document.getElementById('grammar-cat-modal-title').innerText = 'Edit Category';
    grammarCatModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
};

window.deleteGrammarCat = async function(id) {
    if (confirm("Are you sure you want to delete this category? Lessons in this category might be orphaned.")) {
        try {
            await deleteDoc(doc(db, "grammar_categories", id));
            loadGrammarData();
            window.showToast('Deleted!', 'success');
        } catch (e) {
            console.error(e);
            window.showToast("Error deleting category!", 'error');
        }
    }
};

// Lesson CRUD
if (document.getElementById('add-grammar-lesson-btn')) {
    document.getElementById('add-grammar-lesson-btn').addEventListener('click', () => {
        const lastCat = document.getElementById('grammar-lesson-category').value;
        grammarLessonForm.reset();
        if(lastCat) document.getElementById('grammar-lesson-category').value = lastCat;
        document.getElementById('grammar-lesson-id').value = '';
        document.getElementById('grammar-lesson-order').value = grammarLessonsData.length > 0 ? Math.max(...grammarLessonsData.map(l => l.order || 0)) + 1 : 1;
        if (tinymce.get('grammar-lesson-content')) {
            tinymce.get('grammar-lesson-content').setContent('');
        }
        document.getElementById('grammar-lesson-modal-title').innerText = 'Add Lesson';
        grammarLessonModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
    });
}

if (grammarLessonForm) {
    grammarLessonForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('grammar-lesson-id').value;
        const categoryId = document.getElementById('grammar-lesson-category').value;
        const title = document.getElementById('grammar-lesson-title').value.trim();
        const author = '';
        const order = parseInt(document.getElementById('grammar-lesson-order').value) || 0;
        const content = tinymce.get('grammar-lesson-content') ? tinymce.get('grammar-lesson-content').getContent() : document.getElementById('grammar-lesson-content').value;

        try {
            if (id) {
                await updateDoc(doc(db, "grammar_lessons", id), { categoryId, title, author, order, content });
            } else {
                await addDoc(collection(db, "grammar_lessons"), { categoryId, title, author, order, content });
            }
            grammarLessonModal.style.display = 'none'; document.body.classList.remove('modal-open'); window.closeTinyMCEPopups(); window.isModalDirty = false;
            loadGrammarData();
            window.showToast('Saved!', 'success');
        } catch (err) { console.error(err); window.showToast("Error saving lesson!: " + (err.message || err), 'error'); }
    });
}

window.editGrammarLesson = async function(id) {
    const les = grammarLessonsData.find(l => l.id === id);
    if (!les) return;
    document.getElementById('grammar-lesson-id').value = les.id;
    document.getElementById('grammar-lesson-category').value = les.categoryId;
    document.getElementById('grammar-lesson-title').value = les.title;
    document.getElementById('grammar-lesson-order').value = les.order || 0;
    
    if (tinymce.get('grammar-lesson-content')) {
        tinymce.get('grammar-lesson-content').setContent(les.content || '');
    } else {
        document.getElementById('grammar-lesson-content').value = les.content || '';
    }
    
    document.getElementById('grammar-lesson-modal-title').innerText = 'Edit Lesson';
    grammarLessonModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
};

// Unit CRUD
if (document.getElementById('add-grammar-unit-btn')) {
    document.getElementById('add-grammar-unit-btn').addEventListener('click', () => {
        const lastLes = document.getElementById('grammar-unit-lesson').value;
        const lastCat = document.getElementById('grammar-unit-category').value;
        grammarUnitForm.reset();
        if(lastLes) document.getElementById('grammar-unit-lesson').value = lastLes;
        if(lastCat) document.getElementById('grammar-unit-category').value = lastCat;
        document.getElementById('grammar-unit-id').value = '';
        document.getElementById('grammar-unit-order').value = grammarUnitsData.length > 0 ? Math.max(...grammarUnitsData.map(u => u.order || 0)) + 1 : 1;
        if (tinymce.get('grammar-unit-content')) {
            tinymce.get('grammar-unit-content').setContent('');
        }
        document.getElementById('grammar-unit-modal-title').innerText = 'Add Unit';
        grammarUnitModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
    });
}

if (grammarUnitForm) {
    grammarUnitForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('grammar-unit-id').value;
        const lessonId = document.getElementById('grammar-unit-lesson').value;
        const title = document.getElementById('grammar-unit-title').value.trim();
        const author = '';
        const order = parseInt(document.getElementById('grammar-unit-order').value) || 0;
        const content = tinymce.get('grammar-unit-content') ? tinymce.get('grammar-unit-content').getContent() : document.getElementById('grammar-unit-content').value;

        if (!lessonId) {
            window.showToast("Please select a Lesson.", 'error');
            return;
        }

        try {
            if (id) {
                await updateDoc(doc(db, "grammar_units", id), { lessonId, title, author, order, content });
            } else {
                await addDoc(collection(db, "grammar_units"), { lessonId, title, author, order, content });
            }
            grammarUnitModal.style.display = 'none'; document.body.classList.remove('modal-open'); window.closeTinyMCEPopups(); window.isModalDirty = false;
            loadGrammarData();
            window.showToast('Saved!', 'success');
        } catch (err) { console.error(err); window.showToast("Error saving unit!: " + (err.message || err), 'error'); }
    });
}

window.editGrammarUnit = async function(id) {
    const unit = grammarUnitsData.find(u => u.id === id);
    if (!unit) return;
    document.getElementById('grammar-unit-id').value = unit.id;
    
    // Find category from lesson to populate filter dropdown
    const lesson = grammarLessonsData.find(l => l.id === unit.lessonId);
    if (lesson) {
        document.getElementById('grammar-unit-category').value = lesson.categoryId;
        updateGrammarUnitSelects(lesson.categoryId);
    }
    
    document.getElementById('grammar-unit-lesson').value = unit.lessonId;
    document.getElementById('grammar-unit-title').value = unit.title;
    document.getElementById('grammar-unit-order').value = unit.order || 0;
    
    if (tinymce.get('grammar-unit-content')) {
        tinymce.get('grammar-unit-content').setContent(unit.content || '');
    } else {
        document.getElementById('grammar-unit-content').value = unit.content || '';
    }
    
    document.getElementById('grammar-unit-modal-title').innerText = 'Edit Unit';
    grammarUnitModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
};

window.deleteGrammarLesson = async function(id) {
    if (confirm("Are you sure you want to delete this lesson?")) {
        try {
            await deleteDoc(doc(db, "grammar_lessons", id));
            loadGrammarData();
            window.showToast('Deleted!', 'success');
        } catch (e) {
            console.error(e);
            window.showToast("Error deleting lesson!", 'error');
        }
    }
};

window.deleteGrammarUnit = async function(id) {
    if (confirm("Are you sure you want to delete this unit?")) {
        try {
            await deleteDoc(doc(db, "grammar_units", id));
            loadGrammarData();
            window.showToast('Deleted!', 'success');
        } catch (e) {
            console.error(e);
            window.showToast("Error deleting unit!", 'error');
        }
    }
};

window.closeModal = function(id) { document.getElementById(id).style.display = 'none'; window.closeTinyMCEPopups(); };


// GRAMMAR MANAGEMENT LOGIC
// =========================================================

// State
let pronunciationCategoriesData = [];
let pronunciationLessonsData = [];
let pronunciationUnitsData = [];

// DOM Elements
const pronunciationCatList = document.getElementById('pronunciation-cat-list');
const pronunciationLessonList = document.getElementById('pronunciation-lesson-list');
const pronunciationUnitList = document.getElementById('pronunciation-unit-list');
const filterPronunciationCat = document.getElementById('filter-pronunciation-cat');
const filterPronunciationUnitCat = document.getElementById('filter-pronunciation-unit-cat');
const filterPronunciationUnitLes = document.getElementById('filter-pronunciation-unit-les');

const pronunciationCatModal = document.getElementById('pronunciation-cat-modal');
const pronunciationCatForm = document.getElementById('pronunciation-cat-form');

const pronunciationLessonModal = document.getElementById('pronunciation-lesson-modal');
const pronunciationLessonForm = document.getElementById('pronunciation-lesson-form');

const pronunciationUnitModal = document.getElementById('pronunciation-unit-modal');
const pronunciationUnitForm = document.getElementById('pronunciation-unit-form');



async function loadPronunciationData() {
    try {
        // Load Categories
        const catSnap = await getDocs(collection(db, 'pronunciation_categories'));
        pronunciationCategoriesData = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        pronunciationCategoriesData.sort((a,b) => (a.order || 0) - (b.order || 0));
        
        renderPronunciationCategories();
        updatePronunciationCatSelects();

        // Load Lessons
        const lesSnap = await getDocs(collection(db, 'pronunciation_lessons'));
        pronunciationLessonsData = lesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Load Units
        const uniSnap = await getDocs(collection(db, 'pronunciation_units'));
        pronunciationUnitsData = uniSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        renderPronunciationLessons();
        renderPronunciationUnits();
        updatePronunciationUnitSelects();
    } catch (e) {
        console.error("Error loading Pronunciation Data:", e);
    }
}

function renderPronunciationCategories() {
    if (!pronunciationCatList) return;
    pronunciationCatList.innerHTML = '';
    pronunciationCategoriesData.forEach(cat => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cat.order || 0}</td>
            <td><strong>${cat.title}</strong></td>
            <td>
                <button class="btn-secondary btn-small" onclick="editPronunciationCat('${cat.id}')">Edit</button>
                <button class="btn-secondary btn-danger btn-small" onclick="deletePronunciationCat('${cat.id}')">Delete</button>
            </td>
        `;
        pronunciationCatList.appendChild(tr);
    });
}

function updatePronunciationCatSelects() {
    const filterCat = document.getElementById('filter-pronunciation-cat');
    const lessonCat = document.getElementById('pronunciation-lesson-category');
    const unitCatFilter = document.getElementById('filter-pronunciation-unit-cat');
    const unitCat = document.getElementById('pronunciation-unit-category');
    
    if (filterCat) {
        const currentFilter = filterCat.value;
        filterCat.innerHTML = '<option value="all">All Categories</option>';
        pronunciationCategoriesData.forEach(cat => {
            filterCat.innerHTML += `<option value="${cat.id}">${cat.title}</option>`;
        });
        filterCat.value = currentFilter || 'all';
    }

    if (lessonCat) {
        const currentLessonCat = lessonCat.value;
        lessonCat.innerHTML = '';
        pronunciationCategoriesData.forEach(cat => {
            lessonCat.innerHTML += `<option value="${cat.id}">${cat.title}</option>`;
        });
        if (currentLessonCat) lessonCat.value = currentLessonCat;
    }

    if (unitCatFilter) {
        const currentFilter = unitCatFilter.value;
        unitCatFilter.innerHTML = '<option value="all">All Categories</option>';
        pronunciationCategoriesData.forEach(cat => {
            unitCatFilter.innerHTML += `<option value="${cat.id}">${cat.title}</option>`;
        });
        unitCatFilter.value = currentFilter || 'all';
    }
    
    if (unitCat) {
        const currentFilter = unitCat.value;
        unitCat.innerHTML = '<option value="">-- Select to filter lessons --</option>';
        pronunciationCategoriesData.forEach(cat => {
            unitCat.innerHTML += `<option value="${cat.id}">${cat.title}</option>`;
        });
        unitCat.value = currentFilter || '';
    }
}

function updatePronunciationUnitSelects(selectedCat = null) {
    const unitLesFilter = document.getElementById('filter-pronunciation-unit-les');
    const unitLes = document.getElementById('pronunciation-unit-lesson');
    
    let filteredLessons = pronunciationLessonsData;
    filteredLessons.sort((a,b) => (a.order || 0) - (b.order || 0));

    if (unitLesFilter) {
        const currentFilter = unitLesFilter.value;
        unitLesFilter.innerHTML = '<option value="all">All Lessons</option>';
        let filterCatId = document.getElementById('filter-pronunciation-unit-cat')?.value;
        let lessonsForFilter = filterCatId && filterCatId !== 'all' ? filteredLessons.filter(l => l.categoryId === filterCatId) : filteredLessons;
        lessonsForFilter.forEach(les => {
            unitLesFilter.innerHTML += `<option value="${les.id}">${les.title}</option>`;
        });
        unitLesFilter.value = currentFilter || 'all';
    }

    if (unitLes) {
        const currentLes = unitLes.value;
        unitLes.innerHTML = '';
        let lessonsForForm = selectedCat ? filteredLessons.filter(l => l.categoryId === selectedCat) : filteredLessons;
        lessonsForForm.forEach(les => {
            unitLes.innerHTML += `<option value="${les.id}">${les.title}</option>`;
        });
        if (currentLes) unitLes.value = currentLes;
    }
}

function renderPronunciationLessons() {
    if (!pronunciationLessonList) return;
    const filterId = document.getElementById('filter-pronunciation-cat')?.value || 'all';
    
    let filtered = pronunciationLessonsData;
    if (filterId !== 'all') {
        filtered = filtered.filter(l => l.categoryId === filterId);
    }
    
    filtered.sort((a,b) => (a.order || 0) - (b.order || 0));

    pronunciationLessonList.innerHTML = '';
    filtered.forEach(les => {
        const catName = pronunciationCategoriesData.find(c => c.id === les.categoryId)?.title || 'Unknown';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${les.order || 0}</td>
            <td><span class="badge">${catName}</span></td>
            <td><strong>${les.title}</strong></td>
            <td>
                <button class="btn-secondary btn-small" onclick="editPronunciationLesson('${les.id}')">Edit</button>
                <button class="btn-secondary btn-danger btn-small" onclick="deletePronunciationLesson('${les.id}')">Delete</button>
            </td>
        `;
        pronunciationLessonList.appendChild(tr);
    });
}

function renderPronunciationUnits() {
    if (!pronunciationUnitList) return;
    const filterCatId = document.getElementById('filter-pronunciation-unit-cat')?.value || 'all';
    const filterLesId = document.getElementById('filter-pronunciation-unit-les')?.value || 'all';
    
    let filtered = pronunciationUnitsData;
    
    if (filterLesId !== 'all') {
        filtered = filtered.filter(u => u.lessonId === filterLesId);
    } else if (filterCatId !== 'all') {
        const allowedLessons = pronunciationLessonsData.filter(l => l.categoryId === filterCatId).map(l => l.id);
        filtered = filtered.filter(u => allowedLessons.includes(u.lessonId));
    }
    
    filtered.sort((a,b) => (a.order || 0) - (b.order || 0));

    pronunciationUnitList.innerHTML = '';
    filtered.forEach(unit => {
        const lesson = pronunciationLessonsData.find(l => l.id === unit.lessonId);
        const lessonName = lesson ? lesson.title : 'Unknown';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${unit.order || 0}</td>
            <td><span class="badge" style="background: #eef2f6; color: #4a7578;">${lessonName}</span></td>
            <td><strong>${unit.title}</strong></td>
            <td>
                <button class="btn-secondary btn-small" onclick="editPronunciationUnit('${unit.id}')">Edit</button>
                <button class="btn-secondary btn-danger btn-small" onclick="deletePronunciationUnit('${unit.id}')">Delete</button>
            </td>
        `;
        pronunciationUnitList.appendChild(tr);
    });
}

if (filterPronunciationCat) {
    filterPronunciationCat.addEventListener('change', renderPronunciationLessons);
}
if (filterPronunciationUnitCat) {
    filterPronunciationUnitCat.addEventListener('change', () => {
        updatePronunciationUnitSelects();
        renderPronunciationUnits();
    });
}
if (filterPronunciationUnitLes) {
    filterPronunciationUnitLes.addEventListener('change', renderPronunciationUnits);
}
if (document.getElementById('pronunciation-unit-category')) {
    document.getElementById('pronunciation-unit-category').addEventListener('change', (e) => {
        updatePronunciationUnitSelects(e.target.value);
    });
}

// Category CRUD
if (document.getElementById('add-pronunciation-cat-btn')) {
    document.getElementById('add-pronunciation-cat-btn').addEventListener('click', () => {
        pronunciationCatForm.reset();
        document.getElementById('pronunciation-cat-id').value = '';
        document.getElementById('pronunciation-cat-order').value = pronunciationCategoriesData.length > 0 ? Math.max(...pronunciationCategoriesData.map(c => c.order || 0)) + 1 : 1;
        document.getElementById('pronunciation-cat-modal-title').innerText = 'Add Category';
        pronunciationCatModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
    });
}

if (pronunciationCatForm) {
    pronunciationCatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('pronunciation-cat-id').value;
        const title = document.getElementById('pronunciation-cat-title').value.trim();
        const order = parseInt(document.getElementById('pronunciation-cat-order').value) || 0;

        try {
            if (id) {
                await updateDoc(doc(db, "pronunciation_categories", id), { title, order });
            } else {
                await addDoc(collection(db, "pronunciation_categories"), { title, order });
            }
            pronunciationCatModal.style.display = 'none'; document.body.classList.remove('modal-open'); window.closeTinyMCEPopups(); window.isModalDirty = false;
            loadPronunciationData();
            window.showToast('Saved!', 'success');
        } catch (err) { console.error(err); window.showToast("Error saving category!: " + (err.message || err), 'error'); }
    });
}

window.editPronunciationCat = function(id) {
    const cat = pronunciationCategoriesData.find(c => c.id === id);
    if (!cat) return;
    document.getElementById('pronunciation-cat-id').value = cat.id;
    document.getElementById('pronunciation-cat-title').value = cat.title;
    document.getElementById('pronunciation-cat-order').value = cat.order || 0;
    document.getElementById('pronunciation-cat-modal-title').innerText = 'Edit Category';
    pronunciationCatModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
};

window.deletePronunciationCat = async function(id) {
    if (confirm("Are you sure you want to delete this category? Lessons in this category might be orphaned.")) {
        try {
            await deleteDoc(doc(db, "pronunciation_categories", id));
            loadPronunciationData();
            window.showToast('Deleted!', 'success');
        } catch (e) {
            console.error(e);
            window.showToast("Error deleting category!", 'error');
        }
    }
};

// Lesson CRUD
if (document.getElementById('add-pronunciation-lesson-btn')) {
    document.getElementById('add-pronunciation-lesson-btn').addEventListener('click', () => {
        const lastCat = document.getElementById('pronunciation-lesson-category').value;
        pronunciationLessonForm.reset();
        if(lastCat) document.getElementById('pronunciation-lesson-category').value = lastCat;
        document.getElementById('pronunciation-lesson-id').value = '';
        document.getElementById('pronunciation-lesson-order').value = pronunciationLessonsData.length > 0 ? Math.max(...pronunciationLessonsData.map(l => l.order || 0)) + 1 : 1;
        if (tinymce.get('pronunciation-lesson-content')) {
            tinymce.get('pronunciation-lesson-content').setContent('');
        }
        document.getElementById('pronunciation-lesson-modal-title').innerText = 'Add Lesson';
        pronunciationLessonModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
    });
}

if (pronunciationLessonForm) {
    pronunciationLessonForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('pronunciation-lesson-id').value;
        const categoryId = document.getElementById('pronunciation-lesson-category').value;
        const title = document.getElementById('pronunciation-lesson-title').value.trim();
        const author = '';
        const order = parseInt(document.getElementById('pronunciation-lesson-order').value) || 0;
        const content = tinymce.get('pronunciation-lesson-content') ? tinymce.get('pronunciation-lesson-content').getContent() : document.getElementById('pronunciation-lesson-content').value;

        try {
            if (id) {
                await updateDoc(doc(db, "pronunciation_lessons", id), { categoryId, title, author, order, content });
            } else {
                await addDoc(collection(db, "pronunciation_lessons"), { categoryId, title, author, order, content });
            }
            pronunciationLessonModal.style.display = 'none'; document.body.classList.remove('modal-open'); window.closeTinyMCEPopups(); window.isModalDirty = false;
            loadPronunciationData();
            window.showToast('Saved!', 'success');
        } catch (err) { console.error(err); window.showToast("Error saving lesson!: " + (err.message || err), 'error'); }
    });
}

window.editPronunciationLesson = async function(id) {
    const les = pronunciationLessonsData.find(l => l.id === id);
    if (!les) return;
    document.getElementById('pronunciation-lesson-id').value = les.id;
    document.getElementById('pronunciation-lesson-category').value = les.categoryId;
    document.getElementById('pronunciation-lesson-title').value = les.title;
    document.getElementById('pronunciation-lesson-order').value = les.order || 0;
    
    if (tinymce.get('pronunciation-lesson-content')) {
        tinymce.get('pronunciation-lesson-content').setContent(les.content || '');
    } else {
        document.getElementById('pronunciation-lesson-content').value = les.content || '';
    }
    
    document.getElementById('pronunciation-lesson-modal-title').innerText = 'Edit Lesson';
    pronunciationLessonModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
};

// Unit CRUD
if (document.getElementById('add-pronunciation-unit-btn')) {
    document.getElementById('add-pronunciation-unit-btn').addEventListener('click', () => {
        const lastLes = document.getElementById('pronunciation-unit-lesson').value;
        const lastCat = document.getElementById('pronunciation-unit-category').value;
        pronunciationUnitForm.reset();
        if(lastLes) document.getElementById('pronunciation-unit-lesson').value = lastLes;
        if(lastCat) document.getElementById('pronunciation-unit-category').value = lastCat;
        document.getElementById('pronunciation-unit-id').value = '';
        document.getElementById('pronunciation-unit-order').value = pronunciationUnitsData.length > 0 ? Math.max(...pronunciationUnitsData.map(u => u.order || 0)) + 1 : 1;
        if (tinymce.get('pronunciation-unit-content')) {
            tinymce.get('pronunciation-unit-content').setContent('');
        }
        document.getElementById('pronunciation-unit-modal-title').innerText = 'Add Unit';
        pronunciationUnitModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
    });
}

if (pronunciationUnitForm) {
    pronunciationUnitForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('pronunciation-unit-id').value;
        const lessonId = document.getElementById('pronunciation-unit-lesson').value;
        const title = document.getElementById('pronunciation-unit-title').value.trim();
        const author = '';
        const order = parseInt(document.getElementById('pronunciation-unit-order').value) || 0;
        const content = tinymce.get('pronunciation-unit-content') ? tinymce.get('pronunciation-unit-content').getContent() : document.getElementById('pronunciation-unit-content').value;

        if (!lessonId) {
            window.showToast("Please select a Lesson.", 'error');
            return;
        }

        try {
            if (id) {
                await updateDoc(doc(db, "pronunciation_units", id), { lessonId, title, author, order, content });
            } else {
                await addDoc(collection(db, "pronunciation_units"), { lessonId, title, author, order, content });
            }
            pronunciationUnitModal.style.display = 'none'; document.body.classList.remove('modal-open'); window.closeTinyMCEPopups(); window.isModalDirty = false;
            loadPronunciationData();
            window.showToast('Saved!', 'success');
        } catch (err) { console.error(err); window.showToast("Error saving unit!: " + (err.message || err), 'error'); }
    });
}

window.editPronunciationUnit = async function(id) {
    const unit = pronunciationUnitsData.find(u => u.id === id);
    if (!unit) return;
    document.getElementById('pronunciation-unit-id').value = unit.id;
    
    // Find category from lesson to populate filter dropdown
    const lesson = pronunciationLessonsData.find(l => l.id === unit.lessonId);
    if (lesson) {
        document.getElementById('pronunciation-unit-category').value = lesson.categoryId;
        updatePronunciationUnitSelects(lesson.categoryId);
    }
    
    document.getElementById('pronunciation-unit-lesson').value = unit.lessonId;
    document.getElementById('pronunciation-unit-title').value = unit.title;
    document.getElementById('pronunciation-unit-order').value = unit.order || 0;
    
    if (tinymce.get('pronunciation-unit-content')) {
        tinymce.get('pronunciation-unit-content').setContent(unit.content || '');
    } else {
        document.getElementById('pronunciation-unit-content').value = unit.content || '';
    }
    
    document.getElementById('pronunciation-unit-modal-title').innerText = 'Edit Unit';
    pronunciationUnitModal.style.display = 'flex'; document.body.classList.add('modal-open'); window.isModalDirty = false;
};

window.deletePronunciationLesson = async function(id) {
    if (confirm("Are you sure you want to delete this lesson?")) {
        try {
            await deleteDoc(doc(db, "pronunciation_lessons", id));
            loadPronunciationData();
            window.showToast('Deleted!', 'success');
        } catch (e) {
            console.error(e);
            window.showToast("Error deleting lesson!", 'error');
        }
    }
};

window.deletePronunciationUnit = async function(id) {
    if (confirm("Are you sure you want to delete this unit?")) {
        try {
            await deleteDoc(doc(db, "pronunciation_units", id));
            loadPronunciationData();
            window.showToast('Deleted!', 'success');
        } catch (e) {
            console.error(e);
            window.showToast("Error deleting unit!", 'error');
        }
    }
};

window.closeModal = function(id) { document.getElementById(id).style.display = 'none'; window.closeTinyMCEPopups(); };


function updateDashboardStats() {
    const elBooks = document.getElementById('stat-books');
    const elUnits = document.getElementById('stat-units');
    const elVocab = document.getElementById('stat-vocab');
    const elGrammar = document.getElementById('stat-grammar');
    
    if (elBooks) elBooks.innerText = (typeof booksData !== 'undefined') ? booksData.length : 0;
    if (elUnits) elUnits.innerText = (typeof unitsData !== 'undefined') ? unitsData.length : 0;
    if (elVocab) elVocab.innerText = (typeof vocabData !== 'undefined') ? vocabData.length : 0;
    if (elGrammar) elGrammar.innerText = (typeof grammarLessonsData !== 'undefined') ? grammarLessonsData.length : 0;
}


window.renderVocab = renderVocab;
window.renderPhrasal = renderPhrasal;
window.renderPrep = renderPrep;
window.renderWordform = renderWordform;
window.renderPattern = renderPattern;
window.renderLexical = renderLexical;


// Dark mode logic
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
