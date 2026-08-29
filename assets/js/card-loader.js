/**
 * card-loader.js — Rebuilds flashcard objects for SRS entries whose `src`
 * tag points at a non-vocabulary collection (phrasal/prep/pattern/wordform/
 * lexical) or at a generated Grammar/Pronunciation lesson card.
 *
 * Shared by review.js (due sessions) and content-tree.js (lesson flashcards)
 * so the card shape and the generated-card algorithm stay identical to the
 * ones main.js builds on the unit_* pages.
 */
import { collection, getDocs, doc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-config.js';

/** src tag -> Firestore collection. */
export const SRC_COLLECTIONS = {
    phrasal: 'phrasal_verbs',
    prep: 'prep_phrases',
    pattern: 'word_patterns',
    wordform: 'word_formations',
    lexical: 'lexical_expansions',
    grammar_lesson: 'grammar_lessons',
    grammar_unit: 'grammar_units',
    pronunciation_lesson: 'pronunciation_lessons',
    pronunciation_unit: 'pronunciation_units'
};

const LESSON_SRCS = new Set(['grammar_lesson', 'grammar_unit', 'pronunciation_lesson', 'pronunciation_unit']);

/** True when an SRS entry can be turned back into a flashcard. */
export function isLoadable(entry) {
    return entry.next !== '9999-12-31' && (!entry.src || entry.src in SRC_COLLECTIONS);
}

/** Normalise "action n" style form titles to the site-wide "action (n)". */
const formWord = (t) => String(t || '').replace(/\s+\b(v|n|adj|adv|prep|conj|pron|det)\b\.?\s*$/i, ' ($1)');

/**
 * Deterministically derive Q/A cards from lesson HTML: every h2/h3 heading
 * becomes the prompt and the first non-empty text block under it the answer.
 * Card ids are `<docId>#<position>` — stable while the content is unchanged.
 */
export function lessonCards(html, docId, src) {
    const wrap = new DOMParser().parseFromString(`<div>${html || ''}</div>`, 'text/html').body.firstElementChild;
    if (!wrap) return [];
    const blocks = [...wrap.children];
    const cards = [];
    blocks.forEach((el, i) => {
        if (!/^H[23]$/.test(el.tagName)) return;
        const q = el.textContent.trim().replace(/\s+/g, ' ');
        if (!q) return;
        let a = '';
        for (let j = i + 1; j < blocks.length; j++) {
            const b = blocks[j];
            if (/^H[1-6]$/.test(b.tagName)) break;
            const t = b.textContent.trim().replace(/\s+/g, ' ');
            if (t) { a = t; break; }
        }
        if (!a) return;
        cards.push({
            id: `${docId}#${cards.length}`,
            word: q,
            def: a.length > 240 ? a.slice(0, 237) + '…' : a,
            example: '', pron: '', audio: '', unitId: null, src
        });
    });
    return cards;
}

function docCard(src, d, unitId) {
    if (src === 'phrasal') {
        return { id: d.id, word: d.word, def: d.def, example: d.example, pron: d.pron || '', audio: d.audio || '', unitId, src };
    }
    if (src === 'prep') {
        return { id: d.id, word: d.word, def: d.def, example: d.example, pron: '', audio: '', unitId, src };
    }
    if (src === 'pattern') {
        return { id: d.id, word: d.word, def: d.pattern ? `${d.pattern} — ${d.def || ''}` : (d.def || ''), example: d.example || '', pron: '', audio: '', unitId, src };
    }
    return null;
}

/**
 * Rebuild flashcards for src-tagged SRS entries. Entries look like
 * { id, unitId, src } where id is a doc id (or `docId#index` for flattened
 * wordform/lexical/lesson rows).
 */
export async function loadSrcCards(entries) {
    const cards = [];
    const bySrc = {};
    entries.forEach(e => { (bySrc[e.src] ||= []).push(e); });

    await Promise.all(Object.entries(bySrc).map(async ([src, list]) => {
        const coll = SRC_COLLECTIONS[src];
        if (!coll) return;

        // Lesson-generated cards: fetch each doc and re-run the generator.
        if (LESSON_SRCS.has(src)) {
            const ids = [...new Set(list.map(e => String(e.id).split('#')[0]))];
            await Promise.all(ids.map(async (docId) => {
                try {
                    const snap = await getDoc(doc(db, coll, docId));
                    if (!snap.exists() || snap.data().status === 'draft') return;
                    const want = new Set(list
                        .filter(e => String(e.id).startsWith(docId + '#'))
                        .map(e => +String(e.id).split('#')[1]));
                    lessonCards(snap.data().content, docId, src)
                        .forEach((c, i) => { if (want.has(i)) cards.push(c); });
                } catch (e) {
                    console.warn('[card-loader] lesson fetch failed', coll, docId, e);
                }
            }));
            return;
        }

        // Unit-scoped vocabulary-family collections.
        const byUnit = {};
        list.forEach(e => { if (e.unitId) (byUnit[e.unitId] ||= []).push(e); });
        await Promise.all(Object.entries(byUnit).map(async ([unitId, es]) => {
            try {
                const snap = await getDocs(query(collection(db, coll), where('unitId', '==', unitId)));
                const wanted = new Set(es.map(e => e.id));
                snap.docs.forEach(d => {
                    const data = { id: d.id, ...d.data() };
                    if (data.status === 'draft') return;
                    if (src === 'wordform') {
                        (data.forms || []).forEach((f, i) => {
                            const cid = `${d.id}#${i}`;
                            if (!wanted.has(cid) || !f.title || !f.definitions) return;
                            const a0 = (f.audios || [])[0] || {};
                            cards.push({
                                id: cid, word: formWord(f.title), def: f.definitions,
                                example: (f.examples || '').split('\n')[0] || '',
                                pron: a0.pron || '', audio: a0.url || '', unitId, src
                            });
                        });
                    } else if (src === 'lexical') {
                        (data.words || []).forEach((w, i) => {
                            const cid = `${d.id}#${i}`;
                            if (!wanted.has(cid) || !w.word || !w.def) return;
                            cards.push({
                                id: cid, word: w.word, def: w.def, example: w.example || '',
                                pron: w.pron || '', audio: w.audio || '', unitId, src
                            });
                        });
                    } else {
                        if (!wanted.has(d.id)) return;
                        const c = docCard(src, data, unitId);
                        if (c && c.word && c.def) cards.push(c);
                    }
                });
            } catch (e) {
                console.warn('[card-loader] unit fetch failed', src, unitId, e);
            }
        }));
    }));

    return cards;
}
