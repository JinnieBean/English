import { collection, getDocs, getDoc, doc, query, where, getCountFromServer } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-config.js';
import { escapeHtml } from './utils.js';

/* ---------- Shared page helpers ---------- */

const SKELETON_BLOCK = `
    <div class="list-skeleton">
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text short"></div>
    </div>`;

function showSkeleton(container, repeat = 3) {
    container.innerHTML = Array(repeat).fill(SKELETON_BLOCK).join('');
}

function showError(container, message, retryFn) {
    container.innerHTML = `
        <div class="error-state">
            <p>${escapeHtml(message)}</p>
            ${retryFn ? '<button type="button" class="btn-retry">Try again</button>' : ''}
        </div>`;
    const btn = container.querySelector('.btn-retry');
    if (btn && retryFn) btn.addEventListener('click', () => retryFn());
}

function injectSearchBar(listContainer, id, placeholder) {
    const existing = document.getElementById(id);
    if (existing?.closest('.vocab-search-container')) return existing;

    const searchContainer = document.createElement('div');
    searchContainer.className = 'vocab-search-container';
    searchContainer.innerHTML = `
        <input type="search" id="${id}" placeholder="${escapeHtml(placeholder)}"
            aria-label="${escapeHtml(placeholder)}">`;
    listContainer.parentNode.insertBefore(searchContainer, listContainer);
    return searchContainer.querySelector('input');
}

function applyUrlSearchParam(input) {
    if (!input) return null;
    const q = new URLSearchParams(window.location.search).get('q') || '';
    if (q) input.value = q;
    return q.toLowerCase().trim();
}

let _urlSearchTimer;
function syncUrlSearchParam(value) {
    clearTimeout(_urlSearchTimer);
    _urlSearchTimer = setTimeout(() => {
        const url = new URL(window.location);
        if (value) url.searchParams.set('q', value);
        else url.searchParams.delete('q');
        history.replaceState(null, '', url);
    }, 400);
}

/** Standard search-box wiring: full list when empty, filtered otherwise.
 *  Always performs an initial render honouring any ?q= URL parameter. */
function wireSearch(input, allItems, renderFn, matchFn) {
    const run = () => {
        const term = input ? input.value.toLowerCase().trim() : '';
        syncUrlSearchParam(term);
        if (!term) { renderFn(allItems, false); return; }
        renderFn(allItems.filter(item => matchFn(item, term)), true);
    };
    if (input) {
        input.addEventListener('input', run);
    }
    // Initial render (honours any ?q= URL parameter)
    run();
}

const isDraft = (d) => d.status === 'draft';

window.formatStandalonePos = (pos) => {
    if (!pos) return '';
    const clean = pos.trim().replace(/^\(+|\)+$/g, '').toLowerCase();
    return clean ? `(${clean})` : '';
};

window.formatWordWithPos = (word) => {
    if (!word) return '';
    // Look for (v), (n), (adj) etc in the word itself and style it correctly.
    return String(word).replace(/\s*\(?\b(v|n|adj|adv|prep|conj|pron|det)\b\)?\s*$/gi, (match, p1) => {
        return ` <span class="vocab-pos">( ${p1.toLowerCase()} )</span>`;
    });
};

document.addEventListener('DOMContentLoaded', async () => {

    /* Random quote for Homepage */
    const quoteContainer = document.querySelector('.index-quote blockquote');
    if (quoteContainer) {
        const slogans = [
            { text: "The limits of my language mean the limits of my world.", author: "Ludwig Wittgenstein" },
            { text: "To have another language is to possess a second soul.", author: "Charlemagne" },
            { text: "Language is the road map of a culture. It tells you where its people come from and where they are going.", author: "Rita Mae Brown" },
            { text: "Those who know nothing of foreign languages know nothing of their own.", author: "Johann Wolfgang von Goethe" },
            { text: "A different language is a different vision of life.", author: "Federico Fellini" },
            { text: "Learning another language is not only learning different words for the same things, but learning another way to think about things.", author: "Flora Lewis" },
            { text: "One language sets you in a corridor for life. Two languages open every door along the way.", author: "Frank Smith" },
            { text: "With languages, you are at home anywhere.", author: "Edmund de Waal" }
        ];
        const randomSlogan = slogans[Math.floor(Math.random() * slogans.length)];
        quoteContainer.innerHTML = `"${escapeHtml(randomSlogan.text)}"\n                          <cite>— ${escapeHtml(randomSlogan.author)}</cite>`;
    }

    /* Render dynamic Unit Detail Header */
    const headerContainer = document.getElementById('unit-detail-header-container');
    if (headerContainer) {
        const unitId = new URLSearchParams(window.location.search).get('id');
        const titleEl = document.getElementById('unit-detail-title');
        if (unitId && titleEl) {
            try {
                const unitDoc = await getDoc(doc(db, "units", unitId));
                if (unitDoc.exists()) {
                    const unitData = unitDoc.data();
                    titleEl.innerText = unitData.title || '';
                    document.title = `${unitData.title} — Thor's Notes`;

                    // Dynamic breadcrumb: Home › Vocabulary › Unit
                    if (window.renderBreadcrumb) {
                        window.renderBreadcrumb([
                            { label: 'Home', href: 'index.html' },
                            { label: 'Vocabulary', href: unitData.bookId ? `units.html?bookId=${encodeURIComponent(unitData.bookId)}` : 'book.html' },
                            { label: unitData.title || 'Unit' }
                        ]);
                    }
                } else {
                    titleEl.innerText = 'Unit not found';
                }
            } catch (e) {
                console.error("Error loading header details", e);
                titleEl.innerText = 'Error loading unit';
            }
        }
    }

    /* Sidebar toggle lives in ui.js (runs on its own DOMContentLoaded) */

    /* Index Page Stats — count on the server instead of downloading collections */
    const statVocab = document.getElementById('stat-vocab');
    const statUnits = document.getElementById('stat-units');
    const statGrammar = document.getElementById('stat-grammar');
    if (statVocab || statUnits || statGrammar) {
        try {
            const [v, u, g] = await Promise.all([
                getCountFromServer(collection(db, 'vocabularies')),
                getCountFromServer(collection(db, 'units')),
                getCountFromServer(collection(db, 'grammar_lessons'))
            ]);
            if (window.updateIndexStats) window.updateIndexStats(v.data(), u.data(), g.data());
        } catch (e) {
            console.error(e);
            if (statVocab) statVocab.textContent = '–';
            if (statUnits) statUnits.textContent = '–';
            if (statGrammar) statGrammar.textContent = '–';
        }
    }

    /* Books Page */
    const booksListContainer = document.getElementById('books-list-container');
    if (booksListContainer) {
        const loadBooks = async () => {
            showSkeleton(booksListContainer, 2);
            try {
                const booksSnapshot = await getDocs(collection(db, "books"));
                const books = booksSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
                    .filter(b => !isDraft(b));
                books.sort((a, b) => (a.order || 0) - (b.order || 0));

                if (books.length === 0) {
                    booksListContainer.innerHTML = '<p class="empty-state">No books have been created yet.</p>';
                    return;
                }
                booksListContainer.innerHTML = books.map(book => `
                    <div class="book-container reveal">
                        <div class="book-cover">
                            <img src="${escapeHtml(book.image || 'assets/images/book_cover.png')}" alt="Cover of ${escapeHtml(book.title)}" loading="lazy" decoding="async"
                                onerror="this.src='assets/images/book_cover.png'">
                        </div>
                        <div class="book-details">
                            <h2 class="book-title">${escapeHtml(book.title)}</h2>
                            <h3 class="book-subtitle">${escapeHtml(book.subtitle || '')}</h3>
                            <p class="book-desc">${escapeHtml(book.desc || '')}</p>
                            <a href="units.html?bookId=${encodeURIComponent(book.id)}" class="btn-learn-more">Learn More</a>
                        </div>
                    </div>
                `).join('');
                requestAnimationFrame(() => window.initRevealAnimations?.());
            } catch (e) {
                console.error(e);
                showError(booksListContainer, 'Could not load books. Please check your connection.', loadBooks);
            }
        };
        loadBooks();
    }

    /* Units Page */
    const unitsListContainer = document.getElementById('units-list-container');
    if (unitsListContainer) {
        const bookId = new URLSearchParams(window.location.search).get('bookId');

        const loadUnits = async () => {
            showSkeleton(unitsListContainer, 3);
            try {
                if (bookId) {
                    // Fetch only the requested book document instead of the whole collection
                    const bookSnap = await getDoc(doc(db, "books", bookId));
                    const currentBook = bookSnap.exists() ? bookSnap.data() : null;
                    const header = document.querySelector('.course-header');
                    if (header && currentBook) {
                        header.innerHTML = `${escapeHtml(currentBook.title)} ${currentBook.subtitle ? `<br><span style="font-size:0.8em;font-weight:400;">${escapeHtml(currentBook.subtitle)}</span>` : ''}`;
                        document.title = `${currentBook.title} — Thor's Notes`;
                    }
                    if (window.renderBreadcrumb) {
                        window.renderBreadcrumb([
                            { label: 'Home', href: 'index.html' },
                            { label: 'Books', href: 'book.html' },
                            { label: currentBook?.title || 'Units' }
                        ]);
                    }
                }

                // Server-side filter by bookId when available
                const unitsQuery = bookId
                    ? query(collection(db, "units"), where("bookId", "==", bookId))
                    : collection(db, "units");
                const unitsSnapshot = await getDocs(unitsQuery);
                const units = unitsSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
                    .filter(u => !isDraft(u));
                units.sort((a, b) => (a.order || 0) - (b.order || 0));

                if (units.length === 0) {
                    unitsListContainer.innerHTML = '<p class="empty-state">No units have been created for this book yet.</p>';
                    return;
                }

                const sectionMap = [
                    { id: 'vocab', name: 'Vocabulary', url: 'unit_detail.html' },
                    { id: 'phrasal', name: 'Phrasal Verbs', url: 'unit_phrasal.html' },
                    { id: 'prep', name: 'Prepositional Phrases', url: 'unit_prep.html' },
                    { id: 'wordform', name: 'Word Formation', url: 'unit_wordform.html' },
                    { id: 'pattern', name: 'Word Patterns', url: 'unit_pattern.html' },
                    { id: 'lexical', name: 'Lexical Expansion', url: 'unit_lexical.html' }
                ];

                unitsListContainer.innerHTML = units.map(unit => {
                    let sectionsHtml;
                    if (unit.sections && unit.sections.length > 0) {
                        sectionsHtml = sectionMap
                            .filter(sec => unit.sections.includes(sec.id))
                            .map(sec => `<a href="${sec.url}?id=${encodeURIComponent(unit.id)}" class="unit-tab-btn">${sec.name}</a>`)
                            .join('');
                    } else {
                        sectionsHtml = `<a href="unit_detail.html?id=${encodeURIComponent(unit.id)}" class="unit-tab-btn">Vocabulary</a>`;
                    }
                    return `
                        <div class="unit-item reveal" style="flex-direction: column; align-items: flex-start; gap: 1rem;">
                            <span class="unit-name">${escapeHtml(unit.title)}</span>
                            <div style="display: flex; gap: 0.8rem; flex-wrap: wrap;">
                                ${sectionsHtml}
                            </div>
                        </div>`;
                }).join('');

                requestAnimationFrame(() => {
                    if (typeof window.initRevealAnimations === 'function') window.initRevealAnimations();
                    else document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
                });
            } catch (e) {
                console.error(e);
                showError(unitsListContainer, 'Could not load units. Please check your connection.', loadUnits);
            }
        };
        loadUnits();
    }

    /* =========================================================
       Unit Detail Page — Vocabulary (+ flashcards, quiz, CSV)
       ========================================================= */
    const vocabListContainer = document.getElementById('vocab-list-container');
    if (vocabListContainer) {
        const unitId = new URLSearchParams(window.location.search).get('id');
        if (!unitId) {
            showError(vocabListContainer, 'Unit ID missing from the URL.');
        } else {
            const loadVocab = async () => {
                showSkeleton(vocabListContainer, 4);
                try {
                    const vocabSnapshot = await getDocs(
                        query(collection(db, "vocabularies"), where("unitId", "==", unitId))
                    );
                    const vocabs = vocabSnapshot.docs.map(d => ({ id: d.id, ...d.data() }))
                        .filter(v => !isDraft(v));
                    vocabs.sort((a, b) => (a.word || '').localeCompare(b.word || ''));

                    const searchInput = injectSearchBar(vocabListContainer, 'vocab-search-input', 'Search vocabulary…');
                    applyUrlSearchParam(searchInput);

                    // Toolbar: flashcards / quiz / CSV / starred filter / progress badge
                    const toolbar = document.createElement('div');
                    toolbar.className = 'vocab-toolbar reveal visible';
                    toolbar.innerHTML = `
                        <div class="vocab-tools-left">
                            <button type="button" id="flashcard-toggle-btn" class="flashcard-toggle-btn">&#127924; Flashcards</button>
                            <button type="button" id="quiz-toggle-btn" class="flashcard-toggle-btn">&#10067; Quiz</button>
                            <label class="starred-filter"><input type="checkbox" id="starred-only-checkbox"> &#9733; Starred</label>
                        </div>
                        <div class="vocab-tools-right">
                            <span id="progress-badge-${escapeHtml(unitId)}"></span>
                            <button type="button" id="export-csv-btn" class="csv-export-btn" title="Download this unit's words as CSV (Anki friendly)">Export CSV</button>
                        </div>`;
                    const titleEl = document.querySelector('.vocab-section-title');
                    if (titleEl) {
                        titleEl.style.display = 'flex';
                        titleEl.style.alignItems = 'center';
                        titleEl.style.justifyContent = 'space-between';
                        titleEl.style.gap = '1rem';
                        titleEl.appendChild(toolbar);
                    } else {
                        vocabListContainer.parentNode.insertBefore(toolbar, vocabListContainer);
                    }

                    const bookmarksKey = 'vocab-bookmarks';
                    const getBookmarks = () => {
                        try { return JSON.parse(localStorage.getItem(bookmarksKey) || '{}'); }
                        catch { return {}; }
                    };

                    const renderVocabList = (filteredVocabs, searching) => {
                        if (vocabs.length === 0) {
                            vocabListContainer.innerHTML = '<p class="empty-state">This unit has no vocabulary yet.</p>';
                            return;
                        }
                        if (filteredVocabs.length === 0) {
                            vocabListContainer.innerHTML = searching
                                ? '<p class="empty-state">No results match your search.</p>'
                                : '<p class="empty-state">No starred words in this unit yet.</p>';
                            return;
                        }
                        const marks = getBookmarks();
                        vocabListContainer.innerHTML = filteredVocabs.map(v => {
                            const audioHtml = window.buildCustomAudioPlayer
                                ? window.buildCustomAudioPlayer(v.audio, v.word)
                                : (v.audio
                                    ? `<audio controls preload="none" class="vocab-audio-player"><source src="${escapeHtml(v.audio)}" type="audio/mpeg"></audio>`
                                    : '');
                            const starred = !!marks[v.id];
                            return `
                            <div class="vocab-item reveal">
                                <button type="button" class="bookmark-btn ${starred ? 'active' : ''}" data-id="${escapeHtml(v.id)}"
                                    title="${starred ? 'Remove bookmark' : 'Bookmark this word'}" aria-label="Bookmark this word"
                                    aria-pressed="${starred}">${starred ? '&#9733;' : '&#9734;'}</button>
                                <div class="vocab-left">
                                    <div class="vocab-word-group">
                                        <span class="vocab-word">${window.formatWordWithPos(escapeHtml(v.word))}</span>
                                        <span class="vocab-pos">${window.formatStandalonePos(v.pos)}</span>
                                    </div>
                                    <div class="vocab-audio-group">
                                        <span class="vocab-pronunciation">${escapeHtml(v.pron || '')}</span>
                                        ${audioHtml}
                                    </div>
                                </div>
                                <div class="vocab-right">
                                    <p class="vocab-def">${escapeHtml(v.def || '')}</p>
                                    <p class="vocab-example" data-word="${escapeHtml((v.word || '').replace(/\s*\([^)]*\)\s*$/g, '').trim())}">${escapeHtml(v.example || '')}</p>
                                </div>
                            </div>`;
                        }).join('');
                        vocabListContainer.querySelectorAll('.bookmark-btn').forEach(btn => {
                            btn.addEventListener('click', () => {
                                const id = btn.dataset.id;
                                const marks = getBookmarks();
                                const item = vocabs.find(x => x.id === id);
                                if (marks[id]) delete marks[id];
                                else if (item) marks[id] = { word: item.word, def: item.def, example: item.example, pron: item.pron, unitId };
                                localStorage.setItem(bookmarksKey, JSON.stringify(marks));
                                rerender();
                            });
                        });

                        requestAnimationFrame(() => {
                            document.querySelectorAll('.vocab-example[data-word]').forEach(el => {
                                window.highlightWordInExample?.(el, el.dataset.word);
                            });
                            window.initRevealAnimations
                                ? window.initRevealAnimations()
                                : document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
                        });
                    };

                    // Starred-only toggle re-renders using the current search term
                    let starredOnly = false;
                    const rerender = () => {
                        const base = starredOnly ? vocabs.filter(v => getBookmarks()[v.id]) : vocabs;
                        const term = (searchInput?.value || '').toLowerCase().trim();
                        if (!term) return renderVocabList(base, starredOnly);
                        renderVocabList(base.filter(v =>
                            (v.word || '').toLowerCase().includes(term) ||
                            (v.def || '').toLowerCase().includes(term)), true);
                    };

                    document.getElementById('starred-only-checkbox')?.addEventListener('change', (e) => {
                        starredOnly = e.target.checked;
                        rerender();
                    });

                    wireSearch(searchInput, vocabs,
                        (list, searching) => renderVocabList(starredOnly ? list.filter(v => getBookmarks()[v.id]) : list, searching),
                        (v, term) => (v.word || '').toLowerCase().includes(term) || (v.def || '').toLowerCase().includes(term));

                    // Export CSV (Anki-friendly Front/Back)
                    document.getElementById('export-csv-btn')?.addEventListener('click', () => {
                        const rows = [['Front', 'Back', 'Example']];
                        vocabs.forEach(v => rows.push([
                            v.word || '', v.def || '', v.example || ''
                        ]));
                        const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
                        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = 'unit-vocabulary.csv';
                        a.click();
                        URL.revokeObjectURL(a.href);
                    });

                    // Initial render happens inside wireSearch (honours ?q=)

                    // Flashcard overlay + quiz overlay (injected once)
                    if (!document.getElementById('flashcard-overlay')) {
                        document.body.insertAdjacentHTML('beforeend', `
                            <div class="flashcard-overlay" id="flashcard-overlay" aria-hidden="true">
                                <div class="flashcard-modal" role="dialog" aria-modal="true" aria-label="Flashcard practice">
                                    <button class="flashcard-close" id="flashcard-close" data-fc-action="close" aria-label="Close">&times;</button>
                                    <div class="flashcard-counter" id="fc-counter" aria-live="polite">1 / 1</div>
                                    <div class="flashcard-progress-bar">
                                        <div class="flashcard-progress-fill" id="fc-progress-fill" style="width:0%"></div>
                                    </div>
                                    <div class="flashcard-card" id="flashcard-card-area"></div>
                                    <div class="flashcard-actions"></div>
                                </div>
                            </div>
                        `);
                    }
                    if (window.initFlashcard) window.initFlashcard(vocabs, unitId);
                    window.renderProgressBadge?.(unitId, vocabs.length);

                    if (window.initQuiz) window.initQuiz(vocabs);
                } catch (e) {
                    console.error(e);
                    showError(vocabListContainer, 'Could not load vocabulary. Please check your connection.', loadVocab);
                }
            };
            loadVocab();
        }
    }

    /* Generic renderer for the five sibling unit pages */
    setupSimpleList({
        containerId: 'phrasal-list-container',
        collectionName: 'phrasal_verbs',
        searchInputId: 'phrasal-search-input',
        placeholder: 'Search phrasal verbs…',
        emptyMsg: 'This unit has no phrasal verbs yet.',
        sortKey: 'word',
        renderItem: p => `
            <div class="phrasal-item reveal">
                <div class="phrasal-left">
                    <div class="phrasal-word">${escapeHtml(p.word || '')}</div>
                    <div class="phrasal-pron">${escapeHtml(p.pron || '')}</div>
                </div>
                <div class="phrasal-right">
                    <p class="phrasal-def">${escapeHtml(p.def || '')}</p>
                    <p class="phrasal-example">${escapeHtml(p.example || '')}</p>
                </div>
            </div>`
    });

    setupSimpleList({
        containerId: 'prep-list-container',
        collectionName: 'prep_phrases',
        searchInputId: 'prep-search-input',
        placeholder: 'Search prepositional phrases…',
        emptyMsg: 'This unit has no prepositional phrases yet.',
        sortKey: 'word',
        renderItem: p => `
            <div class="phrasal-item reveal">
                <div class="phrasal-left">
                    <div class="phrasal-word">${escapeHtml(p.word || '')}</div>
                </div>
                <div class="phrasal-right">
                    <p class="phrasal-def">${escapeHtml(p.def || '')}</p>
                    <p class="phrasal-example">${escapeHtml(p.example || '')}</p>
                </div>
            </div>`
    });

    setupWfList();

    setupPatternList();

    setupLexicalList();

    /* ---------------- Section implementations ---------------- */

    function setupSimpleList(cfg) {
        const container = document.getElementById(cfg.containerId);
        if (!container) return;
        const unitId = new URLSearchParams(window.location.search).get('id');
        if (!unitId) {
            showError(container, 'Unit ID missing from the URL.');
            return;
        }

        const load = async () => {
            showSkeleton(container, 3);
            try {
                const snap = await getDocs(query(collection(db, cfg.collectionName), where("unitId", "==", unitId)));
                const items = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !isDraft(x));
                items.sort((a, b) => (a[cfg.sortKey] || '').localeCompare(b[cfg.sortKey] || ''));

                const searchInput = injectSearchBar(container, cfg.searchInputId, cfg.placeholder);
                applyUrlSearchParam(searchInput);

                const render = (list, searching) => {
                    if (items.length === 0) {
                        container.innerHTML = `<p class="empty-state">${cfg.emptyMsg}</p>`;
                        return;
                    }
                    if (list.length === 0) {
                        container.innerHTML = '<p class="empty-state">No results match your search.</p>';
                        return;
                    }
                    container.innerHTML = list.map(cfg.renderItem).join('');
                    requestAnimationFrame(() => {
                        window.initRevealAnimations
                            ? window.initRevealAnimations()
                            : document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
                    });
                };

                wireSearch(searchInput, items, render,
                    (item, term) =>
                        (item.word || '').toLowerCase().includes(term) ||
                        (item.def || '').toLowerCase().includes(term));

            } catch (e) {
                console.error(e);
                showError(container, 'Could not load data. Please check your connection.', load);
            }
        };
        load();
    }

    function setupWfList() {
        const container = document.getElementById('wordform-list-container');
        if (!container) return;
        const unitId = new URLSearchParams(window.location.search).get('id');
        if (!unitId) {
            showError(container, 'Unit ID missing from the URL.');
            return;
        }

        const load = async () => {
            showSkeleton(container, 3);
            try {
                const snap = await getDocs(query(collection(db, "word_formations"), where("unitId", "==", unitId)));
                const wordforms = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !isDraft(x));
                wordforms.sort((a, b) => (a.rootWord || '').localeCompare(b.rootWord || ''));

                const searchInput = injectSearchBar(container, 'wf-search-input', 'Search root words…');
                applyUrlSearchParam(searchInput);

                const render = (list, searching) => {
                    if (wordforms.length === 0) {
                        container.innerHTML = '<p class="empty-state">This unit has no word formations yet.</p>';
                        return;
                    }
                    if (list.length === 0) {
                        container.innerHTML = '<p class="empty-state">No results match your search.</p>';
                        return;
                    }
                    container.innerHTML = list.map(w => {
                        const formatPos = (text) => {
                            if (!text) return '';
                            return String(text).replace(/\s*\(?\b(v|n|adj|adv|prep|conj|pron|det)\b\)?/gi, (match, p1) =>
                                ` <span class="vocab-pos">( ${p1.toLowerCase()} )</span>`);
                        };

                        let overviewsHtml = '';
                        if (w.overviews && w.overviews.length > 0) {
                            overviewsHtml = w.overviews.map(o => `
                                <div class="wf-overview-row">
                                    <span class="wf-pos"><span class="vocab-pos">${window.formatStandalonePos(o.pos)}</span></span>
                                    <span class="wf-words">${escapeHtml(o.words)}</span>
                                </div>`).join('');
                        }

                        let formsHtml = '';
                        if (w.forms && w.forms.length > 0) {
                            formsHtml = w.forms.map(f => {
                                let audiosHtml = '';
                                if (f.audios && f.audios.length > 0) {
                                    audiosHtml = f.audios.map(a => {
                                        const audioHtml = window.buildCustomAudioPlayer
                                            ? window.buildCustomAudioPlayer(a.url, a.pron)
                                            : (a.url ? `<audio controls preload="none" src="${escapeHtml(a.url)}"></audio>` : '');
                                        return `
                                            <div class="vocab-audio-group">
                                                <span class="vocab-pronunciation">${escapeHtml(a.pron || '')}</span>
                                                ${audioHtml}
                                            </div>`;
                                    }).join('');
                                }

                                const defsHtml = f.definitions ? f.definitions.split('\n').map(line => `<p class="wf-def-line">${escapeHtml(line)}</p>`).join('') : '';
                                const examplesHtml = f.examples ? f.examples.split('\n').map(line => `<p class="wf-example-line">${escapeHtml(line)}</p>`).join('') : '';

                                return `
                                    <div class="wf-form-block">
                                        <div class="wf-form-left">
                                            <h4 class="wf-form-title">${formatPos(escapeHtml(f.title))}</h4>
                                            ${audiosHtml}
                                        </div>
                                        <div class="wf-form-right">
                                            <div class="wf-form-defs">${defsHtml}</div>
                                            <div class="wf-form-examples">${examplesHtml}</div>
                                        </div>
                                    </div>`;
                            }).join('');
                        }

                        return `
                            <div class="wf-item reveal">
                                <div class="wf-main">
                                    <div class="wf-root">${escapeHtml(w.rootWord || '')}</div>
                                    <div class="wf-overview-list">${overviewsHtml}</div>
                                </div>
                                <button type="button" class="wf-toggle" aria-expanded="false"
                                    aria-label="Toggle word formation details" onclick="window.toggleWf(this)">&#9654;</button>
                                <div class="wf-forms collapsed">${formsHtml}</div>
                            </div>`;
                    }).join('');
                    requestAnimationFrame(() => {
                        window.initRevealAnimations
                            ? window.initRevealAnimations()
                            : document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
                    });
                };

                wireSearch(searchInput, wordforms, render,
                    (w, term) =>
                        (w.rootWord || '').toLowerCase().includes(term) ||
                        (w.forms || []).some(f => (f.title || '').toLowerCase().includes(term)));

            } catch (e) {
                console.error(e);
                showError(container, 'Could not load data. Please check your connection.', load);
            }
        };
        load();
    }

    function setupPatternList() {
        const container = document.getElementById('pattern-list-container');
        if (!container) return;
        const unitId = new URLSearchParams(window.location.search).get('id');
        if (!unitId) {
            showError(container, 'Unit ID missing from the URL.');
            return;
        }

        const load = async () => {
            showSkeleton(container, 3);
            try {
                const snap = await getDocs(query(collection(db, "word_patterns"), where("unitId", "==", unitId)));
                const patterns = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !isDraft(x));
                patterns.sort((a, b) => (a.word || '').localeCompare(b.word || ''));

                const searchInput = injectSearchBar(container, 'pattern-search-input', 'Search word patterns…');
                applyUrlSearchParam(searchInput);

                const render = (list, searching) => {
                    if (patterns.length === 0) {
                        container.innerHTML = '<p class="empty-state">This unit has no word patterns yet.</p>';
                        return;
                    }
                    if (list.length === 0) {
                        container.innerHTML = '<p class="empty-state">No results match your search.</p>';
                        return;
                    }
                    container.innerHTML = list.map(p => `
                        <div class="phrasal-item reveal">
                            <div class="phrasal-left pattern-left" style="flex-direction: column; align-items: flex-start;">
                                <div class="vocab-word-group" style="margin-bottom: 1rem; align-items: baseline; flex-wrap: nowrap; white-space: nowrap;">
                                    <span class="phrasal-word">${window.formatWordWithPos(escapeHtml(p.word))}</span>
                                    <span class="vocab-pos">${window.formatStandalonePos(p.pos)}</span>
                                </div>
                                <div style="font-size: 1.3rem; color: var(--text-primary); font-weight: normal; font-style: italic;">${escapeHtml(p.pattern || '').replace(/\n/g, '<br>')}</div>
                            </div>
                            <div class="phrasal-right">
                                <p class="phrasal-def">${escapeHtml(p.def || '')}</p>
                                <p class="phrasal-example">${escapeHtml(p.example || '')}</p>
                            </div>
                        </div>`).join('');
                    requestAnimationFrame(() => {
                        window.initRevealAnimations
                            ? window.initRevealAnimations()
                            : document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
                    });
                };

                wireSearch(searchInput, patterns, render,
                    (p, term) =>
                        (p.word || '').toLowerCase().includes(term) ||
                        (p.pattern || '').toLowerCase().includes(term) ||
                        (p.def || '').toLowerCase().includes(term));

            } catch (e) {
                console.error(e);
                showError(container, 'Could not load data. Please check your connection.', load);
            }
        };
        load();
    }

    function setupLexicalList() {
        const container = document.getElementById('lexical-list-container');
        if (!container) return;
        const unitId = new URLSearchParams(window.location.search).get('id');
        if (!unitId) {
            showError(container, 'Unit ID missing from the URL.');
            return;
        }

        const load = async () => {
            showSkeleton(container, 3);
            try {
                const snap = await getDocs(query(collection(db, "lexical_expansions"), where("unitId", "==", unitId)));
                const lexicals = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => !isDraft(x));

                const searchInput = injectSearchBar(container, 'lexical-search-input', 'Search lexical expansions…');
                applyUrlSearchParam(searchInput);

                const normalizeSearch = (s) => (s || '')
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/đ/g, 'd');

                const render = (list, searching) => {
                    if (lexicals.length === 0) {
                        container.innerHTML = '<p class="empty-state">This unit has no lexical expansion yet.</p>';
                        return;
                    }
                    if (list.length === 0) {
                        container.innerHTML = '<p class="empty-state">No results match your search.</p>';
                        return;
                    }
                    container.innerHTML = list.map(lex => {
                        const alignLeft = ['left', 'right', 'center'].includes(lex.alignLeft) ? lex.alignLeft : 'left';
                        const alignRight = ['left', 'right', 'center'].includes(lex.alignRight) ? lex.alignRight : 'left';
                        const textLeftHtml = lex.textLeft ? `<div style="flex: 1; white-space: pre-wrap; font-family: inherit; font-size: 1.6rem; text-align: ${alignLeft};">${escapeHtml(lex.textLeft)}</div>` : '';
                        const textRightHtml = lex.textRight ? `<div style="flex: 1; white-space: pre-wrap; font-family: inherit; font-size: 1.6rem; text-align: ${alignRight};">${escapeHtml(lex.textRight)}</div>` : '';

                        const topSectionHtml = (textLeftHtml || textRightHtml) ? `
                            <div class="lex-top-section">
                                ${textLeftHtml}
                                ${textRightHtml}
                            </div>` : '';

                        let wordsHtml = '';
                        if (lex.words && lex.words.length > 0) {
                            wordsHtml = lex.words.map(w => `
                                <div class="vocab-item reveal">
                                    <div class="vocab-left">
                                        <div class="vocab-word-group">
                                            <span class="vocab-word">${window.formatWordWithPos(escapeHtml(w.word))}</span>
                                            <span class="vocab-pos">${window.formatStandalonePos(w.pos)}</span>
                                        </div>
                                        <div style="margin-top: 0.5rem;">
                                            <span class="vocab-pronunciation" style="white-space: pre-wrap; line-height: 1.6; font-style: italic; font-weight: normal;">${escapeHtml(w.pron || '')}</span>
                                        </div>
                                    </div>
                                    <div class="vocab-right">
                                        <p class="vocab-def">${escapeHtml(w.def || '')}</p>
                                        <p class="vocab-example">${escapeHtml(w.example || '')}</p>
                                    </div>
                                </div>`).join('');
                        }

                        return `
                            <div class="wf-item reveal" style="margin-bottom: 3rem; width: 100%;">
                                ${topSectionHtml}
                                <button type="button" class="wf-toggle" aria-expanded="false"
                                    aria-label="Toggle lexical expansion details" onclick="window.toggleWf(this)">&#9654;</button>
                                <div class="wf-forms collapsed">
                                    <div style="display: flex; flex-direction: column; gap: 3rem; width: 100%;">
                                        ${wordsHtml}
                                    </div>
                                </div>
                            </div>`;
                    }).join('');
                    requestAnimationFrame(() => {
                        window.initRevealAnimations
                            ? window.initRevealAnimations()
                            : document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
                    });
                };

                if (!searchInput) render(lexicals, false);
                if (searchInput) {
                    const runSearch = () => {
                        const term = normalizeSearch(searchInput.value.trim());
                        syncUrlSearchParam(term);
                        if (!term) return render(lexicals, false);

                        const ranked = [];
                        lexicals.forEach(lex => {
                            let score = 0;
                            const texts = [normalizeSearch(lex.textLeft), normalizeSearch(lex.textRight)];
                            (lex.words || []).forEach(w => {
                                const word = normalizeSearch(w.word).replace(/\(.*?\)/g, '').trim();
                                if (word.startsWith(term)) score = Math.max(score, 100);
                                else if (word.includes(term)) score = Math.max(score, 80);
                                else if (texts.some(t => t.includes(term))) score = Math.max(score, 60);
                                else if (normalizeSearch(w.def).includes(term) || normalizeSearch(w.pron).includes(term)) score = Math.max(score, 40);
                            });
                            if (!score && texts.some(t => t.includes(term))) score = 60;
                            if (score) ranked.push({ score, lex });
                        });

                        ranked.sort((a, b) => b.score - a.score);
                        render(ranked.map(r => r.lex), true);
                    };
                    searchInput.addEventListener('input', runSearch);
                    // Always render once on load (honours any ?q= URL parameter)
                    runSearch();
                }
            } catch (e) {
                console.error(e);
                showError(container, 'Could not load data. Please check your connection.', load);
            }
        };
        load();
    }
});

/* Accessible word-formation expander: pass the button itself. */
window.toggleWf = function (btn) {
    const forms = btn.nextElementSibling;
    if (!forms) return;
    const collapsed = forms.classList.toggle('collapsed');
    btn.setAttribute('aria-expanded', String(!collapsed));
    btn.innerHTML = collapsed ? '&#9654;' : '&#9660;';
};
