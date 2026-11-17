import { escapeHtml } from './utils.js';

const DATA = {
  "vowels": [
    {
      "character": "iː",
      "imageSoundName": "a1",
      "optionLetter": [
        {
          "letter": "s_e_at",
          "sound": "seat"
        },
        {
          "letter": "gr_e_en",
          "sound": "green"
        },
        {
          "letter": "tr_e_e",
          "sound": "tree"
        }
      ]
    },
    {
      "character": "ɪ",
      "imageSoundName": "b1",
      "optionLetter": [
        {
          "letter": "s_it",
          "sound": "sit"
        },
        {
          "letter": "gr_in",
          "sound": "grin"
        },
        {
          "letter": "f_ish",
          "sound": "fish"
        }
      ]
    },
    {
      "character": "ʊ",
      "imageSoundName": "c1",
      "optionLetter": [
        {
          "letter": "g_o_od",
          "sound": "good"
        },
        {
          "letter": "f_o_ot",
          "sound": "foot"
        },
        {
          "letter": "p_ull",
          "sound": "pull"
        }
      ]
    },
    {
      "character": "uː",
      "imageSoundName": "d1",
      "optionLetter": [
        {
          "letter": "f_o_od",
          "sound": "food"
        },
        {
          "letter": "y_o_u",
          "sound": "you"
        },
        {
          "letter": "sh_o_e",
          "sound": "shoe"
        }
      ]
    },
    {
      "character": "e",
      "imageSoundName": "a2",
      "optionLetter": [
        {
          "letter": "h_e_ad",
          "sound": "head"
        },
        {
          "letter": "b_et",
          "sound": "bet"
        },
        {
          "letter": "s_a_id",
          "sound": "said"
        }
      ]
    },
    {
      "character": "ə",
      "imageSoundName": "b2",
      "optionLetter": [
        {
          "letter": "teach_e_r",
          "sound": "teacher"
        },
        {
          "letter": "_observ_e_r",
          "sound": "observer"
        },
        {
          "letter": "_about",
          "sound": "about"
        }
      ]
    },
    {
      "character": "ɜː",
      "imageSoundName": "c2",
      "optionLetter": [
        {
          "letter": "g_i_rl",
          "sound": "girl"
        },
        {
          "letter": "n_u_rse",
          "sound": "nurse"
        },
        {
          "letter": "_e_a_rth",
          "sound": "earth"
        }
      ]
    },
    {
      "character": "ɔː",
      "imageSoundName": "d2",
      "optionLetter": [
        {
          "letter": "w_a_lk",
          "sound": "walk"
        },
        {
          "letter": "d_o_or",
          "sound": "door"
        },
        {
          "letter": "f_o_ur",
          "sound": "four"
        }
      ]
    },
    {
      "character": "æ",
      "imageSoundName": "a3",
      "optionLetter": [
        {
          "letter": "h_ad",
          "sound": "had"
        },
        {
          "letter": "l_amb",
          "sound": "lamb"
        },
        {
          "letter": "_apple",
          "sound": "apple"
        }
      ]
    },
    {
      "character": "ʌ",
      "imageSoundName": "b3",
      "optionLetter": [
        {
          "letter": "c_up",
          "sound": "cup"
        },
        {
          "letter": "l_ove",
          "sound": "love"
        },
        {
          "letter": "m_oney",
          "sound": "money"
        }
      ]
    },
    {
      "character": "ɑː",
      "imageSoundName": "c3",
      "optionLetter": [
        {
          "letter": "h_e_a_rt",
          "sound": "heart"
        },
        {
          "letter": "d_a_rk",
          "sound": "dark"
        },
        {
          "letter": "j_a_r",
          "sound": "jar"
        }
      ]
    },
    {
      "character": "ɒ",
      "imageSoundName": "d3",
      "optionLetter": [
        {
          "letter": "h_ot",
          "sound": "hot"
        },
        {
          "letter": "st_op",
          "sound": "stop"
        },
        {
          "letter": "w_ant",
          "sound": "want"
        }
      ]
    }
  ],
  "diphthongs": [
    {
      "character": "ɪə",
      "imageSoundName": "f1",
      "optionLetter": [
        {
          "letter": "y_e_ar",
          "sound": "year"
        },
        {
          "letter": "b_e_er",
          "sound": "beer"
        },
        {
          "letter": "_e_a_r",
          "sound": "ear"
        }
      ]
    },
    {
      "character": "eə",
      "imageSoundName": "g1",
      "optionLetter": [
        {
          "letter": "ch_a_i_r",
          "sound": "chair"
        },
        {
          "letter": "wh_e_r_e",
          "sound": "where"
        },
        {
          "letter": "th_e_r_e",
          "sound": "there"
        }
      ]
    },
    {
      "character": "əʊ",
      "imageSoundName": "f2",
      "optionLetter": [
        {
          "letter": "j_oke",
          "sound": "joke"
        },
        {
          "letter": "v_ote",
          "sound": "vote"
        },
        {
          "letter": "thr_o_w",
          "sound": "throwoption"
        }
      ]
    },
    {
      "character": "aʊ",
      "imageSoundName": "g2",
      "optionLetter": [
        {
          "letter": "v_o_w",
          "sound": "vow"
        },
        {
          "letter": "l_o_unge",
          "sound": "lounge"
        },
        {
          "letter": "_o_ut",
          "sound": "out"
        }
      ]
    },
    {
      "character": "ʊə",
      "imageSoundName": "h2",
      "optionLetter": [
        {
          "letter": "s_e_w_e_r",
          "sound": "sewer"
        },
        {
          "letter": "f_e_w_e_r",
          "sound": "fewer"
        },
        {
          "letter": "fl_u_ent",
          "sound": "fluent"
        }
      ]
    },
    {
      "character": "eɪ",
      "imageSoundName": "f3",
      "optionLetter": [
        {
          "letter": "th_e_y",
          "sound": "they"
        },
        {
          "letter": "b_athe",
          "sound": "bathe"
        },
        {
          "letter": "w_a_y",
          "sound": "way"
        }
      ]
    },
    {
      "character": "aɪ",
      "imageSoundName": "g3",
      "optionLetter": [
        {
          "letter": "th_i_g_h",
          "sound": "thigh"
        },
        {
          "letter": "d_ice",
          "sound": "dice"
        },
        {
          "letter": "m_y",
          "sound": "my"
        }
      ]
    },
    {
      "character": "ɔɪ",
      "imageSoundName": "h3",
      "optionLetter": [
        {
          "letter": "j_o_y",
          "sound": "joy"
        },
        {
          "letter": "n_o_ise",
          "sound": "noise"
        },
        {
          "letter": "ch_o_ice",
          "sound": "choice"
        }
      ]
    }
  ],
  "consonants": [
    {
      "character": "p",
      "imageSoundName": "a4",
      "optionLetter": [
        {
          "letter": "_pull",
          "sound": "pull"
        },
        {
          "letter": "sto_p",
          "sound": "stop"
        },
        {
          "letter": "a_p_ple",
          "sound": "apple"
        }
      ]
    },
    {
      "character": "f",
      "imageSoundName": "b4",
      "optionLetter": [
        {
          "letter": "_four",
          "sound": "four"
        },
        {
          "letter": "_food",
          "sound": "food"
        },
        {
          "letter": "_fish",
          "sound": "fish"
        }
      ]
    },
    {
      "character": "t",
      "imageSoundName": "c4",
      "optionLetter": [
        {
          "letter": "_tree",
          "sound": "tree"
        },
        {
          "letter": "s_top",
          "sound": "stop"
        },
        {
          "letter": "wan_t",
          "sound": "want"
        }
      ]
    },
    {
      "character": "θ",
      "imageSoundName": "d4",
      "optionLetter": [
        {
          "letter": "ear_t_h",
          "sound": "earth"
        },
        {
          "letter": "_t_high",
          "sound": "thigh"
        },
        {
          "letter": "_t_hrow",
          "sound": "throwoption"
        }
      ]
    },
    {
      "character": "tʃ",
      "imageSoundName": "e4",
      "optionLetter": [
        {
          "letter": "tea_c_her",
          "sound": "teacher"
        },
        {
          "letter": "_c_hair",
          "sound": "chair"
        },
        {
          "letter": "_c_hoice",
          "sound": "choice"
        }
      ]
    },
    {
      "character": "s",
      "imageSoundName": "f4",
      "optionLetter": [
        {
          "letter": "_stop",
          "sound": "stop"
        },
        {
          "letter": "_sit",
          "sound": "sit"
        },
        {
          "letter": "fa_st",
          "sound": "fast"
        }
      ]
    },
    {
      "character": "ʃ",
      "imageSoundName": "g4",
      "optionLetter": [
        {
          "letter": "_s_hoe",
          "sound": "shoe"
        },
        {
          "letter": "fi_s_h",
          "sound": "fish"
        },
        {
          "letter": "_sure",
          "sound": "sure"
        }
      ]
    },
    {
      "character": "k",
      "imageSoundName": "h4",
      "optionLetter": [
        {
          "letter": "wal_k",
          "sound": "walk"
        },
        {
          "letter": "dar_k",
          "sound": "dark"
        },
        {
          "letter": "_cup",
          "sound": "cup"
        }
      ]
    },
    {
      "character": "b",
      "imageSoundName": "a5",
      "optionLetter": [
        {
          "letter": "_bet",
          "sound": "bet"
        },
        {
          "letter": "a_bout",
          "sound": "about"
        },
        {
          "letter": "_beer",
          "sound": "beer"
        }
      ]
    },
    {
      "character": "v",
      "imageSoundName": "b5",
      "optionLetter": [
        {
          "letter": "obser_ver",
          "sound": "observer"
        },
        {
          "letter": "_vow",
          "sound": "vow"
        },
        {
          "letter": "_vote",
          "sound": "vote"
        }
      ]
    },
    {
      "character": "d",
      "imageSoundName": "c5",
      "optionLetter": [
        {
          "letter": "_door",
          "sound": "door"
        },
        {
          "letter": "foo_d",
          "sound": "food"
        },
        {
          "letter": "sai_d",
          "sound": "said"
        }
      ]
    },
    {
      "character": "ð",
      "imageSoundName": "d5",
      "optionLetter": [
        {
          "letter": "_t_hey",
          "sound": "they"
        },
        {
          "letter": "_t_here",
          "sound": "there"
        },
        {
          "letter": "ba_t_he",
          "sound": "bathe"
        }
      ]
    },
    {
      "character": "dʒ",
      "imageSoundName": "e5",
      "optionLetter": [
        {
          "letter": "_joke",
          "sound": "joke"
        },
        {
          "letter": "_joy",
          "sound": "joy"
        },
        {
          "letter": "loun_ge",
          "sound": "lounge"
        }
      ]
    },
    {
      "character": "z",
      "imageSoundName": "f5",
      "optionLetter": [
        {
          "letter": "ob_server",
          "sound": "observer"
        },
        {
          "letter": "noi_se",
          "sound": "noise"
        },
        {
          "letter": "pre_sident",
          "sound": "president"
        }
      ]
    },
    {
      "character": "ʒ",
      "imageSoundName": "g5",
      "optionLetter": [
        {
          "letter": "ca_sual",
          "sound": "casual"
        },
        {
          "letter": "mea_sure",
          "sound": "measure"
        },
        {
          "letter": "plea_sure",
          "sound": "pleasure"
        }
      ]
    },
    {
      "character": "g",
      "imageSoundName": "h5",
      "optionLetter": [
        {
          "letter": "_grin",
          "sound": "grin"
        },
        {
          "letter": "_green",
          "sound": "green"
        },
        {
          "letter": "_girl",
          "sound": "girl"
        }
      ]
    },
    {
      "character": "h",
      "imageSoundName": "a6",
      "optionLetter": [
        {
          "letter": "_hot",
          "sound": "hot"
        },
        {
          "letter": "_head",
          "sound": "head"
        },
        {
          "letter": "_heart",
          "sound": "heart"
        }
      ]
    },
    {
      "character": "m",
      "imageSoundName": "b6",
      "optionLetter": [
        {
          "letter": "_money",
          "sound": "money"
        },
        {
          "letter": "la_m_b",
          "sound": "lamb"
        },
        {
          "letter": "_my",
          "sound": "my"
        }
      ]
    },
    {
      "character": "n",
      "imageSoundName": "c6",
      "optionLetter": [
        {
          "letter": "gri_n",
          "sound": "grin"
        },
        {
          "letter": "gree_n",
          "sound": "green"
        },
        {
          "letter": "_nurse",
          "sound": "nurse"
        }
      ]
    },
    {
      "character": "ŋ",
      "imageSoundName": "d6",
      "optionLetter": [
        {
          "letter": "si_n_g",
          "sound": "sing"
        },
        {
          "letter": "e_n_glish",
          "sound": "english"
        },
        {
          "letter": "dra_nk",
          "sound": "drank"
        }
      ]
    },
    {
      "character": "r",
      "imageSoundName": "e6",
      "optionLetter": [
        {
          "letter": "_rule",
          "sound": "rule"
        },
        {
          "letter": "g_rin",
          "sound": "grin"
        },
        {
          "letter": "t_ree",
          "sound": "tree"
        }
      ]
    },
    {
      "character": "l",
      "imageSoundName": "f6",
      "optionLetter": [
        {
          "letter": "pu_l_l",
          "sound": "pull"
        },
        {
          "letter": "_love",
          "sound": "love"
        },
        {
          "letter": "ru_le",
          "sound": "rule"
        }
      ]
    },
    {
      "character": "w",
      "imageSoundName": "g6",
      "optionLetter": [
        {
          "letter": "_want",
          "sound": "want"
        },
        {
          "letter": "_way",
          "sound": "way"
        },
        {
          "letter": "_w_here",
          "sound": "where"
        }
      ]
    },
    {
      "character": "j",
      "imageSoundName": "h6",
      "optionLetter": [
        {
          "letter": "_year",
          "sound": "year"
        },
        {
          "letter": "_yes",
          "sound": "yes"
        },
        {
          "letter": "_yellow",
          "sound": "yellow"
        }
      ]
    }
  ]
};

const AUDIO_BASE = 'assets/audio/ipa/';
const audioCache = new Map();

let curAudio = null;
let wordMenu = null;
let activeTile = null;
let hoverClearTimer = null;

function showToast(msg) {
    const toast = document.getElementById('ipa-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 1800);
}

function clearPlaying() {
    document.querySelectorAll('.ipa-tile.playing').forEach(x => x.classList.remove('playing'));
    document.querySelectorAll('.ipa-word-menu button.playing').forEach(x => x.classList.remove('playing'));
}

function playSound(name, targetEl) {
    const src = `${AUDIO_BASE}${encodeURIComponent(name)}.mp3`;
    if (curAudio) {
        curAudio.pause();
        curAudio.currentTime = 0;
    }
    clearPlaying();

    let audio = audioCache.get(name);
    if (!audio) {
        audio = new Audio(src);
        audio.preload = 'auto';
        audioCache.set(name, audio);
    } else {
        audio.currentTime = 0;
    }
    curAudio = audio;

    if (targetEl) targetEl.classList.add('playing');
    audio.onended = clearPlaying;
    audio.onerror = () => {
        clearPlaying();
        showToast(`Could not play audio: ${name}`);
    };
    audio.play().catch(() => {
        clearPlaying();
        showToast(`Click again to play: ${name}`);
    });
}

function cancelHoverClear() {
    if (hoverClearTimer) {
        clearTimeout(hoverClearTimer);
        hoverClearTimer = null;
    }
}

function clearHover() {
    cancelHoverClear();
    if (activeTile) {
        activeTile.classList.remove('hovered');
        activeTile = null;
    }
    document.body.classList.remove('ipa-chart-dim');
}

function closeWordMenu() {
    if (wordMenu) {
        const old = wordMenu;
        wordMenu = null;
        old.remove();
    }
}

function scheduleHoverClear(el, relatedTarget) {
    if (activeTile !== el) return;
    cancelHoverClear();
    if (wordMenu && wordMenu._tile === el && relatedTarget && wordMenu.contains(relatedTarget)) return;
    hoverClearTimer = setTimeout(() => {
        if (activeTile !== el) return;
        const overMenu = wordMenu && wordMenu._tile === el && wordMenu.matches(':hover');
        if (overMenu) return;
        const hovered = document.querySelector('.ipa-tile:hover');
        if (hovered && hovered !== el) {
            setHover(hovered);
            return;
        }
        if (!el.matches(':hover')) clearHover();
    }, 35);
}

function setHover(el) {
    cancelHoverClear();
    if (activeTile === el) {
        document.body.classList.add('ipa-chart-dim');
        return;
    }
    if (activeTile) activeTile.classList.remove('hovered');
    if (wordMenu) closeWordMenu();
    activeTile = el;
    el.classList.add('hovered');
    document.body.classList.add('ipa-chart-dim');
}

function positionWordMenu(el) {
    if (!wordMenu) return;
    const r = el.getBoundingClientRect();
    const w = 172;
    const gap = 2;
    let left = r.right + gap;
    let top = r.top;
    let side = 'menu-right';
    if (left + w > window.innerWidth - 8) {
        left = r.left - w - gap;
        side = 'menu-left';
    }
    if (top + wordMenu.offsetHeight > window.innerHeight - 8) {
        top = window.innerHeight - wordMenu.offsetHeight - 8;
    }
    top = Math.max(8, top);
    left = Math.max(8, left);
    wordMenu.classList.remove('menu-right', 'menu-left');
    wordMenu.classList.add(side);
    wordMenu.style.left = `${left}px`;
    wordMenu.style.top = `${top}px`;
}

function showWordMenu(item, el) {
    cancelHoverClear();
    if (wordMenu && wordMenu._tile === el) {
        closeWordMenu();
        return;
    }
    closeWordMenu();

    wordMenu = document.createElement('div');
    wordMenu.className = 'ipa-word-menu';
    wordMenu._tile = el;
    wordMenu.addEventListener('mouseenter', cancelHoverClear);
    wordMenu.addEventListener('mouseleave', e => scheduleHoverClear(el, e.relatedTarget));

    const title = document.createElement('div');
    title.className = 'ipa-word-menu-title';
    title.textContent = `${item.character} · example words`;
    wordMenu.appendChild(title);

    item.optionLetter.forEach(opt => {
        const b = document.createElement('button');
        b.type = 'button';
        const cleanWord = opt.letter.replaceAll('_', '');
        const displayWord = opt.sound === 'throwoption' ? 'throw' : opt.sound;
        b.innerHTML = `${escapeHtml(displayWord)}<span class="ipa-word-pattern">${escapeHtml(cleanWord)}</span>`;
        b.addEventListener('click', e => {
            e.stopPropagation();
            playSound(opt.sound, b);
        });
        wordMenu.appendChild(b);
    });

    document.body.appendChild(wordMenu);
    positionWordMenu(el);
}

function createTile(item) {
    const el = document.createElement('div');
    el.className = 'ipa-tile';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', `Play phoneme ${item.character}`);
    el.innerHTML = `<button type="button" class="ipa-play-corner" aria-label="Show example words for ${escapeHtml(item.character)}"></button><span class="ipa-symbol">${escapeHtml(item.character)}</span>`;

    el.addEventListener('mouseenter', () => setHover(el));
    el.addEventListener('mouseleave', e => scheduleHoverClear(el, e.relatedTarget));
    el.addEventListener('click', e => {
        if (e.target.closest('.ipa-play-corner')) return;
        e.stopPropagation();
        playSound(item.imageSoundName, el);
    });
    el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            playSound(item.imageSoundName, el);
        }
    });
    el.querySelector('.ipa-play-corner').addEventListener('click', e => {
        e.stopPropagation();
        showWordMenu(item, el);
    });
    return el;
}

function createGroup(label, items, gridClass, ribbonClass) {
    const group = document.createElement('section');
    group.className = 'ipa-group';
    group.innerHTML = `<div class="ipa-ribbon ${ribbonClass || ''}">${escapeHtml(label)}</div>`;
    const grid = document.createElement('div');
    grid.className = `ipa-sound-grid ${gridClass}`;
    items.forEach(item => grid.appendChild(createTile(item)));
    group.appendChild(grid);
    return group;
}

document.addEventListener('DOMContentLoaded', () => {
    const content = document.getElementById('ipa-chart-content');
    if (!content) return;

    const top = document.createElement('div');
    top.className = 'ipa-vowel-diph';
    top.appendChild(createGroup('vowels', DATA.vowels, 'ipa-vowel-grid'));
    top.appendChild(createGroup('diphthongs', DATA.diphthongs, 'ipa-diph-grid', 'diph'));

    content.innerHTML = '';
    content.appendChild(top);
    content.appendChild(createGroup('consonants', DATA.consonants, 'ipa-con-grid', 'con'));

    const helpBtn = document.getElementById('ipa-help-btn');
    const helpPanel = document.getElementById('ipa-help-panel');
    if (helpBtn && helpPanel) {
        helpBtn.addEventListener('click', e => {
            e.stopPropagation();
            closeWordMenu();
            helpPanel.classList.toggle('open');
        });
    }

    document.addEventListener('click', e => {
        if (!e.target.closest('.ipa-tile') && !e.target.closest('.ipa-word-menu')) {
            closeWordMenu();
        }
        if (helpPanel && helpBtn && !helpPanel.contains(e.target) && e.target !== helpBtn) {
            helpPanel.classList.remove('open');
        }
    });

    window.addEventListener('resize', () => {
        if (wordMenu && wordMenu._tile) positionWordMenu(wordMenu._tile);
    });
    window.addEventListener('scroll', () => {
        if (wordMenu && wordMenu._tile) positionWordMenu(wordMenu._tile);
    }, { passive: true });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeWordMenu();
            clearHover();
            helpPanel?.classList.remove('open');
        }
    });
});
