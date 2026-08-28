/**
 * mylearning.js — learner dashboard: known words, SRS rotation,
 * streak, activity heat-strip and per-unit progress bars.
 */
import {
    initStore, onStoreAuthChanged, getUser, totalKnown, srsCounts, getStreak,
    allProgress, getActivityMap, todayKey, isAuthResolved,
    lessonLearnedCount, srsDueList
} from './progress-store.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from './firebase-config.js';
import { escapeHtml } from './utils.js';

const $ = (id) => document.getElementById(id);

function renderStats() {
    $('ml-known').textContent = String(totalKnown());
    const c = srsCounts();
    // "In SRS rotation" = words still being scheduled (not graduated)
    $('ml-learning').textContent = String(c.learning);
    $('ml-streak').textContent = String(getStreak());
    $('ml-units').textContent = String(Object.keys(allProgress()).length);
    const mlLessons = $('ml-lessons');
    if (mlLessons) mlLessons.textContent = String(lessonLearnedCount());
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

/** B8 — how many words come due on each of the next 7 days (srs.next).
 *  Cards tagged with src (phrasal/pattern/…) are excluded: they have no
 *  document in `vocabularies` and therefore never appear in Review. */
function renderForecast() {
    const wrap = $('ml-forecast');
    if (!wrap) return;
    const entries = srsDueList('9999-12-30').filter(e => e.next !== '9999-12-31' && !e.src);
    const today = todayKey();
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        days.push({
            k: todayKey(d),
            n: 0,
            label: i === 0 ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' })
        });
    }
    entries.forEach(e => {
        // overdue words fold into today's bucket
        const k = (e.next || '') <= today ? today : e.next;
        const day = days.find(d => d.k === k);
        if (day) day.n++;
    });
    const max = Math.max(1, ...days.map(d => d.n));
    wrap.innerHTML = days.map(d => `
        <div class="ml-day ml-day-wide" title="${d.k}: ${d.n} word${d.n === 1 ? '' : 's'} due">
            <div class="ml-bar" style="height:${Math.round((d.n / max) * 100)}%"></div>
            <span>${d.label}</span>
            <strong class="ml-day-count">${d.n}</strong>
        </div>`).join('');
}

/** B8 — reviews per week, aggregated from the activity map (last 8 weeks). */
function renderWeekly() {
    const wrap = $('ml-weekly');
    if (!wrap) return;
    const map = getActivityMap();
    const weeks = [];
    for (let w = 7; w >= 0; w--) {
        let sum = 0;
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - w * 7 - i);
            sum += map[todayKey(d)] || 0;
        }
        const start = new Date();
        start.setDate(start.getDate() - w * 7 - 6);
        weeks.push({
            n: sum,
            label: start.toLocaleDateString(undefined, { day: 'numeric', month: 'numeric' })
        });
    }
    const max = Math.max(1, ...weeks.map(x => x.n));
    wrap.innerHTML = weeks.map(x => `
        <div class="ml-day ml-day-wide" title="Week of ${x.label}: ${x.n} review${x.n === 1 ? '' : 's'}">
            <div class="ml-bar" style="height:${Math.round((x.n / max) * 100)}%"></div>
            <span>${x.label}</span>
            <strong class="ml-day-count">${x.n}</strong>
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
    renderUnitBars(); renderForecast(); renderWeekly();

    // refresh once auth merge settles
    onStoreAuthChanged(() => {
        renderStats(); renderSyncStatus(); renderUnitBars();
        renderForecast(); renderWeekly();
    });
});
