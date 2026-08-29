/**
 * search-index.js — Shared site-wide search index.
 * Built lazily on the FIRST keystroke (never on focus) and cached in
 * sessionStorage, then consumed by both the header dropdown (ui.js) and
 * the full results page (search.js).
 *
 * Entry shape: { t: type, label, sub, url, d?: definition snippet }
 */
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-config.js';

const CACHE_KEY = 'tn-search-cache-v3';
const TTL = 30 * 60 * 1000;
let _promise = null;

const clip = (s, n = 160) => {
    const t = String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return t.length > n ? t.slice(0, n - 1) + '…' : t;
};

async function build() {
    let items = null;
    try {
        const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
        if (cached && Date.now() - cached.t < TTL && Array.isArray(cached.items)) {
            items = cached.items;
        } else {
            const grab = async (n) => (await getDocs(collection(db, n))).docs
                .map(d => ({ id: d.id, ...d.data() }))
                .filter(x => x.status !== 'draft');

            const [vocabs, phrasals, preps, patterns, wordforms, lexicals, gLessons, gUnits, pLessons, pUnits, units, books] =
                await Promise.all([
                    grab('vocabularies'), grab('phrasal_verbs'), grab('prep_phrases'),
                    grab('word_patterns'), grab('word_formations'), grab('lexical_expansions'),
                    grab('grammar_lessons'), grab('grammar_units'),
                    grab('pronunciation_lessons'), grab('pronunciation_units'),
                    grab('units'), grab('books')
                ]);
            const unitTitle = {};
            units.forEach(u => { unitTitle[u.id] = u.title; });
            const inUnit = (id) => unitTitle[id] || '';

            items = [];
            vocabs.forEach(v => v.word && items.push({ t: 'Vocabulary', label: v.word, sub: inUnit(v.unitId), url: `unit_detail.html?id=${v.unitId}`, d: clip(v.def) }));
            phrasals.forEach(v => v.word && items.push({ t: 'Phrasal Verbs', label: v.word, sub: inUnit(v.unitId), url: `unit_phrasal.html?id=${v.unitId}`, d: clip(v.def) }));
            preps.forEach(v => v.word && items.push({ t: 'Prepositional Phrases', label: v.word, sub: inUnit(v.unitId), url: `unit_prep.html?id=${v.unitId}`, d: clip(v.def) }));
            patterns.forEach(v => v.word && items.push({ t: 'Word Patterns', label: v.word, sub: inUnit(v.unitId), url: `unit_pattern.html?id=${v.unitId}`, d: clip(`${v.pattern || ''} ${v.def || ''}`) }));
            wordforms.forEach(w => w.rootWord && items.push({ t: 'Word Formation', label: w.rootWord, sub: inUnit(w.unitId), url: `unit_wordform.html?id=${w.unitId}`, d: clip((w.forms || []).map(f => f.definitions).join(' ')) }));
            lexicals.forEach(l => (l.words || []).forEach(w => w.word && items.push({ t: 'Lexical Expansion', label: w.word, sub: inUnit(l.unitId), url: `unit_lexical.html?id=${l.unitId}`, d: clip(w.def) })));
            books.forEach(b => b.title && items.push({ t: 'Books', label: b.title, sub: b.subtitle || 'Book', url: `units.html?bookId=${b.id}` }));
            gLessons.forEach(l => l.title && items.push({ t: 'Grammar', label: l.title, sub: 'Lesson', url: `grammar_lesson.html?id=${l.id}&type=lesson` }));
            gUnits.forEach(u => u.title && items.push({ t: 'Grammar', label: u.title, sub: 'Unit', url: `grammar_lesson.html?id=${u.id}&type=unit` }));
            pLessons.forEach(l => l.title && items.push({ t: 'Pronunciation', label: l.title, sub: 'Lesson', url: `pronunciation_lesson.html?id=${l.id}&type=lesson` }));
            pUnits.forEach(u => u.title && items.push({ t: 'Pronunciation', label: u.title, sub: 'Unit', url: `pronunciation_lesson.html?id=${u.id}&type=unit` }));

            try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), items })); } catch { /* quota */ }
        }
    } catch (e) {
        console.warn('[search] index failed:', e);
        _promise = null; // allow retry on next keystroke
        return null;
    }
    return items;
}

/** Shared in-flight build across the dropdown and the results page. */
export function ensureSearchIndex() {
    if (!_promise) _promise = build();
    return _promise;
}

/** Relevance score for one entry against a lowercase term (0 = no match). */
export function scoreItem(it, term) {
    const lbl = (it.label || '').toLowerCase();
    if (lbl === term) return 100;
    if (lbl.startsWith(term)) return 80;
    if (lbl.includes(term)) return 60;
    if ((it.d || '').toLowerCase().includes(term)) return 45;
    if ((it.sub || '').toLowerCase().includes(term)) return 30;
    return 0;
}

/** All entries matching `term`, best score first. */
export function searchItems(items, term) {
    const t = String(term || '').toLowerCase().trim();
    if (!t || !items) return [];
    const scored = [];
    for (const it of items) {
        const score = scoreItem(it, t);
        if (score) scored.push({ score, it });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.map(x => x.it);
}
