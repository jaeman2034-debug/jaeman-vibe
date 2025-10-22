import { useEffect, useMemo, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { collection, deleteDoc, doc, getDocs, getFirestore, setDoc } from 'firebase/firestore';

export type SaveKey = `${'meetup'|'job'|'item'}:${string}`;

function lsGet(): Set<SaveKey> {
  try { 
    return new Set(JSON.parse(localStorage.getItem('yago:saves') || '[]')); 
  } catch { 
    return new Set(); 
  }
}

function lsSet(set: Set<SaveKey>) {
  try { 
    localStorage.setItem('yago:saves', JSON.stringify(Array.from(set))); 
  } catch {}
}

export function useSaves() {
  const [uid, setUid] = useState<string | null>(null);
  const [set, setSet] = useState<Set<SaveKey>>(new Set());
  const db = useMemo(() => getFirestore(), []);

  useEffect(() => {
    const auth = getAuth();
    const off = onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null));
    return () => off();
  }, []);

  async function load(uidNow = uid) {
    if (uidNow) {
      try {
        const snap = await getDocs(collection(db, 'users', uidNow, 'saves'));
        const keys = new Set<SaveKey>();
        snap.forEach((d) => keys.add(d.id as SaveKey));
        setSet(keys);
      } catch (error) {
        console.warn('Failed to load saves from Firestore:', error);
        setSet(lsGet());
      }
    } else {
      setSet(lsGet());
    }
  }

  useEffect(() => { 
    load(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  const isSaved = (key: SaveKey) => set.has(key);

  async function toggle(key: SaveKey, data?: any) {
    const next = new Set(set);
    if (set.has(key)) {
      next.delete(key);
      setSet(next);
      if (uid) {
        try {
          await deleteDoc(doc(db, 'users', uid, 'saves', key));
        } catch (error) {
          console.warn('Failed to delete save from Firestore:', error);
        }
      } else {
        lsSet(next);
      }
    } else {
      next.add(key);
      setSet(next);
      if (uid) {
        try {
          await setDoc(doc(db, 'users', uid, 'saves', key), { 
            ...data, 
            createdAt: Date.now(),
            type: key.split(':')[0],
            itemId: key.split(':')[1]
          });
        } catch (error) {
          console.warn('Failed to save to Firestore:', error);
        }
      } else {
        lsSet(next);
      }
    }
  }

  return { isSaved, toggle, refresh: () => load() };
}
