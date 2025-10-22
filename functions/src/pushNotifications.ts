import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { logPush, logError } from "./loggingUtils";

/**
 * ?뵒 ?몄떆 ?뚮┝ ?쒖뒪?? * ???곹뭹 ?깅줉 ??愿??援щ룆?먮뱾?먭쾶 ?먮룞 ?뚮┝ 諛쒖넚
 */

// Firebase Admin 珥덇린??admin.initializeApp();

/**
 * ???곹뭹 ?깅줉 ???몄떆 ?뚮┝ 諛쒖넚
 */
export const onMarketItemCreate = functions
  .region("asia-northeast3")
  .firestore.document("marketItems/{itemId}")
  .onCreate(async (snap, context) => {
    const item = snap.data();
    const itemId = context.params.itemId;
    
    console.log(`?넅 ???곹뭹 ?깅줉: ${item.title} (${itemId})`);

    // ?곹뭹 ?곗씠??寃利?    const tags: string[] = item.autoTags || [];
    const location = item.location;
    
    if (!tags.length) {
      console.log("?좑툘 ?곹뭹???쒓렇媛 ?놁뼱 ?뚮┝??諛쒖넚?섏? ?딆뒿?덈떎.");
      return;
    }

    if (!location) {
      console.log("?좑툘 ?곹뭹???꾩튂 ?뺣낫媛 ?놁뼱 ?뚮┝??諛쒖넚?섏? ?딆뒿?덈떎.");
      return;
    }

    try {
      // 援щ룆??議고쉶
      const subscriptionsSnapshot = await admin.firestore()
        .collection("subscriptions")
        .get();

      const matchedSubscriptions: admin.firestore.QueryDocumentSnapshot[] = [];
      
      // ?ㅼ썙??留ㅼ묶 諛??꾩튂 ?꾪꽣留?      for (const subscriptionDoc of subscriptionsSnapshot.docs) {
        const subscription = subscriptionDoc.data();
        
        // ?ㅼ썙??留ㅼ묶 ?뺤씤
        if (tags.includes(subscription.keyword)) {
          // ?꾩튂 湲곕컲 ?꾪꽣留?(諛섍꼍 ???뺤씤)
          if (isWithinRadius(subscription.geo, location, subscription.radius || 5)) {
            matchedSubscriptions.push(subscriptionDoc);
          }
        }
      }

      console.log(`?렞 留ㅼ묶??援щ룆?? ${matchedSubscriptions.length}紐?);

      // ?몄떆 ?뚮┝ 諛쒖넚
      const notificationPromises = matchedSubscriptions.map(async (subscriptionDoc) => {
        const subscription = subscriptionDoc.data();
        const fcmToken = subscription.fcmToken;
        
        try {
          // FCM 硫붿떆吏 援ъ꽦
          const message = {
            to: fcmToken,
            sound: 'default',
            title: '?넅 ???곹뭹 ?뚮┝',
            body: `${item.title}??媛) 洹쇱쿂???깅줉?섏뿀?듬땲??`,
            data: {
              itemId,
              keyword: subscription.keyword,
              type: 'new_item',
              click_action: 'FLUTTER_NOTIFICATION_CLICK'
            },
            notification: {
              title: '?넅 ???곹뭹 ?뚮┝',
              body: `${item.title}??媛) 洹쇱쿂???깅줉?섏뿀?듬땲??`,
              sound: 'default',
              badge: '1'
            }
          };

          // FCM ?꾩넚
          const response = await admin.messaging().send(message);
          console.log(`???뚮┝ 諛쒖넚 ?깃났: ${subscription.uid} (${subscription.keyword})`);
          
          // ?몄떆 ?뚮┝ 濡쒓렇 ???          await logPush({
            title: message.notification?.title || "???곹뭹 ?뚮┝",
            body: message.notification?.body || "",
            tokens: [fcmToken],
            data: { itemId, keyword: subscription.keyword },
            successCount: 1,
            failureCount: 0
          });
          
          // ?뚮┝ 濡쒓렇 ???          await admin.firestore().collection("notifications").add({
            recipientId: subscription.uid,
            itemId,
            keyword: subscription.keyword,
            title: message.notification?.title,
            body: message.notification?.body,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'sent',
            fcmResponse: response
          });

          return { success: true, userId: subscription.uid };

        } catch (error) {
          console.error(`???뚮┝ 諛쒖넚 ?ㅽ뙣: ${subscription.uid}`, error);
          
          // ?먮윭 濡쒓렇 ???          await logError("pushNotification", error, {
            userId: subscription.uid,
            itemId,
            keyword: subscription.keyword,
            fcmToken
          });
          
          // ?ㅽ뙣 濡쒓렇 ???          await admin.firestore().collection("notifications").add({
            recipientId: subscription.uid,
            itemId,
            keyword: subscription.keyword,
            title: '?뚮┝ 諛쒖넚 ?ㅽ뙣',
            body: `?곹뭹: ${item.title}`,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'failed',
            error: error.message
          });

          return { success: false, userId: subscription.uid, error };
        }
      });

      // 紐⑤뱺 ?뚮┝ 諛쒖넚 ?꾨즺 ?湲?      const results = await Promise.allSettled(notificationPromises);
      
      const successCount = results.filter(r => 
        r.status === 'fulfilled' && r.value.success
      ).length;
      
      const failureCount = results.length - successCount;

      console.log(`?뵒 ?몄떆 ?뚮┝ 諛쒖넚 ?꾨즺: ?깃났 ${successCount}嫄? ?ㅽ뙣 ${failureCount}嫄?);

      // ?듦퀎 ?낅뜲?댄듃
      await admin.firestore().collection("notificationStats").doc("daily").set({
        date: new Date().toISOString().split('T')[0],
        totalSent: admin.firestore.FieldValue.increment(successCount),
        totalFailed: admin.firestore.FieldValue.increment(failureCount),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

    } catch (error) {
      console.error("???몄떆 ?뚮┝ 泥섎━ ?ㅽ뙣:", error);
    }
  });

/**
 * 嫄곕━ 怨꾩궛 ?⑥닔 (Haversine formula)
 */
function isWithinRadius(
  userGeo: { lat: number; lng: number },
  itemGeo: { lat: number; lng: number },
  radiusKm: number = 5
): boolean {
  const R = 6371; // 吏援?諛섏?由?(km)
  const dLat = (itemGeo.lat - userGeo.lat) * Math.PI / 180;
  const dLon = (itemGeo.lng - userGeo.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(userGeo.lat * Math.PI / 180) * Math.cos(itemGeo.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance <= radiusKm;
}

/**
 * 二쇨린???뚮┝ ?붿빟 (留ㅼ씪 ?ㅼ쟾 9??
 */
export const dailyNotificationSummary = functions
  .region("asia-northeast3")
  .pubsub.schedule("0 9 * * *") // 留ㅼ씪 ?ㅼ쟾 9??(KST)
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    console.log("?뱤 ?쇱씪 ?뚮┝ ?붿빟 ?쒖옉");

    try {
      // ?댁젣 ?덈줈 ?깅줉???곹뭹 議고쉶
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const itemsSnapshot = await admin.firestore()
        .collection("marketItems")
        .where("createdAt", ">=", yesterday)
        .where("createdAt", "<", today)
        .get();

      if (itemsSnapshot.empty) {
        console.log("?벊 ?댁젣 ?깅줉?????곹뭹???놁뒿?덈떎.");
        return;
      }

      const newItems = itemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 紐⑤뱺 援щ룆?먯뿉寃??붿빟 ?뚮┝ 諛쒖넚
      const subscriptionsSnapshot = await admin.firestore()
        .collection("subscriptions")
        .get();

      const summaryPromises = subscriptionsSnapshot.docs.map(async (subscriptionDoc) => {
        const subscription = subscriptionDoc.data();
        const fcmToken = subscription.fcmToken;
        
        // ?대떦 援щ룆?먯쓽 ?ㅼ썙?쒖? 留ㅼ묶?섎뒗 ?곹뭹 ?꾪꽣留?        const matchingItems = newItems.filter(item => 
          item.autoTags?.includes(subscription.keyword)
        );

        if (matchingItems.length === 0) return;

        try {
          const message = {
            to: fcmToken,
            sound: 'default',
            title: '?뱤 ?ㅻ뒛?????곹뭹',
            body: `'${subscription.keyword}' 愿?????곹뭹 ${matchingItems.length}媛쒓? ?깅줉?섏뿀?듬땲??`,
            data: {
              type: 'daily_summary',
              keyword: subscription.keyword,
              itemCount: matchingItems.length.toString()
            }
          };

          await admin.messaging().send(message);
          console.log(`?뱤 ?붿빟 ?뚮┝ 諛쒖넚: ${subscription.uid}`);

        } catch (error) {
          console.error(`???붿빟 ?뚮┝ 諛쒖넚 ?ㅽ뙣: ${subscription.uid}`, error);
        }
      });

      await Promise.allSettled(summaryPromises);
      console.log("?뱤 ?쇱씪 ?뚮┝ ?붿빟 ?꾨즺");

    } catch (error) {
      console.error("???쇱씪 ?뚮┝ ?붿빟 ?ㅽ뙣:", error);
    }
  });

/**
 * n8n ?뱁썒 ?뚮┝ (?좏깮?ы빆)
 */
export const notifyN8nNewItem = functions
  .region("asia-northeast3")
  .firestore.document("marketItems/{itemId}")
  .onCreate(async (snap, context) => {
    const item = snap.data();
    const itemId = context.params.itemId;

    // n8n ?뱁썒 URL ?뺤씤
    const n8nWebhook = functions.config().n8n?.webhook;
    if (!n8nWebhook) return;

    try {
      const response = await fetch(n8nWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "new_item_registered",
          itemId,
          title: item.title,
          autoTags: item.autoTags,
          location: item.location,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log("??n8n ?뚮┝ ?꾩넚 ?꾨즺");
      }

    } catch (error) {
      console.error("??n8n ?뚮┝ ?꾩넚 ?ㅽ뙣:", error);
    }
  });
