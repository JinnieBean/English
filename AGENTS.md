# AGENTS.md

Static multi-page English study site (vanilla HTML/CSS/ES modules) backed by Firebase Firestore. No build system, no package.json, no tests or lint. Serve with a local static server — ES module imports fail over `file://`.

## Architecture

- Page → JS mapping: `main.js` powers index/book/units/unit_* pages, `grammar.js` the grammar pages, `pronunciation.js` the pronunciation pages. Every page also loads `assets/js/ui.js` (shared: dark mode, reveal animations, audio player, flashcards, breadcrumbs). Admin is separate: `admin/index.html` + `admin/js/admin.js` (Firebase Auth login, TinyMCE from CDN).
- Firebase SDK 10.7.1 is imported via CDN URLs and the firebase config object is duplicated in all 4 JS files (`assets/js/main.js`, `grammar.js`, `pronunciation.js`, `admin/js/admin.js`). Changing credentials/config requires editing all four.
- Firestore collections: `books`, `units`, `vocabularies`, `phrasal_verbs`, `prep_phrases`, `word_formations`, `word_patterns`, `lexical_expansions`, `grammar_categories`, `grammar_lessons`, `grammar_units`, `pronunciation_categories`, `pronunciation_lessons`, `pronunciation_units`.
- Pages are driven by URL query params: `unit_detail.html?id=`, `units.html?bookId=`, lesson pages `?id=` (plus `?type=`).

## Gotchas

- The six `unit_*.html` pages (detail, phrasal, prep, wordform, pattern, lexical) are near-identical copies that only differ in title/labels/active subnav link; each page's subnav lists the other five. Edit all six when changing shared markup.
- Sidebar/theme state is persisted in `localStorage` (`sidebar-collapsed`, `theme-dark`, admin equivalents); pages apply an inline `<script>` in `<head>` to avoid flash-of-uncollapsed-sidebar — preserve it when editing page heads.
- `git` operations in this checkout may fail with "dubious ownership"; add the path via `git config --global --add safe.directory` if needed.
