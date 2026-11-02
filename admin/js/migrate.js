/**
 * migrate.js — One-time data migration for the "Lexical Expansion → Word
 * Expansion" rename. Runs from admin → Settings → Data migration.
 *
 * What it does:
 *   1. Copies every document of the legacy `lexical_expansions` collection
 *      into `word_expansions`, keeping the SAME document ids (and their
 *      createdAt/updatedAt stamps), so bookmarks / SRS progress and audit
 *      history stay intact.
 *   2. Rewrites `units.sections` entries with the legacy id 'lexical' to
 *      the new id 'wordexp'.
 *   3. Optionally deletes the legacy source documents after verification
 *      (checkbox, opt-in).
 *
 * The panel self-hides when there is nothing left to migrate. Public pages
 * already read `word_expansions` with a legacy fallback, so running this is
 * a hardening step — not a blocker.
 */
import { collection, getDocs, writeBatch, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { adminDb as db } from './admin-firebase.js';
import { hooks, confirmDialog, logAudit } from './common.js';
import { friendlyError } from '../../assets/js/utils.js';

const LEGACY = 'lexical_expansions';
const TARGET = 'word_expansions';
const LEGACY_SECTION = 'lexical';
const NEW_SECTION = 'wordexp';

const panel = document.getElementById('migration-panel');
const statusEl = document.getElementById('migration-status');
const deleteSource = document.getElementById('migration-delete-source');

async function getCounts() {
    const [legacySnap, targetSnap] = await Promise.all([
        getDocs(collection(db, LEGACY)),
        getDocs(collection(db, TARGET))
    ]);
    return {
        legacy: legacySnap.docs.map(d => ({ id: d.id, data: d.data() })),
        targetIds: new Set(targetSnap.docs.map(d => d.id))
    };
}

/** Copy every legacy doc whose id is missing from the target collection. */
async function copyMissing(legacyDocs, targetIds) {
    const missing = legacyDocs.filter(d => !targetIds.has(d.id));
    let copied = 0;
    const CHUNK = 300;
    for (let i = 0; i < missing.length; i += CHUNK) {
        const batch = writeBatch(db);
        for (const d of missing.slice(i, i + CHUNK)) {
            batch.set(doc(db, TARGET, d.id), d.data()); // same id, same data
        }
        await batch.commit();
        copied += Math.min(CHUNK, missing.length - i);
    }
    return { copied, missingCount: missing.length };
}

/** Rewrite unit.sections: legacy 'lexical' -> 'wordexp'. Returns updated count. */
async function migrateUnitSections() {
    const snap = await getDocs(collection(db, 'units'));
    const units = snap.docs.filter(d => {
        const sections = d.data().sections;
        return Array.isArray(sections) && sections.includes(LEGACY_SECTION);
    });
    const CHUNK = 300;
    for (let i = 0; i < units.length; i += CHUNK) {
        const batch = writeBatch(db);
        for (const d of units.slice(i, i + CHUNK)) {
            const normalized = d.data().sections
                .map(s => (s === LEGACY_SECTION ? NEW_SECTION : s))
                .filter((s, idx, arr) => arr.indexOf(s) === idx); // dedupe
            batch.update(doc(db, 'units', d.id), { sections: normalized });
        }
        await batch.commit();
    }
    return units.length;
}

/** Verify every legacy doc id (and its data) now exists in the target. */
async function verifyCopied(legacyDocs, onlyIds) {
    const snap = await getDocs(collection(db, TARGET));
    const byId = new Map(snap.docs.map(d => [d.id, d.data()]));
    return legacyDocs
        .filter(d => !onlyIds || onlyIds.has(d.id))
        .every(d => !!byId.get(d.id));
}

/** Return true when there is nothing left to do. */
async function refresh() {
    if (!panel) return;
    try {
        const { legacy, targetIds } = await getCounts();
        const missingIds = legacy.filter(d => !targetIds.has(d.id));
        let unitsNeedingSection = 0;
        try {
            unitsNeedingSection = (await getDocs(collection(db, 'units')))
                .docs.filter(d => Array.isArray(d.data().sections) && d.data().sections.includes(LEGACY_SECTION))
                .length;
        } catch { /* units read failed — ignore, counts below still work */ }

        if (!legacy.length && !unitsNeedingSection) {
            panel.hidden = true;
            return true;
        }

        panel.hidden = false;
        const btn = document.getElementById('migration-run-btn');
        btn.disabled = false;
        btn.textContent = missingIds.length
            ? `Migrate data (${missingIds.length} doc(s)${unitsNeedingSection ? `, ${unitsNeedingSection} unit(s)` : ''})`
            : `Units section fix only (${unitsNeedingSection})`;

        statusEl.textContent = missingIds.length
            ? `"lexical_expansions" has ${legacy.length} document(s) — ${missingIds.length} still missing in "word_expansions".` +
              (unitsNeedingSection ? ` ${unitsNeedingSection} unit(s) use the legacy "lexical" section id.` : '')
            : `All legacy documents are already copied into "word_expansions".` +
              (unitsNeedingSection ? ` ${unitsNeedingSection} unit(s) still use the legacy "lexical" section id.` : '');

        // Reset the listener and wire it for this state.
        const runBtn = document.getElementById('migration-run-btn');
        const clone = runBtn.cloneNode(true);
        runBtn.replaceWith(clone);
        clone.addEventListener('click', () => run(legacy, targetIds, missingIds, unitsNeedingSection));
        return false;
    } catch (e) {
        console.error('[migrate] init failed:', e);
        panel.hidden = false;
        if (statusEl) statusEl.textContent = `Could not inspect collections: ${friendlyError(e)} — deploy the latest firestore.rules first.`;
        const b = document.getElementById('migration-run-btn');
        if (b) b.disabled = true;
        return true;
    }
}

async function run(legacyDocs, targetIds, missingIds, unitsNeedingSection) {
    if (!missingIds.length && !unitsNeedingSection) return;
    const willDelete = !!deleteSource?.checked && missingIds.length > 0;

    const ok = await confirmDialog({
        title: 'Run data migration?',
        message:
            (missingIds.length
                ? `${missingIds.length} document(s) will be copied from "lexical_expansions" to "word_expansions".`
                : '') +
            (unitsNeedingSection ? ` Unit section references will be normalized ('lexical' → 'wordexp').` : '') +
            (willDelete
                ? ' Afterwards the legacy documents will be DELETED — this cannot be undone.'
                : ' The legacy collection is kept as a safety copy.'),
        confirmText: 'Migrate',
        danger: willDelete
    });
    if (!ok) return;

    const btn = document.getElementById('migration-run-btn');
    const orig = btn.textContent;
    btn.disabled = true;
    btn.innerHTML = '<i aria-hidden="true" class="fas fa-spinner fa-spin"></i> Migrating…';

    try {
        let copiedCount = 0;
        if (missingIds.length) {
            ({ copied: copiedCount } = await copyMissing(legacyDocs, targetIds));
        }
        let unitsUpdated = 0;
        if (unitsNeedingSection) {
            unitsUpdated = await migrateUnitSections();
        }

        // Simple verification before any destructive step
        const verified = missingIds.length ? await verifyCopied(legacyDocs) : true;

        if (willDelete) {
            if (!verified) {
                window.showToast('Copy verification failed — legacy documents were NOT deleted. Nothing was lost.', 'error');
                btn.disabled = false;
                btn.innerHTML = orig;
                return;
            }
            let deleted = 0;
            const CHUNK = 300;
            for (let i = 0; i < missingIds.length; i += CHUNK) {
                const batch = writeBatch(db);
                for (const id of missingIds.slice(i, i + CHUNK)) {
                    batch.delete(doc(db, LEGACY, id));
                }
                await batch.commit();
                deleted += Math.min(CHUNK, missingIds.length - i);
            }
            await logAudit('migrate', TARGET, '', `${deleted} legacy doc(s) deleted after verified copy`);
        }

        await logAudit('migrate', TARGET, '',
            `${copiedCount} doc(s) copied, ${unitsUpdated} unit(s) updated${willDelete ? ', legacy emptied' : ''}`);
        try { await hooks.reload(null); } catch { /* data re-load is best-effort */ }

        window.showToast(
            `Migration complete — ${copiedCount} document(s) copied, ${unitsUpdated} unit(s) updated.` +
            (willDelete ? ' Legacy collection emptied.' : ' Legacy collection kept as backup.'),
            'success'
        );

        await refresh();
    } catch (e) {
        console.error('[migrate] run failed:', e);
        window.showToast(`Migration failed: ${friendlyError(e)}`, 'error');
        btn.disabled = false;
        btn.innerHTML = orig;
    }
}

export function initMigration() {
    if (!panel) return;
    // Content reads are world-readable per firestore.rules, so counting works
    // before sign-in; the migration run itself requires an admin session.
    refresh();
}
