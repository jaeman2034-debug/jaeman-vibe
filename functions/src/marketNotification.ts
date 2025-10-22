/**
 * ?슚 YAGO VIBE ?먮룞 諛섍꼍 ?뚮┝ ?붿쭊 (泥쒖옱 紐⑤뱶)
 * Firestore ??Functions ??n8n ??Slack쨌移댁뭅?ㅒ룻뀛?덇렇???꾩쟾 ?먮룞?? */

import * as functions from "firebase-functions";
import fetch from "node-fetch";

// ?섍꼍蹂???ㅼ젙 (泥쒖옱 紐⑤뱶 理쒖쟻??
const CENTER = { lat: 37.5665, lng: 126.9780 }; // ?쒖슱?쒖껌 湲곗???const RADIUS = 3000; // 諛섍꼍 3km
const N8N_HOOK = process.env.N8N_WEBHOOK_URL || "";

// ??????????????????????????????
// 泥쒖옱 紐⑤뱶 嫄곕━ 怨꾩궛 (理쒖쟻?붾맂 ?섎쾭?ъ씤)
// ??????????????????????????????
function distance(a: any, b: any) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) *
      Math.cos(toRad(b.lat)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ??????????????????????????????
// market_items ??臾몄꽌 ??諛섍꼍 ?대㈃ n8n Webhook ?몄텧
// ??????????????????????????????
// ??????????????????????????????
// ?슚 泥쒖옱 紐⑤뱶 硫붿씤 ?몃━嫄?(理쒖쟻?붾맂 踰꾩쟾)
// ??????????????????????????????
export const onMarketItemCreated = functions
  .region("asia-northeast3")
  .firestore.document("market_items/{docId}")
  .onCreate(async (snap, ctx) => {
    try {
      const data = snap.data();
      const loc = data.location;
      
      // 鍮좊Ⅸ ?꾪꽣留?(?깅뒫 理쒖쟻??
      if (!loc?.lat || !loc?.lng || !N8N_HOOK) {
        console.warn("?슟 ?꾩닔 ?곗씠???꾨씫 ???뚮┝ 嫄대꼫?");
        return;
      }

      // 泥쒖옱 紐⑤뱶 嫄곕━ 怨꾩궛
      const dist = distance(CENTER, loc);
      
      // 諛섍꼍 諛뽰씠硫?利됱떆 由ы꽩 (?깅뒫 理쒖쟻??
      if (dist > RADIUS) {
        console.log(`?슟 諛섍꼍 諛? ${Math.round(dist)}m > ${RADIUS}m ??skip`);
        return;
      }

      // ?슚 n8n?쇰줈 蹂대궪 ?섏씠濡쒕뱶 (泥쒖옱 紐⑤뱶 理쒖쟻??
      const payload = {
        event: "market_item_created",
        timestamp: new Date().toISOString(),
        docId: ctx.params.docId,
        distance_m: Math.round(dist),
        radius_m: RADIUS,
        center: CENTER,
        item: {
          title: data.title || "?쒕ぉ ?놁쓬",
          price: data.price || null,
          address: data.address || null,
          imageUrl: data.imageUrl || null,
          location: { lat: Number(loc.lat), lng: Number(loc.lng) },
          createdAt: data.createdAt || new Date().toISOString(),
          // 異붽? ?꾨뱶??          category: data.category || "湲고?",
          sellerId: data.sellerId || null,
          condition: data.condition || "以묎퀬",
        },
      };

      console.log("?슚 ??嫄곕옒 ?뚮┝ ?꾩넚:", {
        item: payload.item.title,
        distance: `${payload.distance_m}m`,
        price: payload.item.price
      });

      // n8n Webhook ?몄텧 (鍮꾨룞湲?泥섎━)
      const res = await fetch(N8N_HOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        console.log("??泥쒖옱 紐⑤뱶 ?뚮┝ ?꾩넚 ?꾨즺");
      } else {
        const text = await res.text();
        console.error("??n8n ?묐떟 ?ㅻ쪟:", res.status, text);
      }
    } catch (err) {
      console.error("?뮙 onMarketItemCreated error:", err);
    }
  });

// ??????????????????????????????
// ?섎룞 ?뚯뒪?몄슜 Callable ?⑥닔
// ??????????????????????????????
export const testMarketNotification = functions
  .region("asia-northeast3")
  .https.onCall(async (data) => {
    const { lat, lng, title, price } = data;
    
    if (!lat || !lng) {
      throw new functions.https.HttpsError("invalid-argument", "lat, lng ?꾩슂");
    }

      const dist = distance(CENTER, { lat: Number(lat), lng: Number(lng) });

    const payload = {
      event: "test_market_item",
      timestamp: new Date().toISOString(),
      distance_m: Math.round(dist),
      radius_m: RADIUS,
      center: CENTER,
      item: {
        title: title || "?뚯뒪???곹뭹",
        price: price || 10000,
        address: "?뚯뒪??二쇱냼",
        location: { lat: Number(lat), lng: Number(lng) },
        createdAt: new Date().toISOString(),
      },
    };

    if (!N8N_HOOK) {
      return { message: "N8N_WEBHOOK_URL 誘몄꽕??, payload };
    }

    try {
      const res = await fetch(N8N_HOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      return { 
        message: "?뚯뒪???뚮┝ ?꾩넚 ?꾨즺",
        status: res.status,
        payload 
      };
    } catch (error) {
      console.error("?뚯뒪???뚮┝ ?꾩넚 ?ㅽ뙣:", error);
      throw new functions.https.HttpsError("internal", "?뚮┝ ?꾩넚 ?ㅽ뙣");
    }
  });
