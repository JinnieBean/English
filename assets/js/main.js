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
                        <div class="book-container">
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
            
            phrasalListContainer.innerHTML = '';
            
            if(phrasals.length === 0) {
                phrasalListContainer.innerHTML = '<p>This unit has no phrasal verbs yet.</p>';
            }

            phrasals.forEach(p => {
                phrasalListContainer.innerHTML += `
                    <div class="phrasal-item">
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
            
            prepListContainer.innerHTML = '';
            
            if(preps.length === 0) {
                prepListContainer.innerHTML = '<p>This unit has no prepositional phrases yet.</p>';
            }

            preps.forEach(p => {
                prepListContainer.innerHTML += `
                    <div class="phrasal-item">
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
            
            wfListContainer.innerHTML = '';
            
            if(wordforms.length === 0) {
                wfListContainer.innerHTML = '<p>This unit has no word formations yet.</p>';
            }

            wordforms.forEach(w => {
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
                    <div class="wf-item">
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
            
            patternListContainer.innerHTML = '';
            
            if(patterns.length === 0) {
                patternListContainer.innerHTML = '<p>This unit has no word patterns yet.</p>';
            }

            const formatPos = (text) => {
                if(!text) return '';
                return text.replace(/\s*\(?\b(v|n|adj|adv|prep|conj|pron|det)\b\)?/gi, (match, p1) => {
                    return ` <span class="vocab-pos" style="font-weight: 400; font-size: 1.2rem; color: var(--text-secondary);">(${p1.toLowerCase()})</span>`;
                });
            };

            patterns.forEach(p => {
                patternListContainer.innerHTML += `
                    <div class="phrasal-item">
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
                
                lexicalListContainer.innerHTML = '';
                
                if(lexicals.length === 0) {
                    lexicalListContainer.innerHTML = '<p>This unit has no lexical expansion yet.</p>';
                }

                lexicals.forEach(lex => {
                    if (lex.words && lex.words.length > 0) {
                        lex.words.sort((a, b) => a.word.localeCompare(b.word));
                    }
                    let textLeftHtml = lex.textLeft ? `<div style="flex: 1; white-space: pre-wrap; font-family: inherit; font-size: 1rem; text-align: ${lex.alignLeft || 'left'};">${lex.textLeft}</div>` : '';
                    let textRightHtml = lex.textRight ? `<div style="flex: 1; white-space: pre-wrap; font-family: inherit; font-size: 1rem; text-align: ${lex.alignRight || 'left'};">${lex.textRight}</div>` : '';
                    
                    let topSectionHtml = '';
                    if(textLeftHtml || textRightHtml) {
                        topSectionHtml = `
                            <div style="display: flex; gap: 2rem; margin-bottom: 2rem; color: #4a7578; font-style: italic; font-weight: normal;">
                                ${textLeftHtml}
                                ${textRightHtml}
                            </div>
                        `;
                    }
                    
                    let wordsHtml = '';
                    if(lex.words && lex.words.length > 0) {
                        lex.words.forEach(w => {
                            wordsHtml += `
                                <div class="vocab-item">
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
                        <div style="margin-bottom: 4rem;">
                            ${topSectionHtml}
                            ${wordsHtml}
                        </div>
                    `;
                });
            } catch(e) {
                console.error(e);
                lexicalListContainer.innerHTML = '<p style="color: red;">Error loading Lexical Expansion.</p>';
            }
        }
    }
