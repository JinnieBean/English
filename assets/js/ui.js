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
