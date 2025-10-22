import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();

export const joinEvent = onCall(async (request) => {
  const { eventId } = request.data;
  const uid = request.auth?.uid;
  
  if (!uid) {
    throw new HttpsError('unauthenticated', '로그인이 필요합니다');
  }

  if (!eventId) {
    throw new HttpsError('invalid-argument', '이벤트 ID가 필요합니다');
  }

  return await db.runTransaction(async (tx) => {
    const evRef = db.doc(`events/${eventId}`);
    const atRef = evRef.collection('attendees').doc(uid);

    const [evSnap, atSnap] = await Promise.all([tx.get(evRef), tx.get(atRef)]);
    
    if (!evSnap.exists) {
      throw new HttpsError('not-found', '이벤트가 존재하지 않습니다');
    }

    const ev = evSnap.data()!;
    
    // 이미 참가한 경우
    if (atSnap.exists && atSnap.data()?.status === 'joined') {
      return { ok: true, already: true };
    }

    // 정원 초과 시 대기열로
    if ((ev.attendeeCount ?? 0) >= (ev.capacity ?? 0)) {
      const wlRef = evRef.collection('waitlist').doc(uid);
      tx.set(wlRef, { 
        status: 'waiting', 
        createdAt: FieldValue.serverTimestamp(),
        userId: uid
      }, { merge: true });
      return { ok: true, waitlisted: true };
    }

    // 정상 참가
    tx.set(atRef, { 
      status: 'joined', 
      feePaid: ev.fee || 0, 
      joinedAt: FieldValue.serverTimestamp(),
      userId: uid
    }, { merge: true });
    
    tx.update(evRef, { 
      attendeeCount: (ev.attendeeCount ?? 0) + 1, 
      updatedAt: FieldValue.serverTimestamp() 
    });
    
    return { ok: true };
  });
});
