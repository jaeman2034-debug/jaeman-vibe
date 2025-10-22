import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

const db = admin.firestore();

// ????硫붿떆吏 ?꾩넚 ???곷?諛⑹뿉寃?FCM ?몄떆 ?뚮┝
export const sendChatPush = functions.firestore
  .document("chatRooms/{roomId}/messages/{msgId}")
  .onCreate(async (snap, ctx) => {
    try {
      const msg = snap.data();
      const { roomId } = ctx.params;

      // ?쒖뒪??硫붿떆吏???뚮┝ 蹂대궡吏 ?딆쓬
      if (msg.senderId === "system") {
        console.log("?쒖뒪??硫붿떆吏 - ?몄떆 ?뚮┝ 嫄대꼫?");
        return null;
      }

      // 梨꾪똿諛??뺣낫 媛?몄삤湲?      const roomRef = db.doc(`chatRooms/${roomId}`);
      const roomSnap = await roomRef.get();
      
      if (!roomSnap.exists) {
        console.log(`梨꾪똿諛?${roomId}瑜?李얠쓣 ???놁뒿?덈떎`);
        return null;
      }

      const room = roomSnap.data();
      if (!room?.participants) {
        console.log(`梨꾪똿諛?${roomId}??李멸????뺣낫媛 ?놁뒿?덈떎`);
        return null;
      }

      // ?섏떊??李얘린 (諛쒖떊?먭? ?꾨땶 ?щ엺)
      const recipients = room.participants.filter((uid: string) => uid !== msg.senderId);
      
      if (recipients.length === 0) {
        console.log("?섏떊?먭? ?놁뒿?덈떎");
        return null;
      }

      console.log(`梨꾪똿 硫붿떆吏 ?몄떆 諛쒖넚 ??? ${recipients.join(', ')}`);

      // ?섏떊?먮뱾??FCM ?좏겙 媛?몄삤湲?      const tokenPromises = recipients.map(async (uid: string) => {
        const tokenDoc = await db.doc(`fcmTokens/${uid}`).get();
        return tokenDoc.exists ? tokenDoc.data()?.token : null;
      });

      const tokens = (await Promise.all(tokenPromises)).filter(Boolean);
      
      if (tokens.length === 0) {
        console.log("?깅줉??FCM ?좏겙???놁뒿?덈떎");
        return null;
      }

      // FCM 硫붿떆吏 ?꾩넚
      const message = {
        tokens,
        notification: {
          title: "?뮠 ??硫붿떆吏",
          body: msg.text || "硫붿떆吏媛 ?꾩갑?덉뼱??",
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
      
      console.log(`梨꾪똿 ?몄떆 諛쒖넚 ?꾨즺: ${response.successCount}媛??깃났, ${response.failureCount}媛??ㅽ뙣`);
      
      // ?ㅽ뙣???좏겙???뺣━
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && tokens[idx]) {
            failedTokens.push(tokens[idx]);
            console.error(`?좏겙 ${tokens[idx]} 諛쒖넚 ?ㅽ뙣:`, resp.error);
          }
        });

        // ?ㅽ뙣???좏겙????젣
        const batch = db.batch();
        for (const uid of recipients) {
          const tokenDoc = await db.doc(`fcmTokens/${uid}`).get();
          if (tokenDoc.exists && failedTokens.includes(tokenDoc.data()?.token)) {
            batch.delete(db.doc(`fcmTokens/${uid}`));
          }
        }
        await batch.commit();
      }

      return response;
    } catch (error) {
      console.error("梨꾪똿 ?몄떆 ?뚮┝ 諛쒖넚 ?ㅽ뙣:", error);
      throw error;
    }
  });

// ??嫄곕옒 ?꾨즺 ???먮ℓ??援щℓ??紐⑤몢?먭쾶 FCM ?몄떆 ?뚮┝
export const sendTradeCompletePush = functions.firestore
  .document("products/{productId}")
  .onUpdate(async (change, ctx) => {
    try {
      const before = change.before.data();
      const after = change.after.data();
      const { productId } = ctx.params;

      // 嫄곕옒 ?꾨즺 ?곹깭 蹂寃쎌씤吏 ?뺤씤
      if (before.status === "completed" || after.status !== "completed") {
        console.log("嫄곕옒 ?꾨즺 ?곹깭 蹂寃쎌씠 ?꾨땲誘濡??몄떆 ?뚮┝ 嫄대꼫?");
        return null;
      }

      console.log(`?곹뭹 ${productId} 嫄곕옒 ?꾨즺 ?몄떆 ?뚮┝ 諛쒖넚`);

      // 梨꾪똿諛⑹뿉??李멸??먮뱾 李얘린
      const chatRoomsQuery = await db.collection('chatRooms')
        .where('productId', '==', productId)
        .get();

      if (chatRoomsQuery.empty) {
        console.log(`?곹뭹 ${productId}?????梨꾪똿諛⑹쓣 李얠쓣 ???놁뒿?덈떎`);
        return null;
      }

      const participants = new Set<string>();
      chatRoomsQuery.forEach(doc => {
        const room = doc.data();
        if (room.participants) {
          room.participants.forEach((uid: string) => participants.add(uid));
        }
      });

      if (participants.size === 0) {
        console.log("嫄곕옒 李멸??먭? ?놁뒿?덈떎");
        return null;
      }

      console.log(`嫄곕옒 ?꾨즺 ?몄떆 諛쒖넚 ??? ${Array.from(participants).join(', ')}`);

      // 李멸??먮뱾??FCM ?좏겙 媛?몄삤湲?      const tokenPromises = Array.from(participants).map(async (uid: string) => {
        const tokenDoc = await db.doc(`fcmTokens/${uid}`).get();
        return tokenDoc.exists ? tokenDoc.data()?.token : null;
      });

      const tokens = (await Promise.all(tokenPromises)).filter(Boolean);
      
      if (tokens.length === 0) {
        console.log("?깅줉??FCM ?좏겙???놁뒿?덈떎");
        return null;
      }

      // FCM 硫붿떆吏 ?꾩넚
      const message = {
        tokens,
        notification: {
          title: "??嫄곕옒 ?꾨즺!",
          body: `${after.title} 嫄곕옒媛 ?꾨즺?섏뿀?듬땲??`,
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
      
      console.log(`嫄곕옒 ?꾨즺 ?몄떆 諛쒖넚 ?꾨즺: ${response.successCount}媛??깃났, ${response.failureCount}媛??ㅽ뙣`);

      return response;
    } catch (error) {
      console.error("嫄곕옒 ?꾨즺 ?몄떆 ?뚮┝ 諛쒖넚 ?ㅽ뙣:", error);
      throw error;
    }
  });

// ????臾몄쓽 (梨꾪똿諛??앹꽦) ???먮ℓ?먯뿉寃?FCM ?몄떆 ?뚮┝
export const sendNewInquiryPush = functions.firestore
  .document("chatRooms/{roomId}")
  .onCreate(async (snap, ctx) => {
    try {
      const room = snap.data();
      const { roomId } = ctx.params;

      // productId媛 ?덈뒗 梨꾪똿諛⑸쭔 泥섎━ (嫄곕옒 愿??臾몄쓽)
      if (!room.productId) {
        console.log("嫄곕옒 愿??梨꾪똿諛⑹씠 ?꾨땲誘濡??몄떆 ?뚮┝ 嫄대꼫?");
        return null;
      }

      // ?먮ℓ??李얘린 (泥?踰덉㎏ 李멸??먭? ?먮ℓ?먮씪怨?媛??
      if (!room.participants || room.participants.length < 2) {
        console.log("李멸????뺣낫媛 遺議깊빀?덈떎");
        return null;
      }

      const sellerId = room.participants[0]; // ?먮ℓ??ID
      const buyerId = room.participants[1];  // 援щℓ??ID

      console.log(`??臾몄쓽 ?몄떆 諛쒖넚 ???(?먮ℓ??: ${sellerId}`);

      // ?먮ℓ?먯쓽 FCM ?좏겙 媛?몄삤湲?      const tokenDoc = await db.doc(`fcmTokens/${sellerId}`).get();
      const token = tokenDoc.exists ? tokenDoc.data()?.token : null;
      
      if (!token) {
        console.log(`?먮ℓ??${sellerId}??FCM ?좏겙???놁뒿?덈떎`);
        return null;
      }

      // ?곹뭹 ?뺣낫 媛?몄삤湲?      const productDoc = await db.doc(`products/${room.productId}`).get();
      const productTitle = productDoc.exists ? productDoc.data()?.title : "?곹뭹";

      // FCM 硫붿떆吏 ?꾩넚
      const message = {
        token,
        notification: {
          title: "?썟 ??臾몄쓽 ?꾩갑!",
          body: `${productTitle}???덈줈??臾몄쓽媛 ?꾩갑?덉뼱??`,
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
      
      console.log(`??臾몄쓽 ?몄떆 諛쒖넚 ?꾨즺: ${response}`);

      return response;
    } catch (error) {
      console.error("??臾몄쓽 ?몄떆 ?뚮┝ 諛쒖넚 ?ㅽ뙣:", error);
      throw error;
    }
  });

// ??FCM ?좏겙 ?깅줉/?낅뜲?댄듃 (?대씪?댁뼵?몄뿉???몄텧)
export const registerFCMToken = functions.https.onCall(async (data, ctx) => {
  if (!ctx.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', '濡쒓렇?몄씠 ?꾩슂?⑸땲??);
  }

  const { token, platform = 'web' } = data as { 
    token: string; 
    platform?: string; 
  };

  if (!token) {
    throw new functions.https.HttpsError('invalid-argument', 'FCM ?좏겙???꾩슂?⑸땲??);
  }

  try {
    await db.doc(`fcmTokens/${ctx.auth.uid}`).set({
      token,
      platform,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      userId: ctx.auth.uid,
    }, { merge: true });

    console.log(`FCM ?좏겙 ?깅줉?? ${ctx.auth.uid} - ${platform}`);
    return { ok: true, message: "FCM ?좏겙???깅줉?섏뿀?듬땲?? };
  } catch (error) {
    console.error('FCM ?좏겙 ?깅줉 ?ㅽ뙣:', error);
    throw new functions.https.HttpsError('internal', '?좏겙 ?깅줉???ㅽ뙣?덉뒿?덈떎');
  }
});
