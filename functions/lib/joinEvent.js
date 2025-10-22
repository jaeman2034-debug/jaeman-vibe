"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinEvent = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const db = (0, firestore_1.getFirestore)();
exports.joinEvent = (0, https_1.onCall)(async (request) => {
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
        const [evSnap, atSnap] = await Promise.all([tx.get(evRef), tx.get(atRef)]);
        if (!evSnap.exists) {
            throw new https_1.HttpsError('not-found', '이벤트가 존재하지 않습니다');
        }
        const ev = evSnap.data();
        // 이미 참가한 경우
        if (atSnap.exists && atSnap.data()?.status === 'joined') {
            return { ok: true, already: true };
        }
        // 정원 초과 시 대기열로
        if ((ev.attendeeCount ?? 0) >= (ev.capacity ?? 0)) {
            const wlRef = evRef.collection('waitlist').doc(uid);
            tx.set(wlRef, {
                status: 'waiting',
                createdAt: firestore_1.FieldValue.serverTimestamp(),
                userId: uid
            }, { merge: true });
            return { ok: true, waitlisted: true };
        }
        // 정상 참가
        tx.set(atRef, {
            status: 'joined',
            feePaid: ev.fee || 0,
            joinedAt: firestore_1.FieldValue.serverTimestamp(),
            userId: uid
        }, { merge: true });
        tx.update(evRef, {
            attendeeCount: (ev.attendeeCount ?? 0) + 1,
            updatedAt: firestore_1.FieldValue.serverTimestamp()
        });
        return { ok: true };
    });
});
