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
import {
    lessonLearned, setLessonLearned, recordActivity
} from './progress-store.js';

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
                // Fetch the three levels (+ intro doc) in parallel instead of a waterfall
                const [categories, lessons, units, introSnap] = await Promise.all([
                    fetchAll(cfg.categories),
                    fetchAll(cfg.lessons),
                    fetchAll(cfg.units),
                    getDoc(doc(db, cfg.intro, 'main')).catch(() => null)
                ]);

                if (!categories.length) {
                    overviewContainer.innerHTML = '<p class="empty-state">No content has been published yet.</p>';
                    return;
                }

                // B6 — "Introduction" entry pointing at ?id=intro (lesson page
                // already knows how to render the intro doc)
                const introHtml = (introSnap && introSnap.exists()) ? `
                    <div class="${cfg.cssPrefix}-intro reveal">
                        <h2 class="${cfg.cssPrefix}-intro-title">${escapeHtml(introSnap.data().title || 'Introduction')}</h2>
                        <a href="${cfg.lessonPage}?id=intro" class="${cfg.cssPrefix}-read-more">Read the introduction &rarr;</a>
                    </div>` : '';

                overviewContainer.innerHTML = introHtml + categories.map(cat => {
                    const catLessons = lessons.filter(l => l.categoryId === cat.id);

                    let lesHtml;
                    if (catLessons.length > 0) {
                        lesHtml = catLessons.map(l => {
                            const uniHtml = units.filter(u => u.lessonId === l.id).map(unit => `
                                <a href="${cfg.lessonPage}?id=${encodeURIComponent(unit.id)}&type=unit" class="${cfg.cssPrefix}-lesson-link unit-link"
                                    data-lp-key="${cfg.cssPrefix}:unit:${unit.id}">
                                    <span class="unit-bullet" aria-hidden="true">&bull;</span>
                                    <span class="lesson-title">${escapeHtml(unit.title)}</span>
                                </a>`).join('');

                            return `
                            <div class="${cfg.cssPrefix}-lesson-group">
                                <a href="${cfg.lessonPage}?id=${encodeURIComponent(l.id)}&type=lesson" class="${cfg.cssPrefix}-lesson-link lesson-heading"
                                    data-lp-key="${cfg.cssPrefix}:lesson:${l.id}">
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

                // B5 — put a check mark next to lessons already marked as learned
                overviewContainer.querySelectorAll('[data-lp-key]').forEach(a => {
                    if (!lessonLearned(a.dataset.lpKey)) return;
                    a.insertAdjacentHTML('beforeend', '<span class="lp-done" title="Đã học">&#10003;</span>');
                });

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

                // B5 — stable progress key: prefix:type:id
                const lpType = lessonId === 'intro' ? 'intro'
                    : (urlParams.get('type') === 'unit' ? 'unit' : 'lesson');
                const lpKey = `${cfg.cssPrefix}:${lpType}:${lessonId}`;
                const learned = lessonLearned(lpKey);

                lessonContainer.innerHTML = `
                    <nav class="back-nav">
                        <a href="${cfg.overviewHref}" class="back-link">&larr; Back to ${escapeHtml(cfg.label)}</a>
                    </nav>
                    <div class="lesson-header">
                        <h1 class="lesson-main-title">${escapeHtml(title)}</h1>
                        ${authorHtml}
                        <button type="button" id="lesson-learned-btn" class="lesson-learned-btn${learned ? ' learned' : ''}"
                            aria-pressed="${learned}">
                            ${learned ? '&#10003; Đã học' : '&#9711; Đánh dấu đã học'}
                        </button>
                    </div>
                    <div class="lesson-content">
                        ${content}
                    </div>
                `;

                document.getElementById('lesson-learned-btn')?.addEventListener('click', function () {
                    const nowLearned = !lessonLearned(lpKey);
                    setLessonLearned(lpKey, nowLearned);
                    if (nowLearned) recordActivity(1);
                    this.classList.toggle('learned', nowLearned);
                    this.setAttribute('aria-pressed', String(nowLearned));
                    this.innerHTML = nowLearned ? '&#10003; Đã học' : '&#9711; Đánh dấu đã học';
                });

                enhanceLessonPage();
            } catch (e) {
                console.error(e);
                showError(lessonContainer, 'Could not load this lesson. Please check your connection.', loadLesson);
            }
        };
        loadLesson();
    }
}

/* ---------- Lesson reading kit: progress bar, TOC, font size ---------- */
function enhanceLessonPage() {
    const content = document.querySelector('.lesson-content');
    if (!content) return;

    /* Reading progress bar */
    if (!document.getElementById('reading-progress-bar')) {
        const bar = document.createElement('div');
        bar.id = 'reading-progress-bar';
        bar.innerHTML = '<div class="rp-fill"></div>';
        document.body.appendChild(bar);
    }
    const rpFill = document.querySelector('#reading-progress-bar .rp-fill');
    const onScroll = () => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
        if (rpFill) rpFill.style.width = pct + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Font size controls (persisted) */
    const SCALE_KEY = 'lesson-font-scale';
    let scale = parseFloat(localStorage.getItem(SCALE_KEY) || '1') || 1;
    const applyScale = () => {
        content.style.fontSize = (1.05 * scale).toFixed(2) + 'rem';
    };
    applyScale();
    if (!document.getElementById('lesson-font-controls')) {
        const fc = document.createElement('div');
        fc.id = 'lesson-font-controls';
        fc.setAttribute('role', 'group');
        fc.setAttribute('aria-label', 'Text size');
        fc.innerHTML = `
            <button type="button" data-fs="-" title="Smaller text" aria-label="Smaller text">A&minus;</button>
            <button type="button" data-fs="0" title="Reset text size" aria-label="Reset text size">A</button>
            <button type="button" data-fs="+" title="Larger text" aria-label="Larger text">A+</button>`;
        document.body.appendChild(fc);
        fc.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
            scale = b.dataset.fs === '+' ? Math.min(1.6, scale + 0.1)
                  : b.dataset.fs === '-' ? Math.max(0.8, scale - 0.1)
                  : 1;
            localStorage.setItem(SCALE_KEY, String(scale));
            applyScale();
        }));
    }

    /* Table of contents from h2/h3 */
    const headings = [...content.querySelectorAll('h2, h3')];
    const existingToc = document.getElementById('lesson-toc');
    existingToc?.remove();
    if (headings.length >= 2) {
        headings.forEach((h, i) => { h.id = h.id || `lesson-h-${i}`; });
        const toc = document.createElement('nav');
        toc.id = 'lesson-toc';
        toc.className = 'lesson-toc';
        toc.setAttribute('aria-label', 'Table of contents');
        toc.innerHTML = '<div class="toc-title">On this page</div>' + headings.map(h =>
            `<a href="#${h.id}" class="${h.tagName.toLowerCase()}">${escapeHtml(h.textContent)}</a>`).join('');
        content.prepend(toc);

        const links = [...toc.querySelectorAll('a')];
        const setActive = (id) => links.forEach(a =>
            a.classList.toggle('active', a.getAttribute('href') === '#' + id));
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(en => { if (en.isIntersecting) setActive(en.target.id); });
        }, { rootMargin: '-70px 0px -65% 0px' });
        headings.forEach(h => obs.observe(h));
    }
}
