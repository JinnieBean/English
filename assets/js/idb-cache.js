/**
 * idb-cache.js — Tiny IndexedDB document cache for offline reading.
 *
 * cachedLoad(key, loader) runs the Firestore loader; on success the plain
 * result is stored under `key`, on failure (offline / network error) the
 * last stored copy is served instead so already-viewed units keep working.
 */
const DB_NAME = 'tn-offline';
const STORE = 'docs';
let _dbPromise = null;

function openDb() {
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise((resolve, reject) => {
        let req;
        try { req = indexedDB.open(DB_NAME, 1); } catch (e) { reject(e); return; }
        req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        req.onblocked = () => reject(new Error('idb blocked'));
    }).catch(e => { _dbPromise = null; throw e; });
    return _dbPromise;
}

export async function cachePut(key, value) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
    });
}

export async function cacheGet(key) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result === undefined ? null : req.result);
        req.onerror = () => reject(req.error);
    });
}

/** True when `value` looks like a served-from-cache payload. */
export async function cachedLoad(key, loader) {
    try {
        const fresh = await loader();
        cachePut(key, fresh).catch(() => { /* quota/private mode */ });
        return { data: fresh, fromCache: false };
    } catch (e) {
        const cached = await cacheGet(key).catch(() => null);
        if (cached) return { data: cached, fromCache: true };
        throw e;
    }
}
