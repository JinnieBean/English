/**
 * mylearning.js — learner dashboard: known words, SRS rotation,
 * streak, activity heat-strip and per-unit progress bars.
 */
import {
    initStore, onStoreAuthChanged, getUser, totalKnown, srsCounts, getStreak,
    allProgress, getActivityMap, todayKey, isAuthResolved
} from './progress-store.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-config.js';
import { escapeHtml } from './utils.js';

const $ = (id) => document.getElementById(id);

function renderStats() {
    $('ml-known').textContent = String(totalKnown());
    const c = srsCounts();
    // "In SRS rotation" = words still being scheduled (not graduated)
    let inRotation = 0;
    Object.values(allProgress()).forEach(() => {});
    inRotation = c.learning;
    $('ml-learning').textContent = String(inRotation);
    $('ml-streak').textContent = String(getStreak());
    $('ml-units').textContent = String(Object.keys(allProgress()).length);
}

function renderSyncStatus() {
    const el = $('ml-sync-status');
    if (!el) return;
    if (!isAuthResolved()) {
        el.innerHTML = 'Checking sync status&hellip;';
        return;
    }
    const u = getUser();
    if (u) {
        el.innerHTML = `&#9729; Synced to <strong>${escapeHtml(u.email || 'your account')}</strong>`;
        el.style.color = 'var(--text-secondary)';
    } else {
        el.innerHTML = '&#128190; Local only &mdash; sign in with Google (sidebar) to sync across devices.';
    }
}

function renderActivity() {
    const wrap = $('ml-activity');
    if (!wrap) return;
    const map = getActivityMap();
    const days = [];
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const k = todayKey(d);
        days.push({ k, n: map[k] || 0, label: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }) });
    }
    const max = Math.max(1, ...days.map(d => d.n));
    wrap.innerHTML = days.map(d => `
        <div class="ml-day" title="${d.label}: ${d.n} review${d.n === 1 ? '' : 's'}">
            <div class="ml-bar" style="height:${Math.round((d.n / max) * 100)}%"></div>
            <span>${d.label.split(' ')[1] || d.label}</span>
        </div>`).join('');
}

async function renderUnitBars() {
    const wrap = $('ml-unit-bars');
    if (!wrap) return;
    const progress = allProgress();
    const unitIds = Object.keys(progress).filter(uid =>
        (progress[uid]?.known || []).length > 0);

    if (!unitIds.length) {
        wrap.innerHTML = '<p class="empty-state">Mark flashcards as “Known” to see unit progress here.</p>';
        return;
    }

    let titles = {};
    try {
        const snap = await getDocs(collection(db, 'units'));
        snap.docs.forEach(d => { titles[d.id] = d.data().title; });
    } catch { /* titles optional */ }

    const rows = unitIds.map(uid => ({
        uid,
        title: titles[uid] || uid.slice(0, 8) + '…',
        count: (progress[uid]?.known || []).length
    })).sort((a, b) => b.count - a.count);

    const max = Math.max(...rows.map(r => r.count));
    wrap.innerHTML = rows.map(r => `
        <div class="ml-unit-row">
            <span class="ml-unit-title" title="${escapeHtml(r.title)}">${escapeHtml(r.title)}</span>
            <div class="ml-unit-track"><div class="ml-unit-fill" style="width:${Math.round((r.count / max) * 100)}%"></div></div>
            <span class="ml-unit-count">${r.count}</span>
        </div>`).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    initStore();
    renderStats(); renderActivity(); renderSyncStatus();
    renderUnitBars();

    // refresh once auth merge settles
    onStoreAuthChanged(() => {
        renderStats(); renderSyncStatus(); renderUnitBars();
    });
});
