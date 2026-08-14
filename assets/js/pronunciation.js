import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

document.addEventListener('DOMContentLoaded', async () => {
    // Sidebar Toggle Logic
    const sidebarToggle = document.getElementById('sidebar-toggle-expanded');
    const sidebarBrandContainer = document.querySelector('.sidebar-brand-container');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebar) {
        if (localStorage.getItem('sidebar-collapsed') === 'true') {
            sidebar.classList.add('collapsed', 'no-transition');
        }
        document.documentElement.classList.remove('sidebar-will-collapse');
        setTimeout(() => sidebar.classList.remove('no-transition'), 50);
        
        const toggleSidebar = () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
        };

        if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
        
        if (sidebarBrandContainer) {
            sidebarBrandContainer.addEventListener('click', (e) => {
                if (sidebar.classList.contains('collapsed')) {
                    e.preventDefault();
                    toggleSidebar();
                }
            });
        }
    }

    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && sidebar.classList.contains('mobile-open')) {
                if (!sidebar.contains(e.target) && e.target !== mobileMenuBtn) {
                    sidebar.classList.remove('mobile-open');
                }
            }
        });
    }

    // Pronunciation Overview Page Logic
    const overviewContainer = document.getElementById('pronunciation-overview-container');
        if (overviewContainer) {
        overviewContainer.innerHTML = Array(3).fill(`
            <div class="grammar-category" style="margin-bottom: 3rem;">
                <div class="skeleton skeleton-title"></div>
                <div style="margin-bottom: 1.5rem;">
                    <div class="skeleton skeleton-text"></div>
                    <div class="skeleton skeleton-text short"></div>
                </div>
            </div>
        `).join('');
        try {

            // Fetch Categories
            const catSnap = await getDocs(collection(db, 'pronunciation_categories'));
            let categories = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            categories.sort((a, b) => (a.order || 0) - (b.order || 0));

            // Fetch Lessons
            const lesSnap = await getDocs(collection(db, 'pronunciation_lessons'));
            let lessons = lesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            lessons.sort((a, b) => (a.order || 0) - (b.order || 0));

            // Fetch Units
            const uniSnap = await getDocs(collection(db, 'pronunciation_units'));
            let units = uniSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            units.sort((a, b) => (a.order || 0) - (b.order || 0));

            let catsHtml = '';
            categories.forEach(cat => {
                const catLessons = lessons.filter(l => l.categoryId === cat.id);
                
                let lesHtml = '';
                if (catLessons.length > 0) {
                    lesHtml = catLessons.map(l => {
                        const lessonUnits = units.filter(u => u.lessonId === l.id);
                        let uniHtml = lessonUnits.map(unit => `
                            <a href="pronunciation_lesson.html?id=${unit.id}&type=unit" class="pronunciation-lesson-link" style="padding-left: 2rem; position: relative; border-bottom: none; margin-bottom: 0.5rem; padding-bottom: 0;">
                                <span style="position: absolute; left: 0.5rem; top: 50%; transform: translateY(-50%); color: #1a7a7f; font-size: 1.2rem;">•</span>
                                <span class="lesson-title" style="font-size: 1.15rem;">${unit.title}</span>
                            </a>
                        `).join('');

                        return `
                        <div class="pronunciation-lesson-group" style="margin-bottom: 1.5rem;">
                            <a href="pronunciation_lesson.html?id=${l.id}&type=lesson" class="pronunciation-lesson-link" style="padding-left: 0.5rem; border-bottom: none; margin-bottom: 0.5rem; padding-bottom: 0;">
                                <span class="lesson-title" style="font-size: 1.25rem; font-family: 'Playfair Display', serif; color: #1a4d4f; font-weight: 600;">${l.title}</span>
                            </a>
                            <div class="pronunciation-lesson-units" style="margin-left: 1rem;  padding-left: 0.5rem; margin-top: 0.5rem;">
                                ${uniHtml}
                            </div>
                        </div>
                        `;
                    }).join('');
                } else {
                    lesHtml = '<div style="padding-left: 1rem; color: #888; font-style: italic;">No lessons available in this category.</div>';
                }
                
                catsHtml += `
                    <div class="pronunciation-category reveal">
                        <h3 class="pronunciation-category-title">${cat.title}</h3>
                        <div class="pronunciation-category-lessons">
                            ${lesHtml}
                        </div>
                    </div>
                `;
            });

            overviewContainer.innerHTML = catsHtml;
            if (window.initRevealAnimations) requestAnimationFrame(() => window.initRevealAnimations());

        } catch (e) {
            console.error(e);
            overviewContainer.innerHTML = '<p style="color:red;">Error loading pronunciation data.</p>';
        }
    }

    // Pronunciation Lesson Page Logic
    const lessonContainer = document.getElementById('pronunciation-lesson-container');
    if (lessonContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const lessonId = urlParams.get('id');
        
        if (!lessonId) {
            lessonContainer.innerHTML = '<p style="color:red;">Lesson ID not found.</p>';
            return;
        }

        try {
            let title = '';
            let authorHtml = '';
            let content = '';

            if (lessonId === 'intro') {
                const introDocRef = doc(db, 'pronunciation_intro', 'main');
                const introSnap = await getDoc(introDocRef);
                if (introSnap.exists()) {
                    const data = introSnap.data();
                    title = data.title || 'English Pronunciation Overview';
                    content = data.content || '';
                }
            } else {
                const type = urlParams.get('type');
                if (type === 'unit') {
                    const unitDocRef = doc(db, 'pronunciation_units', lessonId);
                    const unitSnap = await getDoc(unitDocRef);
                    if (unitSnap.exists()) {
                        const data = unitSnap.data();
                        title = data.title;
                        authorHtml = data.author ? `<p class="lesson-author">Written By ${data.author}</p>` : '';
                        content = data.content;
                    }
                } else {
                    const lessonDocRef = doc(db, 'pronunciation_lessons', lessonId);
                    const lessonSnap = await getDoc(lessonDocRef);
                    if (lessonSnap.exists()) {
                        const data = lessonSnap.data();
                        title = data.title;
                        authorHtml = data.author ? `<p class="lesson-author">Written By ${data.author}</p>` : '';
                        content = data.content;
                    }
                }
            }

            if (!title) {
                lessonContainer.innerHTML = '<p style="color:red;">Lesson not found.</p>';
                return;
            }

            lessonContainer.innerHTML = `
                <div class="lesson-header">
                    <h1 class="lesson-main-title">${title}</h1>
                    ${authorHtml}
                </div>
                <div class="lesson-content">
                    ${content}
                </div>
            `;
                if (typeof buildTOC === "function") buildTOC();
        } catch (e) {
            console.error(e);
            lessonContainer.innerHTML = '<p style="color:red;">Error loading lesson.</p>';
        }
    }
});

    function buildTOC() {
        const contentArea = document.querySelector('.lesson-content');
        const tocList = document.getElementById('toc-list');
        const tocContainer = document.getElementById('toc-container');
        
        if (!contentArea || !tocList || !tocContainer) return;
        
        const headings = contentArea.querySelectorAll('h2, h3');
        if (headings.length === 0) {
            tocContainer.parentElement.style.display = 'none';
            return;
        }
        
        let tocHtml = '';
        headings.forEach((heading, index) => {
            if (!heading.id) {
                heading.id = 'heading-' + index;
            }
            const level = heading.tagName.toLowerCase() === 'h3' ? 'toc-h3' : 'toc-h2';
            tocHtml += `<li class="${level}"><a href="#${heading.id}" data-id="${heading.id}">${heading.innerText}</a></li>`;
        });
        
        tocList.innerHTML = tocHtml;
        
        // Active scroll spy
        const links = tocList.querySelectorAll('a');
        window.addEventListener('scroll', () => {
            let currentId = '';
            headings.forEach(heading => {
                const rect = heading.getBoundingClientRect();
                if (rect.top <= 100) {
                    currentId = heading.id;
                }
            });
            links.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-id') === currentId) {
                    link.classList.add('active');
                }
            });
        });
    }
