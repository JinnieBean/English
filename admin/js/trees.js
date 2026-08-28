import { collection, doc, addDoc, updateDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { adminDb as db } from './admin-firebase.js';
import { escapeHtml, sanitizeRichText, friendlyError } from '../../assets/js/utils.js';
import { logAudit as logAuditBase } from './common.js';
const logAuditSafe = (...a) => logAuditBase(...a).catch?.() ?? logAuditBase;
const showToastErr = (e) => { console.error(e); try { window.showToast(friendlyError(e), 'error'); } catch {} };
import { hooks, openModal, onSubmit, stampCreate, stampUpdate, isDuplicate, dupToast, performDelete, publicUrlFor, enableDragReorder } from './common.js';
import { fetchAll } from './data.js';

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
            hooks.updateStats?.();
        } catch (e) {
            console.error(`Error loading ${cfg.label} data:`, e);
            [catList, lessonList, unitList].forEach(tb => {
                if (tb && !tb.rows.length) {
                    tb.innerHTML = '<tr><td colspan="4" class="empty-row">Could not load data — check your connection and reload.</td></tr>';
                }
            });
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
            <tr draggable="true" data-id="${cat.id}">
                <td>${cat.order || 0}</td>
                <td data-inline="1" data-tree-tab="${cfg.label}" data-kind="cat" data-id="${cat.id}" data-field="title"><strong>${escapeHtml(cat.title)}</strong></td>
                <td>
                    ${publicUrlFor(cfg.categories, cat) ? `<a class="btn-secondary btn-small view-site-btn" href="${publicUrlFor(cfg.categories, cat)}" target="_blank" rel="noopener" title="View on site">&#8599;</a>` : ''}
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
            <tr draggable="true" data-id="${les.id}">
                <td>${les.order || 0}</td>
                <td><span class="badge">${escapeHtml(catName)}</span></td>
                <td data-inline="1" data-tree-tab="${cfg.label}" data-kind="lesson" data-id="${les.id}" data-field="title"><strong>${escapeHtml(les.title)}</strong> ${les.status === 'draft' ? '<span class="badge badge-draft">Draft</span>' : ''}</td>
                <td>
                    ${publicUrlFor(cfg.lessons, les) ? `<a class="btn-secondary btn-small view-site-btn" href="${publicUrlFor(cfg.lessons, les)}" target="_blank" rel="noopener" title="View on site">&#8599;</a>` : ''}
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
            <tr draggable="true" data-id="${unit.id}">
                <td>${unit.order || 0}</td>
                <td><span class="badge badge-muted">${escapeHtml(lessonName)}</span></td>
                <td data-inline="1" data-tree-tab="${cfg.label}" data-kind="unit" data-id="${unit.id}" data-field="title"><strong>${escapeHtml(unit.title)}</strong> ${unit.status === 'draft' ? '<span class="badge badge-draft">Draft</span>' : ''}</td>
                <td>
                    ${publicUrlFor(cfg.units, unit) ? `<a class="btn-secondary btn-small view-site-btn" href="${publicUrlFor(cfg.units, unit)}" target="_blank" rel="noopener" title="View on site">&#8599;</a>` : ''}
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
        hooks.updateStats?.();
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
        await logAuditSafe(id ? 'update' : 'create', cfg.categories, id, title);
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
        await logAuditSafe(id ? 'update' : 'create', cfg.lessons, id, title);
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
        await logAuditSafe(id ? 'update' : 'create', cfg.units, id, title);
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

    // Drag reorder for the three levels
    const wireTreeReorder = (tbodyId, collName, list) => {
        const tb = document.getElementById(tbodyId);
        if (!tb || tb.dataset.rw === '1') return;
        tb.dataset.rw = '1';
        enableDragReorder(tb, async (ids) => {
            const batch = writeBatch(db);
            let changed = 0;
            ids.forEach((id, i) => {
                const it = list().find(x => x.id === id);
                if (it && (it.order || 0) !== i + 1) {
                    batch.update(doc(db, collName, id), { order: i + 1 });
                    changed++;
                }
            });
            if (!changed) return;
            try {
                await batch.commit();
                await logAuditSafe('reorder', collName, ids.join(','), `${changed} order updates`);
                window.showToast(`Reordered ${changed} item(s).`, 'success');
                await loadData();
            } catch (err) { console.error(err); showToastErr(err); }
        });
    };
    wireTreeReorder(cfg.catListId, cfg.categories, () => state.categories);
    wireTreeReorder(cfg.lessonListId, cfg.lessons, () => state.lessons);
    wireTreeReorder(cfg.unitListId, cfg.units, () => state.units);

    return { loadData, state };
}

/* ---- TinyMCE init (kept config) ---- */
export let treeManagers;

let tinymceInitialized = false;
export function initTinyMCE() {
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
export function loadGrammarData() { return grammarManager.loadData(); }

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
export function loadPronunciationData() { return pronunciationManager.loadData(); }
treeManagers = { grammar: grammarManager, pronunciation: pronunciationManager };
