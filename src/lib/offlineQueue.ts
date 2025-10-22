const DB_NAME = 'yago-offline';
const STORE = 'checkins';
const VER = 1;

export type CheckinItem = {
  id: string; token: string; eventId?: string | null; scannedBy?: string | null;
  ts: number; attempts: number; lastError?: string | null;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VER);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id' });
        os.createIndex('ts', 'ts', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function oqAdd(token: string, eventId?: string, scannedBy?: string) {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  const os = tx.objectStore(STORE);
  os.put({ id: token, token, eventId: eventId || null, scannedBy: scannedBy || null, ts: Date.now(), attempts: 0 });
  await tx.complete?.(); db.close();
}
export async function oqCount(): Promise<number> {
  const db = await openDB(); const tx = db.transaction(STORE, 'readonly'); const os = tx.objectStore(STORE);
  const req = os.count();
  const n = await new Promise<number>((res, rej) => { req.onsuccess = () => res(req.result || 0); req.onerror = () => rej(req.error); });
  db.close(); return n;
}
export async function oqTake(batch = 10): Promise<CheckinItem[]> {
  const db = await openDB(); const tx = db.transaction(STORE, 'readonly'); const os = tx.objectStore(STORE);
  const idx = os.index('ts'); const items: CheckinItem[] = [];
  await new Promise<void>((res, rej) => {
    const cur = idx.openCursor();
    cur.onsuccess = () => { const c = cur.result as IDBCursorWithValue | null;
      if (!c || items.length >= batch) return res(); items.push(c.value as CheckinItem); c.continue(); };
    cur.onerror = () => rej(cur.error);
  });
  db.close(); return items;
}
export async function oqRemove(ids: string[]) {
  if (!ids.length) return;
  const db = await openDB(); const tx = db.transaction(STORE, 'readwrite'); const os = tx.objectStore(STORE);
  await Promise.all(ids.map(id => new Promise<void>((res, rej) => { const r = os.delete(id); r.onsuccess = () => res(); r.onerror = () => rej(r.error); })));
  db.close();
}
export async function oqBumpAttempts(id: string, lastError?: string) {
  const db = await openDB(); const tx = db.transaction(STORE, 'readwrite'); const os = tx.objectStore(STORE);
  const getReq = os.get(id);
  await new Promise<void>((res, rej) => {
    getReq.onsuccess = () => { const it = getReq.result; if (it) { it.attempts = (it.attempts || 0) + 1; it.lastError = lastError || it.lastError || null; os.put(it); } res(); };
    getReq.onerror = () => rej(getReq.error);
  });
  db.close();
}

// Scan.tsx에서 사용하는 함수들
export const enqueueScan = oqAdd;
export const getPendingCount = oqCount;

export async function flushScans() {
  const items = await oqTake(50); // 최대 50개씩 처리
  if (items.length === 0) return;
  
  // 실제 스캔 처리 로직 (여기서는 단순히 삭제)
  const ids = items.map(item => item.id);
  await oqRemove(ids);
  
  return items.length;
}