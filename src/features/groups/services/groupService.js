import FIREBASE from '@/lib/firebase';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { autoCorrectDong } from '@/features/location/services/locationService';
const col = () => collection(FIREBASE.db, 'groups');
/** 모임 목록 조회 (최신순 50개) */
export async function listGroups(max = 50) {
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
/** 모임 상세 조회 */
export async function getGroup(id) {
    const snap = await getDoc(doc(FIREBASE.db, 'groups', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
/** 모임 생성 */
export async function createGroup(data) {
    const now = serverTimestamp();
    const refDoc = await addDoc(col(), {
        ...data,
        currentMembers: data.currentMembers || 1,
        createdAt: now,
        updatedAt: now,
    });
    // 위치가 있으면 행정동 자동 보정
    if (data.loc) {
        setTimeout(() => {
            autoCorrectDong('groups', refDoc.id, data.loc);
        }, 1000);
    }
    return refDoc.id;
}
/** 모임 업데이트 */
export async function updateGroup(id, patch) {
    await updateDoc(doc(FIREBASE.db, 'groups', id), {
        ...patch,
        updatedAt: serverTimestamp()
    });
}
/** 모임 삭제 */
export async function deleteGroup(id) {
    await updateDoc(doc(FIREBASE.db, 'groups', id), {
        deleted: true,
        updatedAt: serverTimestamp()
    });
}
