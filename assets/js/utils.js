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

/**
 * Escape a string for safe interpolation into an HTML attribute that is
 * quoted with double quotes (same as escapeHtml but kept for readability).
 */
export const escapeAttr = escapeHtml;

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
