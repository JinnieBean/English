<<<<<<< HEAD
/**
 * ui.js — Thor's Notes UI Enhancement Module
 * Handles: Dark Mode (#7), Fade-in (#9), Custom Audio (#13),
 *          Vocab Highlight (#14), Flashcard Mode (#10),
 *          Progress Indicator (#11), Breadcrumb (#5), Stats (#8)
 */

/* ==============================================
   #7 — DARK MODE TOGGLE
   ============================================== */
function initDarkMode() {
    const toggle = document.getElementById('dark-mode-toggle');
    if (!toggle) return;

    const icon = toggle.querySelector('.dm-icon');
    const label = toggle.querySelector('.dm-label');

    const applyTheme = (dark) => {
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        if (icon) icon.textContent = dark ? '☀️' : '🌙';
        if (label) label.textContent = dark ? 'Light Mode' : 'Dark Mode';
        toggle.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    };

    // Apply saved preference immediately
    const saved = localStorage.getItem('theme-dark') === 'true';
    applyTheme(saved);

    toggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        applyTheme(!isDark);
        localStorage.setItem('theme-dark', !isDark);
    });
}

/* ==============================================
   #9 — INTERSECTION OBSERVER FADE-IN
   ============================================== */
function initRevealAnimations() {
    const elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    elements.forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.05}s`;
        observer.observe(el);
    });
}

/* ==============================================
   #5 — BREADCRUMB GENERATION
   ============================================== */
function initBreadcrumb() {
    const container = document.getElementById('breadcrumb-container');
    if (!container) return;

    const crumbs = JSON.parse(container.dataset.crumbs || '[]');
    if (!crumbs.length) return;

    const items = crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        if (isLast) {
            return `<span class="bc-current">${c.label}</span>`;
        }
        return `<a href="${c.href}">${c.label}</a><span class="bc-sep">›</span>`;
    });

    container.innerHTML = `<nav class="breadcrumb" aria-label="Breadcrumb">${items.join('')}</nav>`;
}

/* ==============================================
   #13 — CUSTOM AUDIO PLAYER
   ============================================== */
function buildCustomAudioPlayer(src) {
    if (!src) {
        return `<span style="font-size:0.8rem;color:var(--text-secondary);font-style:italic;">No audio</span>`;
    }

    const id = 'ap-' + Math.random().toString(36).substr(2, 8);
    return `
        <div class="custom-audio-player" id="${id}" data-src="${src}">
            <button class="audio-play-btn" aria-label="Play audio" type="button"
                onclick="window.toggleAudio('${id}')">
                <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </button>
            <div class="audio-waveform" aria-hidden="true">
                <span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span>
            </div>
            <span class="audio-duration" id="${id}-dur">0:00</span>
            <div class="audio-controls-extra">
                <button class="audio-speed-btn" type="button" onclick="window.toggleAudioSpeed('${id}')" title="Playback Speed">1x</button>
                <input type="range" class="audio-vol-slider" id="${id}-vol" min="0" max="1" step="0.1" value="1" oninput="window.changeAudioVolume('${id}', this.value)" title="Volume">
            </div>
            <audio id="${id}-audio" preload="none" src="${src}"></audio>
        </div>
    `;
}

window._audioInstances = {};

window.toggleAudio = function(playerId) {
    const container = document.getElementById(playerId);
    if (!container) return;

    const audio = document.getElementById(playerId + '-audio');
    const btn = container.querySelector('.audio-play-btn svg');
    const durEl = document.getElementById(playerId + '-dur');

    // Pause all other players
    Object.keys(window._audioInstances).forEach(id => {
        if (id !== playerId) {
            const other = window._audioInstances[id];
            if (other && !other.paused) {
                other.pause();
                const otherContainer = document.getElementById(id);
                if (otherContainer) {
                    otherContainer.classList.remove('playing');
                    const otherBtn = otherContainer.querySelector('.audio-play-btn svg');
                    if (otherBtn) otherBtn.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
                }
            }
        }
    });

    window._audioInstances[playerId] = audio;

    if (audio.paused) {
        audio.play().catch(() => {});
        container.classList.add('playing');
        btn.innerHTML = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';
    } else {
        audio.pause();
        container.classList.remove('playing');
        btn.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    }

    audio.addEventListener('ended', () => {
        container.classList.remove('playing');
        btn.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"/>';
    }, { once: true });

    audio.addEventListener('loadedmetadata', () => {
        const mins = Math.floor(audio.duration / 60);
        const secs = Math.floor(audio.duration % 60).toString().padStart(2, '0');
        if (durEl && !isNaN(audio.duration)) durEl.textContent = `${mins}:${secs}`;
    });

    audio.addEventListener('timeupdate', () => {
        const mins = Math.floor(audio.currentTime / 60);
        const secs = Math.floor(audio.currentTime % 60).toString().padStart(2, '0');
        if (durEl) durEl.textContent = `${mins}:${secs}`;
    });
};

window.toggleAudioSpeed = function(playerId) {
    const audio = document.getElementById(playerId + '-audio');
    const container = document.getElementById(playerId);
    if (!audio || !container) return;

    const btn = container.querySelector('.audio-speed-btn');
    if (!btn) return;

    // Cycle speeds: 1x -> 1.5x -> 2x -> 0.5x -> 1x
    let speed = audio.playbackRate;
    if (speed === 1) speed = 1.5;
    else if (speed === 1.5) speed = 2;
    else if (speed === 2) speed = 0.5;
    else speed = 1;

    audio.playbackRate = speed;
    btn.textContent = speed + 'x';
};

window.changeAudioVolume = function(playerId, volume) {
    const audio = document.getElementById(playerId + '-audio');
    if (!audio) return;
    audio.volume = parseFloat(volume);
};

/* ==============================================
   #14 — HIGHLIGHT VOCAB WORD IN EXAMPLE
   ============================================== */
function highlightWordInExample(exampleEl, word) {
    if (!exampleEl || !word) return;
    const cleanWord = word.replace(/\s*\([^)]*\)\s*$/g, '').trim();
    if (!cleanWord) return;

    const escaped = cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match word boundaries (case insensitive)
    const regex = new RegExp(`(${escaped}(?:ed|ing|s|d|er|est|ly)?)`, 'gi');
    const text = exampleEl.textContent;
    if (regex.test(text)) {
        exampleEl.innerHTML = text.replace(regex, '<span class="highlight-word">$1</span>');
    }
}

/* ==============================================
   #11 — PROGRESS INDICATOR
   ============================================== */
function buildProgressBadge(unitId, total) {
    const key = `progress-${unitId}`;
    const seen = JSON.parse(localStorage.getItem(key) || '[]');
    const count = Math.min(seen.length, total);
    const pct = total > 0 ? (count / total) * 100 : 0;

    return `
        <div class="unit-progress-badge" title="${count}/${total} words reviewed">
            <div class="unit-progress-bar-wrap">
                <div class="unit-progress-bar-fill" style="width:${pct}%"></div>
            </div>
            <span>${count}/${total}</span>
        </div>
    `;
}

/* ==============================================
   #10 — FLASHCARD MODE
   ============================================== */
let _flashcardData = [];
let _flashcardIndex = 0;
let _flashcardRevealed = false;

function initFlashcard(vocabs) {
    if (!vocabs || !vocabs.length) return;
    _flashcardData = [...vocabs].sort(() => Math.random() - 0.5);

    const btn = document.getElementById('flashcard-toggle-btn');
    const overlay = document.getElementById('flashcard-overlay');
    const closeBtn = document.getElementById('flashcard-close');
    const prevBtn = document.getElementById('fc-prev');
    const nextBtn = document.getElementById('fc-next');
    const cardArea = document.getElementById('flashcard-card-area');

    if (!btn || !overlay) return;

    btn.addEventListener('click', () => {
        _flashcardIndex = 0;
        _flashcardRevealed = false;
        renderFlashcard();
        overlay.classList.add('active');
    });

    closeBtn?.addEventListener('click', () => overlay.classList.remove('active'));
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
    });

    cardArea?.addEventListener('click', () => {
        _flashcardRevealed = !_flashcardRevealed;
        renderFlashcard();
    });

    prevBtn?.addEventListener('click', () => {
        if (_flashcardIndex > 0) {
            _flashcardIndex--;
            _flashcardRevealed = false;
            renderFlashcard();
        }
    });

    nextBtn?.addEventListener('click', () => {
        if (_flashcardIndex < _flashcardData.length - 1) {
            _flashcardIndex++;
            _flashcardRevealed = false;
            renderFlashcard();
        } else {
            overlay.classList.remove('active');
        }
    });
}

function renderFlashcard() {
    const v = _flashcardData[_flashcardIndex];
    if (!v) return;

    const counter = document.getElementById('fc-counter');
    const fill = document.getElementById('fc-progress-fill');
    const cardArea = document.getElementById('flashcard-card-area');

    const total = _flashcardData.length;
    const idx = _flashcardIndex + 1;
    const pct = (idx / total) * 100;

    if (counter) counter.textContent = `${idx} / ${total}`;
    if (fill) fill.style.width = pct + '%';

    const cleanWord = (v.word || '').replace(/\s*\([^)]*\)\s*$/g, '').trim();
    const escaped = cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exHighlight = v.example
        ? v.example.replace(new RegExp(`(${escaped}(?:ed|ing|s|d|er|est|ly)?)`, 'gi'), '<span class="highlight-word">$1</span>')
        : '';

    if (cardArea) {
        if (!_flashcardRevealed) {
            cardArea.innerHTML = `
                <div class="flashcard-front">
                    <div class="flashcard-word">${v.word || ''}</div>
                    <div class="flashcard-pron">${v.pron || ''}</div>
                    <div class="flashcard-hint">Tap to reveal meaning</div>
                </div>
            `;
        } else {
            cardArea.innerHTML = `
                <div class="flashcard-back">
                    <div class="flashcard-def">${v.def || ''}</div>
                    ${exHighlight ? `<div class="flashcard-example">${exHighlight}</div>` : ''}
                </div>
            `;
        }
    }
}

/* ==============================================
   #8 — INDEX PAGE STATS
   ============================================== */
function updateIndexStats(vocabCount, unitCount, grammarCount) {
    const animateNumber = (el, target) => {
        if (!el || isNaN(target)) return;
        let current = 0;
        const step = Math.ceil(target / 40);
        const timer = setInterval(() => {
            current = Math.min(current + step, target);
            el.textContent = current;
            if (current >= target) clearInterval(timer);
        }, 30);
    };

    animateNumber(document.getElementById('stat-vocab'), vocabCount);
    animateNumber(document.getElementById('stat-units'), unitCount);
    animateNumber(document.getElementById('stat-grammar'), grammarCount);
}

/* ==============================================
   INIT
   ============================================== */
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initRevealAnimations();
    initBreadcrumb();
});

// Export functions to window for use in main.js
window.buildCustomAudioPlayer = buildCustomAudioPlayer;
window.highlightWordInExample = highlightWordInExample;
window.buildProgressBadge = buildProgressBadge;
window.initFlashcard = initFlashcard;
window.updateIndexStats = updateIndexStats;
window.initRevealAnimations = initRevealAnimations;
=======
/**
 * ui.js — Thor's Notes UI Enhancement Module
 * Handles: Dark Mode (#7), Fade-in (#9), Custom Audio (#13),
 *          Vocab Highlight (#14), Flashcard Mode (#10),
 *          Progress Indicator (#11), Breadcrumb (#5), Stats (#8)
 */
import { escapeHtml, formatTime, applyAudioVersion } from './utils.js';
import {
    initStore, getKnownSet, markKnown,
    srsGrade, srsDueList, getUser, signInWithGoogle, signOutUser,
    onStoreAuthChanged, onAuthError, recordActivity, isAuthResolved
} from './progress-store.js';

/* ==============================================
   #7 — DARK MODE TOGGLE
   ============================================== */
function initDarkMode() {
    const toggle = document.getElementById('dark-mode-toggle');
    if (!toggle) return;

    const icon = toggle.querySelector('.dm-icon');
    const label = toggle.querySelector('.dm-label');

    const applyTheme = (dark) => {
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        if (icon) icon.textContent = dark ? '\u2600\uFE0F' : '\uD83C\uDF19';
        if (label) label.textContent = dark ? 'Light Mode' : 'Dark Mode';
        toggle.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    };

    // Apply saved preference immediately
    const saved = localStorage.getItem('theme-dark') === 'true';
    applyTheme(saved);

    toggle.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        applyTheme(!isDark);
        localStorage.setItem('theme-dark', !isDark);
    });
}

/* ==============================================
   #9 — INTERSECTION OBSERVER FADE-IN
   ============================================== */
function initRevealAnimations() {
    const elements = document.querySelectorAll('.reveal:not(.visible)');
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    elements.forEach((el, i) => {
        el.style.transitionDelay = `${Math.min(i, 8) * 0.05}s`;
        observer.observe(el);
    });
}

/* ==============================================
   #5 — BREADCRUMB GENERATION
   Usage: <nav class="breadcrumb-container" id="breadcrumb-container"
             data-crumbs='[{"label":"Home","href":"index.html"},...]'></nav>
   Dynamic pages may instead call window.renderBreadcrumb([{label, href}...]).
   ============================================== */
window.renderBreadcrumb = function (crumbs) {
    const container = document.getElementById('breadcrumb-container');
    if (!container || !crumbs?.length) return;

    const items = crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        const label = escapeHtml(c.label);
        if (isLast || !c.href) {
            return `<span class="bc-current" aria-current="page">${label}</span>`;
        }
        return `<a href="${escapeHtml(c.href)}">${label}</a><span class="bc-sep" aria-hidden="true">›</span>`;
    });

    container.hidden = false;
    container.innerHTML = `<nav class="breadcrumb" aria-label="Breadcrumb">${items.join('')}</nav>`;
};

function initBreadcrumb() {
    const container = document.getElementById('breadcrumb-container');
    if (!container) return;

    let crumbs = [];
    try { crumbs = JSON.parse(container.dataset.crumbs || '[]'); } catch { crumbs = []; }
    if (!crumbs.length) {
        // Dynamic pages fill this container themselves after their data loads
        if (!container.dataset.section && !container.id.includes('dynamic')) {
            container.hidden = true;
        }
        return;
    }
    window.renderBreadcrumb(crumbs);
}

/* ==============================================
   #13 — CUSTOM AUDIO PLAYER
   All wiring is done via DELEGATED listeners on `document`:
   - clicks are handled with closest() lookups (no inline onclick,
     immune to CSP/extensions stripping inline handlers)
   - media events (play/pause/ended/timeupdate/…) do not bubble, but
     capture-phase document listeners still receive them, so each
     player needs no per-instance binding at all.
   ============================================== */
const _PLAY_SVG = '<polygon points="5 3 19 12 5 21 5 3"/>';
const _PAUSE_SVG = '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>';

function ttsButton(text) {
    if (!text || !('speechSynthesis' in window)) {
        return '<span class="audio-none">No audio</span>';
    }
    return `
        <button class="audio-tts-btn" type="button" title="Text-to-speech"
            data-say="${escapeHtml(text)}" aria-label="Read aloud">&#128266;</button>
    `;
}

function buildCustomAudioPlayer(src, ttsText) {
    if (!src) {
        return `<span class="audio-group-tts">${ttsButton(ttsText)}</span>`;
    }

    // Longman rotates ?version= on its audio files — always force the
    // current version at playback time so stale DB URLs keep working.
    const effectiveSrc = applyAudioVersion(src);
    const id = 'ap-' + Math.random().toString(36).slice(2, 10);
    const safeSrc = escapeHtml(effectiveSrc);
    return `
        <div class="custom-audio-player" id="${id}" data-src="${safeSrc}">
            <button class="audio-play-btn" aria-label="Play audio" type="button">
                <svg viewBox="0 0 24 24">${_PLAY_SVG}</svg>
            </button>
            <input type="range" class="audio-seek-slider" id="${id}-seek" min="0" max="100" step="0.1"
                value="0" aria-label="Seek">
            <span class="audio-duration" id="${id}-dur">--:--</span>
            <div class="audio-controls-extra">
                <button class="audio-speed-btn" type="button" title="Playback speed" aria-label="Playback speed">1x</button>
                <button class="audio-loop-btn" type="button" title="Repeat" aria-label="Repeat" aria-pressed="false">&#128257;</button>
                <a class="audio-download-btn" href="${safeSrc}" download title="Download" aria-label="Download audio">&#11015;</a>
            </div>
            <audio id="${id}-audio" preload="none" src="${safeSrc}"></audio>
        </div>
    `;
}

window._audioInstances = {};

function playerIdOfAudio(audioEl) {
    return audioEl?.id?.replace(/-audio$/, '') || null;
}

function showAudioError(container) {
    if (!container) return;
    container.classList.add('audio-error');
    const durEl = container.querySelector('.audio-duration');
    if (durEl) durEl.textContent = 'unavailable';
}

window.toggleAudio = function (playerId) {
    const container = document.getElementById(playerId);
    const audio = document.getElementById(playerId + '-audio');
    if (!container || !audio) return;

    // Pause all other players
    Object.keys(window._audioInstances).forEach(id => {
        if (id !== playerId) {
            const other = window._audioInstances[id];
            if (other && !other.paused) other.pause();
        }
    });

    window._audioInstances[playerId] = audio;

    if (audio.paused) {
        audio.play().catch(() => {
            // One retry after forcing a fresh load (helps stale/blocked metadata),
            // then surface the failure visibly instead of failing silently.
            if (container.dataset.retry !== '1') {
                container.dataset.retry = '1';
                try { audio.load(); } catch { /* noop */ }
                setTimeout(() => {
                    audio.play().catch(() => showAudioError(container));
                }, 200);
            } else {
                showAudioError(container);
            }
        });
    } else {
        audio.pause();
    }
};

window.seekAudio = function (playerId, value) {
    const audio = document.getElementById(playerId + '-audio');
    const seekEl = document.getElementById(playerId + '-seek');
    if (!audio || !seekEl || !isFinite(audio.duration)) return;
    seekEl.dataset.dragging = '1';
    audio.currentTime = (parseFloat(value) / 100) * audio.duration;
    clearTimeout(seekEl._dragT);
    seekEl._dragT = setTimeout(() => { seekEl.dataset.dragging = '0'; }, 250);
};

window.toggleAudioSpeed = function (playerId) {
    const audio = document.getElementById(playerId + '-audio');
    const container = document.getElementById(playerId);
    if (!audio || !container) return;

    const btn = container.querySelector('.audio-speed-btn');
    if (!btn) return;

    // Cycle speeds: 1x -> 1.5x -> 2x -> 0.5x -> 1x
    let speed = audio.playbackRate;
    if (speed === 1) speed = 1.5;
    else if (speed === 1.5) speed = 2;
    else if (speed === 2) speed = 0.5;
    else speed = 1;

    audio.playbackRate = speed;
    btn.textContent = speed + 'x';
};

window.toggleAudioLoop = function (playerId) {
    const audio = document.getElementById(playerId + '-audio');
    const container = document.getElementById(playerId);
    if (!audio || !container) return;

    audio.loop = !audio.loop;
    const btn = container.querySelector('.audio-loop-btn');
    if (btn) {
        btn.setAttribute('aria-pressed', String(audio.loop));
        btn.classList.toggle('active', audio.loop);
    }
};

window.speakText = function (btn) {
    if (!('speechSynthesis' in window)) return;
    const text = btn?.dataset.say;
    if (!text) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.replace(/\s*\([^)]*\)\s*$/g, '').trim());
    utter.lang = 'en-US';
    utter.rate = 0.95;
    window.speechSynthesis.speak(utter);
};

/** One-time global wiring for every audio player on the page. */
let _audioGloballyWired = false;
function wireGlobalAudio() {
    if (_audioGloballyWired) return;
    _audioGloballyWired = true;

    /* ---- Control clicks (delegated) ---- */
    document.addEventListener('click', (e) => {
        const ttsBtn = e.target.closest('.audio-tts-btn');
        if (ttsBtn) {
            e.preventDefault();
            window.speakText(ttsBtn);
            return;
        }

        const player = e.target.closest('.custom-audio-player');
        if (!player) return;
        const pid = player.id;
        if (!pid) return;

        if (e.target.closest('.audio-play-btn')) {
            e.preventDefault();
            window.toggleAudio(pid);
        } else if (e.target.closest('.audio-speed-btn')) {
            window.toggleAudioSpeed(pid);
        } else if (e.target.closest('.audio-loop-btn')) {
            window.toggleAudioLoop(pid);
        }
        // .audio-download-btn is a real link — let it behave natively
    });

    /* ---- Seek slider ---- */
    document.addEventListener('input', (e) => {
        if (!e.target.classList?.contains('audio-seek-slider')) return;
        const player = e.target.closest('.custom-audio-player');
        if (player) window.seekAudio(player.id, e.target.value);
    });

    /* ---- Media state events (capture phase; these don't bubble) ---- */
    const onMedia = (type, fn) => document.addEventListener(type, fn, true);

    onMedia('play', (e) => {
        const pid = playerIdOfAudio(e.target);
        if (!pid) return;
        const container = document.getElementById(pid);
        container?.classList.add('playing');
        const svg = container?.querySelector('.audio-play-btn svg');
        if (svg) svg.innerHTML = _PAUSE_SVG;
    });

    onMedia('pause', (e) => {
        const pid = playerIdOfAudio(e.target);
        if (!pid) return;
        const container = document.getElementById(pid);
        container?.classList.remove('playing');
        const svg = container?.querySelector('.audio-play-btn svg');
        if (svg) svg.innerHTML = _PLAY_SVG;
    });

    onMedia('ended', (e) => {
        const audio = e.target;
        const pid = playerIdOfAudio(audio);
        if (!pid) return;
        const container = document.getElementById(pid);
        container?.classList.remove('playing');
        const svg = container?.querySelector('.audio-play-btn svg');
        if (svg) svg.innerHTML = _PLAY_SVG;
        const seekEl = document.getElementById(pid + '-seek');
        if (seekEl) seekEl.value = 0;
        const durEl = document.getElementById(pid + '-dur');
        if (durEl && isFinite(audio.duration)) durEl.textContent = formatTime(audio.duration);
    });

    onMedia('loadedmetadata', (e) => {
        const audio = e.target;
        const pid = playerIdOfAudio(audio);
        if (!pid || !isFinite(audio.duration)) return;
        const durEl = document.getElementById(pid + '-dur');
        if (durEl) durEl.textContent = formatTime(audio.duration);
    });

    onMedia('timeupdate', (e) => {
        const audio = e.target;
        const pid = playerIdOfAudio(audio);
        if (!pid) return;
        const durEl = document.getElementById(pid + '-dur');
        if (durEl && isFinite(audio.duration)) {
            durEl.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
        }
        const seekEl = document.getElementById(pid + '-seek');
        if (seekEl && isFinite(audio.duration) && seekEl.dataset.dragging !== '1') {
            seekEl.value = (audio.currentTime / audio.duration) * 100 || 0;
        }
    });

    onMedia('error', (e) => {
        const pid = playerIdOfAudio(e.target);
        if (!pid) return;
        // Only mark the error if the element actually failed to fetch its source.
        if (e.target?.error) {
            showAudioError(document.getElementById(pid));
        }
    });
}
wireGlobalAudio();

/* ==============================================
   #14 — HIGHLIGHT VOCAB WORD IN EXAMPLE
   ============================================== */
function highlightWordInExample(exampleEl, word) {
    if (!exampleEl || !word) return;
    const cleanWord = word.replace(/\s*\([^)]*\)\s*$/g, '').trim();
    if (!cleanWord) return;

    const escaped = cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match word boundaries (case insensitive); textContent is safe here —
    // we only wrap matched plain text, never inject raw data.
    const regex = new RegExp(`(${escaped}(?:ed|ing|s|d|er|est|ly)?)`, 'gi');
    const text = exampleEl.textContent;
    if (regex.test(text)) {
        exampleEl.innerHTML = text.replace(regex, '<span class="highlight-word">$1</span>');
    }
}

/* ==============================================
   #11 — PROGRESS INDICATOR (driven by flashcard/SRS results)
   Backed by progress-store.js (local-first, cloud-synced when signed in)
   ============================================== */
function renderProgressBadge(unitId, total) {
    const badge = document.getElementById(`progress-badge-${unitId}`);
    if (!badge) return;
    const count = Math.min(getKnownSet(unitId).size, total);
    const pct = total > 0 ? (count / total) * 100 : 0;
    badge.innerHTML = `
        <div class="unit-progress-badge" title="${count}/${total} words marked as known">
            <div class="unit-progress-bar-wrap">
                <div class="unit-progress-bar-fill" style="width:${pct}%"></div>
            </div>
            <span>${count}/${total}</span>
        </div>
    `;
}

window.renderProgressBadge = renderProgressBadge;

/* ==============================================
   #10 — FLASHCARD MODE
   Keyboard: Space/Enter/F = flip · ←/→ = navigate ·
             1 = still learning · 2 = known · Esc = close
   ============================================== */
let _flashcardData = [];
let _flashcardIndex = 0;
let _flashcardRevealed = false;
let _flashcardUnitId = null;
let _fcKnown = new Set();
let _fcSessionDone = false;
let _lastFocused = null;

function fcOpen() {
    return document.getElementById('flashcard-overlay')?.classList.contains('active');
}

function initFlashcard(vocabs, unitId) {
    if (!vocabs || !vocabs.length) return;
    _flashcardData = [...vocabs].sort(() => Math.random() - 0.5);
    // unitId===undefined  -> infer from words (normal unit page)
    // unitId===null        -> MIXED units (review page); grade per-card below
    _flashcardUnitId = (unitId === undefined) ? (vocabs[0]?.unitId || null) : unitId;
    _fcKnown = getKnownSet(_flashcardUnitId);

    const btn = document.getElementById('flashcard-toggle-btn');
    const overlay = document.getElementById('flashcard-overlay');

    if (!btn || !overlay) return;

    // Guard against double-binding when the section is reloaded via Retry
    if (btn.dataset.fcBound !== '1') {
        btn.dataset.fcBound = '1';
        bindFlashcardEvents(btn, overlay);
    }
}

function bindFlashcardEvents(btn, overlay) {
    btn.addEventListener('click', () => openFlashcards());
    // Delegated handling: action buttons are re-rendered on every card
    overlay.addEventListener('click', (e) => {
        const actionEl = e.target.closest('[data-fc-action]');
        if (actionEl) {
            e.stopPropagation();
            handleFcAction(actionEl.dataset.fcAction);
            return;
        }
        if (e.target === overlay) closeFlashcards();
    });
    document.getElementById('flashcard-card-area')?.addEventListener('click', (e) => {
        // Don't flip when interacting with action buttons or the shared
        // Longman/TTS audio player rendered on the card.
        if (e.target.closest('[data-fc-action], .custom-audio-player, .audio-tts-btn')) return;
        _flashcardRevealed = !_flashcardRevealed;
        renderFlashcard();
    });

    document.addEventListener('keydown', (e) => {
        if (!fcOpen()) return;
        switch (e.key) {
            case ' ': case 'Enter': case 'f': case 'F':
                e.preventDefault(); _flashcardRevealed = !_flashcardRevealed; renderFlashcard(); break;
            case 'ArrowRight': e.preventDefault(); handleFcAction('next'); break;
            case 'ArrowLeft': e.preventDefault(); handleFcAction('prev'); break;
            case '1': handleFcAction('unknown'); break;
            case '2': handleFcAction('known'); break;
            case 'Escape': closeFlashcards(); break;
        }
    });
}

function openFlashcards() {
    const overlay = document.getElementById('flashcard-overlay');
    if (!overlay) return;
    _lastFocused = document.activeElement;
    _flashcardIndex = 0;
    _flashcardRevealed = false;
    _fcSessionDone = false;
    renderFlashcard();
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    overlay.querySelector('.flashcard-modal')?.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-hidden', 'false');
    document.getElementById('flashcard-close')?.focus();
}

function closeFlashcards() {
    const overlay = document.getElementById('flashcard-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    pauseAllAudio();
    persistKnown();
    if (_lastFocused instanceof HTMLElement) _lastFocused.focus();
}

/** Stop every playing audio instance (used when leaving a flashcard). */
function pauseAllAudio() {
    Object.values(window._audioInstances || {}).forEach(a => {
        if (a && !a.paused) { try { a.pause(); } catch { /* noop */ } }
    });
}

function persistKnown() {
    if (_flashcardUnitId) {
        renderProgressBadge(_flashcardUnitId, document.querySelectorAll('.vocab-item').length || _flashcardData.length);
        // refresh the review-count badge in the sidebar too
        updateReviewBadge();
    }
}

function handleFcAction(action) {
    switch (action) {
        case 'close': closeFlashcards(); break;
        case 'flip': _flashcardRevealed = !_flashcardRevealed; renderFlashcard(); break;
        case 'prev':
            pauseAllAudio();
            if (_fcSessionDone) { restartFlashcards(_flashcardData); return; }
            if (_flashcardIndex > 0) { _flashcardIndex--; _flashcardRevealed = false; renderFlashcard(); }
            break;
        case 'next':
            pauseAllAudio();
            if (_fcSessionDone) { restartFlashcards(_flashcardData); return; }
            if (_flashcardIndex < _flashcardData.length - 1) { _flashcardIndex++; _flashcardRevealed = false; renderFlashcard(); }
            else finishSession();
            break;
case 'known': {
            if (_fcSessionDone) return;
            const v = _flashcardData[_flashcardIndex];
            const cardUnit = _flashcardUnitId || v.unitId || null;
            pauseAllAudio();
            _fcKnown.add(v.id);
            // Persist to progress-store (tn-store-v1 + cloud when signed in)
            if (cardUnit) markKnown(cardUnit, v.id, true);
            srsGrade(v.id, cardUnit, true, v.src);
            advanceOrFinish();
            break;
        }
        case 'unknown': {
            if (_fcSessionDone) return;
            const v2 = _flashcardData[_flashcardIndex];
            const cardUnit2 = _flashcardUnitId || v2.unitId || null;
            pauseAllAudio();
            _fcKnown.delete(v2.id);
            if (cardUnit2) markKnown(cardUnit2, v2.id, false);
            srsGrade(v2.id, cardUnit2, false, v2.src);
            advanceOrFinish();
            break;
        }
        case 'restart-all': pauseAllAudio(); restartFlashcards(_flashcardData); break;
        case 'restart-unknown': {
            pauseAllAudio();
            const rest = _flashcardData.filter(v => !_fcKnown.has(v.id));
            restartFlashcards(rest.length ? rest : _flashcardData);
            break;
        }
    }
}

function advanceOrFinish() {
    if (_flashcardIndex < _flashcardData.length - 1) {
        _flashcardIndex++;
        _flashcardRevealed = false;
        renderFlashcard();
    } else {
        finishSession();
    }
}

function finishSession() {
    _fcSessionDone = true;
    persistKnown();
    const cardArea = document.getElementById('flashcard-card-area');
    const counter = document.getElementById('fc-counter');
    const fill = document.getElementById('fc-progress-fill');
    if (counter) counter.textContent = 'Done!';
    if (fill) fill.style.width = '100%';
    const knownCount = _fcKnown.size;
    const total = _flashcardData.length;
    if (cardArea) {
        cardArea.innerHTML = `
            <div class="flashcard-summary">
                <div class="fc-summary-title">Session complete!</div>
                <p class="fc-summary-text">${knownCount} / ${total} words marked as known.</p>
                <div class="fc-summary-actions">
                    <button class="fc-btn" type="button" data-fc-action="restart-unknown">Retry unknown</button>
                    <button class="fc-btn fc-btn-secondary" type="button" data-fc-action="restart-all">Restart all</button>
                </div>
            </div>
        `;
    }
}

function restartFlashcards(data) {
    _flashcardData = [...data].sort(() => Math.random() - 0.5);
    _flashcardIndex = 0;
    _flashcardRevealed = false;
    _fcSessionDone = false;
    renderFlashcard();
}

function renderFlashcard() {
    const v = _flashcardData[_flashcardIndex];
    if (!v) return;

    const counter = document.getElementById('fc-counter');
    const fill = document.getElementById('fc-progress-fill');
    const cardArea = document.getElementById('flashcard-card-area');
    const actionsBar = document.querySelector('.flashcard-actions');

    const total = _flashcardData.length;
    const idx = _flashcardIndex + 1;

    if (counter) counter.textContent = `${idx} / ${total}`;
    if (fill) fill.style.width = ((idx / total) * 100) + '%';

    const cleanWord = (v.word || '').replace(/\s*\([^)]*\)\s*$/g, '').trim();
    const escaped = cleanWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rawExample = v.example ? escapeHtml(v.example) : '';
    const exHighlight = rawExample
        ? rawExample.replace(new RegExp(`(${escaped}(?:ed|ing|s|d|er|est|ly)?)`, 'gi'), '<span class="highlight-word">$1</span>')
        : '';

    const isKnown = _fcKnown.has(v.id);

    if (actionsBar) actionsBar.innerHTML = `
        <button class="fc-btn fc-btn-unknown ${!isKnown ? 'fc-active' : ''}" type="button" data-fc-action="unknown" title="Still learning (1)">&#10007; Learning</button>
        <button class="fc-btn fc-btn-prev" type="button" data-fc-action="prev" title="Previous (&larr;)">&larr; Prev</button>
        <button class="fc-btn fc-btn-flip" type="button" data-fc-action="flip" title="Flip (Space)">Flip</button>
        <button class="fc-btn fc-btn-next" type="button" data-fc-action="next" title="Next (&rarr;)">Next &rarr;</button>
        <button class="fc-btn fc-btn-known ${isKnown ? 'fc-active' : ''}" type="button" data-fc-action="known" title="Known (2)">&#10003; Known</button>
    `;

    if (cardArea) {
        if (!_flashcardRevealed) {
            // Same Longman audio as the vocabulary list; TTS only as fallback
            // when the word has no stored audio URL.
            const audioHtml = v.audio
                ? `<div class="flashcard-audio">${buildCustomAudioPlayer(v.audio)}</div>`
                : ttsButton(cleanWord);
            cardArea.innerHTML = `
                <div class="flashcard-front ${isKnown ? 'fc-marked-known' : ''}">
                    <div class="flashcard-word">${escapeHtml(v.word || '')}</div>
                    <div class="flashcard-pron">${escapeHtml(v.pron || '')}</div>
                    ${audioHtml}
                    <div class="flashcard-hint">Tap card or press Space to reveal meaning</div>
                </div>
            `;
        } else {
            cardArea.innerHTML = `
                <div class="flashcard-back">
                    <div class="flashcard-def">${escapeHtml(v.def || '')}</div>
                    ${exHighlight ? `<div class="flashcard-example">${exHighlight}</div>` : ''}
                    <div class="flashcard-hint">Press <strong>2</strong> if you know it, <strong>1</strong> to review later</div>
                </div>
            `;
        }
    }
}

/* ==============================================
   #12 — QUIZ HUB (Multiple choice · Typing · Listening)
   One button opens a mode menu; each mode runs a 10-question
   session over the unit's vocabulary.
   ============================================== */
let _quizData = [];
let _quizIndex = 0;
let _quizScore = 0;
let _quizAnswered = false;
let _quizMode = 'choice';
let _quizAudio = null;
let _quizSourcePool = [];
let _quizMenuPool = [];

function initQuiz(vocabs) {
    if (!vocabs || vocabs.length < 4) return;
    const btn = document.getElementById('quiz-toggle-btn');
    if (!btn) return;
    _quizMenuPool = vocabs;
    // Guard against double-binding when the section is reloaded via Retry
    if (btn.dataset.qzBound !== '1') {
        btn.dataset.qzBound = '1';
        btn.addEventListener('click', () => openQuizMenu(_quizMenuPool));
    }
}

function ensureQuizOverlay() {
    if (document.getElementById('quiz-overlay')) return;
    document.body.insertAdjacentHTML('beforeend', `
        <div class="flashcard-overlay" id="quiz-overlay" aria-hidden="true">
            <div class="flashcard-modal quiz-modal" role="dialog" aria-modal="true" aria-label="Vocabulary quiz">
                <button class="flashcard-close" id="quiz-close" aria-label="Close">&times;</button>
                <div class="flashcard-counter" id="quiz-counter" aria-live="polite">1 / 1</div>
                <div class="flashcard-progress-bar">
                    <div class="flashcard-progress-fill" id="quiz-progress-fill" style="width:0%"></div>
                </div>
                <div class="quiz-question-area" id="quiz-question-area"></div>
            </div>
        </div>
    `);
    const overlay = document.getElementById('quiz-overlay');
    document.getElementById('quiz-close').addEventListener('click', closeQuiz);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeQuiz(); });
    document.addEventListener('keydown', (e) => {
        const openNow = overlay.classList.contains('active');
        if (!openNow) return;
        if (e.key === 'Escape') closeQuiz();
        if (_quizMode === 'choice' && /^[1-4]$/.test(e.key)) {
            document.querySelector(`.quiz-option[data-index="${+e.key - 1}"]`)?.click();
        }
        if (_quizMode === 'typing' && e.key === 'Enter') {
            document.getElementById('typing-check-btn')?.click();
        }
    });
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function openQuizMenu(vocabs) {
    ensureQuizOverlay();
    _quizMode = 'menu';
    stopQuizAudio();
    const eligible = vocabs.filter(v => v.word && v.def);
    const listenOk = vocabs.filter(v => v.audio).length >= 4;
    const overlay = document.getElementById('quiz-overlay');
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    const counter = document.getElementById('quiz-counter');
    const fill = document.getElementById('quiz-progress-fill');
    if (counter) counter.textContent = 'Choose a mode';
    if (fill) fill.style.width = '0%';
    const area = document.getElementById('quiz-question-area');
    if (!area) return;
    area.innerHTML = `
        <div class="quiz-mode-menu">
            <div class="quiz-mode-title">Practice this unit</div>
            <button type="button" class="quiz-mode-btn" data-quiz-mode="choice">
                <span class="qmi">&#9998;</span>
                <span><strong>Multiple choice</strong><small>Read the definition, pick the right word</small></span>
            </button>
            <button type="button" class="quiz-mode-btn" data-quiz-mode="typing">
                <span class="qmi">&#183;&#183;&#183;</span>
                <span><strong>Typing test</strong><small>See the meaning, type the word</small></span>
            </button>
            <button type="button" class="quiz-mode-btn ${listenOk ? '' : 'disabled'}" data-quiz-mode="listening" ${listenOk ? '' : 'aria-disabled="true"'}>
                <span class="qmi">&#9835;</span>
                <span><strong>Listening quiz</strong><small>Hear the pronunciation, pick the word</small></span>
            </button>
            ${listenOk ? '' : '<p class="qa-hint" style="text-align:center">Listening needs at least 4 words with audio in this unit.</p>'}
        </div>`;
    area.querySelectorAll('[data-quiz-mode]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('disabled')) return;
            startQuiz(vocabs, btn.dataset.quizMode);
        });
    });
}

function startQuiz(vocabs, mode) {
    _quizMode = mode;
    _quizSourcePool = vocabs;
    let pool = vocabs.filter(v => v.word && v.def);
    if (mode === 'listening') pool = vocabs.filter(v => v.word && v.audio);
    if (pool.length < 4) { renderQuizSummary(); return; }

    _quizData = shuffle(pool).slice(0, Math.min(10, pool.length)).map(v => ({
        ...v,
        options: mode === 'choice'
            ? buildOptions(v, pool)
            : mode === 'listening'
                ? buildWordOptions(v, pool)
                : []
    }));
    _quizIndex = 0;
    _quizScore = 0;
    renderQuizQuestion();
}

function buildOptions(current, pool) {
    return shuffle([current.def,
        ...shuffle(pool.filter(v => v.id !== current.id)).slice(0, 3).map(v => v.def)]);
}
function buildWordOptions(current, pool) {
    return shuffle([current.word,
        ...shuffle(pool.filter(v => v.id !== current.id)).slice(0, 3).map(v => v.word)]);
}

function closeQuiz() {
    stopQuizAudio();
    const overlay = document.getElementById('quiz-overlay');
    overlay?.classList.remove('active');
    overlay?.setAttribute('aria-hidden', 'true');
}

function stopQuizAudio() {
    try { _quizAudio?.pause(); } catch {}
    _quizAudio = null;
}

const stripPos = (w) => String(w || '').replace(/\s*\([^)]*\)\s*$/g, '').trim();
const normAns = (s) => String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');

function levenshtein(a, b) {
    if (Math.abs(a.length - b.length) > 1) return 2;
    const m = [...a], n = [...b];
    let prev = Array.from({ length: n.length + 1 }, (_, i) => i);
    for (let i = 1; i <= m.length; i++) {
        const cur = [i];
        for (let j = 1; j <= n.length; j++) {
            cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (m[i - 1] === n[j - 1] ? 0 : 1));
        }
        prev = cur;
    }
    return prev[n.length];
}

function setQuizChrome(idx, total) {
    const counter = document.getElementById('quiz-counter');
    const fill = document.getElementById('quiz-progress-fill');
    if (counter) counter.textContent = `${idx + 1} / ${total}`;
    if (fill) fill.style.width = ((idx / total) * 100) + '%';
}

function renderQuizQuestion() {
    const q = _quizData[_quizIndex];
    const area = document.getElementById('quiz-question-area');
    if (!q || !area) return;
    _quizAnswered = false;
    setQuizChrome(_quizIndex, _quizData.length);

    if (_quizMode === 'choice') renderChoiceQuestion(q, area);
    else if (_quizMode === 'typing') renderTypingQuestion(q, area);
    else renderListeningQuestion(q, area);
}

/* ---------- mode: multiple choice ---------- */
function renderChoiceQuestion(q, area) {
    area.innerHTML = `
        <div class="quiz-prompt">What does <strong>&ldquo;${escapeHtml(stripPos(q.word))}&rdquo;</strong> mean?</div>
        <div class="quiz-options">
            ${q.options.map((opt, i) => `
                <button type="button" class="quiz-option" data-correct="${opt === q.def ? '1' : '0'}" data-index="${i}">
                    <span class="quiz-option-key">${i + 1}</span>
                    <span>${escapeHtml(opt)}</span>
                </button>`).join('')}
        </div>
        <div class="quiz-feedback" id="quiz-feedback" aria-live="polite"></div>`;

    area.querySelectorAll('.quiz-option').forEach(btn => {
        btn.addEventListener('click', () => {
            if (_quizAnswered) return;
            _quizAnswered = true;
            const correct = btn.dataset.correct === '1';
            settleChoice(area, correct, btn, q);
        });
    });
}

function settleChoice(area, correct, chosenBtn, q) {
    _quizAnswered = true;
    if (correct) _quizScore++;
    area.querySelectorAll('.quiz-option').forEach(b => {
        b.disabled = true;
        if (b.dataset.correct === '1') b.classList.add('correct');
    });
    if (!correct) chosenBtn.classList.add('wrong');
    const fb = document.getElementById('quiz-feedback');
    if (fb) fb.textContent = correct ? 'Correct!' : `Answer: ${stripPos(q.word)}`;
    setTimeout(advanceQuiz, correct ? 700 : 1600);
}

/* ---------- mode: typing ---------- */
function renderTypingQuestion(q, area) {
    area.innerHTML = `
        <div class="quiz-prompt">Type the word for this meaning:</div>
        <div class="quiz-typing-def">${escapeHtml(q.def)}</div>
        <div class="quiz-typing-row">
            <input type="text" id="typing-input" class="quiz-typing-input" autocomplete="off"
                autocapitalize="off" spellcheck="false" placeholder="Type the word…" aria-label="Your answer">
            <button type="button" class="fc-btn fc-btn-flip" id="typing-check-btn">Check</button>
        </div>
        <div class="quiz-feedback" id="quiz-feedback" aria-live="polite"></div>`;
    const input = document.getElementById('typing-input');
    input?.focus();
    document.getElementById('typing-check-btn')?.addEventListener('click', () => {
        if (_quizAnswered) return;
        const guess = normAns(input.value);
        const answer = normAns(stripPos(q.word));
        if (!guess) return;
        const exact = guess === answer;
        const near = !exact && levenshtein(guess, answer) <= 1;
        gradeTyping(area, q, exact, near, answer);
    });
}

function gradeTyping(area, q, exact, near, answer) {
    _quizAnswered = true;
    const fb = document.getElementById('quiz-feedback');
    if (exact || near) {
        _quizScore++;
        if (fb) fb.textContent = near ? `Correct — “${stripPos(q.word)}” (close enough!)` : 'Correct!';
        area.querySelector('.quiz-typing-def')?.classList.add('correct');
    } else {
        if (fb) fb.innerHTML = `Not quite — the answer was <strong>${escapeHtml(stripPos(q.word))}</strong>`;
        area.querySelector('.quiz-typing-def')?.classList.add('wrong');
    }
    document.getElementById('typing-input')?.setAttribute('readonly', 'true');
    setTimeout(advanceQuiz, exact ? 700 : 1600);
}

/* ---------- mode: listening ---------- */
function playQuizAudio(src) {
    stopQuizAudio();
    try {
        _quizAudio = new Audio(applyAudioVersion(src));
        _quizAudio.play().catch(() => {});
    } catch { /* noop */ }
}

function renderListeningQuestion(q, area) {
    area.innerHTML = `
        <div class="quiz-prompt">Listen and choose the word:</div>
        <div class="quiz-listen-controls">
            <button type="button" class="audio-tts-btn quiz-replay-btn" title="Replay audio" aria-label="Replay audio">&#128266;</button>
        </div>
        <div class="quiz-options">
            ${q.options.map((opt, i) => `
                <button type="button" class="quiz-option" data-correct="${stripPos(opt) === stripPos(q.word) ? '1' : '0'}" data-index="${i}">
                    <span class="quiz-option-key">${i + 1}</span>
                    <span class="quiz-option-word">${escapeHtml(stripPos(opt))}</span>
                </button>`).join('')}
        </div>
        <div class="quiz-feedback" id="quiz-feedback" aria-live="polite"></div>`;

    playQuizAudio(q.audio);
    area.querySelector('.quiz-replay-btn')?.addEventListener('click', () => playQuizAudio(q.audio));
    area.querySelectorAll('.quiz-option').forEach(btn => {
        btn.addEventListener('click', () => {
            if (_quizAnswered) return;
            const correct = btn.dataset.correct === '1';
            settleChoice(area, correct, btn, q);
        });
    });
}

function advanceQuiz() {
    stopQuizAudio();
    if (_quizIndex < _quizData.length - 1) { _quizIndex++; renderQuizQuestion(); }
    else renderQuizSummary();
}

function renderQuizSummary() {
    stopQuizAudio();
    recordActivity(Math.max(1, Math.round(_quizScore / 2)));
    const area = document.getElementById('quiz-question-area');
    const counter = document.getElementById('quiz-counter');
    const fill = document.getElementById('quiz-progress-fill');
    if (counter) counter.textContent = 'Done!';
    if (fill) fill.style.width = '100%';
    if (!area) return;
    const pct = _quizData.length ? Math.round((_quizScore / _quizData.length) * 100) : 0;
    const titles = { choice: 'Multiple choice', typing: 'Typing test', listening: 'Listening quiz' };
    area.innerHTML = `
        <div class="flashcard-summary">
            <div class="fc-summary-title">${pct >= 80 ? 'Excellent!' : pct >= 50 ? 'Good job!' : 'Keep practising!'}</div>
            <p class="fc-summary-text">${titles[_quizMode] || 'Quiz'} — you scored ${_quizScore} / ${_quizData.length} (${pct}%).</p>
            <div class="fc-summary-actions">
                <button class="fc-btn" type="button" id="quiz-restart">Play again</button>
                <button class="fc-btn fc-btn-secondary" type="button" id="quiz-menu-btn">Other modes</button>
                <button class="fc-btn fc-btn-secondary" type="button" id="quiz-close-2">Close</button>
            </div>
        </div>`;
    document.getElementById('quiz-restart')?.addEventListener('click', () => startQuiz(_quizSourcePool, _quizMode));
    document.getElementById('quiz-menu-btn')?.addEventListener('click', () => openQuizMenu(_quizSourcePool));
    document.getElementById('quiz-close-2')?.addEventListener('click', closeQuiz);
}

/* ==============================================
   #8 — INDEX PAGE STATS
   ============================================== */
function updateIndexStats(vocabCount, unitCount, grammarCount) {
    const animateNumber = (el, target) => {
        if (!el || isNaN(target)) return;
        let current = 0;
        const step = Math.ceil(target / 40);
        const timer = setInterval(() => {
            current = Math.min(current + step, target);
            el.textContent = current;
            if (current >= target) clearInterval(timer);
        }, 30);
    };

    animateNumber(document.getElementById('stat-vocab'), vocabCount);
    animateNumber(document.getElementById('stat-units'), unitCount);
    animateNumber(document.getElementById('stat-grammar'), grammarCount);
}

/* ==============================================
   GLOBAL SEARCH (site-wide instant search)
   ============================================== */
let _gsPromise = null;
const GS_CACHE_KEY = 'tn-search-cache-v2';
const GS_TTL = 30 * 60 * 1000;

function ensureSearchIndex() {
    // Share a single in-flight build across concurrent callers
    if (!_gsPromise) {
        _gsPromise = buildSearchIndex();
    }
    return _gsPromise;
}

async function buildSearchIndex() {
    let items = null;
    try {
        const cached = JSON.parse(sessionStorage.getItem(GS_CACHE_KEY) || 'null');
        if (cached && Date.now() - cached.t < GS_TTL && Array.isArray(cached.items)) {
            items = cached.items;
        } else {
            const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            const { db } = await import('./firebase-config.js');
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

            // NOTE: assigns the OUTER `items` (no shadowing!)
            items = [];
            vocabs.forEach(v => v.word && items.push({ t: 'Vocabulary', label: v.word, sub: inUnit(v.unitId), url: `unit_detail.html?id=${v.unitId}` }));
            phrasals.forEach(v => v.word && items.push({ t: 'Phrasal Verbs', label: v.word, sub: inUnit(v.unitId), url: `unit_phrasal.html?id=${v.unitId}` }));
            preps.forEach(v => v.word && items.push({ t: 'Prepositional Phrases', label: v.word, sub: inUnit(v.unitId), url: `unit_prep.html?id=${v.unitId}` }));
            patterns.forEach(v => v.word && items.push({ t: 'Word Patterns', label: v.word, sub: inUnit(v.unitId), url: `unit_pattern.html?id=${v.unitId}` }));
            wordforms.forEach(w => w.rootWord && items.push({ t: 'Word Formation', label: w.rootWord, sub: inUnit(w.unitId), url: `unit_wordform.html?id=${w.unitId}` }));
            lexicals.forEach(l => (l.words || []).forEach(w => w.word && items.push({ t: 'Lexical Expansion', label: w.word, sub: inUnit(l.unitId), url: `unit_lexical.html?id=${l.unitId}` })));
            books.forEach(b => b.title && items.push({ t: 'Books', label: b.title, sub: b.subtitle || 'Book', url: `units.html?bookId=${b.id}` }));
            gLessons.forEach(l => l.title && items.push({ t: 'Grammar', label: l.title, sub: 'Lesson', url: `grammar_lesson.html?id=${l.id}&type=lesson` }));
            gUnits.forEach(u => u.title && items.push({ t: 'Grammar', label: u.title, sub: 'Unit', url: `grammar_lesson.html?id=${u.id}&type=unit` }));
            pLessons.forEach(l => l.title && items.push({ t: 'Pronunciation', label: l.title, sub: 'Lesson', url: `pronunciation_lesson.html?id=${l.id}&type=lesson` }));
            pUnits.forEach(u => u.title && items.push({ t: 'Pronunciation', label: u.title, sub: 'Unit', url: `pronunciation_lesson.html?id=${u.id}&type=unit` }));

            try { sessionStorage.setItem(GS_CACHE_KEY, JSON.stringify({ t: Date.now(), items })); } catch {}
        }
    } catch (e) {
        console.warn('[search] index failed:', e);
        _gsPromise = null; // allow retry on next keystroke
        return null;
    }
    return items;
}

function initGlobalSearch() {
    const headerContent = document.querySelector('.main-header .header-content');
    if (!headerContent) return;

    const wrap = document.createElement('div');
    wrap.className = 'global-search';
    wrap.innerHTML = `
        <svg class="gs-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>
        <input type="search" class="gs-input" placeholder="Search words, grammar…" aria-label="Search the whole site">
        <div class="gs-results" hidden></div>`;
    headerContent.appendChild(wrap);

    const input = wrap.querySelector('.gs-input');
    const box = wrap.querySelector('.gs-results');
    let activeIdx = -1;
    let currentResults = [];
    let debounceT;

    const close = () => { box.hidden = true; activeIdx = -1; };

    const renderResults = () => {
        const term = input.value.toLowerCase().trim();
        if (!term || !currentResults.length) { close(); return; }
        const scored = [];
        for (const it of currentResults) {
            const lbl = (it.label || '').toLowerCase();
            let score = 0;
            if (lbl === term) score = 100;
            else if (lbl.startsWith(term)) score = 80;
            else if (lbl.includes(term)) score = 60;
            else if ((it.sub || '').toLowerCase().includes(term)) score = 30;
            if (score) scored.push({ score, it });
        }
        scored.sort((a, b) => b.score - a.score);
        const top = scored.slice(0, 12).map(x => x.it);

        if (!top.length) {
            box.innerHTML = '<div class="gs-empty">No matches found.</div>';
            box.hidden = false;
            return;
        }

        const hl = (t) => {
            const s2 = String(t);
            const idx = s2.toLowerCase().indexOf(term);
            if (idx === -1) return escapeHtml(s2);
            return escapeHtml(s2.slice(0, idx)) + '<mark>' +
                escapeHtml(s2.slice(idx, idx + term.length)) + '</mark>' +
                escapeHtml(s2.slice(idx + term.length));
        };
        let lastType = '';
        activeIdx = Math.min(activeIdx, top.length - 1);
        box.innerHTML = top.map((it, i) => {
            const header = it.t !== lastType ? `<div class="gs-group">${escapeHtml(it.t)}</div>` : '';
            lastType = it.t;
            return `${header}
                <a class="gs-item ${i === activeIdx ? 'active' : ''}" href="${escapeHtml(it.url)}">
                    <span class="gs-label">${hl(it.label)}</span>
                    ${it.sub ? `<span class="gs-sub">${escapeHtml(it.sub)}</span>` : ''}
                </a>`;
        }).join('');
        box.hidden = false;
    };

    input.addEventListener('input', () => {
        clearTimeout(debounceT);
        debounceT = setTimeout(async () => {
            currentResults = (await ensureSearchIndex()) || [];
            renderResults();
        }, 180);
    });

    input.addEventListener('focus', async () => {
        currentResults = (await ensureSearchIndex()) || [];
    });

    input.addEventListener('keydown', (e) => {
        if (box.hidden) return;
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const items = [...box.querySelectorAll('.gs-item')];
            if (!items.length) return;
            activeIdx = e.key === 'ArrowDown'
                ? Math.min(activeIdx + 1, items.length - 1)
                : Math.max(activeIdx - 1, 0);
            items.forEach((el, i) => el.classList.toggle('active', i === activeIdx));
            items[activeIdx]?.scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
            const target = box.querySelectorAll('.gs-item')[Math.max(activeIdx, 0)];
            if (target) window.location.href = target.getAttribute('href');
        } else if (e.key === 'Escape') {
            close(); input.blur();
        }
    });

    document.addEventListener('click', (e) => {
        if (!wrap.contains(e.target)) close();
    });
}

/* ==============================================
   DICTIONARY POPUP — double-click any word inside
   examples / definitions to look it up.
   ============================================== */
function initDictPopup() {
    let pop = null;
    const dismiss = () => { pop?.remove(); pop = null; };

    // Esc closes the popup from anywhere on the page
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && pop) dismiss();
    });

    const baseForms = (w) => {
        const out = new Set([w]);
        if (w.endsWith('ies')) out.add(w.slice(0, -3) + 'y');
        if (w.endsWith('es')) out.add(w.slice(0, -2));
        if (w.endsWith('s')) out.add(w.slice(0, -1));
        if (w.endsWith('ed')) { out.add(w.slice(0, -2)); out.add(w.slice(0, -1)); }
        if (w.endsWith('ing')) { out.add(w.slice(0, -3)); out.add(w.slice(0, -3) + 'e'); }
        return out;
    };

    document.addEventListener('dblclick', (e) => {
        const zone = e.target.closest('.vocab-example, .phrasal-example, .wf-example-line');
        if (!zone) return;
        const sel = window.getSelection();
        const wordRaw = String(sel || '').trim().replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, '');
        if (!wordRaw || wordRaw.split(/\s+/).length > 3) return;

        const lexicon = window.__unitLexicon || {};
        const lower = wordRaw.toLowerCase();
        let hit = null;
        for (const cand of baseForms(lower)) {
            if (lexicon[cand]) { hit = lexicon[cand]; break; }
        }
        showDictPop(e, sel, wordRaw, hit);
    });

    function showDictPop(e, sel, wordRaw, hit) {
        dismiss();
        pop = document.createElement('div');
        pop.className = 'dict-pop';
        const slug = encodeURIComponent(wordRaw.toLowerCase());
        const audioBtn = hit
            ? `<button type="button" class="audio-tts-btn" data-say="${escapeHtml(hit.word)}" title="Read aloud">&#128266;</button>`
            : '';
        pop.innerHTML = `
            <div class="dp-word">${escapeHtml(wordRaw)} ${audioBtn}</div>
            ${hit?.def
                ? `<div class="dp-def">${escapeHtml(hit.def)}</div>`
                : '<div class="dp-def dp-muted">Not in this unit&rsquo;s vocabulary.</div>'}
            <div class="dp-links">
                <a href="https://www.ldoceonline.com/dictionary/${slug}" target="_blank" rel="noopener">Longman &#8599;</a>
                <a href="https://dictionary.cambridge.org/dictionary/english/${slug}" target="_blank" rel="noopener">Cambridge &#8599;</a>
            </div>`;

        document.body.appendChild(pop);
        const pw = pop.offsetWidth, ph = pop.offsetHeight;
        const rect = sel?.rangeCount ? sel.getRangeAt(0).getBoundingClientRect() : { left: e.clientX, top: e.clientY, width: 0, bottom: e.clientY };
        let left = rect.left + window.scrollX + rect.width / 2 - pw / 2;
        let top = rect.top + window.scrollY - ph - 8;
        if (top < window.scrollY + 8) top = (rect.bottom || e.clientY) + window.scrollY + 8;
        const vw = document.documentElement.clientWidth;
        if (vw < 480) left = Math.max(8, (vw - pw) / 2); else left = Math.max(window.scrollX + 8, left);
        pop.style.left = left + 'px';
        pop.style.top = top + 'px';

        pop.querySelector('.audio-tts-btn')?.addEventListener('click', function () {
            window.speakText(this);
        });

        setTimeout(() => {
            const off = (ev) => {
                if (pop && !pop.contains(ev.target)) { dismiss(); document.removeEventListener('click', off, true); }
            };
            document.addEventListener('click', off, true);
        }, 10);
        // NOTE: the popup is positioned in page coordinates, so it stays
        // anchored to the selected word while scrolling (no dismiss on scroll).
    }
}

/* ==============================================
   LEARNER AUTH BOX (sidebar footer) — Google sign-in
   ============================================== */
function buildAuthBox() {
    // Prefer the static container shipped in page markup
    // (.sidebar-bottom > #tn-auth-box, directly under the dark-mode toggle)
    const box = document.getElementById('tn-auth-box');
    if (!box) return;
    if (box.dataset.wired === '1') return;
    box.dataset.wired = '1';

    const statusEl = box.querySelector('.tn-auth-status');
    const actionsEl = box.querySelector('.tn-auth-actions');

    const GOOGLE_SVG = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M21.35 11.1H12v3.9h5.4c-.55 2.5-2.7 3.9-5.4 3.9a6 6 0 1 1 0-12c1.5 0 2.9.55 4 1.45l2.9-2.9A10 10 0 1 0 22 12c0-.3-.03-.6-.06-.9z"/></svg>';
    const EXIT_SVG = '<svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>';

    let errorTimer;
    function showError(msg) {
        clearTimeout(errorTimer);
        statusEl.innerHTML = `<span class="tn-auth-error">${escapeHtml(msg)}</span>`;
        errorTimer = setTimeout(() => render(getUser()), 6000);
    }

    function render(user) {
        // Session not resolved yet — avoid flashing the signed-out state
        if (!isAuthResolved()) {
            statusEl.innerHTML = '<span class="tn-auth-name tn-muted">Loading&hellip;</span>';
            actionsEl.innerHTML = '';
            return;
        }
        if (user) {
            const name = user.displayName || user.email || 'Learner';
            statusEl.innerHTML = `
                <span class="tn-avatar" aria-hidden="true">${escapeHtml((name[0] || '?').toUpperCase())}</span>
                <span class="tn-auth-name" title="${escapeHtml(user.email || '')}">${escapeHtml(name)}</span>`;
            actionsEl.innerHTML = `
                <button type="button" class="btn-retry tn-signout-btn" title="Sign out">
                    ${EXIT_SVG}<span class="tn-full-label">Sign out</span>
                </button>`;
            actionsEl.querySelector('.tn-signout-btn').addEventListener('click', () => signOutUser());
        } else {
            statusEl.innerHTML = '<span class="tn-auth-name tn-muted">Local progress only</span>';
            actionsEl.innerHTML = `
                <button type="button" class="btn-retry tn-signin-btn" title="Sign in with Google">
                    ${GOOGLE_SVG}<span class="tn-full-label">Sign in</span>
                </button>`;
            const btn = actionsEl.querySelector('.tn-signin-btn');
            btn.addEventListener('click', async () => {
                btn.disabled = true;
                btn.classList.add('tn-busy');
                try {
                    const result = await signInWithGoogle();
                    if (result === 'redirecting') {
                        statusEl.innerHTML = '<span class="tn-auth-name">Redirecting to Google&hellip;</span>';
                    }
                    // success path is handled by onStoreAuthChanged
                } catch (err) {
                    const code = err?.code || '';
                    let msg;
                    if (code === 'auth/unauthorized-domain') {
                        msg = 'This domain is not authorized for Google sign-in. Open the site via http://localhost:PORT (not 127.0.0.1), or add the domain in Firebase Console → Authentication → Settings → Authorized domains.';
                    } else if (code === 'auth/popup-closed-by-user') {
                        msg = 'Sign-in cancelled.';
                    } else if (code.includes('network')) {
                        msg = 'Network problem — check your connection and retry.';
                    } else {
                        msg = 'Sign-in failed' + (code ? ` (${code})` : '') + '.';
                    }
                    showError(msg);
                } finally {
                    btn.disabled = false;
                    btn.classList.remove('tn-busy');
                }
            });
        }
    }

    onStoreAuthChanged(render);
    onAuthError((err) => {
        const code = err?.code || '';
        if (code === 'auth/unauthorized-domain') {
            showError('Domain not authorized — use localhost or add it in Firebase Console → Authorized domains.');
        }
    });
}

/* ==============================================
   REVIEW BADGE (sidebar "Review today" count)
   ============================================== */
function updateReviewBadge() {
    const el = document.getElementById('review-count-badge');
    if (!el) return;
    const due = srsDueList().filter(en => en.next !== '9999-12-31').length;
    el.textContent = due > 99 ? '99+' : String(due);
    el.hidden = due === 0;
}

/* ==============================================
   PWA — service worker registration
   ============================================== */
function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol === 'file:') return;
    navigator.serviceWorker.register('sw.js').catch(err => {
        console.warn('[pwa] SW registration skipped:', err.message);
    });
}

/* ==============================================
   SHARED — SIDEBAR / MOBILE MENU
   Previously copy-pasted in main.js, grammar.js, pronunciation.js
   ============================================== */
function initSidebar() {
    const sidebarToggle = document.getElementById('sidebar-toggle-expanded');
    const sidebarBrandContainer = document.querySelector('.sidebar-brand-container');
    const sidebar = document.querySelector('.sidebar');

    if (sidebar) {
        // Apply collapsed state immediately (no-transition to avoid flash)
        if (localStorage.getItem('sidebar-collapsed') === 'true') {
            sidebar.classList.add('collapsed', 'no-transition');
        }
        // Remove the pre-collapse class from <html> and re-enable transitions
        document.documentElement.classList.remove('sidebar-will-collapse');
        setTimeout(() => sidebar.classList.remove('no-transition'), 50);

        const toggleSidebar = () => {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebar-collapsed', String(sidebar.classList.contains('collapsed')));
        };

        if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);

        // When sidebar is collapsed, clicking the logo area expands it
        if (sidebarBrandContainer) {
            sidebarBrandContainer.addEventListener('click', (e) => {
                if (sidebar.classList.contains('collapsed')) {
                    e.preventDefault();
                    toggleSidebar();
                }
            });
        }
    }

    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && sidebar.classList.contains('mobile-open')) {
                if (!sidebar.contains(e.target) && e.target !== mobileMenuBtn) {
                    sidebar.classList.remove('mobile-open');
                }
            }
        });
    }
}

/* ==============================================
   INIT
   ============================================== */
document.addEventListener('DOMContentLoaded', () => {
    initStore();
    initDarkMode();
    initRevealAnimations();
    initBreadcrumb();
    initSidebar();
    buildAuthBox();
    initGlobalSearch();
    initDictPopup();
    registerServiceWorker();
    setTimeout(updateReviewBadge, 800);
    // Refresh the due-today badge once the account's cloud data is merged in
    onStoreAuthChanged(() => updateReviewBadge());
});

// Export functions to window for use in main.js
window.buildCustomAudioPlayer = buildCustomAudioPlayer;
window.highlightWordInExample = highlightWordInExample;
window.initFlashcard = initFlashcard;
window.initQuiz = initQuiz;
window.updateReviewBadge = updateReviewBadge;
window.updateIndexStats = updateIndexStats;
window.initRevealAnimations = initRevealAnimations;
>>>>>>> newFeature
