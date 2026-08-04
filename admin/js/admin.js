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

// Tabs
const navItems = document.querySelectorAll('.nav-item');
const tabPanes = document.querySelectorAll('.tab-pane');

// State
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
const closeBtns = document.querySelectorAll('.close-modal');
closeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const targetId = e.target.getAttribute('data-target');
        document.getElementById(targetId).style.display = 'none';
    });
});
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

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
        
        renderUnits();
        populateUnitSelects();
        renderVocab();
        renderPhrasal();
        renderPrep();
        renderWordform();
        renderPattern();
        renderLexical();
    } catch (error) {
        console.error("Error loading data:", error);
        alert("Cannot load data from Database: " + (error.message || error));
    }
}

// --- Units Logic ---
const unitModal = document.getElementById('unit-modal');
const unitForm = document.getElementById('unit-form');

document.getElementById('add-unit-btn').addEventListener('click', () => {
    document.getElementById('unit-id').value = '';
    unitForm.reset();
    document.getElementById('unit-modal-title').innerText = 'Add New Unit';
    unitModal.style.display = 'flex';
});

unitForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('unit-id').value;
    const title = document.getElementById('unit-title').value;
    const order = parseInt(document.getElementById('unit-order').value);
    
    try {
        if (id) {
            // Update
            await updateDoc(doc(db, "units", id), { title, order });
        } else {
            // Create
            await addDoc(collection(db, "units"), { title, order });
        }
        unitModal.style.display = 'none';
        await loadData();
    } catch (error) {
        console.error("Error saving Unit:", error);
        alert("Error saving Unit!");
    }
});

document.getElementById('search-unit').addEventListener('input', renderUnits);
document.getElementById('sort-unit').addEventListener('change', renderUnits);

function renderUnits() {
    const list = document.getElementById('units-list');
    const searchQuery = document.getElementById('search-unit').value.toLowerCase();
    const sortValue = document.getElementById('sort-unit').value;
    list.innerHTML = '';
    
    let filteredData = unitsData.filter(u => u.title.toLowerCase().includes(searchQuery));
    
    if (sortValue === 'az') {
        filteredData.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortValue === 'za') {
        filteredData.sort((a, b) => b.title.localeCompare(a.title));
    } else {
        filteredData.sort((a, b) => a.order - b.order);
    }

    filteredData.forEach(unit => {
        list.innerHTML += `
            <tr>
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
        document.getElementById('unit-title').value = unit.title;
        document.getElementById('unit-order').value = unit.order;
        document.getElementById('unit-modal-title').innerText = 'Edit Unit';
        unitModal.style.display = 'flex';
    }
};

window.deleteUnit = async (id) => {
    if(confirm('Are you sure you want to delete this unit? All vocabs will need to be reassigned manually.')) {
        try {
            await deleteDoc(doc(db, "units", id));
            await loadData();
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
    document.getElementById('vocab-id').value = '';
    vocabForm.reset();
    document.getElementById('vocab-modal-title').innerText = 'Add New Vocabulary';
    vocabModal.style.display = 'flex';
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
        vocabModal.style.display = 'none';
        await loadData();
    } catch (error) {
        console.error("Error saving vocabulary:", error);
        alert("Error saving vocabulary!");
    }
});

document.getElementById('filter-unit-select').addEventListener('change', renderVocab);
document.getElementById('search-vocab').addEventListener('input', renderVocab);
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
        vocabModal.style.display = 'flex';
    }
};

window.deleteVocab = async (id) => {
    if(confirm('Are you sure you want to delete this word?')) {
        try {
            await deleteDoc(doc(db, "vocabularies", id));
            await loadData();
        } catch (error) {
            console.error("Error deleting vocabulary:", error);
        }
    }
}

// --- Phrasal Verbs Logic ---
const phrasalModal = document.getElementById('phrasal-modal');
const phrasalForm = document.getElementById('phrasal-form');

document.getElementById('add-phrasal-btn').addEventListener('click', () => {
    document.getElementById('phrasal-id').value = '';
    phrasalForm.reset();
    document.getElementById('phrasal-modal-title').innerText = 'Add New Phrasal Verb';
    phrasalModal.style.display = 'flex';
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
        phrasalModal.style.display = 'none';
        await loadData();
    } catch (error) {
        console.error("Error saving Phrasal Verb:", error);
        alert("Error saving Phrasal Verb!");
    }
});

document.getElementById('filter-unit-select-phrasal').addEventListener('change', renderPhrasal);
document.getElementById('search-phrasal').addEventListener('input', renderPhrasal);
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
        phrasalModal.style.display = 'flex';
    }
};

window.deletePhrasal = async (id) => {
    if(confirm('Are you sure you want to delete this phrasal verb?')) {
        try {
            await deleteDoc(doc(db, "phrasal_verbs", id));
            await loadData();
        } catch (error) {
            console.error("Error deleting Phrasal Verb:", error);
        }
    }
}

// --- Prepositional Phrases Logic ---
const prepModal = document.getElementById('prep-modal');
const prepForm = document.getElementById('prep-form');

document.getElementById('add-prep-btn').addEventListener('click', () => {
    document.getElementById('prep-id').value = '';
    prepForm.reset();
    document.getElementById('prep-modal-title').innerText = 'Add New Phrase';
    prepModal.style.display = 'flex';
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
        prepModal.style.display = 'none';
        await loadData();
    } catch (error) {
        console.error("Error saving Phrase:", error);
        alert("Error saving Phrase!");
    }
});

document.getElementById('filter-unit-select-prep').addEventListener('change', renderPrep);
document.getElementById('search-prep').addEventListener('input', renderPrep);
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
        prepModal.style.display = 'flex';
    }
};

window.deletePrep = async (id) => {
    if(confirm('Are you sure you want to delete this phrase?')) {
        try {
            await deleteDoc(doc(db, "prep_phrases", id));
            await loadData();
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
    document.getElementById('wordform-id').value = '';
    wordformForm.reset();
    
    wordformOverviewContainer.innerHTML = '';
    addOverviewRow(); // add at least 1 row default
    
    wordformContainer.innerHTML = '';
    addWordformRow(); // add at least 1 row default
    
    document.getElementById('wordform-modal-title').innerText = 'Add Word Formation';
    wordformModal.style.display = 'flex';
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
        wordformModal.style.display = 'none';
        await loadData();
    } catch (error) {
        console.error("Error saving Word Formation:", error);
        alert("Error saving Word Formation!");
    }
});

document.getElementById('filter-unit-select-wordform').addEventListener('change', renderWordform);
document.getElementById('search-wordform').addEventListener('input', renderWordform);
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
        wordformModal.style.display = 'flex';
    }
};

window.deleteWordform = async (id) => {
    if(confirm('Are you sure you want to delete this word formation?')) {
        try {
            await deleteDoc(doc(db, "word_formations", id));
            await loadData();
        } catch (error) {
            console.error("Error deleting Word formation:", error);
        }
    }
}


// --- Word Patterns Logic ---
const patternModal = document.getElementById('pattern-modal');
const patternForm = document.getElementById('pattern-form');

document.getElementById('add-pattern-btn').addEventListener('click', () => {
    document.getElementById('pattern-id').value = '';
    patternForm.reset();
    document.getElementById('pattern-modal-title').innerText = 'Add New Word Pattern';
    patternModal.style.display = 'flex';
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
        patternModal.style.display = 'none';
        await loadData();
    } catch (error) {
        console.error("Error saving Word Pattern:", error);
        alert("Error saving Word Pattern!");
    }
});

document.getElementById('filter-unit-select-pattern').addEventListener('change', renderPattern);
document.getElementById('search-pattern').addEventListener('input', renderPattern);
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
        patternModal.style.display = 'flex';
    }
};

window.deletePattern = async (id) => {
    if(confirm("Are you sure you want to delete this pattern?")) {
        try {
            await deleteDoc(doc(db, "word_patterns", id));
            await loadData();
        } catch (error) {
            console.error("Error deleting Pattern:", error);
            alert("Error deleting!");
        }
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
        document.getElementById('lexical-id').value = '';
        lexicalForm.reset();
        lexicalWordsContainer.innerHTML = '';
        addLexicalWordRow();
        document.getElementById('lexical-modal-title').innerText = 'Add Lexical Expansion';
        lexicalModal.style.display = 'flex';
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
            lexicalModal.style.display = 'none';
            await loadData();
        } catch (error) {
            console.error("Error saving Lexical Expansion:", error);
            alert("Error saving Lexical Expansion!");
        }
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
        lexicalModal.style.display = 'flex';
    }
};

window.deleteLexical = async (id) => {
    if(confirm("Are you sure you want to delete this Lexical Expansion?")) {
        try {
            await deleteDoc(doc(db, "lexical_expansions", id));
            await loadData();
        } catch (error) {
            console.error("Error deleting Lexical Expansion:", error);
            alert("Error deleting!");
        }
    }
};


// =========================================================
// GRAMMAR MANAGEMENT LOGIC
// =========================================================

// State
let grammarCategoriesData = [];
let grammarLessonsData = [];

// DOM Elements
const grammarIntroForm = document.getElementById('grammar-intro-form');
const grammarCatList = document.getElementById('grammar-cat-list');
const grammarLessonList = document.getElementById('grammar-lesson-list');
const filterGrammarCat = document.getElementById('filter-grammar-cat');

const grammarCatModal = document.getElementById('grammar-cat-modal');
const grammarCatForm = document.getElementById('grammar-cat-form');

const grammarLessonModal = document.getElementById('grammar-lesson-modal');
const grammarLessonForm = document.getElementById('grammar-lesson-form');

// Initialize TinyMCE
let tinymceInitialized = false;
function initTinyMCE() {
    if (tinymceInitialized || typeof tinymce === 'undefined') return;
    tinymce.init({
        selector: '.tinymce-editor',
        plugins: 'lists link image table code help wordcount',
        toolbar: 'undo redo | blocks | bold italic forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | table | removeformat | help',
        menubar: false,
        height: 400,
        promotion: false
    });
    tinymceInitialized = true;
}

// Ensure TinyMCE is initialized when switching to Grammar tab
document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    item.addEventListener('click', () => {
        if (item.dataset.tab === 'tab-grammar') {
            initTinyMCE();
            loadGrammarData();
        }
    });
});

async function loadGrammarData() {
    try {
        // Load Intro
        const introDocRef = doc(db, 'grammar_intro', 'main');
        const introSnap = await getDoc(introDocRef);
        if (introSnap.exists()) {
            const data = introSnap.data();
            document.getElementById('grammar-intro-title').value = data.title || '';
            document.getElementById('grammar-intro-desc').value = data.description || '';
            if (tinymce.get('grammar-intro-content')) {
                tinymce.get('grammar-intro-content').setContent(data.content || '');
            } else {
                document.getElementById('grammar-intro-content').value = data.content || '';
            }
        }

        // Load Categories
        const catSnap = await getDocs(collection(db, 'grammar_categories'));
        grammarCategoriesData = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        grammarCategoriesData.sort((a,b) => (a.order || 0) - (b.order || 0));
        
        renderGrammarCategories();
        updateGrammarCatSelects();

        // Load Lessons
        const lesSnap = await getDocs(collection(db, 'grammar_lessons'));
        grammarLessonsData = lesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        renderGrammarLessons();
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
}

function renderGrammarLessons() {
    if (!grammarLessonList) return;
    const filterId = document.getElementById('filter-grammar-cat')?.value || 'all';
    
    let filtered = grammarLessonsData;
    if (filterId !== 'all') {
        filtered = filtered.filter(l => l.categoryId === filterId);
    }
    
    // Sort by order
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

if (filterGrammarCat) {
    filterGrammarCat.addEventListener('change', renderGrammarLessons);
}

// Intro Form
if (grammarIntroForm) {
    grammarIntroForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('grammar-intro-title').value;
        const description = document.getElementById('grammar-intro-desc').value;
        const content = tinymce.get('grammar-intro-content') ? tinymce.get('grammar-intro-content').getContent() : document.getElementById('grammar-intro-content').value;
        
        try {
            await setDoc(doc(db, "grammar_intro", "main"), { title, description, content });
            alert("Introduction saved successfully!");
        } catch (e) {
            console.error(e);
            alert("Error saving introduction!");
        }
    });
}

// Category CRUD
if (document.getElementById('add-grammar-cat-btn')) {
    document.getElementById('add-grammar-cat-btn').addEventListener('click', () => {
        grammarCatForm.reset();
        document.getElementById('grammar-cat-id').value = '';
        document.getElementById('grammar-cat-modal-title').innerText = 'Add Category';
        grammarCatModal.style.display = 'flex';
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
            grammarCatModal.style.display = 'none';
            loadGrammarData();
        } catch (err) {
            console.error(err);
            alert("Error saving category!");
        }
    });
}

window.editGrammarCat = function(id) {
    const cat = grammarCategoriesData.find(c => c.id === id);
    if (!cat) return;
    document.getElementById('grammar-cat-id').value = cat.id;
    document.getElementById('grammar-cat-title').value = cat.title;
    document.getElementById('grammar-cat-order').value = cat.order || 0;
    document.getElementById('grammar-cat-modal-title').innerText = 'Edit Category';
    grammarCatModal.style.display = 'flex';
};

window.deleteGrammarCat = async function(id) {
    if (confirm("Are you sure you want to delete this category? Lessons in this category might be orphaned.")) {
        try {
            await deleteDoc(doc(db, "grammar_categories", id));
            loadGrammarData();
        } catch (e) {
            console.error(e);
            alert("Error deleting category!");
        }
    }
};

// Lesson CRUD
if (document.getElementById('add-grammar-lesson-btn')) {
    document.getElementById('add-grammar-lesson-btn').addEventListener('click', () => {
        grammarLessonForm.reset();
        document.getElementById('grammar-lesson-id').value = '';
        if (tinymce.get('grammar-lesson-content')) {
            tinymce.get('grammar-lesson-content').setContent('');
        }
        document.getElementById('grammar-lesson-modal-title').innerText = 'Add Lesson';
        grammarLessonModal.style.display = 'flex';
    });
}

if (grammarLessonForm) {
    grammarLessonForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('grammar-lesson-id').value;
        const categoryId = document.getElementById('grammar-lesson-category').value;
        const title = document.getElementById('grammar-lesson-title').value.trim();
        const author = document.getElementById('grammar-lesson-author').value.trim();
        const order = parseInt(document.getElementById('grammar-lesson-order').value) || 0;
        const content = tinymce.get('grammar-lesson-content') ? tinymce.get('grammar-lesson-content').getContent() : document.getElementById('grammar-lesson-content').value;

        try {
            if (id) {
                await updateDoc(doc(db, "grammar_lessons", id), { categoryId, title, author, order, content });
            } else {
                await addDoc(collection(db, "grammar_lessons"), { categoryId, title, author, order, content });
            }
            grammarLessonModal.style.display = 'none';
            loadGrammarData();
        } catch (err) {
            console.error(err);
            alert("Error saving lesson!");
        }
    });
}

window.editGrammarLesson = async function(id) {
    const les = grammarLessonsData.find(l => l.id === id);
    if (!les) return;
    document.getElementById('grammar-lesson-id').value = les.id;
    document.getElementById('grammar-lesson-category').value = les.categoryId;
    document.getElementById('grammar-lesson-title').value = les.title;
    document.getElementById('grammar-lesson-author').value = les.author || '';
    document.getElementById('grammar-lesson-order').value = les.order || 0;
    
    if (tinymce.get('grammar-lesson-content')) {
        tinymce.get('grammar-lesson-content').setContent(les.content || '');
    } else {
        document.getElementById('grammar-lesson-content').value = les.content || '';
    }
    
    document.getElementById('grammar-lesson-modal-title').innerText = 'Edit Lesson';
    grammarLessonModal.style.display = 'flex';
};

window.deleteGrammarLesson = async function(id) {
    if (confirm("Are you sure you want to delete this lesson?")) {
        try {
            await deleteDoc(doc(db, "grammar_lessons", id));
            loadGrammarData();
        } catch (e) {
            console.error(e);
            alert("Error deleting lesson!");
        }
    }
};

window.closeModal = function(id) { document.getElementById(id).style.display = 'none'; };
