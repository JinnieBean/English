import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Sử dụng chung config
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

document.addEventListener('DOMContentLoaded', async () => {
    
    // Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    if (sidebarToggle && sidebar) {
        // Khôi phục trạng thái từ localStorage
        if (localStorage.getItem('sidebar-collapsed') === 'true') {
            sidebar.classList.add('collapsed');
            // Tắt transition tạm thời để tránh flash animation lúc mới load
            sidebar.style.transition = 'none';
            setTimeout(() => {
                sidebar.style.transition = '';
            }, 100);
        }

        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            // Lưu trạng thái vào localStorage
            localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
        });
    }

    // Mobile Sidebar Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
        
        // Đóng sidebar khi click ngoài sidebar trên mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && sidebar.classList.contains('mobile-open')) {
                if (!sidebar.contains(e.target) && e.target !== mobileMenuBtn) {
                    sidebar.classList.remove('mobile-open');
                }
            }
        });
    }

    // Trang Units: Tải danh sách Units
    const unitsListContainer = document.getElementById('units-list-container');
    if (unitsListContainer) {
        unitsListContainer.innerHTML = '<p style="padding: 1rem 0;">Đang tải dữ liệu...</p>';
        try {
            const unitsSnapshot = await getDocs(collection(db, "units"));
            let units = unitsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            units.sort((a,b) => a.order - b.order); // Sắp xếp theo order
            
            unitsListContainer.innerHTML = ''; // Xóa chữ loading
            
            if(units.length === 0) {
                unitsListContainer.innerHTML = '<p style="padding: 1rem 0;">Chưa có bài học nào được tạo.</p>';
            }
            
            units.forEach(unit => {
                unitsListContainer.innerHTML += `
                    <div class="unit-item" style="flex-direction: column; align-items: flex-start; gap: 0.5rem; justify-content: center;">
                        <span class="unit-name">${unit.title}</span>
                        <div class="unit-submenu">
                            <a href="unit_detail.html?id=${unit.id}" class="unit-submenu-link">Vocabulary</a>
                            <a href="unit_phrasal.html?id=${unit.id}" class="unit-submenu-link">Phrasal Verbs</a>
                            <a href="unit_prep.html?id=${unit.id}" class="unit-submenu-link">Prepositional Phrases</a>
                            <a href="unit_wordform.html?id=${unit.id}" class="unit-submenu-link">Word Formation</a>
                            <a href="unit_pattern.html?id=${unit.id}" class="unit-submenu-link">Word Patterns</a>
                            <a href="unit_lexical.html?id=${unit.id}" class="unit-submenu-link">Lexical Expansion</a>
                        </div>
                    </div>
                `;
            });
        } catch(e) {
            console.error(e);
            unitsListContainer.innerHTML = '<p style="color: red; padding: 1rem 0;">Lỗi tải dữ liệu. Hãy kiểm tra kết nối mạng hoặc Firebase.</p>';
        }
    }
    
    // Trang Unit Detail: Tải danh sách từ vựng thuộc Unit
    const vocabListContainer = document.getElementById('vocab-list-container');
    if (vocabListContainer) {
        // Lấy unit ID từ URL (vd: unit_detail.html?id=xxx)
        const urlParams = new URLSearchParams(window.location.search);
        const unitId = urlParams.get('id');
        
        if (!unitId) {
            vocabListContainer.innerHTML = '<p style="color: red;">Không tìm thấy Unit ID.</p>';
            return;
        }

        vocabListContainer.innerHTML = '<p>Đang tải từ vựng...</p>';
        
        try {
            // Lấy lại tên Unit (Tùy chọn: tối ưu hơn thì có thể lấy 1 doc thay vì getDocs toàn bộ)
            const unitsSnapshot = await getDocs(collection(db, "units"));
            const currentUnit = unitsSnapshot.docs.find(d => d.id === unitId)?.data();
            
            if (currentUnit) {
                const titleEl = document.querySelector('.unit-detail-title');
                if(titleEl) titleEl.innerText = currentUnit.title;
            }

            // Tải danh sách từ vựng
            const vocabSnapshot = await getDocs(collection(db, "vocabularies"));
            let vocabs = vocabSnapshot.docs
                            .map(doc => ({ id: doc.id, ...doc.data() }))
                            .filter(v => v.unitId === unitId); // Lọc những từ thuộc Unit này
            
            vocabListContainer.innerHTML = '';
            
            if(vocabs.length === 0) {
                vocabListContainer.innerHTML = '<p>Unit này chưa có từ vựng nào.</p>';
            }

            vocabs.forEach(v => {
                // Xử lý Audio (nếu ko có link thì ẩn thẻ source đi hoặc báo lỗi nhẹ)
                const audioHtml = v.audio 
                    ? `<audio controls class="vocab-audio-player"><source src="${v.audio}" type="audio/mpeg"></audio>`
                    : `<span style="font-size: 0.8rem; color: #888; font-style: italic;">No audio</span>`;

                vocabListContainer.innerHTML += `
                    <div class="vocab-item">
                        <div class="vocab-left">
                            <div class="vocab-word-group">
                                <span class="vocab-word">${v.word}</span>
                                <span class="vocab-pos">${window.formatStandalonePos(v.pos)}</span>
                            </div>
                            <div class="vocab-audio-group">
                                <span class="vocab-pronunciation">${v.pron}</span>
                                ${audioHtml}
                            </div>
                        </div>
                        <div class="vocab-right">
                            <p class="vocab-def">${v.def}</p>
                            <p class="vocab-example">${v.example}</p>
                        </div>
                    </div>
                `;
            });
        } catch(e) {
            console.error(e);
            vocabListContainer.innerHTML = '<p style="color: red;">Lỗi tải từ vựng.</p>';
        }
    }

    // Trang Unit Phrasal: Tải danh sách Phrasal verbs
    const phrasalListContainer = document.getElementById('phrasal-list-container');
    if (phrasalListContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const unitId = urlParams.get('id');
        
        if (!unitId) {
            phrasalListContainer.innerHTML = '<p style="color: red;">Không tìm thấy Unit ID.</p>';
            return;
        }

        phrasalListContainer.innerHTML = '<p>Đang tải dữ liệu...</p>';
        
        try {
            const unitsSnapshot = await getDocs(collection(db, "units"));
            const currentUnit = unitsSnapshot.docs.find(d => d.id === unitId)?.data();
            
            if (currentUnit) {
                const titleEl = document.querySelector('.unit-detail-title');
                if(titleEl) titleEl.innerText = currentUnit.title;
            }

            const phrasalSnapshot = await getDocs(collection(db, "phrasal_verbs"));
            let phrasals = phrasalSnapshot.docs
                            .map(doc => ({ id: doc.id, ...doc.data() }))
                            .filter(p => p.unitId === unitId);
            
            phrasalListContainer.innerHTML = '';
            
            if(phrasals.length === 0) {
                phrasalListContainer.innerHTML = '<p>Unit này chưa có Phrasal verb nào.</p>';
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
            phrasalListContainer.innerHTML = '<p style="color: red;">Lỗi tải dữ liệu.</p>';
        }
    }

    // Trang Unit Prep: Tải danh sách Prepositional phrases
    const prepListContainer = document.getElementById('prep-list-container');
    if (prepListContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const unitId = urlParams.get('id');
        
        if (!unitId) {
            prepListContainer.innerHTML = '<p style="color: red;">Không tìm thấy Unit ID.</p>';
            return;
        }

        prepListContainer.innerHTML = '<p>Đang tải dữ liệu...</p>';
        
        try {
            const unitsSnapshot = await getDocs(collection(db, "units"));
            const currentUnit = unitsSnapshot.docs.find(d => d.id === unitId)?.data();
            
            if (currentUnit) {
                const titleEl = document.querySelector('.unit-detail-title');
                if(titleEl) titleEl.innerText = currentUnit.title;
            }

            const prepSnapshot = await getDocs(collection(db, "prep_phrases"));
            let preps = prepSnapshot.docs
                            .map(doc => ({ id: doc.id, ...doc.data() }))
                            .filter(p => p.unitId === unitId);
            
            prepListContainer.innerHTML = '';
            
            if(preps.length === 0) {
                prepListContainer.innerHTML = '<p>Unit này chưa có Prepositional phrase nào.</p>';
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
            prepListContainer.innerHTML = '<p style="color: red;">Lỗi tải dữ liệu.</p>';
        }
    }

    // Trang Unit Word Formation
    const wfListContainer = document.getElementById('wordform-list-container');
    if (wfListContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const unitId = urlParams.get('id');
        
        if (!unitId) {
            wfListContainer.innerHTML = '<p style="color: red;">Không tìm thấy Unit ID.</p>';
            return;
        }

        wfListContainer.innerHTML = '<p>Đang tải dữ liệu...</p>';
        
        try {
            const unitsSnapshot = await getDocs(collection(db, "units"));
            const currentUnit = unitsSnapshot.docs.find(d => d.id === unitId)?.data();
            
            if (currentUnit) {
                const titleEl = document.querySelector('.unit-detail-title');
                if(titleEl) titleEl.innerText = currentUnit.title;
            }

            const wfSnapshot = await getDocs(collection(db, "word_formations"));
            let wordforms = wfSnapshot.docs
                            .map(doc => ({ id: doc.id, ...doc.data() }))
                            .filter(w => w.unitId === unitId);
            
            wfListContainer.innerHTML = '';
            
            if(wordforms.length === 0) {
                wfListContainer.innerHTML = '<p>Unit này chưa có Word formation nào.</p>';
            }

            wordforms.forEach(w => {
                const formatPos = (text) => {
                    if(!text) return '';
                    return text.replace(/\b(v|n|adj|adv|prep|conj|pron|det)\b/gi, (match) => {
                        return `<span class="vocab-pos">(${match.toLowerCase()})</span>`;
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
                                        <audio controls src="${a.url}"></audio>
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
            wfListContainer.innerHTML = '<p style="color: red;">Lỗi tải dữ liệu.</p>';
        }
    }

    // Trang Unit Pattern: Tải danh sách Word patterns
    const patternListContainer = document.getElementById('pattern-list-container');
    if (patternListContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const unitId = urlParams.get('id');
        
        if (!unitId) {
            patternListContainer.innerHTML = '<p style="color: red;">Không tìm thấy Unit ID.</p>';
            return;
        }

        patternListContainer.innerHTML = '<p>Đang tải dữ liệu...</p>';
        
        try {
            const unitsSnapshot = await getDocs(collection(db, "units"));
            const currentUnit = unitsSnapshot.docs.find(d => d.id === unitId)?.data();
            
            if (currentUnit) {
                const titleEl = document.querySelector('.unit-detail-title');
                if(titleEl) titleEl.innerText = currentUnit.title;
            }

            const patternSnapshot = await getDocs(collection(db, "word_patterns"));
            let patterns = patternSnapshot.docs
                            .map(doc => ({ id: doc.id, ...doc.data() }))
                            .filter(p => p.unitId === unitId);
            
            patternListContainer.innerHTML = '';
            
            if(patterns.length === 0) {
                patternListContainer.innerHTML = '<p>Unit này chưa có Word pattern nào.</p>';
            }

            const formatPos = (text) => {
                if(!text) return '';
                return text.replace(/\b(v|n|adj|adv|prep|conj|pron|det)\b/gi, (match) => {
                    return `<span class="vocab-pos">(${match.toLowerCase()})</span>`;
                });
            };

            patterns.forEach(p => {
                patternListContainer.innerHTML += `
                    <div class="phrasal-item" style="align-items: flex-start;">
                        <div class="phrasal-left" style="flex-direction: column; align-items: flex-start;">
                            <div class="vocab-word-group" style="margin-bottom: 1rem;">
                                <span class="vocab-word" style="font-size: 1.8rem;">${p.word}</span>
                                <span class="vocab-pos">${window.formatStandalonePos(p.pos)}</span>
                            </div>
                            <div style="font-size: 1.1rem; color: #4a7578;">${p.pattern}</div>
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
            patternListContainer.innerHTML = '<p style="color: red;">Lỗi tải dữ liệu.</p>';
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


    // Trang Unit Lexical: Tải danh sách Lexical Expansion
    const lexicalListContainer = document.getElementById('lexical-list-container');
    if (lexicalListContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const unitId = urlParams.get('id');
        
        if (!unitId) {
            lexicalListContainer.innerHTML = '<p style="color: red;">Không tìm thấy Unit ID.</p>';
        } else {
            lexicalListContainer.innerHTML = '<p>Đang tải dữ liệu...</p>';
            
            try {
                const unitsSnapshot = await getDocs(collection(db, "units"));
                const currentUnit = unitsSnapshot.docs.find(d => d.id === unitId)?.data();
                
                if (currentUnit) {
                    const titleEl = document.querySelector('.unit-detail-title');
                    if(titleEl) titleEl.innerText = currentUnit.title;
                    
                    const submenu = document.getElementById('unit-submenu');
                    if(submenu) {
                        submenu.innerHTML = `
                            <a href="unit_detail.html?id=${unitId}" class="unit-submenu-link">Vocabulary</a>
                            <a href="unit_phrasal.html?id=${unitId}" class="unit-submenu-link">Phrasal Verbs</a>
                            <a href="unit_prep.html?id=${unitId}" class="unit-submenu-link">Prepositional Phrases</a>
                            <a href="unit_wordform.html?id=${unitId}" class="unit-submenu-link">Word Formation</a>
                            <a href="unit_pattern.html?id=${unitId}" class="unit-submenu-link">Word Patterns</a>
                            <a href="unit_lexical.html?id=${unitId}" class="unit-submenu-link active">Lexical Expansion</a>
                        `;
                    }
                }

                const lexicalSnapshot = await getDocs(collection(db, "lexical_expansions"));
                let lexicals = lexicalSnapshot.docs
                                .map(doc => ({ id: doc.id, ...doc.data() }))
                                .filter(l => l.unitId === unitId);
                
                lexicalListContainer.innerHTML = '';
                
                if(lexicals.length === 0) {
                    lexicalListContainer.innerHTML = '<p>Unit này chưa có Lexical Expansion.</p>';
                }

                lexicals.forEach(lex => {
                    let textLeftHtml = lex.textLeft ? `<div style="flex: 1; white-space: pre-wrap; font-family: inherit; font-size: 1rem; text-align: ${lex.alignLeft || 'left'};">${lex.textLeft}</div>` : '';
                    let textRightHtml = lex.textRight ? `<div style="flex: 1; white-space: pre-wrap; font-family: inherit; font-size: 1rem; text-align: ${lex.alignRight || 'left'};">${lex.textRight}</div>` : '';
                    
                    let topSectionHtml = '';
                    if(textLeftHtml || textRightHtml) {
                        topSectionHtml = `
                            <div style="display: flex; gap: 2rem; margin-bottom: 2rem; color: #4a7578;">
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
                                            <span class="vocab-word">${w.word}</span>
                                            <span class="vocab-pos">${window.formatStandalonePos(w.pos)}</span>
                                        </div>
                                        <div class="vocab-audio-group" style="align-items: flex-start; margin-top: 0.5rem;">
                                            <span class="vocab-pronunciation" style="white-space: pre-wrap; line-height: 1.6;">${w.pron}</span>
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
                lexicalListContainer.innerHTML = '<p style="color: red;">Lỗi tải Lexical Expansion.</p>';
            }
        }
    }
