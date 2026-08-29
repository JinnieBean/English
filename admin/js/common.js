import { collection, setDoc, getDoc, addDoc, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { adminAuth as auth, adminDb as db } from './admin-firebase.js';
import { friendlyError } from '../../assets/js/utils.js';

/** Cross-module hooks wired by app.js (avoids circular imports). */
export const hooks = {
    reload: async () => {},
    logAudit: async () => {},
    updateStats: () => {}
};

/* =========================================================
   TINY MCE CLEANUP
   ========================================================= */
window.closeTinyMCEPopups = function () {
    try {
        if (typeof tinymce !== 'undefined' && tinymce.editors) {
            Array.from(tinymce.editors).forEach(ed => {
                if (ed && ed.fire) ed.fire('blur');
            });
            document.querySelectorAll('.tox-tinymce-aux').forEach(aux => {
                aux.innerHTML = '';
            });
        }
    } catch (e) {
        console.warn('Silent error in closeTinyMCEPopups:', e);
    }
};

/* =========================================================
   GENERIC UI HELPERS
   ========================================================= */

/** Close any modal overlay consistently (single source of truth). */
window.closeModalOverlay = function (modalOrId) {
    const modal = typeof modalOrId === 'string' ? document.getElementById(modalOrId) : modalOrId;
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
    window.closeTinyMCEPopups();
    window.isModalDirty = false;
};
// Legacy alias used by inline handlers
window.closeModal = function (id) { window.closeModalOverlay(id); };

export function openModal(modal) {
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
    window.isModalDirty = false;
    const content = modal.querySelector('.modal-content');
    if (content) content.scrollTop = 0;
    setTimeout(() => {
        const target = modal.querySelector('form input[type="text"], form textarea') || modal.querySelector('form select, form input:not([type="hidden"]):not([type="checkbox"])');
        if (target) target.focus();
    }, 100);
}

/** Toast with optional action button (e.g. Undo). */
window.showToast = function (message, type = 'success', action = null) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast ' + type;

    let icon = '';
    if (type === 'success') icon = '<i class="fas fa-check-circle" style="color: #4caf50;"></i>';
    else if (type === 'error') icon = '<i class="fas fa-exclamation-circle" style="color: #d32f2f;"></i>';
    else icon = '<i class="fas fa-info-circle" style="color: #2196f3;"></i>';

    const inner = document.createElement('div');
    inner.style.cssText = 'display:flex; align-items:center; gap:10px;';
    const ic = document.createElement('span');
    ic.innerHTML = icon;
    const msg = document.createElement('span');
    msg.className = 'toast-message';
    msg.textContent = message;
    inner.appendChild(ic);
    inner.appendChild(msg);

    if (action?.label) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'toast-action-btn';
        btn.textContent = action.label;
        btn.addEventListener('click', () => { action.onClick?.(); dismiss(); });
        inner.appendChild(btn);
    }

    toast.appendChild(inner);
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);

    let dismissed = false;
    const dismiss = () => {
        if (dismissed) return;
        dismissed = true;
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    };
    setTimeout(dismiss, action ? 6500 : 3000);
}

/** Promise-based confirmation dialog replacing native confirm(). */
let _confirmEls = null;
function ensureConfirmOverlay() {
    if (_confirmEls) return _confirmEls;
    const overlay = document.createElement('div');
    overlay.className = 'modal confirm-overlay';
    overlay.id = 'confirm-modal';
    overlay.innerHTML = `
        <div class="modal-content confirm-box" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <h3 id="confirm-title">Please confirm</h3>
            <p id="confirm-message"></p>
            <div class="confirm-actions">
                <button type="button" class="btn-secondary" id="confirm-cancel">Cancel</button>
                <button type="button" class="btn-primary btn-danger" id="confirm-ok">Delete</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay._resolve?.(false);
    });
    document.getElementById('confirm-cancel').addEventListener('click', () => overlay._resolve?.(false));
    document.getElementById('confirm-ok').addEventListener('click', () => overlay._resolve?.(true));
    _confirmEls = overlay;
    return overlay;
}

export function confirmDialog({ title = 'Please confirm', message = '', confirmText = 'Delete', danger = true } = {}) {
    const overlay = ensureConfirmOverlay();
    overlay.querySelector('#confirm-title').textContent = title;
    overlay.querySelector('#confirm-message').textContent = message;
    const okBtn = overlay.querySelector('#confirm-ok');
    okBtn.textContent = confirmText;
    okBtn.classList.toggle('btn-danger', danger);
    overlay.style.display = 'flex';
    document.body.classList.add('modal-open');
    okBtn.focus();
    return new Promise((resolve) => {
        overlay._resolve = (val) => {
            overlay._resolve = null;
            overlay.style.display = 'none';
            document.body.classList.remove('modal-open');
            resolve(val);
        };
    });
}

/** Form submit wrapper: prevents double-submit and shows busy state. */
export function onSubmit(form, handler) {
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        if (btn && btn.dataset.busy === '1') return;
        let origHtml = '';
        if (btn) {
            origHtml = btn.innerHTML;
            btn.dataset.busy = '1';
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…';
        }
        try {
            await handler();
        } catch (err) {
            console.error(err);
            window.showToast(friendlyError(err), 'error');
        } finally {
            if (btn) {
                btn.dataset.busy = '';
                btn.disabled = false;
                btn.innerHTML = origHtml;
            }
        }
    });
}

/** Add audit timestamps to every write. */
export function stampCreate(data) {
    return { ...data, status: data.status || 'published', createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
}
export function stampUpdate(data) {
    return { ...data, updatedAt: serverTimestamp() };
}

/** Client-side duplicate detection against already-loaded data. */
export function isDuplicate(items, match, excludeId) {
    return items.some(x => x.id !== excludeId && match(x));
}

export function dupToast(label) {
    window.showToast(`A ${label} with these details already exists.`, 'error');
}

/** Delete helper: confirm dialog + undo toast. */
export async function performDelete(collName, id, label, extraWarning = '') {
    const ok = await confirmDialog({
        title: `Delete this ${label}?`,
        message: `This will permanently remove the ${label}.${extraWarning ? ' ' + extraWarning : ''}`,
        confirmText: 'Delete'
    });
    if (!ok) return;
    try {
        const ref = doc(db, collName, id);
        const snap = await getDoc(ref);
        await deleteDoc(ref);
        await logAudit('delete', collName, id, label);
        if (snap.exists()) {
            const saved = snap.data();
            window.showToast(`${label} deleted.`, 'success', {
                label: 'Undo',
                onClick: async () => {
                    try {
                        await setDoc(ref, saved);
                        await logAudit('restore', collName, id, label);
                        await hooks.reload(collName);
                        window.showToast('Delete undone.', 'success');
                    } catch (err) {
                        console.error(err);
                        window.showToast(friendlyError(err), 'error');
                    }
                }
            });
        } else {
            window.showToast(`${label} deleted.`, 'success');
        }
        await hooks.reload(collName);
    } catch (error) {
        console.error(error);
        window.showToast(friendlyError(error), 'error');
    }
}


/** Resolve a site-root-relative asset path for use inside /admin/.
 *  Remote URLs and data/blob URIs pass through untouched. */
export function assetUrl(path) {
    const p = path || 'assets/images/book_cover.webp';
    if (/^(https?:|data:|blob:)/i.test(p)) return p;
    return '../' + String(p).replace(/^\//, '');
}

export async function logAudit(action, coll, docId, label = '') {
    try {
        await addDoc(collection(db, 'audit_logs'), {
            actor: auth.currentUser?.email || 'unknown',
            action, coll,
            docId: String(docId || ''),
            label: String(label || '').slice(0, 200),
            ts: serverTimestamp()
        });
    } catch (e) {
        console.warn('[audit] write skipped:', e?.code || e?.message);
    }
}

/** Map a record to its public page so admins can preview it on the site. */
export function publicUrlFor(coll, item) {
    if (!item) return null;
    const u = item.unitId ? encodeURIComponent(item.unitId) : null;
    const id = encodeURIComponent(item.id || '');
    switch (coll) {
        case 'books': return 'book.html';
        case 'units': return item.bookId ? `units.html?bookId=${encodeURIComponent(item.bookId)}` : null;
        case 'vocabularies': return u && `unit_detail.html?id=${u}`;
        case 'phrasal_verbs': return u && `unit_phrasal.html?id=${u}`;
        case 'prep_phrases': return u && `unit_prep.html?id=${u}`;
        case 'word_formations': return u && `unit_wordform.html?id=${u}`;
        case 'word_patterns': return u && `unit_pattern.html?id=${u}`;
        case 'lexical_expansions': return u && `unit_lexical.html?id=${u}`;
        case 'grammar_categories': return 'grammar.html';
        case 'grammar_lessons': return `grammar_lesson.html?id=${id}&type=lesson`;
        case 'grammar_units': return `grammar_lesson.html?id=${id}&type=unit`;
        case 'pronunciation_categories': return 'pronunciation.html';
        case 'pronunciation_lessons': return `pronunciation_lesson.html?id=${id}&type=lesson`;
        case 'pronunciation_units': return `pronunciation_lesson.html?id=${id}&type=unit`;
        default: return null;
    }
}

/**
 * Generic row drag-reorder for admin tables.
 * tbody rows must be <tr draggable="true" data-id>; calls persist(idsInNewOrder).
 */
export function enableDragReorder(tbody, persist) {
    let dragging = null;

    tbody.addEventListener('dragstart', (e) => {
        const tr = e.target.closest('tr[draggable="true"]');
        if (!tr) return;
        dragging = tr;
        tr.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        try { e.dataTransfer.setData('text/plain', ''); } catch { /* IE */ }
    });

    tbody.addEventListener('dragover', (e) => {
        if (!dragging) return;
        e.preventDefault();
        const over = e.target.closest('tr[draggable="true"]');
        if (!over || over === dragging) return;
        const rect = over.getBoundingClientRect();
        const before = (e.clientY - rect.top) < rect.height / 2;
        over.parentNode.insertBefore(dragging, before ? over : over.nextSibling);
    });

    tbody.addEventListener('drop', (e) => { if (dragging) e.preventDefault(); });

    tbody.addEventListener('dragend', () => {
        if (!dragging) return;
        dragging.classList.remove('dragging');
        const ids = [...tbody.querySelectorAll('tr[draggable="true"]')]
            .map(tr => tr.dataset.id).filter(Boolean);
        dragging = null;
        if (ids.length) persist(ids);
    });
}
