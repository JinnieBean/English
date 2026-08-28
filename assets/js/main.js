<<<<<<< HEAD
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Use shared config
const firebaseConfig = {
    apiKey: "AIzaSyBiGp-ZZD0Yq-Tok2aAOwVbxXMmq7eRZuM",
    authDomain: "english-study-68459.firebaseapp.com",
    projectId: "english-study-68459",
    storageBucket: "english-study-68459.firebasestorage.app",
    messagingSenderId: "1048895043926",
    appId: "1:1048895043926:web:06c3c04a722e2f3f647ef7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.formatStandalonePos = (pos) => {
    if (!pos) return '';
    const clean = pos.trim().replace(/^\(+|\)+$/g, '').toLowerCase();
    return clean ? `(${clean})` : '';
};

window.formatWordWithPos = (word) => {
    if (!word) return '';
    // Look for (v), (n), (adj) etc in the word itself and style it correctly.
    // The regex matches optional parens around the POS
    return word.replace(/\s*\(?\b(v|n|adj|adv|prep|conj|pron|det)\b\)?\s*$/gi, (match, p1) => {
        return ` <span class="vocab-pos" style="font-weight: 400; font-size: 1.2rem; color: var(--text-secondary);">(${p1.toLowerCase()})</span>`;
    });
};

document.addEventListener('DOMContentLoaded', async () => {
    
    // Random Slogans for Homepage
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
        quoteContainer.innerHTML = `"${randomSlogan.text}"\n                          <cite>— ${randomSlogan.author}</cite>`;
    }
    
    // Render dynamic Unit Detail Header (Book Title, Unit Title, Tab Menu)
    const headerContainer = document.getElementById('unit-detail-header-container');
    if (headerContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const unitId = urlParams.get('id');
        if (unitId) {
            try {
                // Fetch Unit
                const unitDoc = await getDoc(doc(db, "units", unitId));
                if (unitDoc.exists()) {
                    const unitData = unitDoc.data();
                    document.getElementById('unit-detail-title').innerText = unitData.title;
                    
                    // Fetch Book title not needed as per user request

                    // Render Tabs not needed as per user request
                }
            } catch(e) {
                console.error("Error loading header details", e);
            }
        }
    }

    // Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebar-toggle-expanded');
    const sidebarBrandContainer = document.querySelector('.sidebar-brand-container');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebar) {
        // Apply collapsed class immediately (no-transition to avoid flash)
        // The html.sidebar-will-collapse CSS pre-collapses via inline script in <head>
        if (localStorage.getItem('sidebar-collapsed') === 'true') {
            sidebar.classList.add('collapsed', 'no-transition');
        }
        // Remove the pre-collapse class from <html> and re-enable transitions
        document.documentElement.classList.remove('sidebar-will-collapse');
        setTimeout(() => {
            sidebar.classList.remove('no-transition');
        }, 50);

        const toggleSidebar = () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
        };

        if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
        
        // When sidebar is collapsed, clicking the logo area expands it
        if (sidebarBrandContainer) {
            sidebarBrandContainer.addEventListener('click', (e) => {
                if (sidebar.classList.contains('collapsed')) {
                    e.preventDefault();
                    toggleSidebar();
                }
            });
        }
    }

    // Mobile Sidebar Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
        
        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && sidebar.classList.contains('mobile-open')) {
                if (!sidebar.contains(e.target) && e.target !== mobileMenuBtn) {
                    sidebar.classList.remove('mobile-open');
                }
            }
        });
    }

    // Index Page Stats (#8)
    const statVocab = document.getElementById('stat-vocab');
    const statUnits = document.getElementById('stat-units');
    const statGrammar = document.getElementById('stat-grammar');
    if (statVocab || statUnits || statGrammar) {
        try {
            const [vocabSnap, unitsSnap, grammarSnap] = await Promise.all([
                getDocs(collection(db, 'vocabularies')),
                getDocs(collection(db, 'units')),
                getDocs(collection(db, 'grammar_lessons'))
            ]);
            if (window.updateIndexStats) {
                window.updateIndexStats(vocabSnap.size, unitsSnap.size, grammarSnap.size);
            }
        } catch(e) {
            // Stats non-critical, fail silently
            if (statVocab) statVocab.textContent = '–';
            if (statUnits) statUnits.textContent = '–';
            if (statGrammar) statGrammar.textContent = '–';
        }
    }

    // Books Page: Load Books list
    const booksListContainer = document.getElementById('books-list-container');
    if (booksListContainer) {
        booksListContainer.innerHTML = '<p style="padding: 1rem 0;">Loading books...</p>';

        try {
            const booksSnapshot = await getDocs(collection(db, "books"));
            let books = booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            books.sort((a,b) => (a.order||0) - (b.order||0));
            
            booksListContainer.innerHTML = '';
            
            if(books.length === 0) {
                booksListContainer.innerHTML = '<p style="padding: 1rem 0;">No books have been created yet.</p>';
            } else {
                let booksHtml = '';
                  books.forEach(book => {
                      booksHtml += `
                          <div class="book-container reveal">
                              <div class="book-cover">
                                <img src="${book.image || 'assets/images/book_cover.png'}" alt="${book.title}" loading="lazy" decoding="async">
                            </div>
                            <div class="book-details">
                                <h1 class="book-title">${book.title}</h1>
                                <h2 class="book-subtitle">${book.subtitle || ''}</h2>
                                <p class="book-desc">${book.desc || ''}</p>
                                <a href="units.html?bookId=${book.id}" class="btn-learn-more">Learn More</a>
                            </div>
                        </div>
                    `;
                  });
                  booksListContainer.innerHTML = booksHtml;
                  if (window.initRevealAnimations) requestAnimationFrame(() => window.initRevealAnimations());
              }
        } catch(e) {
            console.error(e);
            booksListContainer.innerHTML = '<p style="color: red; padding: 1rem 0;">Error loading data.</p>';
        }
    }

    // Units Page: Load Units list
    const unitsListContainer = document.getElementById('units-list-container');
    if (unitsListContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const bookId = urlParams.get('bookId');
        
        unitsListContainer.innerHTML = '<p style="padding: 1rem 0;">Loading data...</p>';
        try {
            if (bookId) {
                const bookDoc = await getDocs(collection(db, "books"));
                const currentBook = bookDoc.docs.find(d => d.id === bookId)?.data();
                if (currentBook) {
                    const header = document.querySelector('.course-header');
                    if (header) header.innerHTML = `${currentBook.title} ${currentBook.subtitle ? `<br><span style="font-size:0.8em;font-weight:400;">${currentBook.subtitle}</span>` : ''}`;
                }
            }

            const unitsSnapshot = await getDocs(collection(db, "units"));
            let units = unitsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            if (bookId) {
                units = units.filter(u => u.bookId === bookId);
            }
            units.sort((a,b) => (a.order||0) - (b.order||0)); // Sort by order
            
            unitsListContainer.innerHTML = '';

            if(units.length === 0) {
                unitsListContainer.innerHTML = '<p style="padding: 1rem 0;">No units have been created for this book yet.</p>';
            } else {
                let unitsHtml = '';
                units.forEach(unit => {
                    let sectionsHtml = '';
                    if (unit.sections && unit.sections.length > 0) {
                        const sectionMap = [
                            { id: 'vocab', name: 'Vocabulary', url: 'unit_detail.html' },
                            { id: 'phrasal', name: 'Phrasal Verbs', url: 'unit_phrasal.html' },
                            { id: 'prep', name: 'Prepositional Phrases', url: 'unit_prep.html' },
                            { id: 'wordform', name: 'Word Formation', url: 'unit_wordform.html' },
                            { id: 'pattern', name: 'Word Patterns', url: 'unit_pattern.html' },
                            { id: 'lexical', name: 'Lexical Expansion', url: 'unit_lexical.html' }
                        ];

                        sectionMap.forEach(sec => {
                            if (unit.sections.includes(sec.id)) {
                                sectionsHtml += `<a href="${sec.url}?id=${unit.id}" class="unit-tab-btn">${sec.name}</a>`;
                            }
                        });
                    } else {
                        sectionsHtml = `<a href="unit_detail.html?id=${unit.id}" class="unit-tab-btn">Vocabulary</a>`;
                    }

                    unitsHtml += `
                        <div class="unit-item reveal" style="flex-direction: column; align-items: flex-start; gap: 1rem;">
                            <span class="unit-name">${unit.title}</span>
                            <div style="display: flex; gap: 0.8rem; flex-wrap: wrap;">
                                ${sectionsHtml}
                            </div>
                        </div>
                    `;
                });
                unitsListContainer.innerHTML = unitsHtml;

                // Re-init reveal animations after dynamic content
                requestAnimationFrame(() => {
                    if (typeof window.initRevealAnimations === 'function') window.initRevealAnimations();
                    else document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
                });
            }
        } catch(e) {
            console.error(e);
            unitsListContainer.innerHTML = '<p style="color: red; padding: 1rem 0;">Error loading data.</p>';
        }
    }
    
    // Unit Detail Page: Load vocabulary list for the unit
    const vocabListContainer = document.getElementById('vocab-list-container');
    if (vocabListContainer) {
        // Get unit ID from URL (e.g. unit_detail.html?id=xxx)
        const urlParams = new URLSearchParams(window.location.search);
        const unitId = urlParams.get('id');
        
        if (!unitId) {
            vocabListContainer.innerHTML = '<p style="color: red;">Unit ID not found.</p>';
            return;
        }

        vocabListContainer.innerHTML = '<p>Loading vocabulary...</p>';
        
        try {
            // Load vocabulary list
            const vocabSnapshot = await getDocs(collection(db, "vocabularies"));
            let vocabs = vocabSnapshot.docs
                            .map(doc => ({ id: doc.id, ...doc.data() }))
                            .filter(v => v.unitId === unitId); // Filter words belonging to this Unit
            
            vocabs.sort((a, b) => a.word.localeCompare(b.word));
            
            vocabListContainer.innerHTML = '';

            // Inject Search Bar (#15)
            const searchContainer = document.createElement('div');
            searchContainer.className = 'vocab-search-container';
            searchContainer.style.marginBottom = '1.5rem';
            searchContainer.innerHTML = `
                <input type="text" id="vocab-search-input" placeholder="Search vocabulary..." 
                    style="width: 100%; padding: 0.8rem 1.2rem; border-radius: 30px; border: 1px solid var(--line-color); 
                    background: var(--card-bg); color: var(--text-primary); font-family: var(--font-body); 
                    outline: none; transition: border-color 0.2s; box-shadow: var(--shadow-sm);">
            `;
            vocabListContainer.parentNode.insertBefore(searchContainer, vocabListContainer);

            const renderVocabList = (filteredVocabs) => {
                if(filteredVocabs.length === 0) {
                    vocabListContainer.innerHTML = '<p>No vocabulary found.</p>';
                    return;
                }
                
                let vocabHtml = '';
                filteredVocabs.forEach(v => {
                    // Build audio: use custom player (#13) if available
                    const audioHtml = window.buildCustomAudioPlayer
                        ? window.buildCustomAudioPlayer(v.audio)
                        : (v.audio
                            ? `<audio controls preload="none" class="vocab-audio-player"><source src="${v.audio}" type="audio/mpeg"></audio>`
                            : `<span style="font-size: 0.8rem; color: #888; font-style: italic;">No audio</span>`);

                    vocabHtml += `
                        <div class="vocab-item reveal">
                            <div class="vocab-left">
                                <div class="vocab-word-group">
                                    <span class="vocab-word">${window.formatWordWithPos(v.word)}</span>
                                    <span class="vocab-pos">${window.formatStandalonePos(v.pos)}</span>
                                </div>
                                <div class="vocab-audio-group">
                                    <span class="vocab-pronunciation">${v.pron}</span>
                                    ${audioHtml}
                                </div>
                            </div>
                            <div class="vocab-right">
                                <p class="vocab-def">${v.def}</p>
                                <p class="vocab-example" data-word="${(v.word||'').replace(/\s*\([^)]*\)\s*$/g,'').trim()}">${v.example}</p>
                            </div>
                        </div>
                    `;
                });
                vocabListContainer.innerHTML = vocabHtml;

                // After render: apply highlight + reveal animations (#9, #14)
                requestAnimationFrame(() => {
                    document.querySelectorAll('.vocab-example[data-word]').forEach(el => {
                        if (window.highlightWordInExample) {
                            window.highlightWordInExample(el, el.dataset.word);
                        }
                    });
                    // Re-init reveal for dynamically added elements
                    if (window.initRevealAnimations) window.initRevealAnimations();
                    else document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
                });
            };

            // Initial render
            renderVocabList(vocabs);

            // Search filtering
            const searchInput = document.getElementById('vocab-search-input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const term = e.target.value.toLowerCase().trim();
                    if (!term) {
                        renderVocabList(vocabs);
                        return;
                    }
                    const filtered = vocabs.filter(v => 
                        (v.word || '').toLowerCase().includes(term) || 
                        (v.def || '').toLowerCase().includes(term)
                    );
                    renderVocabList(filtered);
                });
            }

                // Inject flashcard button (#10)
                const flashcardBtn = document.createElement('button');
                flashcardBtn.id = 'flashcard-toggle-btn';
                flashcardBtn.className = 'flashcard-toggle-btn';
                flashcardBtn.innerHTML = '🃏 Flashcard Practice';
                const titleEl = document.querySelector('.vocab-section-title');
                if (titleEl) {
                    titleEl.style.display = 'flex';
                    titleEl.style.alignItems = 'center';
                    titleEl.style.gap = '1rem';
                    titleEl.appendChild(flashcardBtn);
                }

                // Flashcard overlay HTML (injected once)
                if (!document.getElementById('flashcard-overlay')) {
                    document.body.insertAdjacentHTML('beforeend', `
                        <div class="flashcard-overlay" id="flashcard-overlay">
                            <div class="flashcard-modal">
                                <button class="flashcard-close" id="flashcard-close" aria-label="Close">&times;</button>
                                <div class="flashcard-counter" id="fc-counter">1 / 1</div>
                                <div class="flashcard-progress-bar">
                                    <div class="flashcard-progress-fill" id="fc-progress-fill" style="width:0%"></div>
                                </div>
                                <div class="flashcard-card" id="flashcard-card-area"></div>
                                <div class="flashcard-actions">
                                    <button class="fc-btn fc-btn-prev" id="fc-prev">← Prev</button>
                                    <button class="fc-btn fc-btn-next" id="fc-next">Next →</button>
                                </div>
                            </div>
                        </div>
                    `);
                }

                if (window.initFlashcard) window.initFlashcard(vocabs);
        } catch(e) {
            console.error(e);
            vocabListContainer.innerHTML = '<p style="color: red;">Error loading vocabulary.</p>';
        }
    }

    // Unit Phrasal Page: Load Phrasal verbs list
    const phrasalListContainer = document.getElementById('phrasal-list-container');
    if (phrasalListContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const unitId = urlParams.get('id');
        
        if (!unitId) {
            phrasalListContainer.innerHTML = '<p style="color: red;">Unit ID not found.</p>';
            return;
        }

        phrasalListContainer.innerHTML = '<p>Loading data...</p>';
        
        try {
            const phrasalSnapshot = await getDocs(collection(db, "phrasal_verbs"));
            let phrasals = phrasalSnapshot.docs
                            .map(doc => ({ id: doc.id, ...doc.data() }))
                            .filter(p => p.unitId === unitId);
                            
            phrasals.sort((a, b) => a.word.localeCompare(b.word));
            
                        // Inject search bar
            const searchContainer = document.createElement('div');
            searchContainer.className = 'vocab-search-container';
            searchContainer.style.marginBottom = '1.5rem';
            searchContainer.innerHTML = `<input type="text" id="phrasal-search-input" placeholder="Search phrasal verbs..." style="width: 100%; padding: 0.8rem 1.2rem; border-radius: 30px; border: 1px solid var(--line-color); background: var(--card-bg); color: var(--text-primary); font-family: var(--font-body); outline: none; transition: border-color 0.2s; box-shadow: var(--shadow-sm);">`;
            phrasalListContainer.parentNode.insertBefore(searchContainer, phrasalListContainer);

            const renderPhrasalList = (filteredList) => {
phrasalListContainer.innerHTML = '';
            if(filteredList.length === 0) { phrasalListContainer.innerHTML = '<p>No phrasal verbs found.</p>'; return; }
            
            if(phrasals.length === 0) {
                phrasalListContainer.innerHTML = '<p>This unit has no phrasal verbs yet.</p>';
            }

            filteredList.forEach(p => {
                phrasalListContainer.innerHTML += `
                    <div class="phrasal-item reveal">
                        <div class="phrasal-left">
                            <div class="phrasal-word">${p.word}</div>
                            <div class="phrasal-pron">${p.pron}</div>
                        </div>
                        <div class="phrasal-right">
                            <p class="phrasal-def">${p.def}</p>
                            <p class="phrasal-example">${p.example}</p>
                        </div>
                    </div>
                `;
            });

                if (window.initRevealAnimations) requestAnimationFrame(() => window.initRevealAnimations());
            };

            renderPhrasalList(phrasals);

            const searchInput = document.getElementById('phrasal-search-input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const term = e.target.value.toLowerCase().trim();
                    if (!term) return renderPhrasalList(phrasals);
                    const filtered = phrasals.filter(p => 
                        (p.word || '').toLowerCase().includes(term) || 
                        (p.def || '').toLowerCase().includes(term)
                    );
                    renderPhrasalList(filtered);
                });
            }
        } catch(e) {
            console.error(e);
            phrasalListContainer.innerHTML = '<p style="color: red;">Error loading data.</p>';
        }
    }

    // Unit Prep Page: Load Prepositional phrases list
    const prepListContainer = document.getElementById('prep-list-container');
    if (prepListContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const unitId = urlParams.get('id');
        
        if (!unitId) {
            prepListContainer.innerHTML = '<p style="color: red;">Unit ID not found.</p>';
            return;
        }

        prepListContainer.innerHTML = '<p>Loading data...</p>';
        
        try {
            const prepSnapshot = await getDocs(collection(db, "prep_phrases"));
            let preps = prepSnapshot.docs
                            .map(doc => ({ id: doc.id, ...doc.data() }))
                            .filter(p => p.unitId === unitId);
                            
            preps.sort((a, b) => a.word.localeCompare(b.word));
            
                        // Inject search bar
            const searchContainer = document.createElement('div');
            searchContainer.className = 'vocab-search-container';
            searchContainer.style.marginBottom = '1.5rem';
            searchContainer.innerHTML = `<input type="text" id="prep-search-input" placeholder="Search prepositional phrases..." style="width: 100%; padding: 0.8rem 1.2rem; border-radius: 30px; border: 1px solid var(--line-color); background: var(--card-bg); color: var(--text-primary); font-family: var(--font-body); outline: none; transition: border-color 0.2s; box-shadow: var(--shadow-sm);">`;
            prepListContainer.parentNode.insertBefore(searchContainer, prepListContainer);

            const renderPrepList = (filteredList) => {
prepListContainer.innerHTML = '';
            if(filteredList.length === 0) { prepListContainer.innerHTML = '<p>No prepositional phrases found.</p>'; return; }
            
            if(preps.length === 0) {
                prepListContainer.innerHTML = '<p>This unit has no prepositional phrases yet.</p>';
            }

            filteredList.forEach(p => {
                prepListContainer.innerHTML += `
                    <div class="phrasal-item reveal">
                        <div class="phrasal-left">
                            <div class="phrasal-word">${p.word}</div>
                        </div>
                        <div class="phrasal-right">
                            <p class="phrasal-def">${p.def}</p>
                            <p class="phrasal-example">${p.example}</p>
                        </div>
                    </div>
                `;
            });

                if (window.initRevealAnimations) requestAnimationFrame(() => window.initRevealAnimations());
            };

            renderPrepList(preps);

            const searchInput = document.getElementById('prep-search-input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const term = e.target.value.toLowerCase().trim();
                    if (!term) return renderPrepList(preps);
                    const filtered = preps.filter(p => 
                        (p.word || '').toLowerCase().includes(term) || 
                        (p.def || '').toLowerCase().includes(term)
                    );
                    renderPrepList(filtered);
                });
            }
        } catch(e) {
            console.error(e);
            prepListContainer.innerHTML = '<p style="color: red;">Error loading data.</p>';
        }
    }

    // Trang Unit Word Formation
    const wfListContainer = document.getElementById('wordform-list-container');
    if (wfListContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const unitId = urlParams.get('id');
        
        if (!unitId) {
            wfListContainer.innerHTML = '<p style="color: red;">Unit ID not found.</p>';
            return;
        }

        wfListContainer.innerHTML = '<p>Loading data...</p>';
        
        try {
            const wfSnapshot = await getDocs(collection(db, "word_formations"));
            let wordforms = wfSnapshot.docs
                            .map(doc => ({ id: doc.id, ...doc.data() }))
                            .filter(w => w.unitId === unitId);
                            
            wordforms.sort((a, b) => (a.rootWord || '').localeCompare(b.rootWord || ''));
            
                        // Inject search bar
            const searchContainer = document.createElement('div');
            searchContainer.className = 'vocab-search-container';
            searchContainer.style.marginBottom = '1.5rem';
            searchContainer.innerHTML = `<input type="text" id="wf-search-input" placeholder="Search root words..." style="width: 100%; padding: 0.8rem 1.2rem; border-radius: 30px; border: 1px solid var(--line-color); background: var(--card-bg); color: var(--text-primary); font-family: var(--font-body); outline: none; transition: border-color 0.2s; box-shadow: var(--shadow-sm);">`;
            wfListContainer.parentNode.insertBefore(searchContainer, wfListContainer);

            const renderWfList = (filteredList) => {
wfListContainer.innerHTML = '';
            if(filteredList.length === 0) { wfListContainer.innerHTML = '<p>No word formations found.</p>'; return; }
            
            if(wordforms.length === 0) {
                wfListContainer.innerHTML = '<p>This unit has no word formations yet.</p>';
            }

            filteredList.forEach(w => {
                const formatPos = (text) => {
                    if(!text) return '';
                    return text.replace(/\s*\(?\b(v|n|adj|adv|prep|conj|pron|det)\b\)?/gi, (match, p1) => {
                        return ` <span class="vocab-pos" style="font-weight: 400; font-size: 1.2rem; color: var(--text-secondary);">(${p1.toLowerCase()})</span>`;
                    });
                };
                
                let overviewsHtml = '';
                if(w.overviews && w.overviews.length > 0) {
                    w.overviews.forEach(o => {
                        overviewsHtml += `
                            <div class="wf-overview-row">
                                <span class="wf-pos"><span class="vocab-pos">${window.formatStandalonePos(o.pos)}</span></span>
                                <span class="wf-words">${o.words}</span>
                            </div>
                        `;
                    });
                }
                
                let formsHtml = '';
                if(w.forms && w.forms.length > 0) {
                    w.forms.forEach(f => {
                        let audiosHtml = '';
                        if(f.audios && f.audios.length > 0) {
                            f.audios.forEach(a => {
                                audiosHtml += `
                                    <div class="wf-audio-wrapper">
                                        <span class="wf-audio-pron">${a.pron}</span>
                                        <audio controls preload="none" src="${a.url}"></audio>
                                    </div>
                                `;
                            });
                        }
                        
                        let defsHtml = f.definitions ? f.definitions.split('\\n').map(line => `<p class="wf-def-line">${line}</p>`).join('') : '';
                        let examplesHtml = f.examples ? f.examples.split('\\n').map(line => `<p class="wf-example-line">${line}</p>`).join('') : '';

                        formsHtml += `
                            <div class="wf-form-block">
                                <div class="wf-form-left">
                                    <h4 class="wf-form-title">${formatPos(f.title)}</h4>
                                    ${audiosHtml}
                                </div>
                                <div class="wf-form-right">
                                    <div class="wf-form-defs">
                                        ${defsHtml}
                                    </div>
                                    <div class="wf-form-examples">
                                        ${examplesHtml}
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                }
                wfListContainer.innerHTML += `
                    <div class="wf-item reveal">
                        <div class="wf-main">
                            <div class="wf-root">${w.rootWord}</div>
                            <div class="wf-overview-list">
                                ${overviewsHtml}
                            </div>
                        </div>
                        <div class="wf-toggle" id="wf-toggle-${w.id}" onclick="window.toggleWf('${w.id}')">▶</div>
                        <div class="wf-forms collapsed" id="wf-forms-${w.id}">
                            ${formsHtml}
                        </div>
                    </div>
                `;
            });

                if (window.initRevealAnimations) requestAnimationFrame(() => window.initRevealAnimations());
            };

            renderWfList(wordforms);

            const searchInput = document.getElementById('wf-search-input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const term = e.target.value.toLowerCase().trim();
                    if (!term) return renderWfList(wordforms);
                    const filtered = wordforms.filter(w => 
                        (w.rootWord || '').toLowerCase().includes(term) || 
                        (w.forms || []).some(f => (f.title || '').toLowerCase().includes(term))
                    );
                    renderWfList(filtered);
                });
            }
        } catch(e) {
            console.error(e);
            wfListContainer.innerHTML = '<p style="color: red;">Error loading data.</p>';
        }
    }

    // Unit Pattern Page: Load Word patterns list
    const patternListContainer = document.getElementById('pattern-list-container');
    if (patternListContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const unitId = urlParams.get('id');
        
        if (!unitId) {
            patternListContainer.innerHTML = '<p style="color: red;">Unit ID not found.</p>';
            return;
        }

        patternListContainer.innerHTML = '<p>Loading data...</p>';
        
        try {
            const patternSnapshot = await getDocs(collection(db, "word_patterns"));
            let patterns = patternSnapshot.docs
                            .map(doc => ({ id: doc.id, ...doc.data() }))
                            .filter(p => p.unitId === unitId);
                            
            patterns.sort((a, b) => a.word.localeCompare(b.word));
            
                        // Inject search bar
            const searchContainer = document.createElement('div');
            searchContainer.className = 'vocab-search-container';
            searchContainer.style.marginBottom = '1.5rem';
            searchContainer.innerHTML = `<input type="text" id="pattern-search-input" placeholder="Search word patterns..." style="width: 100%; padding: 0.8rem 1.2rem; border-radius: 30px; border: 1px solid var(--line-color); background: var(--card-bg); color: var(--text-primary); font-family: var(--font-body); outline: none; transition: border-color 0.2s; box-shadow: var(--shadow-sm);">`;
            patternListContainer.parentNode.insertBefore(searchContainer, patternListContainer);

            const renderPatternList = (filteredList) => {
patternListContainer.innerHTML = '';
            if(filteredList.length === 0) { patternListContainer.innerHTML = '<p>No word patterns found.</p>'; return; }
            
            if(patterns.length === 0) {
                patternListContainer.innerHTML = '<p>This unit has no word patterns yet.</p>';
            }

            const formatPos = (text) => {
                if(!text) return '';
                return text.replace(/\s*\(?\b(v|n|adj|adv|prep|conj|pron|det)\b\)?/gi, (match, p1) => {
                    return ` <span class="vocab-pos" style="font-weight: 400; font-size: 1.2rem; color: var(--text-secondary);">(${p1.toLowerCase()})</span>`;
                });
            };

            filteredList.forEach(p => {
                patternListContainer.innerHTML += `
                    <div class="phrasal-item reveal">
                        <div class="phrasal-left pattern-left" style="flex-direction: column; align-items: flex-start;">
                            <div class="vocab-word-group" style="margin-bottom: 1rem; align-items: baseline; flex-wrap: nowrap; white-space: nowrap;">
                                <span class="phrasal-word">${window.formatWordWithPos(p.word)}</span>
                                <span class="vocab-pos">${window.formatStandalonePos(p.pos)}</span>
                            </div>
                            <div style="font-size: 1.3rem; color: var(--text-primary); font-weight: normal; font-style: italic;">${p.pattern ? p.pattern.replace(/\n/g, '<br>') : ''}</div>
                        </div>
                        <div class="phrasal-right">
                            <p class="phrasal-def">${p.def}</p>
                            <p class="phrasal-example">${p.example}</p>
                        </div>
                    </div>
                `;
            });

                if (window.initRevealAnimations) requestAnimationFrame(() => window.initRevealAnimations());
            };

            renderPatternList(patterns);

            const searchInput = document.getElementById('pattern-search-input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const term = e.target.value.toLowerCase().trim();
                    if (!term) return renderPatternList(patterns);
                    const filtered = patterns.filter(p => 
                        (p.word || '').toLowerCase().includes(term) || 
                        (p.pattern || '').toLowerCase().includes(term) ||
                        (p.def || '').toLowerCase().includes(term)
                    );
                    renderPatternList(filtered);
                });
            }
        } catch(e) {
            console.error(e);
            patternListContainer.innerHTML = '<p style="color: red;">Error loading data.</p>';
        }
    }
});

window.toggleWf = function(id) {
    const forms = document.getElementById('wf-forms-' + id);
    const toggle = document.getElementById('wf-toggle-' + id);
    if(forms.classList.contains('collapsed')) {
        forms.classList.remove('collapsed');
        toggle.innerHTML = '▼';
    } else {
        forms.classList.add('collapsed');
        toggle.innerHTML = '▶';
    }
};


    // Unit Lexical Page: Load Lexical Expansion list
    const lexicalListContainer = document.getElementById('lexical-list-container');
    if (lexicalListContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const unitId = urlParams.get('id');
        
        if (!unitId) {
            lexicalListContainer.innerHTML = '<p style="color: red;">Unit ID not found.</p>';
        } else {
            lexicalListContainer.innerHTML = '<p>Loading data...</p>';
            
            try {
                const lexicalSnapshot = await getDocs(collection(db, "lexical_expansions"));
                let lexicals = lexicalSnapshot.docs
                                .map(doc => ({ id: doc.id, ...doc.data() }))
                                .filter(l => l.unitId === unitId);
                
                            // Inject search bar
            const searchContainer = document.createElement('div');
            searchContainer.className = 'vocab-search-container';
            searchContainer.style.marginBottom = '1.5rem';
            searchContainer.innerHTML = `<input type="text" id="lexical-search-input" placeholder="Search lexical expansions..." style="width: 100%; padding: 0.8rem 1.2rem; border-radius: 30px; border: 1px solid var(--line-color); background: var(--card-bg); color: var(--text-primary); font-family: var(--font-body); outline: none; transition: border-color 0.2s; box-shadow: var(--shadow-sm);">`;
            lexicalListContainer.parentNode.insertBefore(searchContainer, lexicalListContainer);

            const renderLexicalList = (filteredList) => {
lexicalListContainer.innerHTML = '';
            if(filteredList.length === 0) { lexicalListContainer.innerHTML = '<p>No lexical expansion found.</p>'; return; }
                
                if(lexicals.length === 0) {
                    lexicalListContainer.innerHTML = '<p>This unit has no lexical expansion yet.</p>';
                }

                filteredList.forEach(lex => {
                    let textLeftHtml = lex.textLeft ? `<div style="flex: 1; white-space: pre-wrap; font-family: inherit; font-size: 1.6rem; text-align: ${lex.alignLeft || 'left'};">${lex.textLeft}</div>` : '';
                    let textRightHtml = lex.textRight ? `<div style="flex: 1; white-space: pre-wrap; font-family: inherit; font-size: 1.6rem; text-align: ${lex.alignRight || 'left'};">${lex.textRight}</div>` : '';
                    
                    let topSectionHtml = '';
                    if(textLeftHtml || textRightHtml) {
                        topSectionHtml = `
                            <div style="display: flex; gap: 2rem; margin-bottom: 2rem; width: 100%; color: #4a7578; font-style: italic; font-weight: normal;">
                                ${textLeftHtml}
                                ${textRightHtml}
                            </div>
                        `;
                    }
                    
                    let wordsHtml = '';
                    if(lex.words && lex.words.length > 0) {
                        lex.words.forEach(w => {
                            wordsHtml += `
                                <div class="vocab-item reveal">
                                    <div class="vocab-left">
                                        <div class="vocab-word-group">
                                            <span class="vocab-word">${window.formatWordWithPos(w.word)}</span>
                                            <span class="vocab-pos">${window.formatStandalonePos(w.pos)}</span>
                                        </div>
                                        <div style="margin-top: 0.5rem;">
                                            <span class="vocab-pronunciation" style="white-space: pre-wrap; line-height: 1.6; font-style: italic; font-weight: normal;">${w.pron}</span>
                                        </div>
                                    </div>
                                    <div class="vocab-right">
                                        <p class="vocab-def">${w.def}</p>
                                        <p class="vocab-example">${w.example}</p>
                                    </div>
                                </div>
                            `;
                        });
                    }
                    
                    lexicalListContainer.innerHTML += `
                        <div class="wf-item reveal" style="margin-bottom: 3rem; width: 100%;">
                            ${topSectionHtml}
                            <div class="wf-toggle" id="wf-toggle-${lex.id}" onclick="window.toggleWf('${lex.id}')">▶</div>
                            <div class="wf-forms collapsed" id="wf-forms-${lex.id}">
                                <div style="display: flex; flex-direction: column; gap: 3rem; width: 100%;">
                                    ${wordsHtml}
                                </div>
                            </div>
                        </div>
                    `;
                });
    
                if (window.initRevealAnimations) requestAnimationFrame(() => window.initRevealAnimations());
            };

            renderLexicalList(lexicals);

            const searchInput = document.getElementById('lexical-search-input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const term = e.target.value.toLowerCase().trim();
                    if (!term) return renderLexicalList(lexicals);
                    
                    const filtered = lexicals.filter(lex => {
                        const inLeft = (lex.textLeft || '').toLowerCase().includes(term);
                        const inRight = (lex.textRight || '').toLowerCase().includes(term);
                        const inWords = (lex.words || []).some(w => 
                            (w.word || '').toLowerCase().includes(term) || 
                            (w.def || '').toLowerCase().includes(term)
                        );
                        return inLeft || inRight || inWords;
                    });
                    
                    renderLexicalList(filtered);
                });
            }
        } catch(e) {
                console.error(e);
                lexicalListContainer.innerHTML = '<p style="color: red;">Error loading Lexical Expansion.</p>';
            }
        }
    }
=======
import { collection, getDocs, getDoc, doc, query, where, getCountFromServer } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-config.js';
import { escapeHtml, normalizeSearch } from './utils.js';
import { allBookmarks, getBookmark, setBookmark } from './progress-store.js';

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

const truncTitle = (t) => (t && t.length > 44) ? t.slice(0, 43) + '…' : (t || '');

/** Register this unit's words for the double-click dictionary popup. */
function registerLexicon(items) {
    const lex = (window.__unitLexicon ||= {});
    (items || []).forEach(it => {
        const w = String(it.word || '').toLowerCase().replace(/\s*\([^)]*\)\s*$/g, '').trim();
        if (w && it.def && !lex[w]) lex[w] = { word: w, def: it.def };
    });
}

/** Flashcard overlay markup (identical to unit_detail / review pages). */
function ensureFlashcardOverlay() {
    if (document.getElementById('flashcard-overlay')) return;
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

/** Flashcards + Quiz toolbar for the five sibling unit pages.
 *  Cards must be shaped {id, word, def, example, pron, audio, unitId, src}. */
function setupStudyTools(container, unitId, cards) {
    if (!cards || !cards.length || document.getElementById('flashcard-toggle-btn')) return;

    const toolbar = document.createElement('div');
    toolbar.className = 'vocab-toolbar reveal visible';
    toolbar.innerHTML = `
        <div class="vocab-tools-left">
            <button type="button" id="flashcard-toggle-btn" class="flashcard-toggle-btn">&#127924; Flashcards</button>
            ${cards.length >= 4 ? '<button type="button" id="quiz-toggle-btn" class="flashcard-toggle-btn">&#10067; Quiz</button>' : ''}
        </div>
        <div class="vocab-tools-right">
            <span id="progress-badge-${escapeHtml(unitId)}"></span>
        </div>`;
    const titleEl = document.querySelector('.vocab-section-title');
    if (titleEl) {
        titleEl.style.display = 'flex';
        titleEl.style.alignItems = 'center';
        titleEl.style.justifyContent = 'space-between';
        titleEl.style.gap = '1rem';
        titleEl.appendChild(toolbar);
    } else {
        container.parentNode.insertBefore(toolbar, container);
    }

    ensureFlashcardOverlay();
    if (window.initFlashcard) window.initFlashcard(cards, unitId);
    if (window.initQuiz) window.initQuiz(cards);
    window.renderProgressBadge?.(unitId, cards.length);
}

/** Prev/Next unit footer for the six unit_* pages. */
async function buildUnitPager(cur) {
    try {
        if (!cur || !cur.bookId) return;
        const snap = await getDocs(query(collection(db, 'units'), where('bookId', '==', cur.bookId)));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            .filter(u => !isDraft(u))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
        const idx = list.findIndex(u => u.id === cur.id);
        if (idx === -1) return;
        const prev = idx > 0 ? list[idx - 1] : null;
        const next = idx < list.length - 1 ? list[idx + 1] : null;
        if (!prev && !next) return;
        const page = location.pathname.split('/').pop() || 'unit_detail.html';
        const nav = document.createElement('nav');
        nav.className = 'unit-pager';
        nav.innerHTML = `
            ${prev ? `<a class="up-link up-prev" href="${page}?id=${encodeURIComponent(prev.id)}">
                <span>&larr; Previous unit</span><strong>${escapeHtml(truncTitle(prev.title))}</strong></a>` : '<span></span>'}
            ${next ? `<a class="up-link up-next" href="${page}?id=${encodeURIComponent(next.id)}">
                <span>Next unit &rarr;</span><strong>${escapeHtml(truncTitle(next.title))}</strong></a>` : '<span></span>'}`;
        document.querySelector('.container')?.appendChild(nav);
    } catch (e) {
        console.warn('[pager]', e);
    }
}

/** Tab bar shared by the six unit_* pages; `active` is the current page file. */
function renderUnitSubnav(active) {
    const nav = document.getElementById('unit-subnav');
    if (!nav) return;
    const unitId = new URLSearchParams(window.location.search).get('id');
    const tabs = [
        ['unit_detail.html', 'Vocabulary'],
        ['unit_phrasal.html', 'Phrasal Verbs'],
        ['unit_prep.html', 'Prepositional Phrases'],
        ['unit_wordform.html', 'Word Formation'],
        ['unit_pattern.html', 'Word Patterns'],
        ['unit_lexical.html', 'Lexical Expansion']
    ];
    nav.innerHTML = tabs.map(([target, label]) => {
        const href = unitId ? `${target}?id=${encodeURIComponent(unitId)}` : target;
        const isActive = target === active;
        return `<a href="${href}" class="subnav-link${isActive ? ' active' : ''}"${isActive ? ' aria-current="page"' : ''}>${label}</a>`;
    }).join('');
}

/* Accessible expander for word-formation/lexical blocks. Delegated so
   re-renders (search, pagination…) never need re-binding. */
document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-wf-toggle]');
    if (!btn) return;
    const forms = btn.nextElementSibling;
    if (!forms) return;
    const collapsed = forms.classList.toggle('collapsed');
    btn.setAttribute('aria-expanded', String(!collapsed));
    btn.innerHTML = collapsed ? '&#9654;' : '&#9660;';
});

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

/** Word-first search across prioritised field tiers.
 *  Items matching an earlier tier are returned exclusively; later tiers
 *  (definitions, examples…) are only consulted when nothing matches the
 *  word-like fields. Typing "compe" therefore returns compete/competition
 *  instead of every word whose definition happens to mention competing.
 *  All comparisons are accent-insensitive (Vietnamese-friendly). */
function tieredSearch(items, term, tiers) {
    for (const fieldsOf of tiers) {
        const hits = items.filter(it =>
            fieldsOf(it).some(val => normalizeSearch(val).includes(term)));
        if (hits.length) return hits;
    }
    return [];
}

/** Standard search-box wiring: full list when empty, filtered otherwise.
 *  Always performs an initial render honouring any ?q= URL parameter.
 *  The typed term is accent-normalised (Vietnamese-friendly) before matching. */
function wireSearch(input, allItems, renderFn, searchFn) {
    const run = () => {
        const raw = input ? input.value.trim() : '';
        syncUrlSearchParam(raw.toLowerCase());
        const term = normalizeSearch(raw);
        if (!term) { renderFn(allItems, false); return; }
        renderFn(searchFn(allItems, term), true);
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

    /* Random quote
    initStore(); for Homepage */
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

    /* Shared tab bar on the six unit_* pages (rendered from JS) */
    renderUnitSubnav(location.pathname.split('/').pop() || 'unit_detail.html');

    /* Render dynamic Unit Detail Header */
    const headerContainer = document.getElementById('unit-detail-header-container');
    if (headerContainer) {
        const unitId = new URLSearchParams(window.location.search).get('id');
        const titleEl = document.getElementById('unit-detail-title');
        if (!unitId && titleEl) {
            titleEl.innerText = 'Unit not found';
        }
        if (unitId && titleEl) {
            try {
                const unitDoc = await getDoc(doc(db, "units", unitId));
                if (unitDoc.exists()) {
                    const unitData = unitDoc.data();
                    titleEl.innerText = unitData.title || '';
                    document.title = `${unitData.title} — Thor's Notes`;

                    // Next/previous unit navigation for the six unit pages
                    buildUnitPager({ id: unitId, bookId: unitData.bookId });

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
                booksListContainer.innerHTML = books.map((book, i) => `
                    <div class="book-container reveal">
                        <div class="book-cover img-loading">
                            <img src="${escapeHtml(book.image || 'assets/images/book_cover.webp')}"
                                alt="Cover of ${escapeHtml(book.title)}"
                                ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}
                                decoding="async">
                        </div>
                        <div class="book-details">
                            <h2 class="book-title">${escapeHtml(book.title)}</h2>
                            <h3 class="book-subtitle">${escapeHtml(book.subtitle || '')}</h3>
                            <p class="book-desc">${escapeHtml(book.desc || '')}</p>
                            <a href="units.html?bookId=${encodeURIComponent(book.id)}" class="btn-learn-more">Learn More</a>
                        </div>
                    </div>
                `).join('');

                // Fade covers in as they arrive; fall back to the local
                // placeholder cover when a remote image fails.
                requestAnimationFrame(() => {
                    booksListContainer.querySelectorAll('.book-cover').forEach(cover => {
                        const img = cover.querySelector('img');
                        if (!img) return;
                        const reveal = () => cover.classList.remove('img-loading');
                        if (img.complete && img.naturalWidth > 0) { reveal(); return; }
                        img.addEventListener('load', reveal, { once: true });
                        img.addEventListener('error', () => {
                            if (!img.dataset.fallback) {
                                img.dataset.fallback = '1';
                                img.src = 'assets/images/book_cover.webp';
                            } else {
                                reveal();
                            }
                        }, { once: true });
                    });
                    window.initRevealAnimations?.();
                });
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

                    // Expose words to the dictionary popup (double-click lookup)
                    registerLexicon(vocabs);

                    const searchInput = injectSearchBar(vocabListContainer, 'vocab-search-input', 'Search vocabulary…');
                    applyUrlSearchParam(searchInput);

                    // Toolbar: flashcards / quiz / CSV / starred filter / progress badge
                    const toolbar = document.createElement('div');
                    toolbar.className = 'vocab-toolbar reveal visible';
                    toolbar.innerHTML = `
                        <div class="vocab-tools-left">
                            <button type="button" id="flashcard-toggle-btn" class="flashcard-toggle-btn">&#127924; Flashcards</button>
                            <button type="button" id="quiz-toggle-btn" class="flashcard-toggle-btn">&#10067; Quiz</button>
                            <button type="button" id="print-worksheet-btn" class="flashcard-toggle-btn" title="Print a study worksheet">&#128424; Worksheet</button>
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
                        const marks = allBookmarks();
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
                                const item = vocabs.find(x => x.id === id);
                                if (getBookmark(id)) setBookmark(id, null);
                                else if (item) setBookmark(id, { word: item.word, def: item.def, example: item.example, pron: item.pron, unitId });
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
                    const searchVocab = (list, term) => tieredSearch(list, term, [
                        v => [v.word],
                        v => [v.def, v.example]
                    ]);
                    const rerender = () => {
                        const base = starredOnly ? vocabs.filter(v => getBookmark(v.id)) : vocabs;
                        const term = normalizeSearch(searchInput?.value || '');
                        if (!term) return renderVocabList(base, starredOnly);
                        renderVocabList(searchVocab(base, term), true);
                    };

                    document.getElementById('starred-only-checkbox')?.addEventListener('change', (e) => {
                        starredOnly = e.target.checked;
                        rerender();
                    });

                    wireSearch(searchInput, vocabs,
                        (list, searching) => renderVocabList(starredOnly ? list.filter(v => getBookmark(v.id)) : list, searching),
                        searchVocab);

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

                    // Printable worksheet (Part A: word->meaning, Part B: recall)
                    document.getElementById('print-worksheet-btn')?.addEventListener('click', () => {
                        if (!vocabs.length) return;
                        document.getElementById('worksheet-root')?.remove();
                        const stripPosW = (w) => String(w || '').replace(/\s*\([^)]*\)\s*$/g, '').trim();
                        const title = document.getElementById('unit-detail-title')?.innerText || 'Unit vocabulary';
                        const date = new Date().toLocaleDateString();
                        const rowsA = vocabs.map((v, i) => `
                            <tr><td class="ws-num">${i + 1}</td>
                                <td class="ws-word">${escapeHtml(stripPosW(v.word))}</td>
                                <td>${escapeHtml(v.def || '')}</td></tr>`).join('');
                        const rowsB = vocabs.map((v, i) => `
                            <tr><td class="ws-num">${i + 1}</td>
                                <td>${escapeHtml(v.def || '')}</td>
                                <td class="ws-blank"></td></tr>`).join('');
                        const root = document.createElement('div');
                        root.id = 'worksheet-root';
                        root.innerHTML = `
                            <header><h1>${escapeHtml(title)} — Worksheet</h1><span>${date}</span></header>
                            <section><h2>Part A · Match each word with its meaning</h2>
                                <table><thead><tr><th>#</th><th>Word</th><th>Meaning</th></tr></thead><tbody>${rowsA}</tbody></table>
                            </section>
                            <section class="ws-break"><h2>Part B · Write the word</h2>
                                <table><thead><tr><th>#</th><th>Meaning</th><th>Your answer</th></tr></thead><tbody>${rowsB}</tbody></table>
                            </section>`;
                        document.body.appendChild(root);
                        document.body.classList.add('printing-worksheet');
                        const cleanup = () => {
                            document.body.classList.remove('printing-worksheet');
                            window.removeEventListener('afterprint', cleanup);
                            setTimeout(() => root.remove(), 300);
                        };
                        window.addEventListener('afterprint', cleanup);
                        window.print();
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
        toCard: (p, unitId) => ({
            id: p.id, word: p.word, def: p.def, example: p.example,
            pron: p.pron || '', audio: p.audio || '', unitId, src: 'phrasal'
        }),
        renderItem: p => {
            const audioHtml = window.buildCustomAudioPlayer
                ? `<div class="vocab-audio-group">${window.buildCustomAudioPlayer(p.audio, p.word)}</div>`
                : '';
            return `
            <div class="phrasal-item reveal">
                <div class="phrasal-left">
                    <div class="phrasal-word">${escapeHtml(p.word || '')}</div>
                    <div class="phrasal-pron">${escapeHtml(p.pron || '')}</div>
                    ${audioHtml}
                </div>
                <div class="phrasal-right">
                    <p class="phrasal-def">${escapeHtml(p.def || '')}</p>
                    <p class="phrasal-example">${escapeHtml(p.example || '')}</p>
                </div>
            </div>`;
        }
    });

    setupSimpleList({
        containerId: 'prep-list-container',
        collectionName: 'prep_phrases',
        searchInputId: 'prep-search-input',
        placeholder: 'Search prepositional phrases…',
        emptyMsg: 'This unit has no prepositional phrases yet.',
        sortKey: 'word',
        toCard: (p, unitId) => ({
            id: p.id, word: p.word, def: p.def, example: p.example,
            pron: '', audio: '', unitId, src: 'prep'
        }),
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
                registerLexicon(items);

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
                    (list, term) => tieredSearch(list, term, [
                        item => [item.word],
                        item => [item.def, item.example]
                    ]));

                if (cfg.toCard) {
                    const cards = items.map(it => cfg.toCard(it, unitId)).filter(c => c.word && c.def);
                    setupStudyTools(container, unitId, cards);
                }

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

                // Expose every derived form to the dictionary popup (B7).
                // Strip bare POS suffixes ("action n" -> "action") so
                // double-click lookups on the base word match.
                registerLexicon(wordforms.flatMap(w =>
                    (w.forms || []).map(f => ({
                        word: String(f.title || '').replace(/\s+\b(v|n|adj|adv|prep|conj|pron|det)\b\.?\s*$/i, '').trim(),
                        def: f.definitions
                    }))));

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
                                <button type="button" class="wf-toggle" data-wf-toggle aria-expanded="false"
                                    aria-label="Toggle word formation details">&#9654;</button>
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
                    (list, term) => tieredSearch(list, term, [
                        w => [
                            w.rootWord,
                            ...(w.overviews || []).map(o => o.words),
                            ...(w.forms || []).map(f => f.title)
                        ],
                        w => (w.forms || []).flatMap(f => [f.definitions, f.examples])
                    ]));

                // Flashcards/quiz over every derived form (flattened sub-rows).
                // Form titles are stored as "action n" — normalise to the
                // site-wide "action (n)" convention so stripPos() works.
                const cards = [];
                wordforms.forEach(w => {
                    (w.forms || []).forEach((f, i) => {
                        if (!f.title || !f.definitions) return;
                        const a0 = (f.audios || [])[0] || {};
                        cards.push({
                            id: `${w.id}#${i}`,
                            word: String(f.title).replace(/\s+\b(v|n|adj|adv|prep|conj|pron|det)\b\.?\s*$/i, ' ($1)'),
                            def: f.definitions,
                            example: (f.examples || '').split('\n')[0] || '',
                            pron: a0.pron || '',
                            audio: a0.url || '',
                            unitId,
                            src: 'wordform'
                        });
                    });
                });
                setupStudyTools(container, unitId, cards);

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

                registerLexicon(patterns);

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
                    container.innerHTML = list.map(p => {
                        const audioHtml = window.buildCustomAudioPlayer
                            ? `<div class="vocab-audio-group">${window.buildCustomAudioPlayer(p.audio, p.word)}</div>`
                            : '';
                        return `
                        <div class="phrasal-item reveal">
                            <div class="phrasal-left pattern-left" style="flex-direction: column; align-items: flex-start;">
                                <div class="vocab-word-group" style="margin-bottom: 1rem; align-items: baseline; flex-wrap: nowrap; white-space: nowrap;">
                                    <span class="phrasal-word">${window.formatWordWithPos(escapeHtml(p.word))}</span>
                                    <span class="vocab-pos">${window.formatStandalonePos(p.pos)}</span>
                                </div>
                                <div style="font-size: 1.3rem; color: var(--text-primary); font-weight: normal; font-style: italic;">${escapeHtml(p.pattern || '').replace(/\n/g, '<br>')}</div>
                                ${audioHtml}
                            </div>
                            <div class="phrasal-right">
                                <p class="phrasal-def">${escapeHtml(p.def || '')}</p>
                                <p class="phrasal-example">${escapeHtml(p.example || '')}</p>
                            </div>
                        </div>`;
                    }).join('');
                    requestAnimationFrame(() => {
                        window.initRevealAnimations
                            ? window.initRevealAnimations()
                            : document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
                    });
                };

                wireSearch(searchInput, patterns, render,
                    (list, term) => tieredSearch(list, term, [
                        p => [p.word, p.pattern],
                        p => [p.def, p.example]
                    ]));

                const cards = patterns.map(p => ({
                    id: p.id,
                    word: p.word,
                    def: p.pattern ? `${p.pattern} — ${p.def || ''}` : (p.def || ''),
                    example: p.example || '',
                    pron: '',
                    audio: p.audio || '',
                    unitId,
                    src: 'pattern'
                })).filter(c => c.word && c.def);
                setupStudyTools(container, unitId, cards);

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

                // Expose every expansion word to the dictionary popup (B7)
                registerLexicon(lexicals.flatMap(l => l.words || []));

                const searchInput = injectSearchBar(container, 'lexical-search-input', 'Search lexical expansions…');
                applyUrlSearchParam(searchInput);

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
                            wordsHtml = lex.words.map(w => {
                                const audioHtml = window.buildCustomAudioPlayer
                                    ? window.buildCustomAudioPlayer(w.audio, w.word)
                                    : (w.audio
                                        ? `<audio controls preload="none" class="vocab-audio-player"><source src="${escapeHtml(w.audio)}" type="audio/mpeg"></audio>`
                                        : '');
                                return `
                                <div class="vocab-item reveal">
                                    <div class="vocab-left">
                                        <div class="vocab-word-group">
                                            <span class="vocab-word">${window.formatWordWithPos(escapeHtml(w.word))}</span>
                                            <span class="vocab-pos">${window.formatStandalonePos(w.pos)}</span>
                                        </div>
                                        <div class="vocab-audio-group" style="margin-top: 0.5rem;">
                                            <span class="vocab-pronunciation" style="white-space: pre-wrap; line-height: 1.6; font-style: italic; font-weight: normal;">${escapeHtml(w.pron || '')}</span>
                                            ${audioHtml}
                                        </div>
                                    </div>
                                    <div class="vocab-right">
                                        <p class="vocab-def">${escapeHtml(w.def || '')}</p>
                                        <p class="vocab-example">${escapeHtml(w.example || '')}</p>
                                    </div>
                                </div>`;
                            }).join('');
                        }

                        return `
                            <div class="wf-item reveal" style="margin-bottom: 3rem; width: 100%;">
                                ${topSectionHtml}
                                <button type="button" class="wf-toggle" data-wf-toggle aria-expanded="false"
                                    aria-label="Toggle lexical expansion details">&#9654;</button>
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
                        const raw = searchInput.value.trim();
                        syncUrlSearchParam(raw.toLowerCase());
                        const term = normalizeSearch(raw);
                        if (!term) return render(lexicals, false);

                        const ranked = [];
                        lexicals.forEach(lex => {
                            let wordScore = 0, otherScore = 0;
                            const texts = [normalizeSearch(lex.textLeft), normalizeSearch(lex.textRight)];
                            (lex.words || []).forEach(w => {
                                const word = normalizeSearch(w.word).replace(/\(.*?\)/g, '').trim();
                                if (word.startsWith(term)) wordScore = Math.max(wordScore, 100);
                                else if (word.includes(term)) wordScore = Math.max(wordScore, 80);
                                if (texts.some(t => t.includes(term))) otherScore = Math.max(otherScore, 60);
                                else if (normalizeSearch(w.def).includes(term) || normalizeSearch(w.pron).includes(term)) otherScore = Math.max(otherScore, 40);
                            });
                            if (!otherScore && texts.some(t => t.includes(term))) otherScore = 60;
                            const score = wordScore || otherScore;
                            if (score) ranked.push({ score, wordHit: wordScore > 0, lex });
                        });

                        // Word matches take priority: when any entry matched on
                        // its word, hide entries that only matched in text/def.
                        const wordHits = ranked.filter(r => r.wordHit);
                        const finalList = (wordHits.length ? wordHits : ranked)
                            .sort((a, b) => b.score - a.score);
                        render(finalList.map(r => r.lex), true);
                    };
                    searchInput.addEventListener('input', runSearch);
                    // Always render once on load (honours any ?q= URL parameter)
                    runSearch();
                }

                // Flashcards/quiz over every expansion word (flattened sub-rows)
                const cards = [];
                lexicals.forEach(lex => {
                    (lex.words || []).forEach((w, i) => {
                        if (!w.word || !w.def) return;
                        cards.push({
                            id: `${lex.id}#${i}`,
                            word: w.word,
                            def: w.def,
                            example: w.example || '',
                            pron: w.pron || '',
                            audio: w.audio || '',
                            unitId,
                            src: 'lexical'
                        });
                    });
                });
                setupStudyTools(container, unitId, cards);
            } catch (e) {
                console.error(e);
                showError(container, 'Could not load data. Please check your connection.', load);
            }
        };
        load();
    }
});
>>>>>>> newFeature
