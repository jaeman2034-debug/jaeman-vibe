import FIREBASE from '@/lib/firebase';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { autoCorrectDong } from '@/features/location/services/locationService';
const col = () => collection(FIREBASE.db, 'jobs');
/** 구직 목록 조회 (최신순 50개) */
export async function listJobs(max = 50) {
    try {
        const q = query(col(), orderBy('createdAt', 'desc'), limit(max));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    catch {
        // 기존 문서에 createdAt 없을 때 폴백
        const snap = await getDocs(col());
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
}
/** 구직 상세 조회 */
export async function getJob(id) {
    const snap = await getDoc(doc(FIREBASE.db, 'jobs', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
/** 구직 생성 */
export async function createJob(data) {
    const now = serverTimestamp();
    const refDoc = await addDoc(col(), {
        ...data,
        createdAt: now,
        updatedAt: now,
    });
    // 위치가 있으면 행정동 자동 보정
    if (data.loc) {
        setTimeout(() => {
            autoCorrectDong('jobs', refDoc.id, data.loc);
        }, 1000);
    }
    return refDoc.id;
}
/** 구직 업데이트 */
export async function updateJob(id, patch) {
    await updateDoc(doc(FIREBASE.db, 'jobs', id), {
        ...patch,
        updatedAt: serverTimestamp()
    });
}
/** 구직 삭제 */
export async function deleteJob(id) {
    await updateDoc(doc(FIREBASE.db, 'jobs', id), {
        deleted: true,
        updatedAt: serverTimestamp()
    });
}
