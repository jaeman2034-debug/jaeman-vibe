/**
 * 🚨 YAGO VIBE 자동 반경 알림 엔진 (천재 모드)
 * Firestore → Functions → n8n → Slack·카카오·텔레그램 완전 자동화
 */
import * as functions from "firebase-functions";
import fetch from "node-fetch";
// 환경변수 설정 (천재 모드 최적화)
const CENTER = { lat: 37.5665, lng: 126.9780 }; // 서울시청 기준점
const RADIUS = 3000; // 반경 3km
const N8N_HOOK = process.env.N8N_WEBHOOK_URL || "";
// ──────────────────────────────
// 천재 모드 거리 계산 (최적화된 하버사인)
// ──────────────────────────────
function distance(a, b) {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(a.lat)) *
            Math.cos(toRad(b.lat)) *
            Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
}
// ──────────────────────────────
// market_items 새 문서 → 반경 내면 n8n Webhook 호출
// ──────────────────────────────
// ──────────────────────────────
// 🚨 천재 모드 메인 트리거 (최적화된 버전)
// ──────────────────────────────
export const onMarketItemCreated = functions
    .region("asia-northeast3")
    .firestore.document("market_items/{docId}")
    .onCreate(async (snap, ctx) => {
    try {
        const data = snap.data();
        const loc = data.location;
        // 빠른 필터링 (성능 최적화)
        if (!(loc === null || loc === void 0 ? void 0 : loc.lat) || !(loc === null || loc === void 0 ? void 0 : loc.lng) || !N8N_HOOK) {
            console.warn("🚫 필수 데이터 누락 — 알림 건너뜀");
            return;
        }
        // 천재 모드 거리 계산
        const dist = distance(CENTER, loc);
        // 반경 밖이면 즉시 리턴 (성능 최적화)
        if (dist > RADIUS) {
            console.log(`🚫 반경 밖: ${Math.round(dist)}m > ${RADIUS}m — skip`);
            return;
        }
        // 🚨 n8n으로 보낼 페이로드 (천재 모드 최적화)
        const payload = {
            event: "market_item_created",
            timestamp: new Date().toISOString(),
            docId: ctx.params.docId,
            distance_m: Math.round(dist),
            radius_m: RADIUS,
            center: CENTER,
            item: {
                title: data.title || "제목 없음",
                price: data.price || null,
                address: data.address || null,
                imageUrl: data.imageUrl || null,
                location: { lat: Number(loc.lat), lng: Number(loc.lng) },
                createdAt: data.createdAt || new Date().toISOString(),
                // 추가 필드들
                category: data.category || "기타",
                sellerId: data.sellerId || null,
                condition: data.condition || "중고",
            },
        };
        console.log("🚨 새 거래 알림 전송:", {
            item: payload.item.title,
            distance: `${payload.distance_m}m`,
            price: payload.item.price
        });
        // n8n Webhook 호출 (비동기 처리)
        const res = await fetch(N8N_HOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (res.ok) {
            console.log("✅ 천재 모드 알림 전송 완료");
        }
        else {
            const text = await res.text();
            console.error("❌ n8n 응답 오류:", res.status, text);
        }
    }
    catch (err) {
        console.error("💥 onMarketItemCreated error:", err);
    }
});
// ──────────────────────────────
// 수동 테스트용 Callable 함수
// ──────────────────────────────
export const testMarketNotification = functions
    .region("asia-northeast3")
    .https.onCall(async (data) => {
    const { lat, lng, title, price } = data;
    if (!lat || !lng) {
        throw new functions.https.HttpsError("invalid-argument", "lat, lng 필요");
    }
    const dist = distance(CENTER, { lat: Number(lat), lng: Number(lng) });
    const payload = {
        event: "test_market_item",
        timestamp: new Date().toISOString(),
        distance_m: Math.round(dist),
        radius_m: RADIUS,
        center: CENTER,
        item: {
            title: title || "테스트 상품",
            price: price || 10000,
            address: "테스트 주소",
            location: { lat: Number(lat), lng: Number(lng) },
            createdAt: new Date().toISOString(),
        },
    };
    if (!N8N_HOOK) {
        return { message: "N8N_WEBHOOK_URL 미설정", payload };
    }
    try {
        const res = await fetch(N8N_HOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        return {
            message: "테스트 알림 전송 완료",
            status: res.status,
            payload
        };
    }
    catch (error) {
        console.error("테스트 알림 전송 실패:", error);
        throw new functions.https.HttpsError("internal", "알림 전송 실패");
    }
});
//# sourceMappingURL=marketNotification.js.map