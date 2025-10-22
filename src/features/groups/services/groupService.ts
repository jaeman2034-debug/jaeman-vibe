import { db } from '@/lib/firebase'; // ???�일 진입???�용
import {
  collection, doc, addDoc, getDoc, getDocs,
  updateDoc, serverTimestamp, query, orderBy, limit
} from 'firebase/firestore';
import type { Group } from '@/shared/types/product';
import { autoCorrectDong } from '@/features/location/services/locationService';

const col = () => collection(db, 'groups');

/** 모임 목록 조회 (최신??50�? */
export async function listGroups(max = 50): Promise<Group[]> {
  try {
    const q = query(col(), orderBy('createdAt', 'desc'), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  } catch {
    // 기존 문서??createdAt ?�을 ???�백
    const snap = await getDocs(col());
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
  }
}

/** 모임 ?�세 조회 */
export async function getGroup(id: string): Promise<Group | null> {
  const snap = await getDoc(doc(db, 'groups', id));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as Group) : null;
}

/** 모임 ?�성 */
export async function createGroup(data: {
  title: string;
  desc?: string;
  category?: string;
  maxMembers?: number;
  currentMembers?: number;
  ownerId: string;
  loc?: { lat: number; lng: number } | null;
}): Promise<string> {
  const now = serverTimestamp();
  const refDoc = await addDoc(col(), {
    ...data,
    currentMembers: data.currentMembers || 1,
    createdAt: now,
    updatedAt: now,
  });

  // ?�치가 ?�으�??�정???�동 보정
  if (data.loc) {
    setTimeout(() => {
      autoCorrectDong('groups', refDoc.id, data.loc);
    }, 1000);
  }

  return refDoc.id;
}

/** 모임 ?�데?�트 */
export async function updateGroup(id: string, patch: Partial<Group>) {
  await updateDoc(doc(db, 'groups', id), { 
    ...patch, 
    updatedAt: serverTimestamp() 
  });
}

/** 모임 ??�� */
export async function deleteGroup(id: string) {
  await updateDoc(doc(db, 'groups', id), { 
    deleted: true,
    updatedAt: serverTimestamp() 
  });
}
