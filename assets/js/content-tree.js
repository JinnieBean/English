/**
 * content-tree.js — Shared engine for the Grammar & Pronunciation trees.
 * Both sections share identical structure: categories → lessons → units,
 * plus an optional "intro" document rendered by the lesson page.
 *
 * Config shape:
 * {
 *   overviewContainerId, lessonContainerId,      // container ids on each page type
 *   categories, lessons, units, intro,           // Firestore collection names (intro optional)
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
import { lessonCards } from './card-loader.js';
import { cachedLoad } from './idb-cache.js';

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
    const { data: items } = await cachedLoad(`tree:${name}`, async () => {
        const snap = await getDocs(collection(db, name));
        return snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !isDraft(x));
    });
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
                // Fetch the three levels (+ intro doc, when configured) in parallel instead of a waterfall
                const [categories, lessons, units, introSnap] = await Promise.all([
                    fetchAll(cfg.categories),
                    fetchAll(cfg.lessons),
                    fetchAll(cfg.units),
                    cfg.intro ? getDoc(doc(db, cfg.intro, 'main')).catch(() => null) : Promise.resolve(null)
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
                    a.insertAdjacentHTML('beforeend', '<span class="lp-done" title="Learned">&#10003;</span>');
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

            const loadDoc = async (coll, id) => {
                const { data } = await cachedLoad(`doc:${coll}:${id}`, async () => {
                    const s = await getDoc(doc(db, coll, id));
                    return s.exists() ? s.data() : null;
                });
                return data;
            };

            try {
                let title = '';
                let authorHtml = '';
                let content = '';

                if (lessonId === 'intro' && cfg.intro) {
                    const data = await loadDoc(cfg.intro, 'main');
                    if (data) {
                        title = data.title || `${cfg.label} Overview`;
                        content = data.content || '';
                    }
                } else if (urlParams.get('type') === 'unit') {
                    const data = await loadDoc(cfg.units, lessonId);
                    if (data) {
                        title = data.title;
                        authorHtml = data.author ? `<p class="lesson-author">Written By ${escapeHtml(data.author)}</p>` : '';
                        content = data.content || '';
                    }
                } else {
                    const data = await loadDoc(cfg.lessons, lessonId);
                    if (data) {
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
                    <div class="lesson-header">
                        <h1 class="lesson-main-title">${escapeHtml(title)}</h1>
                        ${authorHtml}
                        <button type="button" id="lesson-learned-btn" class="lesson-learned-btn${learned ? ' learned' : ''}"
                            aria-pressed="${learned}">
                            ${learned ? '&#10003; Learned' : '&#9711; Mark as learned'}
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
                    this.innerHTML = nowLearned ? '&#10003; Learned' : '&#9711; Mark as learned';
                });

                // B-flashcards — derive Q/A cards from the lesson headings and
                // offer a flashcard/quiz session (SRS-graded, reviewable).
                if (lpType !== 'intro') {
                    setupLessonStudyTools(
                        lessonContainer.querySelector('.lesson-header'),
                        lessonCards(content, lessonId, `${cfg.cssPrefix}_${lpType}`)
                    );
                }

                enhanceLessonPage();
            } catch (e) {
                console.error(e);
                showError(lessonContainer, 'Could not load this lesson. Please check your connection.', loadLesson);
            }
        };
        loadLesson();
    }
}

/* ---------- Lesson flashcards / quiz (shared overlay from ui.js) ---------- */
function ensureFlashcardOverlay() {
    if (document.getElementById('flashcard-overlay')) return;
    document.body.insertAdjacentHTML('beforeend', `
        <div class="flashcard-overlay" id="flashcard-overlay" aria-hidden="true">
            <div class="flashcard-modal" role="dialog" aria-modal="true" aria-label="Lesson flashcards">
                <button class="flashcard-close" id="flashcard-close" data-fc-action="close" aria-label="Close">&times;</button>
                <div class="flashcard-counter" id="fc-counter" aria-live="polite">1 / 1</div>
                <div class="flashcard-progress-bar">
                    <div class="flashcard-progress-fill" id="fc-progress-fill" style="width:0%"></div>
                </div>
                <div class="flashcard-card" id="flashcard-card-area"></div>
                <div class="flashcard-actions"></div>
            </div>
        </div>`);
}

function hiddenToolBtn(id, cls) {
    let btn = document.getElementById(id);
    if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.id = id;
        btn.className = cls;
        btn.style.display = 'none';
        document.body.appendChild(btn);
    }
    return btn;
}

function setupLessonStudyTools(headerEl, cards) {
    if (!headerEl || cards.length < 2 || !window.initFlashcard) return;

    const fcBtn = document.createElement('button');
    fcBtn.type = 'button';
    fcBtn.className = 'lesson-learned-btn lesson-fc-btn';
    fcBtn.innerHTML = `&#127924; Flashcards (${cards.length})`;
    headerEl.appendChild(fcBtn);
    fcBtn.addEventListener('click', () => {
        ensureFlashcardOverlay();
        const toggle = hiddenToolBtn('flashcard-toggle-btn', 'flashcard-toggle-btn');
        window.initFlashcard(cards, null); // null → per-card SRS grading, no unit badge
        toggle.click();
    });

    if (cards.length >= 4 && window.initQuiz) {
        const qzBtn = document.createElement('button');
        qzBtn.type = 'button';
        qzBtn.className = 'lesson-learned-btn lesson-fc-btn';
        qzBtn.innerHTML = '&#10067; Quiz';
        headerEl.appendChild(qzBtn);
        qzBtn.addEventListener('click', () => {
            const toggle = hiddenToolBtn('quiz-toggle-btn', 'flashcard-toggle-btn');
            window.initQuiz(cards);
            toggle.click();
        });
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
