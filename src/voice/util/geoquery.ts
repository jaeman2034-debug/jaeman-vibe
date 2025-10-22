// src/voice/util/geoquery.ts
import type { Firestore } from "firebase/firestore";
import { collection, getDocs, query, limit } from "firebase/firestore";

export interface GeoItem {
  id: string;
  // ?�요???�드�??�장
  [key: string]: unknown;
}

/**
 * 간단???�한(limit)�?�?기본 쿼리.
 * TODO: ?�제 지?�쿼�?where/orderBy) 조건?� ?�후??추�?.
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
