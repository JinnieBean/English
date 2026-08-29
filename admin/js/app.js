import {
    signInWithEmailAndPassword, signOut, onAuthStateChanged,
    setPersistence, browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/**
 * ⚠️ ADMIN WHITELIST — only these accounts may open the admin panel.
 * Put the email/password account you created in
 * Firebase Console → Authentication → Users here (lowercase).
 * Any other signed-in account (e.g. a learner's Google account) is
 * immediately signed out of THIS panel.
 */
const ADMIN_EMAILS = [
    'dangkhoado16@gmail.com',
    'thornote@gmail.com' // TODO: replace with your real admin email
];

/**
 * Admin sessions live in sessionStorage (per-tab) so they NEVER share the
 * persisted learner session of the public site on the same origin:
 *  - signing in here does NOT sign in the study site
 *  - signing out on the study site does NOT kill this admin tab
 * Trade-off: closing every admin tab requires signing in again.
 * Top-level await guarantees persistence is applied BEFORE auth state is restored.
 */
try {
    await setPersistence(auth, browserSessionPersistence);
} catch (err) {
    console.warn('[auth] persistence change failed:', err?.code);
}
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { adminAuth as auth, adminDb as db } from './admin-firebase.js';
import { escapeHtml, friendlyError } from '../../assets/js/utils.js';
import { hooks, confirmDialog } from './common.js';
import {
    booksData, unitsData, vocabData, phrasalData, prepData,
    wordformData, patternData, lexicalData,
    fetchAll, assignData, addPaginationControls,
    populateBookSelects, populateUnitSelects
} from './data.js';
import {
    renderBooks, renderUnits, renderVocab, renderPhrasal,
    renderPrep, renderWordform, renderPattern, renderLexical
} from './crud.js';
import { initTinyMCE, loadGrammarData, loadPronunciationData, treeManagers } from './trees.js';
import './tools.js';

/* =========================================================
   DOM ELEMENTS + GLOBAL STATE
   ========================================================= */
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const logoutBtn = document.getElementById('logout-btn');
const loginError = document.getElementById('login-error');

// Prevent negative numbers on all number inputs globally
document.addEventListener('keydown', (e) => {
    if (e.target && e.target.type === 'number') {
        if (e.key === '-' || e.key === 'e' || e.key === '+' || e.key === '.') {
            e.preventDefault();
        }
    }
});
document.addEventListener('input', (e) => {
    if (e.target && e.target.type === 'number') {
        if (e.target.value !== '' && parseInt(e.target.value) < 1) {
            e.target.value = 1;
        }
    }
});

const navItems = document.querySelectorAll('.nav-item');
const tabPanes = document.querySelectorAll('.tab-pane');

const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
const adminSidebar = document.getElementById('admin-sidebar');
if (sidebarToggleBtn && adminSidebar) {
    if (localStorage.getItem('admin-sidebar-collapsed') === 'true') {
        adminSidebar.classList.add('collapsed');
    }
    sidebarToggleBtn.addEventListener('click', () => {
        adminSidebar.classList.toggle('collapsed');
        localStorage.setItem('admin-sidebar-collapsed', String(adminSidebar.classList.contains('collapsed')));
    });
}

// Modal dirty tracking
window.isModalDirty = false;
document.addEventListener('input', (e) => {
    if (e.target.closest('.modal')) window.isModalDirty = true;
});
document.addEventListener('change', (e) => {
    if (e.target.closest('.modal')) window.isModalDirty = true;
});

const closeBtns = document.querySelectorAll('.close-modal');
closeBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
        if (window.isModalDirty) {
            const ok = await confirmDialog({
                title: 'Discard changes?',
                message: 'You have unsaved changes. Close anyway?',
                confirmText: 'Discard'
            });
            if (!ok) return;
        }
        window.closeModalOverlay(e.target.getAttribute('data-target'));
    });
});

// Esc closes the topmost open modal (with dirty check)
document.addEventListener('keydown', async (e) => {
    if (e.key !== 'Escape') return;
    const openModals = [...document.querySelectorAll('.modal')].filter(m => m.style.display === 'flex');
    if (!openModals.length) return;
    const top = openModals[openModals.length - 1];
    if (top.id === 'confirm-modal') { top._resolve?.(false); return; }
    if (window.isModalDirty) {
        const ok = await confirmDialog({
            title: 'Discard changes?',
            message: 'You have unsaved changes. Close anyway?',
            confirmText: 'Discard'
        });
        if (!ok) return;
    }
    window.closeModalOverlay(top);
});

/* =========================================================
   TABS
   ========================================================= */
navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(nav => nav.classList.remove('active'));
        tabPanes.forEach(tab => tab.style.display = 'none');

        item.classList.add('active');
        document.getElementById(item.getAttribute('data-tab')).style.display = 'block';

        // Lazy-load heavy tabs on first visit
        if (item.dataset.tab === 'tab-grammar') {
            initTinyMCE();
            loadGrammarData();
        } else if (item.dataset.tab === 'tab-pronunciation') {
            initTinyMCE();
            loadPronunciationData();
        } else if (item.dataset.tab === 'tab-settings') {
            renderAuditLog();
        }
    });
});

/* =========================================================
   AUTH
   ========================================================= */
onAuthStateChanged(auth, async (user) => {
    // Enforce the admin whitelist: any other authenticated account
    // (e.g. a learner's Google account) is rejected and signed out here.
    if (user && !ADMIN_EMAILS.includes((user.email || '').toLowerCase())) {
        await signOut(auth);
        loginSection.style.display = 'flex';
        dashboardSection.style.display = 'none';
        const errEl = document.getElementById('login-error');
        if (errEl) {
            errEl.innerText = `“${user.email}” does not have admin access. Sign in with the administrator account.`;
        }
        return;
    }

    if (user) {
        loginSection.style.display = 'none';
        dashboardSection.style.display = 'flex';
        const emailEl = document.getElementById('admin-user-email');
        if (emailEl) emailEl.textContent = user.email || '';
        if (emailEl) emailEl.title = `Signed in as ${user.email || 'unknown'}`;
        loadData();
        renderAuditLog();
    } else {
        loginSection.style.display = 'flex';
        dashboardSection.style.display = 'none';
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.innerText = '';
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    // Fast-fail: don't even hit Auth for non-admin emails
    if (!ADMIN_EMAILS.includes(email)) {
        loginError.innerText = 'This email is not an administrator account.';
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error(error);
        loginError.innerText = friendlyError(error);
    }
});

logoutBtn.addEventListener('click', () => {
    signOut(auth);
});



async function loadData() {
    const results = await Promise.allSettled([
        fetchAll("books"), fetchAll("units"), fetchAll("vocabularies"),
        fetchAll("phrasal_verbs"), fetchAll("prep_phrases"), fetchAll("word_formations"),
        fetchAll("word_patterns"), fetchAll("lexical_expansions")
    ]);
    const names = ["books", "units", "vocabularies", "phrasal_verbs", "prep_phrases", "word_formations", "word_patterns", "lexical_expansions"];
    results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
            assignData(names[i], r.value);
        } else {
            console.error(`Error loading ${names[i]}:`, r.reason);
            window.showToast(`Could not load ${names[i]}: ${friendlyError(r.reason)}`, 'error');
        }
    });

    renderBooks();
    renderUnits();
    populateBookSelects();
    populateUnitSelects();
    addPaginationControls();
    renderVocab();
    renderPhrasal();
    renderPrep();
    renderWordform();
    renderPattern();
    renderLexical();
    updateDashboardStats();
    renderWordsPerBook();
}

/** Reload only what a given collection affects. */
async function reloadDataFor(collName) {
    try {
        if (collName === 'grammar_categories' || collName === 'grammar_lessons' || collName === 'grammar_units') {
            await loadGrammarData();
            return;
        }
        if (collName === 'pronunciation_categories' || collName === 'pronunciation_lessons' || collName === 'pronunciation_units') {
            await loadPronunciationData();
            return;
        }
        const targets = {
            books: ["books"], units: ["units"],
            vocabularies: ["vocabularies"], phrasal_verbs: ["phrasal_verbs"],
            prep_phrases: ["prep_phrases"], word_formations: ["word_formations"],
            word_patterns: ["word_patterns"], lexical_expansions: ["lexical_expansions"]
        };
        const names = targets[collName] || Object.values(targets).flat();
        const unique = [...new Set(names)];
        const values = await Promise.all(unique.map(fetchAll));
        values.forEach((v, i) => assignData(unique[i], v));
        renderBooks(); renderUnits();
        populateBookSelects(); populateUnitSelects();
        renderVocab(); renderPhrasal(); renderPrep(); renderWordform(); renderPattern(); renderLexical();
        updateDashboardStats();
    } catch (err) {
        console.error(err);
        window.showToast(friendlyError(err), 'error');
    }
}


/* =========================================================
   DASHBOARD STATS
   ========================================================= */
function updateDashboardStats() {
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val ?? 0;
    };
    set('stat-books', booksData.length);
    set('stat-units', unitsData.length);
    set('stat-vocab', vocabData.length);
    set('stat-phrasal', phrasalData.length);
    set('stat-grammar', treeManagers?.grammar.state.lessons.length ?? '...');
    set('stat-pronunciation', treeManagers?.pronunciation.state.lessons.length ?? '...');

    // Draft items across every managed collection
    const allArrays = [booksData, unitsData, vocabData, phrasalData, prepData,
        wordformData, patternData, lexicalData,
        treeManagers?.grammar.state.categories, treeManagers?.grammar.state.lessons,
        treeManagers?.grammar.state.units, treeManagers?.pronunciation.state.categories,
        treeManagers?.pronunciation.state.lessons, treeManagers?.pronunciation.state.units];
    const drafts = allArrays.reduce((n, arr) =>
        n + (Array.isArray(arr) ? arr.filter(x => x.status === 'draft').length : 0), 0);
    set('stat-drafts', drafts);
}

/** Words-per-book horizontal bars for the dashboard. */
async function renderWordsPerBook() {
    const panel = document.getElementById('words-per-book-panel');
    if (!panel) return;
    try {
        const perBook = new Map();
        booksData.forEach(b => perBook.set(b.id, { title: b.title || 'Untitled', count: 0 }));
        const unitBook = new Map(unitsData.map(u => [u.id, u.bookId]));
        vocabData.forEach(v => {
            const bid = unitBook.get(v.unitId);
            if (bid && perBook.has(bid)) perBook.get(bid).count++;
        });
        const rows = [...perBook.values()].filter(r => r.count > 0)
            .sort((a, b) => b.count - a.count);
        if (!rows.length) {
            panel.innerHTML = '<p class="qa-hint">No vocabulary yet.</p>';
            return;
        }
        const max = Math.max(...rows.map(r => r.count));
        panel.innerHTML = rows.map(r => `
            <div class="wpb-row">
                <span class="wpb-title" title="${escapeHtml(r.title)}">${escapeHtml(r.title)}</span>
                <div class="wpb-track"><div class="wpb-fill" style="width:${Math.round((r.count / max) * 100)}%"></div></div>
                <span class="wpb-count">${r.count}</span>
            </div>`).join('');
    } catch (e) {
        console.warn('[stats] words-per-book failed:', e);
        panel.innerHTML = '<p class="qa-hint">Could not load words-per-book stats.</p>';
    }
}
window.renderWordsPerBook = renderWordsPerBook;

/* ---------- Audit log viewer (Settings tab) ---------- */
async function renderAuditLog() {
    const tbodyEl = document.getElementById('audit-list');
    if (!tbodyEl) return;
    tbodyEl.innerHTML = '<tr><td colspan="5" class="empty-row">Loading&hellip;</td></tr>';
    try {
        const snap = await getDocs(query(collection(db, 'audit_logs'), orderBy('ts', 'desc'), limit(50)));
        if (!snap.docs.length) {
            tbodyEl.innerHTML = '<tr><td colspan="5" class="empty-row">No activity recorded yet.</td></tr>';
            return;
        }
        tbodyEl.innerHTML = snap.docs.map(d => {
            const a = d.data();
            const when = a.ts?.toDate ? a.ts.toDate().toLocaleString() : '';
            return `<tr>
                <td>${escapeHtml(when)}</td>
                <td>${escapeHtml(a.actor || '')}</td>
                <td><span class="badge">${escapeHtml(a.action || '')}</span></td>
                <td>${escapeHtml(a.coll || '')}</td>
                <td>${escapeHtml(a.label || '')}</td>
            </tr>`;
        }).join('');
    } catch (e) {
        console.warn('[audit] read failed:', e?.code);
        tbodyEl.innerHTML = `<tr><td colspan="5" class="empty-row">Could not load audit log (${escapeHtml(e?.code || 'error')}). Check Firestore rules.</td></tr>`;
    }
}
document.getElementById('audit-refresh-btn')?.addEventListener('click', renderAuditLog);

// Load grammar/pronunciation once at startup so dashboard stats are accurate
setTimeout(() => {
    if (auth.currentUser) {
        loadGrammarData();
        loadPronunciationData();
    }
}, 2500);


// refresh bars whenever data reloads
const _origReloadForWpb = reloadDataFor;
reloadDataFor = async function (c) { await _origReloadForWpb(c); renderWordsPerBook(); };
hooks.reload = reloadDataFor;
hooks.updateStats = updateDashboardStats;

/* =========================================================
   DARK MODE
   ========================================================= */
const dmBtn = document.getElementById('admin-dark-mode-btn');
if (dmBtn) {
    const dmIcon = document.getElementById('admin-dm-icon');
    const dmLabel = dmBtn.querySelector('.nav-text');
    const applyDarkIcon = (dark) => {
        if (dmIcon) dmIcon.className = dark ? 'fas fa-sun' : 'fas fa-moon';
        if (dmLabel) dmLabel.textContent = dark ? 'Light Mode' : 'Dark Mode';
        dmBtn.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    };
    applyDarkIcon(document.documentElement.getAttribute('data-theme') === 'dark');
    dmBtn.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('admin-theme-dark', 'false');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('admin-theme-dark', 'true');
        }
        applyDarkIcon(!isDark);
    });
}
