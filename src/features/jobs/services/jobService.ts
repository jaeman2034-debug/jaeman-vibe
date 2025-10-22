import { db } from '@/lib/firebase'; // ???�일 진입???�용
import {
  collection, doc, addDoc, getDoc, getDocs,
  updateDoc, serverTimestamp, query, orderBy, limit
} from 'firebase/firestore';
import type { Job } from '@/shared/types/product';
import { autoCorrectDong } from '@/features/location/services/locationService';

const col = () => collection(db, 'jobs');

/** 구직 목록 조회 (최신??50�? */
export async function listJobs(max = 50): Promise<Job[]> {
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

/** 구직 ?�세 조회 */
export async function getJob(id: string): Promise<Job | null> {
  const snap = await getDoc(doc(db, 'jobs', id));
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as Job) : null;
}

/** 구직 ?�성 */
export async function createJob(data: {
  title: string;
  company?: string;
  type: 'fulltime' | 'parttime' | 'coach' | 'etc';
  salaryMin?: number;
  salaryMax?: number;
  contact?: string;
  desc?: string;
  ownerId: string;
  loc?: { lat: number; lng: number } | null;
}): Promise<string> {
  const now = serverTimestamp();
  const refDoc = await addDoc(col(), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });

  // ?�치가 ?�으�??�정???�동 보정
  if (data.loc) {
    setTimeout(() => {
      autoCorrectDong('jobs', refDoc.id, data.loc);
    }, 1000);
  }

  return refDoc.id;
}

/** 구직 ?�데?�트 */
export async function updateJob(id: string, patch: Partial<Job>) {
  await updateDoc(doc(db, 'jobs', id), { 
    ...patch, 
    updatedAt: serverTimestamp() 
  });
}

/** 구직 ??�� */
export async function deleteJob(id: string) {
  await updateDoc(doc(db, 'jobs', id), { 
    deleted: true,
    updatedAt: serverTimestamp() 
  });
}
