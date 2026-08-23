import { collection, getDocs, doc, writeBatch, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from '../../assets/js/firebase-config.js';
import { friendlyError, applyAudioVersion, AUDIO_VERSION } from '../../assets/js/utils.js';
import { hooks, confirmDialog } from './common.js';
import { vocabData, wordformData, lexicalData, fetchAll } from './data.js';

/* =========================================================
   DATA TOOLS — Export / Import JSON
   ========================================================= */
const ALL_COLLECTIONS = [
    'books', 'units', 'vocabularies', 'phrasal_verbs', 'prep_phrases',
    'word_formations', 'word_patterns', 'lexical_expansions',
    'grammar_categories', 'grammar_lessons', 'grammar_units',
    'pronunciation_categories', 'pronunciation_lessons', 'pronunciation_units'
];

document.getElementById('export-all-btn')?.addEventListener('click', async () => {
    try {
        window.showToast('Collecting data…', 'info');
        const dump = {};
        for (const name of ALL_COLLECTIONS) {
            const snap = await getDocs(collection(db, name));
            dump[name] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
        const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `thors-notes-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        window.showToast('Export complete.', 'success');
    } catch (err) {
        console.error(err);
        window.showToast(friendlyError(err), 'error');
    }
});

function stripMeta(obj) {
    const { id, createdAt, updatedAt, ...clean } = obj;
    return clean;
}

document.getElementById('import-btn')?.addEventListener('click', async () => {
    const collName = document.getElementById('import-collection')?.value;
    const fileInput = document.getElementById('import-file');
    const file = fileInput?.files?.[0];
    if (!collName || !file) {
        window.showToast('Choose a collection and a JSON file first.', 'info');
        return;
    }
    try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        let docs = Array.isArray(parsed) ? parsed : (Array.isArray(parsed[collName]) ? parsed[collName] : null);
        if (!docs) {
            window.showToast('JSON format not recognised — expected an array of documents.', 'error');
            return;
        }
        docs = docs.filter(d => d && typeof d === 'object');
        if (!docs.length) { window.showToast('The file contains no documents.', 'error'); return; }

        const existingIds = new Set((await fetchAll(collName)).map(d => d.id));
        const newCount = docs.filter(d => !d.id || !existingIds.has(d.id)).length;
        const updateCount = docs.length - newCount;

        const ok = await confirmDialog({
            title: `Import into "${collName}"?`,
            message: `${docs.length} documents found — ${newCount} will be created, ${updateCount} existing will be overwritten by ID.`,
            confirmText: 'Import'
        });
        if (!ok) return;

        let done = 0;
        const CHUNK = 300;
        for (let i = 0; i < docs.length; i += CHUNK) {
            const batch = writeBatch(db);
            for (const raw of docs.slice(i, i + CHUNK)) {
                const data = { ...stripMeta(raw), updatedAt: serverTimestamp() };
                const isNew = !raw.id || !existingIds.has(raw.id);
                if (isNew) data.createdAt = serverTimestamp();
                const ref = raw.id ? doc(db, collName, raw.id) : doc(collection(db, collName));
                batch.set(ref, data, { merge: false });
            }
            await batch.commit();
            done += Math.min(CHUNK, docs.length - i);
            window.showToast(`Imported ${done}/${docs.length}…`, 'info');
        }
        fileInput.value = '';
        await hooks.reload(null);
        window.showToast(`Import complete — ${docs.length} documents written.`, 'success');
    } catch (err) {
        console.error(err);
        window.showToast(friendlyError(err), 'error');
    }
});

/* =========================================================
   AUDIO URL MAINTENANCE — bulk regex find & replace
   Scans every audio-bearing field:
     vocabularies.audio · word_formations.forms[].audios[].url
     lexical_expansions.words[].audio
   ========================================================= */
const AUDIO_COLLECTIONS = ['vocabularies', 'word_formations', 'lexical_expansions'];

// Show the currently forced Longman audio version in the Settings panel
document.getElementById('audio-version-display')?.replaceChildren(document.createTextNode(AUDIO_VERSION));

const AUDIO_DATA_BY_COLL = () => ({
    vocabularies: vocabData,
    word_formations: wordformData,
    lexical_expansions: lexicalData
});

/** Deep-clone a doc, run replacer over its audio URLs.
 *  Returns { out, urlsChanged } — out is null when nothing matched. */
function mapAudioUrls(collName, data, replacer) {
    let urlsChanged = 0;
    let out;
    if (collName === 'vocabularies' && data.audio) {
        const nv = replacer(data.audio);
        if (nv !== data.audio) { out = { ...data, audio: nv }; urlsChanged++; }
    } else if (collName === 'word_formations' && Array.isArray(data.forms)) {
        let forms = data.forms, touched = false;
        forms = forms.map(f => {
            if (!Array.isArray(f.audios)) return f;
            const audios = f.audios.map(a => {
                if (!a.url) return a;
                const nv = replacer(a.url);
                if (nv !== a.url) { urlsChanged++; touched = true; return { ...a, url: nv }; }
                return a;
            });
            return touched ? { ...f, audios } : f;
        });
        if (urlsChanged > 0) out = { ...data, forms };
    } else if (collName === 'lexical_expansions' && Array.isArray(data.words)) {
        let words = data.words, touched = false;
        words = words.map(w => {
            if (!w.audio) return w;
            const nv = replacer(w.audio);
            if (nv !== w.audio) { urlsChanged++; touched = true; return { ...w, audio: nv }; }
            return w;
        });
        if (urlsChanged > 0) out = { ...data, words };
    }
    return { out, urlsChanged };
}

function getAudioReplacer() {
    const findInput = document.getElementById('audio-find');
    const replaceInput = document.getElementById('audio-replace');
    const pattern = findInput?.value.trim();
    const replacement = replaceInput?.value ?? '';
    if (!pattern) {
        window.showToast('Enter a "Find" regular expression first.', 'info');
        return null;
    }
    let regex;
    try {
        regex = new RegExp(pattern, 'g');
    } catch (err) {
        window.showToast(`Invalid regular expression: ${friendlyError(err)}`, 'error');
        return null;
    }
    return (url) => url.replace(regex, replacement);
}

document.getElementById('audio-preview-btn')?.addEventListener('click', () => {
    const replacer = getAudioReplacer();
    if (!replacer) return;

    const statusEl = document.getElementById('audio-tool-status');
    const dataByColl = AUDIO_DATA_BY_COLL();
    let totalDocs = 0, totalUrls = 0;
    const perColl = [];

    AUDIO_COLLECTIONS.forEach(coll => {
        let docs = 0, urls = 0;
        (dataByColl[coll] || []).forEach(d => {
            const { urlsChanged } = mapAudioUrls(coll, d, replacer);
            if (urlsChanged > 0) { docs++; urls += urlsChanged; }
        });
        if (docs > 0) perColl.push(`${coll}: ${docs} doc(s), ${urls} URL(s)`);
        totalDocs += docs; totalUrls += urls;
    });

    if (statusEl) {
        statusEl.textContent = totalDocs
            ? `Matched ${totalDocs} document(s), ${totalUrls} URL(s). Review then press "Apply to database".`
            : 'No matching audio URLs found.';
    }
    window.showToast(
        totalDocs
            ? `Found ${totalUrls} URL(s) across ${totalDocs} document(s) — ${perColl.join(' | ')}`
            : 'No matching audio URLs found.',
        totalDocs ? 'info' : 'error'
    );
});

document.getElementById('audio-apply-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('audio-apply-btn');
    if (btn?.dataset.busy === '1') return;
    const replacer = getAudioReplacer();
    if (!replacer) return;

    const dataByColl = AUDIO_DATA_BY_COLL();
    const pending = []; // [{ coll, id, field, value }]
    let totalDocs = 0, totalUrls = 0;

    AUDIO_COLLECTIONS.forEach(coll => {
        (dataByColl[coll] || []).forEach(d => {
            const { out, urlsChanged } = mapAudioUrls(coll, d, replacer);
            if (!out) return;
            totalDocs++; totalUrls += urlsChanged;
            const field = coll === 'vocabularies' ? 'audio' : coll === 'word_formations' ? 'forms' : 'words';
            pending.push({ coll, id: d.id, field, value: out[field], label: coll === 'vocabularies' ? out.audio : `${out[field]?.length ?? 0} item(s)` });
        });
    });

    if (!pending.length) {
        window.showToast('No matching audio URLs found.', 'info');
        return;
    }

    const ok = await confirmDialog({
        title: 'Rewrite audio URLs?',
        message: `${totalDocs} document(s) will be updated (${totalUrls} URL(s)). This cannot be undone with Undo — export a backup first if unsure.`,
        confirmText: 'Update'
    });
    if (!ok) return;

    let origHtml = '';
    if (btn) { origHtml = btn.innerHTML; btn.dataset.busy = '1'; btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating…'; }

    try {
        const CHUNK = 300;
        let written = 0;
        for (let i = 0; i < pending.length; i += CHUNK) {
            const batch = writeBatch(db);
            for (const item of pending.slice(i, i + CHUNK)) {
                batch.update(doc(db, item.coll, item.id), { [item.field]: item.value, updatedAt: serverTimestamp() });
            }
            await batch.commit();
            written += Math.min(CHUNK, pending.length - i);
            window.showToast(`Updated ${written}/${pending.length} documents…`, 'info');
        }
        await hooks.reload(null);
        const statusEl = document.getElementById('audio-tool-status');
        if (statusEl) statusEl.textContent = '';
        window.showToast(`Done — ${totalDocs} document(s) updated, ${totalUrls} URL(s) rewritten.`, 'success');
    } catch (err) {
        console.error(err);
        window.showToast(friendlyError(err), 'error');
    } finally {
        if (btn) { btn.dataset.busy = ''; btn.disabled = false; btn.innerHTML = origHtml; }
    }
});
