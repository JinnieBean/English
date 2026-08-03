import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBiGp-ZZD0Yq-Tok2aAOwVbxXMmq7eRZuM",
    authDomain: "english-study-68459.firebaseapp.com",
    projectId: "english-study-68459",
    storageBucket: "english-study-68459.firebasestorage.app",
    messagingSenderId: "1048895043926",
    appId: "1:1048895043926:web:06c3c04a722e2f3f647ef7"
};

// Khởi tạo Firebase
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
        loginError.innerText = "Đăng nhập thất bại. Vui lòng kiểm tra lại email/mật khẩu.";
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
        
        renderUnits();
        populateUnitSelects();
        renderVocab();
        renderPhrasal();
        renderPrep();
        renderWordform();
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        alert("Không thể tải dữ liệu từ Database. Đảm bảo bạn đã mở quyền test mode trong Firestore.");
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
        console.error("Lỗi khi lưu Unit:", error);
        alert("Lỗi khi lưu Unit!");
    }
});

function renderUnits() {
    const list = document.getElementById('units-list');
    list.innerHTML = '';
    unitsData.sort((a,b) => a.order - b.order).forEach(unit => {
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
            console.error("Lỗi khi xóa Unit:", error);
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
    
    const options = unitsData.sort((a,b) => a.order - b.order).map(u => `<option value="${u.id}">${u.title}</option>`).join('');
    
    // Giữ lại option hiện tại nếu đang chọn filter
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

    formSelect.innerHTML = options;
    formSelectPhrasal.innerHTML = options;
    formSelectPrep.innerHTML = options;
    formSelectWordform.innerHTML = options;
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
        console.error("Lỗi khi lưu từ vựng:", error);
        alert("Lỗi khi lưu từ vựng!");
    }
});

document.getElementById('filter-unit-select').addEventListener('change', renderVocab);

function renderVocab() {
    const list = document.getElementById('vocab-list');
    const filter = document.getElementById('filter-unit-select').value;
    list.innerHTML = '';
    
    const filteredVocab = filter === 'all' ? vocabData : vocabData.filter(v => v.unitId === filter);
    
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
            console.error("Lỗi khi xóa từ vựng:", error);
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
        console.error("Lỗi khi lưu Phrasal Verb:", error);
        alert("Lỗi khi lưu Phrasal Verb!");
    }
});

document.getElementById('filter-unit-select-phrasal').addEventListener('change', renderPhrasal);

function renderPhrasal() {
    const list = document.getElementById('phrasal-list');
    const filter = document.getElementById('filter-unit-select-phrasal').value;
    list.innerHTML = '';
    
    const filteredPhrasal = filter === 'all' ? phrasalData : phrasalData.filter(p => p.unitId === filter);
    
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
            console.error("Lỗi khi xóa Phrasal Verb:", error);
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
        console.error("Lỗi khi lưu Phrase:", error);
        alert("Lỗi khi lưu Phrase!");
    }
});

document.getElementById('filter-unit-select-prep').addEventListener('change', renderPrep);

function renderPrep() {
    const list = document.getElementById('prep-list');
    const filter = document.getElementById('filter-unit-select-prep').value;
    list.innerHTML = '';
    
    const filteredPrep = filter === 'all' ? prepData : prepData.filter(p => p.unitId === filter);
    
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
            console.error("Lỗi khi xóa Phrase:", error);
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

    row.innerHTML = `
        <button type="button" class="btn-secondary btn-danger btn-small" style="position:absolute; top: 1rem; right: 1rem;" onclick="this.parentElement.remove()">Remove Form</button>
        <div class="input-group">
            <label>Title (e.g. act v ≠ overact v)</label>
            <input type="text" class="input-field wf-title" value="${title.replace(/"/g, '&quot;')}" required>
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
        const title = r.querySelector('.wf-title').value.trim();
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
        console.error("Lỗi khi lưu Word Formation:", error);
        alert("Lỗi khi lưu Word Formation!");
    }
});

document.getElementById('filter-unit-select-wordform').addEventListener('change', renderWordform);

function renderWordform() {
    const list = document.getElementById('wordform-list');
    const filter = document.getElementById('filter-unit-select-wordform').value;
    list.innerHTML = '';
    
    const filteredWf = filter === 'all' ? wordformData : wordformData.filter(w => w.unitId === filter);
    
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
            console.error("Lỗi khi xóa Word formation:", error);
        }
    }
}
