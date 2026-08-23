/**
 * ui.js — Thor's Notes UI Enhancement Module
 * Handles: Dark Mode (#7), Fade-in (#9), Custom Audio (#13),
 *          Vocab Highlight (#14), Flashcard Mode (#10),
 *          Progress Indicator (#11), Breadcrumb (#5), Stats (#8)
 */
import { escapeHtml, formatTime, applyAudioVersion } from './utils.js';

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
   #11 — PROGRESS INDICATOR (driven by flashcard results)
   ============================================== */
export function getKnownWords(unitId) {
    try { return new Set(JSON.parse(localStorage.getItem(`progress-${unitId}`) || '[]')); }
    catch { return new Set(); }
}

export function saveKnownWords(unitId, knownSet) {
    localStorage.setItem(`progress-${unitId}`, JSON.stringify([...knownSet]));
}

function renderProgressBadge(unitId, total) {
    const badge = document.getElementById(`progress-badge-${unitId}`);
    if (!badge) return;
    const count = Math.min(getKnownWords(unitId).size, total);
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
    _flashcardUnitId = unitId || vocabs[0]?.unitId || null;
    _fcKnown = getKnownWords(_flashcardUnitId);

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
        const ttsBtn = e.target.closest('.fc-tts');
        if (ttsBtn) {
            e.stopPropagation();
            window.speakText(ttsBtn);
            return;
        }
        const actionEl = e.target.closest('[data-fc-action]');
        if (actionEl) {
            e.stopPropagation();
            handleFcAction(actionEl.dataset.fcAction);
            return;
        }
        if (e.target === overlay) closeFlashcards();
    });
    document.getElementById('flashcard-card-area')?.addEventListener('click', (e) => {
        if (e.target.closest('[data-fc-action]')) return;
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
    persistKnown();
    if (_lastFocused instanceof HTMLElement) _lastFocused.focus();
}

function persistKnown() {
    if (_flashcardUnitId) saveKnownWords(_flashcardUnitId, _fcKnown);
    if (_flashcardUnitId) {
        renderProgressBadge(_flashcardUnitId, document.querySelectorAll('.vocab-item').length || _flashcardData.length);
    }
}

function handleFcAction(action) {
    switch (action) {
        case 'close': closeFlashcards(); break;
        case 'flip': _flashcardRevealed = !_flashcardRevealed; renderFlashcard(); break;
        case 'prev':
            if (_fcSessionDone) { restartFlashcards(_flashcardData); return; }
            if (_flashcardIndex > 0) { _flashcardIndex--; _flashcardRevealed = false; renderFlashcard(); }
            break;
        case 'next':
            if (_fcSessionDone) { restartFlashcards(_flashcardData); return; }
            if (_flashcardIndex < _flashcardData.length - 1) { _flashcardIndex++; _flashcardRevealed = false; renderFlashcard(); }
            else finishSession();
            break;
        case 'known':
            if (_fcSessionDone) return;
            _fcKnown.add(_flashcardData[_flashcardIndex].id);
            advanceOrFinish();
            break;
        case 'unknown':
            if (_fcSessionDone) return;
            _fcKnown.delete(_flashcardData[_flashcardIndex].id);
            advanceOrFinish();
            break;
        case 'restart-all': restartFlashcards(_flashcardData); break;
        case 'restart-unknown': {
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
            cardArea.innerHTML = `
                <div class="flashcard-front ${isKnown ? 'fc-marked-known' : ''}">
                    <div class="flashcard-word">${escapeHtml(v.word || '')}</div>
                    <div class="flashcard-pron">${escapeHtml(v.pron || '')}</div>
                    <button class="fc-tts" type="button" title="Read aloud" data-say="${escapeHtml(cleanWord)}" aria-label="Read aloud">&#128266;</button>
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
   #12 — QUIZ MODE (multiple choice from unit vocabulary)
   ============================================== */
let _quizData = [];
let _quizIndex = 0;
let _quizScore = 0;
let _quizAnswered = false;

function initQuiz(vocabs) {
    if (!vocabs || vocabs.length < 4) return;

    const btn = document.getElementById('quiz-toggle-btn');
    if (!btn) return;
    btn.addEventListener('click', () => openQuiz(vocabs));
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
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeQuiz();
        // Number keys 1-4 pick an answer
        if (/^[1-4]$/.test(e.key) && overlay.classList.contains('active')) {
            const opt = document.querySelector(`.quiz-option[data-index="${+e.key - 1}"]`);
            if (opt) opt.click();
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

function openQuiz(vocabs) {
    ensureQuizOverlay();
    const eligible = vocabs.filter(v => v.word && v.def);
    if (eligible.length < 4) return;
    _quizData = shuffle(eligible).slice(0, Math.min(10, eligible.length)).map(v => ({
        ...v,
        options: buildOptions(v, eligible)
    }));
    _quizIndex = 0;
    _quizScore = 0;
    const overlay = document.getElementById('quiz-overlay');
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    renderQuizQuestion();
}

function buildOptions(current, pool) {
    const distractors = shuffle(pool.filter(v => v.id !== current.id))
        .slice(0, 3)
        .map(v => v.def);
    return shuffle([current.def, ...distractors]);
}

function closeQuiz() {
    const overlay = document.getElementById('quiz-overlay');
    overlay?.classList.remove('active');
    overlay?.setAttribute('aria-hidden', 'true');
}

function renderQuizQuestion() {
    const q = _quizData[_quizIndex];
    const area = document.getElementById('quiz-question-area');
    const counter = document.getElementById('quiz-counter');
    const fill = document.getElementById('quiz-progress-fill');
    if (!q || !area) return;

    _quizAnswered = false;
    if (counter) counter.textContent = `${_quizIndex + 1} / ${_quizData.length}`;
    if (fill) fill.style.width = ((_quizIndex / _quizData.length) * 100) + '%';

    area.innerHTML = `
        <div class="quiz-prompt">What does <strong>&ldquo;${escapeHtml((q.word || '').replace(/\s*\([^)]*\)\s*$/g, '').trim())}&rdquo;</strong> mean?</div>
        <div class="quiz-options">
            ${q.options.map((opt, i) => `
                <button type="button" class="quiz-option" data-correct="${opt === q.def ? '1' : '0'}" data-index="${i}">
                    <span class="quiz-option-key">${i + 1}</span>
                    <span>${escapeHtml(opt)}</span>
                </button>`).join('')}
        </div>
        <div class="quiz-feedback" id="quiz-feedback" aria-live="polite"></div>
    `;

    area.querySelectorAll('.quiz-option').forEach(optBtn => {
        optBtn.addEventListener('click', () => {
            if (_quizAnswered) return;
            _quizAnswered = true;
            const correct = optBtn.dataset.correct === '1';
            if (correct) _quizScore++;
            area.querySelectorAll('.quiz-option').forEach(b => {
                b.disabled = true;
                if (b.dataset.correct === '1') b.classList.add('correct');
            });
            if (!correct) optBtn.classList.add('wrong');
            const fb = document.getElementById('quiz-feedback');
            if (fb) fb.textContent = correct ? 'Correct!' : `Answer: ${(q.word || '').replace(/\s*\([^)]*\)\s*$/g, '').trim()}`;
            setTimeout(() => {
                if (_quizIndex < _quizData.length - 1) { _quizIndex++; renderQuizQuestion(); }
                else renderQuizSummary();
            }, correct ? 700 : 1600);
        });
    });
}

function renderQuizSummary() {
    const area = document.getElementById('quiz-question-area');
    const counter = document.getElementById('quiz-counter');
    const fill = document.getElementById('quiz-progress-fill');
    if (counter) counter.textContent = 'Done!';
    if (fill) fill.style.width = '100%';
    if (!area) return;
    const pct = Math.round((_quizScore / _quizData.length) * 100);
    area.innerHTML = `
        <div class="flashcard-summary">
            <div class="fc-summary-title">${pct >= 80 ? 'Excellent!' : pct >= 50 ? 'Good job!' : 'Keep practising!'}</div>
            <p class="fc-summary-text">You scored ${_quizScore} / ${_quizData.length} (${pct}%).</p>
            <div class="fc-summary-actions">
                <button class="fc-btn" type="button" id="quiz-restart">Play again</button>
                <button class="fc-btn fc-btn-secondary" type="button" id="quiz-close-2">Close</button>
            </div>
        </div>`;
    document.getElementById('quiz-restart')?.addEventListener('click', () => openQuiz(_quizData.map(q => ({ ...q, options: undefined }))));
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
    initDarkMode();
    initRevealAnimations();
    initBreadcrumb();
    initSidebar();
});

// Export functions to window for use in main.js
window.buildCustomAudioPlayer = buildCustomAudioPlayer;
window.highlightWordInExample = highlightWordInExample;
window.getKnownWords = getKnownWords;
window.initFlashcard = initFlashcard;
window.initQuiz = initQuiz;
window.updateIndexStats = updateIndexStats;
window.initRevealAnimations = initRevealAnimations;
