/**
 * utils.js — Shared helpers used by both the public site and the admin panel.
 */

/**
 * Escape a string for safe interpolation into HTML.
 * Use this for ALL Firestore-sourced text rendered via innerHTML.
 */
export function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Debounce: delay fn execution until `ms` of silence. */
export function debounce(fn, ms = 250) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
}

/** Format seconds as m:ss. */
export function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

/** Normalize a string for accent-insensitive (Vietnamese friendly) search. */
export function normalizeSearch(s) {
    return (s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd');
}

/** Map a Firestore error to a short, human-friendly message. */
export function friendlyError(err) {
    const code = err?.code || '';
    const msg = err?.message || String(err || '');
    if (code.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
        return 'Permission denied — check Firestore rules.';
    }
    if (code.includes('unavailable') || code.includes('network')) {
        return 'Network error — check your connection and retry.';
    }
    if (code.includes('too-many-requests')) {
        return 'Too many attempts — please wait a moment.';
    }
    if (code.includes('wrong-password')) return 'Wrong password.';
    if (code.includes('user-not-found')) return 'No account found with this email.';
    if (code.includes('invalid-credential') || code.includes('invalid-login-credentials')) {
        return 'Invalid email or password.';
    }
    // Strip technical prefixes like "Failed to save book.: "
    return msg.replace(/^[^:]+:\s*/, '').slice(0, 160);
}

/** Minimal HTML sanitiser for admin-authored rich text (TinyMCE output).
 *  Removes script/style blocks, on* attributes and javascript: URLs while
 *  keeping ordinary formatting tags intact. */
export function sanitizeRichText(html) {
    if (!html) return '';
    let out = String(html);
    out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    out = out.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
    out = out.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    out = out.replace(/(href|src)\s*=\s*(?:"\s*javascript:[^"]*"|'\s*javascript:[^']*'|javascript:[^\s>]*)/gi, '$1="#"');
    return out;
}

/* =========================================================
   LONGMAN AUDIO VERSION HANDLING
   ldoceonline.com rotates its audio URLs' ?version= query
   (e.g. beat1.mp3?version=1.2.89 -> ?version=1.2.90).
   Old URLs stored in the database keep working because every
   player normalises the URL through applyAudioVersion().
   When Longman bumps the version, ONLY this constant changes.
   ========================================================= */
export const AUDIO_VERSION = '1.2.91';

const AUDIO_VERSIONED_HOST = /(^|\.)ldoceonline\.com$/i;

/** Force the current audio version onto a Longman audio URL.
 *  Non-Longman URLs are returned untouched. */
export function applyAudioVersion(url) {
    if (!url || typeof url !== 'string') return url;
    try {
        const u = new URL(url);
        if (!AUDIO_VERSIONED_HOST.test(u.hostname)) return url;
        u.searchParams.delete('version');
        u.searchParams.set('version', AUDIO_VERSION);
        return u.toString();
    } catch {
        return url;
    }
}

/* =========================================================
   RESUME — remembers the last studied unit/lesson per device
   (localStorage only; it's a convenience shortcut, not data)
   ========================================================= */
const LAST_STUDIED_KEY = 'tn-last-studied';

export function recordLastStudied(entry) {
    try { localStorage.setItem(LAST_STUDIED_KEY, JSON.stringify(entry)); } catch { /* ignore */ }
}

export function getLastStudied(maxAgeDays = 30) {
    try {
        const e = JSON.parse(localStorage.getItem(LAST_STUDIED_KEY) || 'null');
        if (!e || !e.page || !e.id) return null;
        if (Date.now() - (e.ts || 0) > maxAgeDays * 864e5) return null;
        return e;
    } catch { return null; }
}

/* ---- Inline SVG icon factory (stroke style matches the sidebar icons) ---- */
const _ICON_PATHS = {
    volume: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
    repeat: '<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    cloud: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
    drive: '<line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/>',
    bookOpen: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
};

/** Inline SVG icon (stroke = currentColor, 24 viewBox) for buttons and empty states. */
export function iconSvg(name) {
    const paths = _ICON_PATHS[name];
    if (!paths) return '';
    return `<svg class="tn-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}
