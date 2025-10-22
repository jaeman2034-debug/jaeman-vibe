import * as functions from "firebase-functions";
import fetch from "node-fetch";
export const getKakaoDirections = functions
    .region("asia-northeast3")
    .https.onRequest(async (req, res) => {
    var _a, _b, _c;
    // CORS 설정
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    const { origin, destination } = req.query;
    if (!origin || !destination) {
        return res.status(400).json({ error: "origin, destination 필요" });
    }
    const [ox, oy] = origin.split(",");
    const [dx, dy] = destination.split(",");
    if (!ox || !oy || !dx || !dy) {
        return res.status(400).json({ error: "좌표 형식이 올바르지 않습니다" });
    }
    // Kakao Mobility Directions API 호출 (프로덕션 최적화)
    const url = `https://apis-navi.kakaomobility.com/v1/directions?origin=${ox},${oy}&destination=${dx},${dy}&priority=RECOMMEND&car_fuel=GASOLINE&car_hipass=false&alternatives=false&road_details=true`;
    const headers = {
        Authorization: `KakaoAK ${functions.config().kakao.key}`,
        "Content-Type": "application/json",
    };
    try {
        console.log("🗺️ Kakao Directions API 호출 (프로덕션):", url);
        const response = await fetch(url, { headers });
        if (!response.ok) {
            console.error("❌ API 응답 오류:", response.status, response.statusText);
            // n8n 알림 (옵션)
            const n8nWebhook = (_a = functions.config().n8n) === null || _a === void 0 ? void 0 : _a.webhook;
            if (n8nWebhook) {
                fetch(n8nWebhook, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "route_error",
                        payload: { origin, destination, status: response.status, error: response.statusText }
                    })
                }).catch(() => { }); // 알림 실패는 무시
            }
            return res.status(response.status).json({
                error: "Kakao Directions API 오류",
                status: response.status
            });
        }
        const data = await response.json();
        console.log("✅ 경로 데이터 수신:", ((_b = data.routes) === null || _b === void 0 ? void 0 : _b.length) || 0, "개 경로");
        // 프로덕션 모바일 네비게이션용 데이터 가공
        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            // 턴바이턴 안내를 위한 가이드 정보 강화
            const processedRoute = {
                ...route,
                sections: route.sections.map((section) => ({
                    ...section,
                    guides: section.guides.map((guide) => ({
                        ...guide,
                        // 모바일 TTS에 최적화된 안내 문장
                        mobileGuidance: guide.guidance.replace(/\./g, "").trim(),
                        // 거리별 안내 타이밍 (배터리 최적화)
                        announcementDistance: guide.distance <= 100 ? 50 : guide.distance <= 300 ? 100 : 200,
                        // 안내 우선순위
                        priority: guide.distance <= 50 ? "high" : guide.distance <= 200 ? "medium" : "low"
                    }))
                }))
            };
            data.routes[0] = processedRoute;
        }
        res.json(data);
    }
    catch (error) {
        console.error("❌ Kakao Directions API 호출 실패:", error);
        // n8n 알림 (옵션)
        const n8nWebhook = (_c = functions.config().n8n) === null || _c === void 0 ? void 0 : _c.webhook;
        if (n8nWebhook) {
            fetch(n8nWebhook, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "route_error",
                    payload: { origin, destination, error: error.message }
                })
            }).catch(() => { }); // 알림 실패는 무시
        }
        res.status(500).json({ error: "API 호출 실패", details: error.message });
    }
});
//# sourceMappingURL=directionsProxy.js.map