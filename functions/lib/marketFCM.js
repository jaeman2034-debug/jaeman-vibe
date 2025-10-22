import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
const db = admin.firestore();
// ✅ 새 메시지 전송 시 상대방에게 FCM 푸시 알림
export const sendChatPush = functions.firestore
    .document("chatRooms/{roomId}/messages/{msgId}")
    .onCreate(async (snap, ctx) => {
    var _a;
    try {
        const msg = snap.data();
        const { roomId } = ctx.params;
        // 시스템 메시지는 알림 보내지 않음
        if (msg.senderId === "system") {
            console.log("시스템 메시지 - 푸시 알림 건너뜀");
            return null;
        }
        // 채팅방 정보 가져오기
        const roomRef = db.doc(`chatRooms/${roomId}`);
        const roomSnap = await roomRef.get();
        if (!roomSnap.exists) {
            console.log(`채팅방 ${roomId}를 찾을 수 없습니다`);
            return null;
        }
        const room = roomSnap.data();
        if (!(room === null || room === void 0 ? void 0 : room.participants)) {
            console.log(`채팅방 ${roomId}에 참가자 정보가 없습니다`);
            return null;
        }
        // 수신자 찾기 (발신자가 아닌 사람)
        const recipients = room.participants.filter((uid) => uid !== msg.senderId);
        if (recipients.length === 0) {
            console.log("수신자가 없습니다");
            return null;
        }
        console.log(`채팅 메시지 푸시 발송 대상: ${recipients.join(', ')}`);
        // 수신자들의 FCM 토큰 가져오기
        const tokenPromises = recipients.map(async (uid) => {
            var _a;
            const tokenDoc = await db.doc(`fcmTokens/${uid}`).get();
            return tokenDoc.exists ? (_a = tokenDoc.data()) === null || _a === void 0 ? void 0 : _a.token : null;
        });
        const tokens = (await Promise.all(tokenPromises)).filter(Boolean);
        if (tokens.length === 0) {
            console.log("등록된 FCM 토큰이 없습니다");
            return null;
        }
        // FCM 메시지 전송
        const message = {
            tokens,
            notification: {
                title: "💬 새 메시지",
                body: msg.text || "메시지가 도착했어요.",
            },
            data: {
                roomId,
                type: "chat_message",
                senderId: msg.senderId,
            },
            webpush: {
                fcmOptions: {
                    link: `${process.env.FRONTEND_URL || 'http://localhost:5183'}/chat/${roomId}`
                }
            }
        };
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`채팅 푸시 발송 완료: ${response.successCount}개 성공, ${response.failureCount}개 실패`);
        // 실패한 토큰들 정리
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success && tokens[idx]) {
                    failedTokens.push(tokens[idx]);
                    console.error(`토큰 ${tokens[idx]} 발송 실패:`, resp.error);
                }
            });
            // 실패한 토큰들 삭제
            const batch = db.batch();
            for (const uid of recipients) {
                const tokenDoc = await db.doc(`fcmTokens/${uid}`).get();
                if (tokenDoc.exists && failedTokens.includes((_a = tokenDoc.data()) === null || _a === void 0 ? void 0 : _a.token)) {
                    batch.delete(db.doc(`fcmTokens/${uid}`));
                }
            }
            await batch.commit();
        }
        return response;
    }
    catch (error) {
        console.error("채팅 푸시 알림 발송 실패:", error);
        throw error;
    }
});
// ✅ 거래 완료 시 판매자/구매자 모두에게 FCM 푸시 알림
export const sendTradeCompletePush = functions.firestore
    .document("products/{productId}")
    .onUpdate(async (change, ctx) => {
    try {
        const before = change.before.data();
        const after = change.after.data();
        const { productId } = ctx.params;
        // 거래 완료 상태 변경인지 확인
        if (before.status === "completed" || after.status !== "completed") {
            console.log("거래 완료 상태 변경이 아니므로 푸시 알림 건너뜀");
            return null;
        }
        console.log(`상품 ${productId} 거래 완료 푸시 알림 발송`);
        // 채팅방에서 참가자들 찾기
        const chatRoomsQuery = await db.collection('chatRooms')
            .where('productId', '==', productId)
            .get();
        if (chatRoomsQuery.empty) {
            console.log(`상품 ${productId}에 대한 채팅방을 찾을 수 없습니다`);
            return null;
        }
        const participants = new Set();
        chatRoomsQuery.forEach(doc => {
            const room = doc.data();
            if (room.participants) {
                room.participants.forEach((uid) => participants.add(uid));
            }
        });
        if (participants.size === 0) {
            console.log("거래 참가자가 없습니다");
            return null;
        }
        console.log(`거래 완료 푸시 발송 대상: ${Array.from(participants).join(', ')}`);
        // 참가자들의 FCM 토큰 가져오기
        const tokenPromises = Array.from(participants).map(async (uid) => {
            var _a;
            const tokenDoc = await db.doc(`fcmTokens/${uid}`).get();
            return tokenDoc.exists ? (_a = tokenDoc.data()) === null || _a === void 0 ? void 0 : _a.token : null;
        });
        const tokens = (await Promise.all(tokenPromises)).filter(Boolean);
        if (tokens.length === 0) {
            console.log("등록된 FCM 토큰이 없습니다");
            return null;
        }
        // FCM 메시지 전송
        const message = {
            tokens,
            notification: {
                title: "✅ 거래 완료!",
                body: `${after.title} 거래가 완료되었습니다.`,
            },
            data: {
                productId,
                type: "trade_completed",
                title: after.title,
            },
            webpush: {
                fcmOptions: {
                    link: `${process.env.FRONTEND_URL || 'http://localhost:5183'}/product/${productId}`
                }
            }
        };
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`거래 완료 푸시 발송 완료: ${response.successCount}개 성공, ${response.failureCount}개 실패`);
        return response;
    }
    catch (error) {
        console.error("거래 완료 푸시 알림 발송 실패:", error);
        throw error;
    }
});
// ✅ 새 문의 (채팅방 생성) 시 판매자에게 FCM 푸시 알림
export const sendNewInquiryPush = functions.firestore
    .document("chatRooms/{roomId}")
    .onCreate(async (snap, ctx) => {
    var _a, _b;
    try {
        const room = snap.data();
        const { roomId } = ctx.params;
        // productId가 있는 채팅방만 처리 (거래 관련 문의)
        if (!room.productId) {
            console.log("거래 관련 채팅방이 아니므로 푸시 알림 건너뜀");
            return null;
        }
        // 판매자 찾기 (첫 번째 참가자가 판매자라고 가정)
        if (!room.participants || room.participants.length < 2) {
            console.log("참가자 정보가 부족합니다");
            return null;
        }
        const sellerId = room.participants[0]; // 판매자 ID
        const buyerId = room.participants[1]; // 구매자 ID
        console.log(`새 문의 푸시 발송 대상 (판매자): ${sellerId}`);
        // 판매자의 FCM 토큰 가져오기
        const tokenDoc = await db.doc(`fcmTokens/${sellerId}`).get();
        const token = tokenDoc.exists ? (_a = tokenDoc.data()) === null || _a === void 0 ? void 0 : _a.token : null;
        if (!token) {
            console.log(`판매자 ${sellerId}의 FCM 토큰이 없습니다`);
            return null;
        }
        // 상품 정보 가져오기
        const productDoc = await db.doc(`products/${room.productId}`).get();
        const productTitle = productDoc.exists ? (_b = productDoc.data()) === null || _b === void 0 ? void 0 : _b.title : "상품";
        // FCM 메시지 전송
        const message = {
            token,
            notification: {
                title: "🛒 새 문의 도착!",
                body: `${productTitle}에 새로운 문의가 도착했어요.`,
            },
            data: {
                roomId,
                productId: room.productId,
                type: "new_inquiry",
                buyerId,
            },
            webpush: {
                fcmOptions: {
                    link: `${process.env.FRONTEND_URL || 'http://localhost:5183'}/chat/${roomId}`
                }
            }
        };
        const response = await admin.messaging().send(message);
        console.log(`새 문의 푸시 발송 완료: ${response}`);
        return response;
    }
    catch (error) {
        console.error("새 문의 푸시 알림 발송 실패:", error);
        throw error;
    }
});
// ✅ FCM 토큰 등록/업데이트 (클라이언트에서 호출)
export const registerFCMToken = functions.https.onCall(async (data, ctx) => {
    var _a;
    if (!((_a = ctx.auth) === null || _a === void 0 ? void 0 : _a.uid)) {
        throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다');
    }
    const { token, platform = 'web' } = data;
    if (!token) {
        throw new functions.https.HttpsError('invalid-argument', 'FCM 토큰이 필요합니다');
    }
    try {
        await db.doc(`fcmTokens/${ctx.auth.uid}`).set({
            token,
            platform,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            userId: ctx.auth.uid,
        }, { merge: true });
        console.log(`FCM 토큰 등록됨: ${ctx.auth.uid} - ${platform}`);
        return { ok: true, message: "FCM 토큰이 등록되었습니다" };
    }
    catch (error) {
        console.error('FCM 토큰 등록 실패:', error);
        throw new functions.https.HttpsError('internal', '토큰 등록에 실패했습니다');
    }
});
//# sourceMappingURL=marketFCM.js.map