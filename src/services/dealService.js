import { doc, serverTimestamp, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
export async function proposeDeal(threadId, payload) { const u = auth.currentUser; if (!u)
    throw new Error('로그?�이 ?�요?�니??'); const tRef = doc(db, 'threads', threadId); await setDoc(tRef, { deal: { ...payload, meetAt: payload.meetAt ? Timestamp.fromDate(payload.meetAt) : null, status: 'proposed', proposedBy: u.uid, acceptedBy: null, updatedAt: serverTimestamp(), } }, { merge: true }); }
export async function acceptDeal(threadId, accepterUid) { const tRef = doc(db, 'threads', threadId); await updateDoc(tRef, { 'deal.status': 'accepted', 'deal.acceptedBy': accepterUid, 'deal.updatedAt': serverTimestamp(), status: 'booked', lastMessage: '?�속???�정?�었?�니??', lastMessageAt: serverTimestamp(), }); }
export async function cancelDeal(threadId) { const tRef = doc(db, 'threads', threadId); await updateDoc(tRef, { 'deal.status': 'cancelled', 'deal.updatedAt': serverTimestamp(), status: 'negotiating', lastMessage: '?�속??취소?�었?�니??', lastMessageAt: serverTimestamp(), }); }
export async function completeDeal(threadId) { const tRef = doc(db, 'threads', threadId); await updateDoc(tRef, { 'deal.status': 'completed', 'deal.updatedAt': serverTimestamp(), status: 'done', lastMessageAt: serverTimestamp(), }); }
