const fs = require('fs');

const codeToAppend = `
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
        tr.innerHTML = \`
            <td>\${cat.order || 0}</td>
            <td><strong>\${cat.title}</strong></td>
            <td>
                <button class="btn-secondary btn-small" onclick="editGrammarCat('\${cat.id}')">Edit</button>
                <button class="btn-secondary btn-danger btn-small" onclick="deleteGrammarCat('\${cat.id}')">Delete</button>
            </td>
        \`;
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
            filterCat.innerHTML += \`<option value="\${cat.id}">\${cat.title}</option>\`;
        });
        filterCat.value = currentFilter || 'all';
    }

    if (lessonCat) {
        const currentLessonCat = lessonCat.value;
        lessonCat.innerHTML = '';
        grammarCategoriesData.forEach(cat => {
            lessonCat.innerHTML += \`<option value="\${cat.id}">\${cat.title}</option>\`;
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
        tr.innerHTML = \`
            <td>\${les.order || 0}</td>
            <td><span class="badge">\${catName}</span></td>
            <td><strong>\${les.title}</strong></td>
            <td>
                <button class="btn-secondary btn-small" onclick="editGrammarLesson('\${les.id}')">Edit</button>
                <button class="btn-secondary btn-danger btn-small" onclick="deleteGrammarLesson('\${les.id}')">Delete</button>
            </td>
        \`;
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
`;

let content = fs.readFileSync('admin/js/admin.js', 'utf8');

// Also need to make sure setDoc is imported from firebase-firestore.js
if (!content.includes('setDoc')) {
    content = content.replace('getDocs,', 'getDocs, setDoc,');
}

// Append the new code
content += '\n' + codeToAppend;

fs.writeFileSync('admin/js/admin.js', content);
