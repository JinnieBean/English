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
        
        renderUnits();
        populateUnitSelects();
        renderVocab();
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
    
    const options = unitsData.sort((a,b) => a.order - b.order).map(u => `<option value="${u.id}">${u.title}</option>`).join('');
    
    // Giữ lại option hiện tại nếu đang chọn filter
    const currentFilter = filterSelect.value;
    filterSelect.innerHTML = `<option value="all">All Units</option>` + options;
    if(currentFilter && currentFilter !== 'all') {
        filterSelect.value = currentFilter;
    }
    
    formSelect.innerHTML = options;
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
