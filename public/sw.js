/* basic SW: app shell + runtime cache + bg sync */
const CACHE = 'yago-v1';
const ASSETS = [
  '/', '/manifest.webmanifest', '/favicon.ico',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

// runtime cache (static & images)
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin === location.origin) {
    if (url.pathname.startsWith('/assets') || url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg')) {
      e.respondWith((async () => {
        const c = await caches.open(CACHE);
        const m = await c.match(e.request);
        if (m) return m;
        const r = await fetch(e.request);
        c.put(e.request, r.clone());
        return r;
      })());
    }
  }
});

// Background Sync: queue name 'checkinSync'
self.addEventListener('sync', async (event) => {
  if (event.tag === 'checkinSync') {
    event.waitUntil(syncCheckins());
  }
});

async function syncCheckins() {
  const db = await openDB();
  const tx = db.transaction('pending', 'readwrite');
  const store = tx.objectStore('pending');
  const all = await store.getAll();
  for (const it of all) {
    try {
      const r = await fetch('/api/checkin', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(it.payload) 
      });
      if (r.ok) await store.delete(it.id);
    } catch {}
  }
  await tx.done; 
  db.close();
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('yago-checkins', 1);
    req.onupgradeneeded = (e) => {
      const db = req.result;
      if (!db.objectStoreNames.contains('pending')) {
        db.createObjectStore('pending', { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

self.addEventListener('message', async (e) => {
  if (e.data && e.data.type === 'QUEUE_CHECKIN') {
    const db = await openDB();
    const tx = db.transaction('pending', 'readwrite');
    await tx.objectStore('pending').put({ 
      id: e.data.id, 
      payload: e.data.payload, 
      ts: Date.now() 
    });
    await tx.done; 
    db.close();
    if ('sync' in self.registration) {
      try { 
        await self.registration.sync.register('checkinSync'); 
      } catch {}
    }
  }
});