/**
 * 🎧 Google Cast 연동 Functions
 * n8n Webhook → Firebase Functions → 로컬 캐스트 브릿지 → Google Nest/Home
 */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
// Firestore 인스턴스
const db = admin.firestore();
// 캐스트 브릿지 서버 URL (로컬)
const CAST_BRIDGE_URL = "http://localhost:4000";
// 캐스트 가능한 스피커 목록
const CAST_SPEAKERS = {
    "living_room": "192.168.1.100", // 거실 Google Nest
    "bedroom": "192.168.1.101", // 침실 Google Home
    "kitchen": "192.168.1.102" // 주방 Google Mini
};
export const googleCastLatest = functions
    .region("asia-northeast3")
    .https.onRequest(async (req, res) => {
    var _a;
    // CORS 설정
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.status(200).send("");
        return;
    }
    try {
        const { speaker = "living_room" } = req.body;
        const speakerIP = CAST_SPEAKERS[speaker];
        if (!speakerIP) {
            res.status(400).json({
                error: "지원하지 않는 스피커입니다",
                available: Object.keys(CAST_SPEAKERS)
            });
            return;
        }
        console.log(`🎧 ${speaker} 스피커(${speakerIP})로 브리핑 재생 요청`);
        // 최신 리포트 조회
        const snapshot = await db
            .collection("ai_voice_reports")
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();
        if (snapshot.empty) {
            res.status(404).json({
                error: "재생할 브리핑이 없습니다"
            });
            return;
        }
        const latestReport = snapshot.docs[0].data();
        const audioUrl = latestReport.audioUrl;
        if (!audioUrl) {
            res.status(404).json({
                error: "오디오 파일이 준비되지 않았습니다"
            });
            return;
        }
        // 로컬 캐스트 브릿지로 전달
        const castResult = await castToSpeaker(speakerIP, audioUrl, latestReport);
        if (castResult.success) {
            res.json({
                success: true,
                message: `${speaker} 스피커에서 브리핑을 재생합니다`,
                audioUrl: audioUrl,
                speaker: speaker,
                speakerIP: speakerIP,
                reportTitle: ((_a = latestReport.summary) === null || _a === void 0 ? void 0 : _a.slice(0, 50)) + "..."
            });
        }
        else {
            res.status(500).json({
                error: "스피커 재생 실패",
                details: castResult.error
            });
        }
    }
    catch (error) {
        console.error("❌ Google Cast 오류:", error);
        res.status(500).json({
            error: "스피커 연동 오류",
            details: error.message
        });
    }
});
// 🎵 스피커로 캐스트하는 함수
async function castToSpeaker(speakerIP, audioUrl, reportData) {
    var _a;
    try {
        // 로컬 캐스트 브릿지 서비스 호출
        const fetch = (await import('node-fetch')).default;
        const castRequest = {
            host: speakerIP,
            url: audioUrl,
            metadata: {
                title: "🎧 YAGO 브리핑",
                subtitle: ((_a = reportData.summary) === null || _a === void 0 ? void 0 : _a.slice(0, 100)) || "AI 음성 리포트",
                albumArt: "https://yago-vibe.firebaseapp.com/icon-512.png"
            }
        };
        const response = await fetch(`${CAST_BRIDGE_URL}/cast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(castRequest)
        });
        if (response.ok) {
            const result = await response.json();
            console.log(`✅ ${speakerIP} 캐스트 성공:`, result);
            return { success: true };
        }
        else {
            const errorText = await response.text();
            console.error(`❌ ${speakerIP} 캐스트 실패:`, errorText);
            return { success: false, error: errorText };
        }
    }
    catch (error) {
        console.error("캐스트 오류:", error);
        return {
            success: false,
            error: error.message
        };
    }
}
// 📱 Android App Shortcut 연동
export const androidAppShortcut = functions
    .region("asia-northeast3")
    .https.onRequest(async (req, res) => {
    var _a, _b, _c, _d, _e, _f, _g;
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.status(200).send("");
        return;
    }
    try {
        // 최신 리포트 조회
        const snapshot = await db
            .collection("ai_voice_reports")
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();
        if (snapshot.empty) {
            res.json({
                success: false,
                message: "재생할 브리핑이 없습니다",
                autoPlay: false
            });
            return;
        }
        const latestReport = snapshot.docs[0].data();
        res.json({
            success: true,
            message: "브리핑을 불러왔습니다",
            autoPlay: true,
            report: {
                id: snapshot.docs[0].id,
                title: ((_a = latestReport.summary) === null || _a === void 0 ? void 0 : _a.slice(0, 50)) + "..." || "AI 음성 리포트",
                audioUrl: latestReport.audioUrl,
                pdfUrl: latestReport.pdfUrl,
                date: latestReport.reportDate || ((_d = (_c = (_b = latestReport.createdAt) === null || _b === void 0 ? void 0 : _b.toDate) === null || _c === void 0 ? void 0 : _c.call(_b)) === null || _d === void 0 ? void 0 : _d.toISOString()),
                totalCount: ((_e = latestReport.stats) === null || _e === void 0 ? void 0 : _e.totalCount) || 0,
                totalValue: ((_f = latestReport.stats) === null || _f === void 0 ? void 0 : _f.totalValue) || 0,
                topArea: ((_g = latestReport.stats) === null || _g === void 0 ? void 0 : _g.topArea) || "정보 없음"
            }
        });
    }
    catch (error) {
        console.error("❌ Android Shortcut 오류:", error);
        res.status(500).json({
            success: false,
            error: "브리핑을 불러오는 중 오류가 발생했습니다"
        });
    }
});
// 🔔 Google Home 루틴 트리거
export const googleHomeRoutine = functions
    .region("asia-northeast3")
    .https.onRequest(async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
        res.status(200).send("");
        return;
    }
    try {
        const { action = "play_latest", speaker = "living_room" } = req.body;
        switch (action) {
            case "play_latest":
                // 최신 브리핑 재생
                req.body.speaker = speaker;
                return await googleCastLatest(req, res);
            case "play_yesterday":
                // 어제 브리핑 재생
                const yesterdayResult = await playYesterdayBriefing(speaker);
                return res.json(yesterdayResult);
            case "get_summary":
                // 요약 정보만 반환
                const summaryResult = await getBriefingSummary();
                return res.json(summaryResult);
            default:
                res.status(400).json({
                    error: "지원하지 않는 액션입니다",
                    supported: ["play_latest", "play_yesterday", "get_summary"]
                });
        }
    }
    catch (error) {
        console.error("❌ Google Home 루틴 오류:", error);
        res.status(500).json({
            error: "루틴 실행 오류",
            details: error.message
        });
    }
});
// 어제 브리핑 재생
async function playYesterdayBriefing(speaker) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const snapshot = await db
        .collection("ai_voice_reports")
        .where("reportDate", ">=", yesterdayStr)
        .where("reportDate", "<", new Date().toISOString().split('T')[0])
        .orderBy("reportDate", "desc")
        .limit(1)
        .get();
    if (snapshot.empty) {
        return {
            success: false,
            message: "어제 생성된 브리핑이 없습니다"
        };
    }
    const yesterdayReport = snapshot.docs[0].data();
    const audioUrl = yesterdayReport.audioUrl;
    if (!audioUrl) {
        return {
            success: false,
            message: "어제 브리핑의 오디오 파일이 준비되지 않았습니다"
        };
    }
    const speakerIP = CAST_SPEAKERS[speaker];
    const castResult = await castToSpeaker(speakerIP, audioUrl, yesterdayReport);
    if (castResult.success) {
        return {
            success: true,
            message: `어제 브리핑을 ${speaker} 스피커에서 재생합니다`,
            audioUrl: audioUrl,
            speaker: speaker
        };
    }
    else {
        throw new Error(`어제 브리핑 재생 실패: ${castResult.error}`);
    }
}
// 브리핑 요약 정보 반환
async function getBriefingSummary() {
    var _a, _b, _c;
    const snapshot = await db
        .collection("ai_voice_reports")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();
    if (snapshot.empty) {
        return {
            success: false,
            message: "브리핑 정보가 없습니다"
        };
    }
    const latestReport = snapshot.docs[0].data();
    return {
        success: true,
        summary: {
            title: "🎧 YAGO 브리핑",
            date: latestReport.reportDate || "오늘",
            totalCount: ((_a = latestReport.stats) === null || _a === void 0 ? void 0 : _a.totalCount) || 0,
            totalValue: ((_b = latestReport.stats) === null || _b === void 0 ? void 0 : _b.totalValue) || 0,
            topArea: ((_c = latestReport.stats) === null || _c === void 0 ? void 0 : _c.topArea) || "정보 없음",
            hasAudio: !!latestReport.audioUrl,
            hasPDF: !!latestReport.pdfUrl
        }
    };
}
//# sourceMappingURL=googleCast.js.map