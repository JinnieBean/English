/**
 * content-tree.js — Shared engine for the Grammar & Pronunciation trees.
 * Both sections share identical structure: categories → lessons → units,
 * plus an optional "intro" document rendered by the lesson page.
 *
 * Config shape:
 * {
 *   overviewContainerId, lessonContainerId,      // container ids on each page type
 *   categories, lessons, units, intro,           // Firestore collection names
 *   lessonPage,                                  // e.g. 'grammar_lesson.html'
 *   cssPrefix,                                   // 'grammar' | 'pronunciation'
 * }
 */
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-config.js';
import { escapeHtml } from './utils.js';

const SKELETON = `
    <div class="grammar-category" style="margin-bottom: 3rem;">
        <div class="skeleton skeleton-title"></div>
        <div style="margin-bottom: 1.5rem;">
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text short"></div>
        </div>
    </div>`;

function showError(container, message, retryFn) {
    container.innerHTML = `
        <div class="error-state">
            <p>${escapeHtml(message)}</p>
            <button type="button" class="btn-retry">Try again</button>
        </div>`;
    container.querySelector('.btn-retry')?.addEventListener('click', retryFn);
}

const isDraft = (d) => d.status === 'draft';

async function fetchAll(name) {
    const snap = await getDocs(collection(db, name));
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !isDraft(x));
    items.sort((a, b) => (a.order || 0) - (b.order || 0));
    return items;
}

export async function initContentTree(cfg) {
    /* ---------- Overview page ---------- */
    const overviewContainer = document.getElementById(cfg.overviewContainerId);
    if (overviewContainer) {
        const load = async () => {
            overviewContainer.innerHTML = Array(3).fill(SKELETON).join('');
            try {
                // Fetch the three levels in parallel instead of a waterfall
                const [categories, lessons, units] = await Promise.all([
                    fetchAll(cfg.categories),
                    fetchAll(cfg.lessons),
                    fetchAll(cfg.units)
                ]);

                if (!categories.length) {
                    overviewContainer.innerHTML = '<p class="empty-state">No content has been published yet.</p>';
                    return;
                }

                overviewContainer.innerHTML = categories.map(cat => {
                    const catLessons = lessons.filter(l => l.categoryId === cat.id);

                    let lesHtml;
                    if (catLessons.length > 0) {
                        lesHtml = catLessons.map(l => {
                            const uniHtml = units.filter(u => u.lessonId === l.id).map(unit => `
                                <a href="${cfg.lessonPage}?id=${encodeURIComponent(unit.id)}&type=unit" class="${cfg.cssPrefix}-lesson-link unit-link">
                                    <span class="unit-bullet" aria-hidden="true">&bull;</span>
                                    <span class="lesson-title">${escapeHtml(unit.title)}</span>
                                </a>`).join('');

                            return `
                            <div class="${cfg.cssPrefix}-lesson-group">
                                <a href="${cfg.lessonPage}?id=${encodeURIComponent(l.id)}&type=lesson" class="${cfg.cssPrefix}-lesson-link lesson-heading">
                                    <span class="lesson-title">${escapeHtml(l.title)}</span>
                                </a>
                                <div class="${cfg.cssPrefix}-lesson-units">${uniHtml}</div>
                            </div>`;
                        }).join('');
                    } else {
                        lesHtml = '<div class="tree-empty">No lessons available in this category.</div>';
                    }

                    return `
                        <div class="${cfg.cssPrefix}-category reveal">
                            <h3 class="${cfg.cssPrefix}-category-title">${escapeHtml(cat.title)}</h3>
                            <div class="${cfg.cssPrefix}-category-lessons">${lesHtml}</div>
                        </div>`;
                }).join('');

                requestAnimationFrame(() => window.initRevealAnimations?.());
            } catch (e) {
                console.error(e);
                showError(overviewContainer, `Could not load ${cfg.label} data. Please check your connection.`, load);
            }
        };
        load();
    }

    /* ---------- Lesson page ---------- */
    const lessonContainer = document.getElementById(cfg.lessonContainerId);
    if (lessonContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const lessonId = urlParams.get('id');

        const loadLesson = async () => {
            if (!lessonId) {
                lessonContainer.innerHTML = '<p class="error-state"><p>Lesson ID missing from the URL.</p></p>';
                return;
            }

            lessonContainer.innerHTML = '<div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text"></div><div class="skeleton skeleton-text short"></div>';

            try {
                let title = '';
                let authorHtml = '';
                let content = '';

                if (lessonId === 'intro') {
                    const snap = await getDoc(doc(db, cfg.intro, 'main'));
                    if (snap.exists()) {
                        const data = snap.data();
                        title = data.title || `${cfg.label} Overview`;
                        content = data.content || '';
                    }
                } else if (urlParams.get('type') === 'unit') {
                    const snap = await getDoc(doc(db, cfg.units, lessonId));
                    if (snap.exists()) {
                        const data = snap.data();
                        title = data.title;
                        authorHtml = data.author ? `<p class="lesson-author">Written By ${escapeHtml(data.author)}</p>` : '';
                        content = data.content || '';
                    }
                } else {
                    const snap = await getDoc(doc(db, cfg.lessons, lessonId));
                    if (snap.exists()) {
                        const data = snap.data();
                        title = data.title;
                        authorHtml = data.author ? `<p class="lesson-author">Written By ${escapeHtml(data.author)}</p>` : '';
                        content = data.content || '';
                    }
                }

                if (!title) {
                    lessonContainer.innerHTML = `
                        <div class="error-state">
                            <p>Content not found.</p>
                            <a class="btn-retry" href="${cfg.overviewHref}">Back to overview</a>
                        </div>`;
                    return;
                }

                document.title = `${title} — Thor's Notes`;
                window.renderBreadcrumb?.([
                    { label: 'Home', href: 'index.html' },
                    { label: cfg.label, href: cfg.overviewHref },
                    { label: title }
                ]);
                lessonContainer.innerHTML = `
                    <nav class="back-nav">
                        <a href="${cfg.overviewHref}" class="back-link">&larr; Back to ${escapeHtml(cfg.label)}</a>
                    </nav>
                    <div class="lesson-header">
                        <h1 class="lesson-main-title">${escapeHtml(title)}</h1>
                        ${authorHtml}
                    </div>
                    <div class="lesson-content">
                        ${content}
                    </div>
                `;
            } catch (e) {
                console.error(e);
                showError(lessonContainer, 'Could not load this lesson. Please check your connection.', loadLesson);
            }
        };
        loadLesson();
    }
}
