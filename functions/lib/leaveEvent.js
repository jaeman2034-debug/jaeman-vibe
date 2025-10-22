"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveEvent = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const db = (0, firestore_1.getFirestore)();
exports.leaveEvent = (0, https_1.onCall)(async (request) => {
    const { eventId } = request.data;
    const uid = request.auth?.uid;
    if (!uid) {
        throw new https_1.HttpsError('unauthenticated', '로그인이 필요합니다');
    }
    if (!eventId) {
        throw new https_1.HttpsError('invalid-argument', '이벤트 ID가 필요합니다');
    }
    return await db.runTransaction(async (tx) => {
        const evRef = db.doc(`events/${eventId}`);
        const atRef = evRef.collection('attendees').doc(uid);
        const wlRef = evRef.collection('waitlist').doc(uid);
        const [evSnap, atSnap, wlSnap] = await Promise.all([
            tx.get(evRef),
            tx.get(atRef),
            tx.get(wlRef)
        ]);
        if (!evSnap.exists) {
            throw new https_1.HttpsError('not-found', '이벤트가 존재하지 않습니다');
        }
        const ev = evSnap.data();
        let removed = false;
        // 참가자에서 제거
        if (atSnap.exists && atSnap.data()?.status === 'joined') {
            tx.delete(atRef);
            tx.update(evRef, {
                attendeeCount: Math.max((ev.attendeeCount ?? 0) - 1, 0),
                updatedAt: firestore_1.FieldValue.serverTimestamp()
            });
            removed = true;
        }
        // 대기열에서 제거
        if (wlSnap.exists) {
            tx.delete(wlRef);
            removed = true;
        }
        if (!removed) {
            throw new https_1.HttpsError('failed-precondition', '참가하지 않은 이벤트입니다');
        }
        // 대기열에서 첫 번째 사람을 참가자로 승격
        const waitlistQuery = evRef.collection('waitlist')
            .where('status', '==', 'waiting')
            .orderBy('createdAt', 'asc')
            .limit(1);
        const waitlistSnap = await tx.get(waitlistQuery);
        if (!waitlistSnap.empty) {
            const firstWaiting = waitlistSnap.docs[0];
            const waitingUid = firstWaiting.id;
            // 대기열에서 제거하고 참가자로 추가
            tx.delete(firstWaiting.ref);
            tx.set(evRef.collection('attendees').doc(waitingUid), {
                status: 'joined',
                feePaid: ev.fee || 0,
                joinedAt: firestore_1.FieldValue.serverTimestamp(),
                userId: waitingUid
            }, { merge: true });
            tx.update(evRef, {
                attendeeCount: (ev.attendeeCount ?? 0) + 1,
                updatedAt: firestore_1.FieldValue.serverTimestamp()
            });
        }
        return { ok: true };
    });
});
