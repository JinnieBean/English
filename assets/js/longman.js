/**
 * longman.js — Shared Longman (ldoceonline.com) lookup helpers.
 *
 * Used by the admin panel to autofill `audio` (US pronunciation, the
 * `<span data-src-mp3=".../ameProns/....mp3">` tag) and `syllables`
 * (the `<span class="HYPHENATION">his‧to‧ry</span>` tag).
 *
 * Longman does not send CORS headers AND blocks most datacenter IPs, so a
 * single "fetch via proxy" strategy fails often. `autofillWord()` therefore
 * tries several independent sources in order and reports where each field
 * came from:
 *   1. Longman HTML via public CORS proxies (exact audio + HYPHENATION).
 *   2. Longman media-URL guessing (ameProns/<word>[1..3].mp3), verified with
 *      an <audio> probe in parallel (probing playback needs no CORS).
 *   3. Wiktionary API (CORS-enabled: hyphenation + IPA).
 *   4. Offline TeX hyphenation patterns (no network; labelled 'auto').
 *   5. dictionaryapi.dev (free, CORS-enabled: phonetic text).
 * A personal proxy URL saved in Settings (localStorage `tn-longman-proxy`)
 * is tried before all public proxies when present.
 * Audio is accepted ONLY from Longman (sources 1–2); pronunciation and
 * syllables come from the best available source per field.
 * When every automatic source fails, the admin UI offers a manual
 * "paste page HTML" fallback parsed locally via `parseLongmanHtml()`.
 */

import { AUDIO_VERSION } from './utils.js';
import { autoSyllables } from './syllables.js';

const LDOCE_BASE = 'https://www.ldoceonline.com/dictionary/';

/** Build the dictionary URL for a headword, e.g. "History (n)" -> .../dictionary/history */
export function longmanUrlFor(word) {
    const slug = String(word || '')
        .toLowerCase()
        .replace(/\s*\([^)]*\)\s*$/g, '') // strip trailing "(n)" POS hints
        .trim()
        .replace(/\s+/g, '-');
    return LDOCE_BASE + encodeURIComponent(slug);
}

/**
 * Extract the dictionary slug from a pasted Longman link
 * (https://www.ldoceonline.com/dictionary/abroad?x=1 -> "abroad").
 * Accepts a bare word too ("abroad" -> "abroad"). Returns '' when unusable.
 */
export function slugFromLongmanInput(input) {
    const raw = String(input || '').trim();
    if (!raw) return '';
    try {
        // Full URL (or without protocol): pull the /dictionary/<slug> segment.
        const withProto = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
        const u = new URL(withProto);
        if (/ldoceonline\.com$/i.test(u.hostname)) {
            const m = u.pathname.match(/\/dictionary\/([^\/?#]+)/i);
            if (m) return decodeURIComponent(m[1]).toLowerCase();
            return '';
        }
    } catch { /* not a URL — fall through and treat as a word */ }
    if (/ldoceonline\.com|^www\.|:\/\//i.test(raw)) return '';
    // A bare word must not contain URL query/fragment/path characters.
    if (/[?#\/]/.test(raw)) return '';
    return raw.toLowerCase().replace(/\s*\([^)]*\)\s*$/g, '').trim().replace(/\s+/g, '-');
}

/** Media filename base: Longman uses the bare headword ("history" -> history.mp3). */
function mediaBase(word) {
    return String(word || '')
        .toLowerCase()
        .replace(/\s*\([^)]*\)\s*$/g, '')
        .trim()
        .replace(/[\s-]+/g, '_')
        .replace(/[^a-z0-9_']/g, '');
}

/**
 * Parse a Longman entry Document.
 * Returns { audio, pron, syllables } — each '' when not found.
 * US audio is preferred (`.amefile` / ameProns), UK (`.brefile`) is fallback.
 */
export function parseLongmanDocument(doc) {
    if (!doc || typeof doc.querySelector !== 'function') {
        return { audio: '', pron: '', syllables: '' };
    }
    const pickAudio = () => {
        const us =
            doc.querySelector('.speaker.amefile[data-src-mp3]') ||
            doc.querySelector('[data-src-mp3*="ameProns"]');
        if (us?.dataset?.srcMp3) return us.dataset.srcMp3;
        const uk =
            doc.querySelector('.speaker.brefile[data-src-mp3]') ||
            doc.querySelector('[data-src-mp3]');
        return uk?.dataset?.srcMp3 || '';
    };
    const audio = pickAudio();
    const syllables = doc.querySelector('.HYPHENATION')?.textContent?.trim() || '';
    const pron = doc.querySelector('.PRON')?.textContent?.trim() || '';
    return { audio, pron, syllables };
}

/** Parse raw Longman HTML text (proxy responses, pasted markup). */
export function parseLongmanHtml(html) {
    if (!html) return { audio: '', pron: '', syllables: '' };
    const parser = new DOMParser();
    return parseLongmanDocument(parser.parseFromString(String(html), 'text/html'));
}

async function fetchWithTimeout(url, timeoutMs = 10000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        return await fetch(url, { signal: ctrl.signal });
    } finally {
        clearTimeout(timer);
    }
}

/* ---------- Source 1: Longman HTML through CORS proxies ---------- */

const PROXIES = [
    {
        name: 'allorigins',
        build: (target) => `https://api.allorigins.win/get?url=${encodeURIComponent(target)}`,
        extract: async (res) => {
            const data = await res.json();
            return data?.contents || '';
        }
    },
    {
        name: 'allorigins-raw',
        build: (target) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
        extract: (res) => res.text()
    },
    {
        name: 'codetabs',
        build: (target) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`,
        extract: (res) => res.text()
    }
];

async function fetchLongmanHtml(word) {
    const url = longmanUrlFor(word);
    // A user-supplied proxy (Settings → Longman panel, stored in
    // localStorage) is tried FIRST — e.g. a personal Cloudflare Worker,
    // which may succeed where public proxies are blocked.
    let custom = null;
    try {
        const prefix = (localStorage.getItem('tn-longman-proxy') || '').trim();
        if (prefix) {
            custom = {
                name: 'custom',
                build: (target) => prefix + encodeURIComponent(target),
                extract: (res) => res.text()
            };
        }
    } catch { /* storage unavailable — skip */ }
    const proxies = custom ? [custom, ...PROXIES] : PROXIES;
    // Race all proxies in PARALLEL: first usable page wins instead of
    // waiting out each proxy's full timeout one after another.
    const attempts = proxies.map((proxy) =>
        (async () => {
            const res = await fetchWithTimeout(proxy.build(url), 8000);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const html = await proxy.extract(res);
            if (!html || html.length < 2000) throw new Error('response too short (likely a block page)');
            const parsed = parseLongmanHtml(html);
            if (!parsed.audio && !parsed.syllables && !parsed.pron) {
                throw new Error('no audio/syllable tags in page');
            }
            return { ...parsed, source: `longman (${proxy.name})` };
        })().then(
            (v) => ({ ok: true, v }),
            (err) => ({ ok: false, err: `${proxy.name}: ${err?.message || err}` })
        )
    );
    const settled = await Promise.all(attempts);
    const win = settled.find((s) => s.ok);
    if (win) return win.v;
    const e = new Error('Longman unreachable through all proxies');
    e.details = settled.map((s) => s.err).join(' · ');
    throw e;
}

/* ---------- Source 2: Wiktionary (CORS-enabled, has hyphenation) ----------
   Uses the MediaWiki API with origin=* (explicitly CORS-allowed) and parses
   the entry wikitext for:
     {{hyphenation|his|to|ry}} / {{hyph|en|his|to|ry}} (or en-hyphenation)
       -> syllables "his‧to‧ry"
     {{IPA|en|/ˈhɪstəri/}} / {{en-IPA|...}} -> pronunciation
     {{audio|en|En-us-....ogg}} -> Commons audio via Special:FilePath */

const WT_SKIP_PARTS = new Set(['en', 'eng', 'english', 'us', 'u.s.', 'uk', 'u.k.']);

/** Parse Wiktionary wikitext for hyphenation / IPA / audio. Pure function, unit-testable. */
export function parseWiktionaryWikitext(wt) {
    let syllables = '';
    const hyRe = /\{\{\s*(?:en-)?(?:hyphenation|hyph)\s*\|([^}]*)\}\}/gi;
    let hm;
    while ((hm = hyRe.exec(wt))) {
        const parts = hm[1]
            .split('|')
            .map((s) => s.trim())
            .filter((s) => s && !s.includes('=') && !WT_SKIP_PARTS.has(s.toLowerCase()));
        if (parts.length >= 2) { syllables = parts.join('‧'); break; }
    }

    let pron = '';
    const ipa =
        String(wt).match(/\{\{\s*IPA\s*\|\s*en\s*\|\s*(\/[^}|]+\/)/i) ||
        String(wt).match(/\{\{\s*en-IPA\s*\|\s*(\/[^}|]+\/)/i) ||
        String(wt).match(/\{\{\s*en-IPA\s*\|\s*([^}|]+)/i);
    if (ipa) {
        pron = ipa[1].trim();
        if (!pron.startsWith('/')) pron = `/${pron}/`;
    }

    let audio = '';
    // Prefer a US recording when the entry has several (|a=US or -us- filename).
    const auRe = /\{\{\s*audio\s*\|\s*en\s*\|\s*([^}|]+)[^}]*\}\}/gi;
    const auCandidates = [];
    let am;
    while ((am = auRe.exec(String(wt)))) {
        if (am[1].trim()) auCandidates.push({ file: am[1].trim(), tag: am[0] });
    }
    const auPick =
        auCandidates.find((c) => /\|a=US\b|[-_]us[-_.]/i.test(c.tag)) || auCandidates[0];
    if (auPick) {
        audio = `https://commons.wikimedia.org/wiki/Special:FilePath/${auPick.file.replace(/\s+/g, '_')}`;
    }
    return { audio, pron, syllables };
}

async function fetchWiktionary(word) {
    const clean = String(word || '')
        .toLowerCase()
        .replace(/\s*\([^)]*\)\s*$/g, '')
        .trim();
    if (!clean) throw new Error('empty word');
    const api =
        `https://en.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(clean)}` +
        `&prop=wikitext&format=json&origin=*&redirects=1&formatversion=2`;
    const res = await fetchWithTimeout(api, 8000);
    if (!res.ok) throw new Error(`wiktionary HTTP ${res.status}`);
    const data = await res.json();
    const wt = data?.parse?.wikitext;
    if (!wt || typeof wt !== 'string') throw new Error('no wikitext returned');

    const { audio, pron, syllables } = parseWiktionaryWikitext(wt);
    if (!audio && !pron && !syllables) throw new Error('nothing usable in wikitext');
    return { audio, pron, syllables, source: 'wiktionary' };
}

/* ---------- Source 3: dictionaryapi.dev (CORS-enabled, free) ---------- */

async function fetchDictionaryApi(word) {
    const clean = String(word || '')
        .toLowerCase()
        .replace(/\s*\([^)]*\)\s*$/g, '')
        .trim();
    if (!clean) throw new Error('empty word');
    const res = await fetchWithTimeout(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`,
        8000
    );
    if (!res.ok) throw new Error(`dictionaryapi HTTP ${res.status}`);
    const data = await res.json();
    const entry = Array.isArray(data) ? data[0] : null;
    if (!entry) throw new Error('word not found in dictionaryapi');
    const phonetics = Array.isArray(entry.phonetics) ? entry.phonetics : [];
    const withAudio = phonetics.find((p) => p?.audio) || {};
    const pron =
        entry.phonetic ||
        (phonetics.find((p) => p?.text) || {}).text ||
        '';
    if (!withAudio.audio && !pron) throw new Error('no audio/pronunciation in dictionaryapi');
    return { audio: withAudio.audio || '', pron, syllables: '', source: 'dictionaryapi.dev' };
}

/* ---------- Source 3: guess Longman media URL + <audio> probe ---------- */

/** Check a cross-origin audio URL is playable. Needs no CORS (playback ≠ fetch). */
export function probeAudio(url, timeoutMs = 5000) {
    return new Promise((resolve) => {
        if (typeof Audio === 'undefined' || !url) { resolve(false); return; }
        let done = false;
        const finish = (ok) => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            try { el.removeAttribute('src'); el.load(); } catch { /* noop */ }
            resolve(ok);
        };
        const el = new Audio();
        const timer = setTimeout(() => finish(false), timeoutMs);
        el.addEventListener('canplaythrough', () => finish(true), { once: true });
        el.addEventListener('loadedmetadata', () => finish(true), { once: true });
        el.addEventListener('error', () => finish(false), { once: true });
        el.preload = 'auto';
        el.src = url;
        try { el.load(); } catch { finish(false); }
    });
}

async function guessLongmanAudio(word) {
    const base = mediaBase(word);
    if (!base) throw new Error('empty word');
    // Homographs get numbered files (beat1.mp3, ...). Probe bare + numbered
    // URLs IN PARALLEL — first playable one wins.
    const candidates = ['', '1', '2', '3'].map(
        (suffix) =>
            `https://www.ldoceonline.com/media/english/ameProns/${base}${suffix}.mp3?version=${AUDIO_VERSION}`
    );
    return new Promise((resolve, reject) => {
        let pending = candidates.length;
        let settled = false;
        candidates.forEach((url) => {
            probeAudio(url, 5000).then((ok) => {
                if (settled) return;
                if (ok) {
                    settled = true;
                    resolve({ audio: url, pron: '', syllables: '', source: 'longman (guessed URL, verified)' });
                } else if (--pending === 0) {
                    reject(new Error('no guessed Longman audio URL played'));
                }
            });
        });
    });
}

/* ---------- Orchestrator: parallel sources + early exit + cache ---------- */

function normCacheKey(word) {
    return String(word || '')
        .toLowerCase()
        .replace(/\s*\([^)]*\)\s*$/g, '')
        .trim()
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ');
}

const _autofillCache = new Map(); // key -> result (without the per-call log)
const _autofillInflight = new Map(); // key -> pending promise (dedup double clicks)

/**
 * Try every source, merge the best of each field.
 * Resolves { audio, audioSource, pron, pronSource, syllables, syllablesSource,
 *              longmanUrl, log }.
 * Rejects ONLY when nothing at all was found (Error carries `.longmanUrl`
 * and `.log` for the UI to display).
 *
 * Speed design: all API sources fire AT ONCE; the call resolves as soon as
 * every field is filled (no waiting out losers' timeouts). Results are
 * cached per session, so re-clicking a word is instant.
 */
export function autofillWord(word, onStep) {
    const slug = slugFromLongmanInput(word);
    if (!slug) {
        return Promise.reject(Object.assign(
            new Error('Invalid word or Longman link.'),
            { longmanUrl: '', log: [] }
        ));
    }
    // APIs that look words up by title (Wiktionary, dictionaryapi.dev) expect
    // spaces ("carry on"); the Longman slug / media guesser keeps hyphens.
    const apiWord = slug.replace(/-/g, ' ');
    const key = normCacheKey(slug);
    if (_autofillCache.has(key)) {
        const cached = _autofillCache.get(key);
        try { onStep?.('Loaded from cache (instant).'); } catch { /* noop */ }
        return Promise.resolve({ ...cached, longmanUrl: longmanUrlFor(slug), log: ['cache hit'] });
    }
    if (_autofillInflight.has(key)) {
        return _autofillInflight.get(key).then((r) => {
            try { onStep?.('Joined the in-flight request…'); } catch { /* noop */ }
            return r;
        });
    }
    const p = _autofillWordParallel(slug, apiWord, onStep).then(
        (res) => {
            _autofillInflight.delete(key);
            if (_autofillCache.size >= 200) {
                _autofillCache.delete(_autofillCache.keys().next().value);
            }
            const { log, ...rest } = res;
            _autofillCache.set(key, rest);
            return res;
        },
        (err) => {
            _autofillInflight.delete(key);
            throw err;
        }
    );
    _autofillInflight.set(key, p);
    return p;
}

function _autofillWordParallel(slug, apiWord, onStep) {
    const longmanUrl = longmanUrlFor(slug);
    const log = [];
    const out = {
        audio: '', audioSource: '',
        pron: '', pronSource: '',
        syllables: '', syllablesSource: '',
        longmanUrl, log
    };
    // Lower rank = more trustworthy source for that field.
    const rankOf = { audio: 99, pron: 99, syllables: 99 };
    const step = (msg) => {
        log.push(msg);
        try { onStep?.(msg); } catch { /* noop */ }
    };
    const fieldsOf = (r) =>
        [r.audio && 'audio', r.pron && 'pronunciation', r.syllables && 'syllables']
            .filter(Boolean).join(', ') || 'no fields';

    return new Promise((resolve, reject) => {
        let settled = false;
        const done = (res) => {
            if (!settled) { settled = true; resolve(res); }
        };
        const fail = (err) => {
            if (!settled) { settled = true; reject(err); }
        };
        const isComplete = () => out.audio && out.pron && out.syllables;

        const applyResult = (r, rank) => {
            if (r.audio && rank < rankOf.audio) {
                out.audio = r.audio; out.audioSource = r.source; rankOf.audio = rank;
            }
            if (r.pron && rank < rankOf.pron) {
                out.pron = r.pron; out.pronSource = r.source; rankOf.pron = rank;
            }
            if (r.syllables && rank < rankOf.syllables) {
                out.syllables = r.syllables; out.syllablesSource = r.source; rankOf.syllables = rank;
            }
        };

        const SOURCES = [
            { rank: 0, label: 'Longman', run: () => fetchLongmanHtml(slug) },
            // Audio must come from Longman media files only: the guessed-URL
            // probe runs in parallel so audio rarely waits for slow proxies.
            { rank: 1, label: 'Longman audio', run: () => guessLongmanAudio(slug) },
            { rank: 2, label: 'Wiktionary', run: () => fetchWiktionary(apiWord) },
            // Offline pattern-based split (no network): last resort before
            // giving up on syllables.
            {
                rank: 3, label: 'Auto syllables', run: async () => {
                    const s = await autoSyllables(apiWord);
                    if (!s) throw new Error('no confident split');
                    return { audio: '', pron: '', syllables: s, source: 'auto (patterns)' };
                }
            },
            { rank: 4, label: 'dictionaryapi.dev', run: () => fetchDictionaryApi(apiWord) }
        ];
        let pending = SOURCES.length;
        let graceTimer = null;
        let finishing = false; // finishAfterApis has taken over (late arrivals ignored)

        const finishAfterApis = () => {
            if (settled || finishing) return;
            finishing = true;
            if (out.audio || out.pron || out.syllables) {
                if (!out.audio) step('No playable Longman audio found — audio left empty.');
                done(out); // partial result is still useful
                return;
            }
            const e = new Error('All automatic sources failed.');
            e.longmanUrl = longmanUrl;
            e.log = log;
            fail(e);
        };

        const checkEnd = () => {
            if (settled) return;
            if (isComplete()) {
                clearTimeout(graceTimer);
                step('All fields filled.');
                done(out);
                return;
            }
            if (--pending !== 0) {
                // Fast sources already gave audio/pronunciation but syllables
                // are still missing: give the last source 3s of grace instead
                // of its full timeout, then continue with what we have.
                if (pending === 1 && !graceTimer && (out.audio || out.pron)) {
                    step('Fast sources done — giving Longman 3s for syllables…');
                    graceTimer = setTimeout(() => {
                        if (settled) return;
                        step('Longman too slow — continuing with what we have.');
                        finishAfterApis();
                    }, 3000);
                }
                return;
            }
            clearTimeout(graceTimer);
            finishAfterApis();
        };

        step('Querying Longman (+ audio probe) + Wiktionary + dictionaryapi.dev in parallel…');
        SOURCES.forEach((s) => {
            s.run().then(
                (r) => {
                    if (settled || finishing) return;
                    // Audio is accepted ONLY from Longman media files
                    // (exact page tag or verified guessed URL).
                    if (!r.source.startsWith('longman')) r = { ...r, audio: '' };
                    step(`${s.label}: ${fieldsOf(r)}.`);
                    applyResult(r, s.rank);
                    checkEnd();
                },
                (err) => {
                    if (settled || finishing) return;
                    step(`${s.label} failed (${err?.details || err?.message}).`);
                    checkEnd();
                }
            );
        });
    });
}

/**
 * Source of a bookmarklet the admin can click while ON a Longman page
 * (same-origin there, so no proxy is needed). It copies
 * {audio, pron, syllables} JSON to the clipboard.
 */
export function longmanBookmarkletSource() {
    return `javascript:(function(){var q=function(s){return document.querySelector(s)};var us=q('.speaker.amefile[data-src-mp3]')||document.querySelector('[data-src-mp3*="ameProns"]');var any=us||q('.speaker.brefile[data-src-mp3]')||document.querySelector('[data-src-mp3]');var d={audio:(any&&any.dataset.srcMp3)||'',pron:(q('.PRON')||{}).textContent||'',syllables:(q('.HYPHENATION')||{}).textContent||''};var t=(d.pron||'').trim()+'\\n'+(d.syllables||'').trim()+'\\n'+(d.audio||'');(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){alert('Copied Longman data:\\n'+t)}).catch(function(){prompt('Copy Longman data:',t)});})();`;
}
