/* Thor's Notes service worker — PWA offline-lite (Phase D)
 *
 * Strategy:
 *  - Navigation requests: network-first, fall back to cache, then offline.html
 *  - Same-origin js/css: network-first (code fixes appear on the next
 *    reload), precached copy kept as the offline fallback
 *  - Other static assets (images/fonts/CDN): stale-while-revalidate
 *  - Never intercept /admin/** (keep the CMS always fresh) or non-GET
 */
const CACHE = 'tn-cache-v6';
const OFFLINE_URL = 'offline.html';

const PRECACHE = [
    './',
    'index.html',
    'english.html',
    'book.html',
    'units.html',
    'unit_detail.html',
    'unit_phrasal.html',
    'unit_prep.html',
    'unit_wordform.html',
    'unit_pattern.html',
    'unit_lexical.html',
    'grammar.html',
    'grammar_lesson.html',
    'pronunciation.html',
    'pronunciation_lesson.html',
    'review.html',
    'mylearning.html',
    '404.html',
    OFFLINE_URL,
    'manifest.webmanifest',
    'assets/css/style.css',
    'assets/css/courses.css',
    'assets/css/english.css',
    'assets/css/grammar-styles.css',
    'assets/js/ui.js',
    'assets/js/main.js',
    'assets/js/utils.js',
    'assets/js/firebase-config.js',
    'assets/js/progress-store.js',
    'assets/js/content-tree.js',
    'assets/js/review.js',
    'assets/js/mylearning.js',
    'assets/images/logo.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE);
        // Add individually so one failure doesn't abort the whole install
        await Promise.allSettled(PRECACHE.map(u => cache.add(new Request(u, { cache: 'reload' }))));
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    if (url.pathname.startsWith('/admin')) return;
    // Firestore/Google APIs must always hit the network
    if (url.hostname.includes('googleapis.com') && url.pathname.includes('firestore')) return;

    // Page navigations: network first, cached copy as fallback
    if (req.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                return await fetch(req);
            } catch {
                const cache = await caches.open(CACHE);
                const cached = await cache.match(req.url, { ignoreSearch: true });
                if (cached) return cached;
                const offline = await cache.match(OFFLINE_URL);
                return offline || Response.error();
            }
        })());
        return;
    }

    // Same-origin app code (js/css): network-first so edits show up on the
    // very next reload instead of being served stale from cache.
    if (url.origin === location.origin && /\.(mjs|js|css)$/i.test(url.pathname)) {
        event.respondWith((async () => {
            const cache = await caches.open(CACHE);
            try {
                const fresh = await fetch(req);
                if (fresh && fresh.ok) cache.put(req, fresh.clone()).catch(() => {});
                return fresh;
            } catch {
                return (await cache.match(req, { ignoreVary: true })) || Response.error();
            }
        })());
        return;
    }

    // Same-origin + font/static CDNs: stale-while-revalidate
    const cacheable =
        url.origin === location.origin ||
        url.hostname.endsWith('gstatic.com') ||
        url.hostname.endsWith('googleapis.com') ||
        url.hostname.endsWith('ldoceonline.com');
    if (!cacheable) return;

    event.respondWith((async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(req, { ignoreVary: true });
        const network = fetch(req).then(res => {
            if (res && (res.ok || res.type === 'opaque')) {
                cache.put(req, res.clone()).catch(() => {});
            }
            return res;
        }).catch(() => null);

        if (cached) {
            network.catch(() => {});
            return cached;
        }
        const fresh = await network;
        return fresh || Response.error();
    })());
});
