// src/voice/util/geoquery.ts
import type { Firestore } from "firebase/firestore";
import { collection, getDocs, query, limit } from "firebase/firestore";

export interface GeoItem {
  id: string;
  // ?„ìš”???„ë“œë§??•ìž¥
  [key: string]: unknown;
}

/**
 * ê°„ë‹¨???œí•œ(limit)ë§?ê±?ê¸°ë³¸ ì¿¼ë¦¬.
 * TODO: ?¤ì œ ì§€?¤ì¿¼ë¦?where/orderBy) ì¡°ê±´?€ ?´í›„??ì¶”ê?.
 */
export async function geoquery(
  db: Firestore,
  colPath: string,
  take: number = 50
): Promise<GeoItem[]> {
  const col = collection(db, colPath);
  const q = query(col, limit(take));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
} 
