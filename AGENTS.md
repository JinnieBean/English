# AGENTS.md

Static multi-page English study site (vanilla HTML/CSS/ES modules) backed by Firebase Firestore. No build system, no package.json, no tests or lint. Serve with a local static server — ES module imports fail over `file://`.

## Architecture

- Page → JS mapping: `main.js` powers index/book/units/unit_* pages, `grammar.js` + `pronunciation.js` are thin configs over the shared engine `assets/js/content-tree.js` (categories → lessons → units trees + lesson rendering). Every page also loads `assets/js/ui.js` (shared: dark mode, reveal animations, custom audio player with seek/loop/download/TTS, flashcards with keyboard shortcuts + progress persistence, quiz mode, breadcrumbs via `window.renderBreadcrumb`, sidebar/mobile menu).
- Shared modules: `assets/js/firebase-config.js` (single source of Firebase config; exports `auth` and `db`) and `assets/js/utils.js` (`escapeHtml`, `friendlyError`, `sanitizeRichText`, `debounce`, …). Both are imported by all page scripts AND by `admin/js/admin.js`. Never duplicate the firebase config object.
- Admin is split into ES modules under `admin/js/`: `app.js` (entry: auth, tabs, stats incl. drafts count + words-per-book bars, audit-log viewer), `common.js` (toast, `confirmDialog`, `onSubmit`, stamps, `performDelete`+Undo, `logAudit`, `publicUrlFor`, `enableDragReorder`), `data.js` (state arrays with live bindings, pagination, unit-select population), `crud.js` (Books/Units + 6 vocab tabs; bulk checkbox actions, inline dbl-click edit, drag-reorder on books/units), `trees.js` (`makeTreeManager()` for Grammar & Pronunciation incl. TinyMCE init and drag reorder), `tools.js` (JSON export/import + audio URL bulk rewrite). Cross-module calls go through `hooks` in common.js to avoid circular imports.
- Learner accounts: Google Sign-In popup; progress mirrors to Firestore `users/{uid}/data/main` via `assets/js/progress-store.js` (local-first; legacy keys auto-migrated into `tn-store-v1`). Pages `review.html` (+`assets/js/review.js`) = SRS due-today session; `mylearning.html` (+`mylearning.js`) = learner dashboard. SRS boxes advance 1→3→7→14 days then graduate.
- PWA: `sw.js` + `manifest.webmanifest`, registered in ui.js (skipped on /admin and file://). Bump the CACHE const when changing precache list.
- Admin writes append to `audit_logs` (viewed in Settings → Activity log).
- Firestore SDK 10.7.1 imported via CDN URLs. Collections: `books`, `units`, `vocabularies`, `phrasal_verbs`, `prep_phrases`, `word_formations`, `word_patterns`, `lexical_expansions`, `grammar_categories`, `grammar_lessons`, `grammar_units`, `grammar_intro`, `pronunciation_categories`, `pronunciation_lessons`, `pronunciation_units`, `pronunciation_intro`.
- Pages are driven by URL query params: `unit_*.html?id=`, `units.html?bookId=`, lesson pages `?id=` (plus `?type=`). Section search state syncs to `?q=` via `history.replaceState`.
- Draft/publish: every content document may carry `status: 'published' | 'draft'`; missing status = published. Public pages hide drafts client-side (admin forms have a Status select).
- Firestore rules live in `firestore.rules` (world-readable content, write restricted to an admin email list that MUST be edited before deploying).

## Gotchas

- The six `unit_*.html` pages (detail, phrasal, prep, wordform, pattern, lexical) are near-identical copies that only differ in title/meta/breadcrumb `data-section`/active subnav link. Edit all six when changing shared markup.
- Sidebar/theme state is persisted in `localStorage` (`sidebar-collapsed`, `theme-dark`, `admin-sidebar-collapsed`, `admin-theme-dark`); pages apply an inline `<script>` in `<head>` to avoid flash-of-uncollapsed-sidebar — preserve it when editing page heads.
- All dynamic data rendered into `innerHTML` must go through `escapeHtml()` (exception: TinyMCE lesson HTML, which passes through `sanitizeRichText()` on save in admin).
- Unit-scoped public queries use `where('unitId','==',id)` (single-field equality needs no composite index); sort client-side afterwards. Index-page counters use `getCountFromServer`.
- Flashcard/bookmark/SRS state lives in `progress-store.js` backed by localStorage key `tn-store-v1` (legacy keys auto-migrated).
- Longman (ldoceonline.com) rotates `?version=` on its audio URLs. All playback URLs pass through `applyAudioVersion()` (assets/js/utils.js) — when Longman bumps the version, update ONLY the `AUDIO_VERSION` constant there. Admin → Settings → "Audio URL maintenance" can bulk-rewrite stored URLs (regex find/replace over vocabularies.audio, word_formations.forms[].audios[].url, lexical_expansions.words[].audio).
- `git` operations in this checkout may fail with "dubious ownership"; add the path via `git config --global --add safe.directory` if needed.
- Source images in `assets/images/` are oversized (book_cover.png is actually a 660KB JPEG with a .png extension; english/grammar/vocabulary PNGs are ~850KB). Book covers render through a shimmer+fade pipeline (`.book-cover.img-loading` in courses.css + handler in main.js loadBooks) so slow images degrade gracefully. When image tooling is available, re-encode them to real WebP ≤ 400px wide and update references — do NOT just rename extensions.
- Book covers support remote URLs; a failed URL falls back to the local placeholder exactly once (`img.dataset.fallback` guard in main.js prevents infinite error loops).
