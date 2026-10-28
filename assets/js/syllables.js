/**
 * syllables.js — Offline English syllable splitting (no network, no Longman).
 *
 * Last-resort source for the admin autofill: when neither Longman HTML nor
 * Wiktionary provides hyphenation, split the word locally with TeX
 * hyphenation patterns (vendored Hypher engine + en-US patterns) and join
 * the parts with ‧ to match the Longman HYPHENATION look.
 *
 * Quality note: TeX patterns are display-grade, not dictionary-grade — a few
 * words differ from Longman. Results from here are therefore labelled
 * 'auto (patterns)' in the autofill status so the admin can eyeball them.
 */

let _hypherPromise = null;

function loadHypher() {
    if (!_hypherPromise) {
        _hypherPromise = Promise.all([
            import('./vendor/hypher.js'),
            import('./vendor/hyphenation-en-us.js')
        ]).then(([engine, patterns]) => {
            const Hypher = engine.default;
            const data = patterns.default;
            return {
                standard: new Hypher(data),
                // Relaxed minimums rescue short words the standard (2,3)
                // minimums can never split (e.g. hap‧py).
                relaxed: new Hypher({ patterns: data.patterns, leftmin: 1, rightmin: 2 })
            };
        }).catch((err) => {
            _hypherPromise = null;
            throw err;
        });
    }
    return _hypherPromise;
}

/** Final attempt for consonant+le endings (a‧ble, ta‧ble, ap‧ple, lit‧tle).
 *  Reliable English rule, applied only when the patterns find no break. */
function consonantLeSplit(word) {
    // (prefix with a vowel)(single consonant)(le), e.g. "able" -> "a‧ble".
    const m = String(word).match(/^([a-z]*[aeiouy][a-z]*?)([bcdfgjklmnpqrstvwxz])le$/);
    if (!m || m[1].length === 0) return '';
    return `${m[1]}‧${m[2]}le`;
}

/**
 * Split a single English word into ‧-joined syllables.
 * Returns '' when the word should not be auto-split (phrases, short words
 * with no confident break, load failure).
 */
export async function autoSyllables(rawWord) {
    const word = String(rawWord || '')
        .toLowerCase()
        .replace(/\s*\([^)]*\)\s*$/g, '')
        .trim()
        .replace(/-/g, '');
    if (!/^[a-z']{2,}$/.test(word)) return '';
    try {
        const { standard, relaxed } = await loadHypher();
        let parts = standard.hyphenate(word);
        if (parts.length < 2 && word.length <= 6) {
            parts = relaxed.hyphenate(word);
        }
        if (parts.length >= 2) return parts.join('‧');
        const le = consonantLeSplit(word);
        return le;
    } catch {
        return '';
    }
}
