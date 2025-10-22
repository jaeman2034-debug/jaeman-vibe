import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import fetch from "node-fetch";
/**
 * 🚀 야고 비서 AI 예측 시스템 - Firebase Functions
 * Cloud Run API 호출 및 Firestore 저장
 */
// Firebase Admin 초기화
admin.initializeApp();
const db = admin.firestore();
/**
 * 그리드 키 생성 유틸리티
 */
const createGridKey = (lat, lng) => {
    const gridLat = Math.round(lat * 100) / 100;
    const gridLng = Math.round(lng * 100) / 100;
    return `${gridLat}_${gridLng}`;
};
/**
 * 일일 데이터 집계 (매일 23:00 실행)
 */
export const aggregateDaily = functions
    .region("asia-northeast3")
    .pubsub.schedule("0 23 * * *") // 매일 23:00
    .timeZone("Asia/Seoul")
    .onRun(async (context) => {
    console.log("📊 일일 데이터 집계 시작:", new Date().toISOString());
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateKey = yesterday.toISOString().slice(0, 10);
        console.log(`📅 집계 대상 날짜: ${dateKey}`);
        // 1️⃣ 음성 세션 집계
        const voiceSnap = await db.collection("voiceSessions")
            .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(yesterday))
            .where("createdAt", "<", admin.firestore.Timestamp.fromDate(new Date()))
            .get();
        // 2️⃣ 상품 등록 집계
        const itemSnap = await db.collection("marketItems")
            .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(yesterday))
            .where("createdAt", "<", admin.firestore.Timestamp.fromDate(new Date()))
            .get();
        // 3️⃣ 팀 모집 집계
        const teamSnap = await db.collection("teamRecruitments")
            .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(yesterday))
            .where("createdAt", "<", admin.firestore.Timestamp.fromDate(new Date()))
            .get();
        console.log(`📊 데이터 수집 완료: 음성 ${voiceSnap.size}건, 상품 ${itemSnap.size}건, 팀 ${teamSnap.size}건`);
        // 4️⃣ 그리드별 집계
        const gridMap = new Map();
        // 음성 세션 집계
        voiceSnap.docs.forEach(doc => {
            var _a, _b;
            const data = doc.data();
            let lat, lng;
            if (((_a = data.geo) === null || _a === void 0 ? void 0 : _a.lat) && ((_b = data.geo) === null || _b === void 0 ? void 0 : _b.lng)) {
                lat = data.geo.lat;
                lng = data.geo.lng;
            }
            else {
                return; // 위치 정보가 없으면 스킵
            }
            const key = createGridKey(lat, lng);
            if (!gridMap.has(key)) {
                gridMap.set(key, { lat, lng, voiceCount: 0, itemCount: 0, teamCount: 0 });
            }
            gridMap.get(key).voiceCount++;
        });
        // 상품 등록 집계
        itemSnap.docs.forEach(doc => {
            var _a, _b;
            const data = doc.data();
            let lat, lng;
            if (((_a = data.location) === null || _a === void 0 ? void 0 : _a.latitude) && ((_b = data.location) === null || _b === void 0 ? void 0 : _b.longitude)) {
                lat = data.location.latitude;
                lng = data.location.longitude;
            }
            else {
                return; // 위치 정보가 없으면 스킵
            }
            const key = createGridKey(lat, lng);
            if (!gridMap.has(key)) {
                gridMap.set(key, { lat, lng, voiceCount: 0, itemCount: 0, teamCount: 0 });
            }
            gridMap.get(key).itemCount++;
        });
        // 팀 모집 집계
        teamSnap.docs.forEach(doc => {
            var _a, _b;
            const data = doc.data();
            let lat, lng;
            if (((_a = data.location) === null || _a === void 0 ? void 0 : _a.latitude) && ((_b = data.location) === null || _b === void 0 ? void 0 : _b.longitude)) {
                lat = data.location.latitude;
                lng = data.location.longitude;
            }
            else {
                return; // 위치 정보가 없으면 스킵
            }
            const key = createGridKey(lat, lng);
            if (!gridMap.has(key)) {
                gridMap.set(key, { lat, lng, voiceCount: 0, itemCount: 0, teamCount: 0 });
            }
            gridMap.get(key).teamCount++;
        });
        // 5️⃣ Firestore 저장
        const batch = db.batch();
        const dayRef = db.collection("dailyCounts").doc(dateKey);
        let savedCells = 0;
        gridMap.forEach((data, key) => {
            const cellRef = dayRef.collection("cells").doc(key);
            batch.set(cellRef, {
                date: dateKey,
                cell: key,
                lat: data.lat,
                lng: data.lng,
                voiceCount: data.voiceCount,
                itemCount: data.itemCount,
                teamCount: data.teamCount,
                total: data.voiceCount + data.itemCount + data.teamCount,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            savedCells++;
        });
        await batch.commit();
        // 집계 로그 저장
        await db.collection("aggregationLogs").add({
            date: dateKey,
            type: "daily_aggregation",
            voiceCount: voiceSnap.size,
            itemCount: itemSnap.size,
            teamCount: teamSnap.size,
            gridCells: savedCells,
            status: "completed",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ 일일 집계 완료: ${dateKey}, ${savedCells}개 그리드 저장`);
    }
    catch (error) {
        console.error("❌ 일일 집계 오류:", error);
        await logError("aggregateDaily", error, { context: "daily_aggregation" });
    }
});
/**
 * 일일 예측 실행 (매일 21:00 실행)
 */
export const forecastDaily = functions
    .region("asia-northeast3")
    .pubsub.schedule("0 21 * * *") // 매일 21:00
    .timeZone("Asia/Seoul")
    .onRun(async (context) => {
    var _a, _b, _c, _d, _e, _f;
    console.log("🔮 일일 예측 시작:", new Date().toISOString());
    try {
        const today = new Date();
        const horizonDate = new Date(today);
        horizonDate.setDate(today.getDate() + 1);
        const targetKey = horizonDate.toISOString().slice(0, 10);
        console.log(`🎯 예측 대상 날짜: ${targetKey}`);
        // 1️⃣ 최근 30일 데이터 수집
        const days = Array.from({ length: 30 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (29 - i));
            return d.toISOString().slice(0, 10);
        });
        console.log(`📊 수집 기간: ${days[0]} ~ ${days[days.length - 1]}`);
        // 2️⃣ 모든 셀 데이터 수집
        const cellMap = new Map();
        for (const day of days) {
            try {
                const snap = await db.collection("dailyCounts")
                    .doc(day)
                    .collection("cells")
                    .get();
                snap.docs.forEach(doc => {
                    const data = doc.data();
                    const key = data.cell;
                    if (!cellMap.has(key)) {
                        cellMap.set(key, {
                            lat: data.lat,
                            lng: data.lng,
                            series: new Array(days.indexOf(day)).fill(0)
                        });
                    }
                    const cellData = cellMap.get(key);
                    // 시리즈 길이 맞추기
                    while (cellData.series.length <= days.indexOf(day)) {
                        cellData.series.push(0);
                    }
                    cellData.series[days.indexOf(day)] = data.total || 0;
                });
            }
            catch (error) {
                console.warn(`⚠️ 날짜 ${day} 데이터 수집 실패:`, error);
            }
        }
        // 3️⃣ 시리즈 길이 정규화 (모든 셀이 30일 데이터를 가지도록)
        cellMap.forEach((cellData) => {
            while (cellData.series.length < 30) {
                cellData.series.push(0);
            }
        });
        console.log(`📈 수집된 셀 수: ${cellMap.size}`);
        // 4️⃣ 빈 데이터 필터링 (최소 3일 이상의 데이터가 있는 셀만)
        const validCells = Array.from(cellMap.entries()).filter(([key, data]) => {
            const nonZeroCount = data.series.filter(val => val > 0).length;
            return nonZeroCount >= 3;
        });
        console.log(`✅ 유효한 셀 수: ${validCells.length}`);
        if (validCells.length === 0) {
            console.log("❌ 예측할 유효한 셀이 없습니다.");
            return;
        }
        // 5️⃣ Cloud Run API 호출 준비
        const cells = validCells.map(([key, data]) => ({
            cell: key,
            lat: data.lat,
            lng: data.lng,
            series: data.series
        }));
        const forecastUrl = (_a = functions.config().forecast) === null || _a === void 0 ? void 0 : _a.url;
        if (!forecastUrl) {
            throw new Error("Forecast API URL이 설정되지 않았습니다.");
        }
        console.log(`🌐 Cloud Run API 호출: ${forecastUrl}`);
        // 6️⃣ Cloud Run API 호출
        const response = await fetch(`${forecastUrl}/forecast`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "yago-forecast-functions/1.0"
            },
            body: JSON.stringify({
                horizon: 1,
                model_type: "auto",
                confidence_level: 0.8,
                include_seasonality: true,
                cells: cells
            }),
            timeout: 60000 // 60초 타임아웃
        });
        if (!response.ok) {
            throw new Error(`Forecast API 호출 실패: ${response.status} ${response.statusText}`);
        }
        const forecastResult = await response.json();
        console.log(`🎯 예측 완료: ${((_b = forecastResult.forecasts) === null || _b === void 0 ? void 0 : _b.length) || 0}개 셀`);
        // 7️⃣ Firestore 저장
        const batch = db.batch();
        const dayRef = db.collection("forecasts").doc(targetKey);
        let savedCount = 0;
        let errorCount = 0;
        if (forecastResult.forecasts) {
            for (const forecast of forecastResult.forecasts) {
                try {
                    const cellRef = dayRef.collection("cells").doc(forecast.cell);
                    batch.set(cellRef, {
                        date: targetKey,
                        cell: forecast.cell,
                        lat: forecast.lat,
                        lng: forecast.lng,
                        yhat: forecast.yhat,
                        yhat_lower: forecast.yhat_lower,
                        yhat_upper: forecast.yhat_upper,
                        confidence: forecast.confidence,
                        model_used: forecast.model_used,
                        data_quality: forecast.data_quality,
                        trend: forecast.trend,
                        createdAt: admin.firestore.FieldValue.serverTimestamp()
                    }, { merge: true });
                    savedCount++;
                }
                catch (error) {
                    console.error(`❌ 셀 ${forecast.cell} 저장 실패:`, error);
                    errorCount++;
                }
            }
        }
        await batch.commit();
        // 8️⃣ 예측 로그 저장
        await db.collection("forecastLogs").add({
            executedAt: admin.firestore.FieldValue.serverTimestamp(),
            targetDate: targetKey,
            cellCount: validCells.length,
            successCount: savedCount,
            errorCount: errorCount,
            executionTime: forecastResult.execution_time || 0,
            model: "auto",
            horizon: 1,
            status: errorCount === 0 ? "completed" : "partial_success",
            summary: forecastResult.summary || {},
            apiResponse: {
                totalCells: ((_c = forecastResult.forecasts) === null || _c === void 0 ? void 0 : _c.length) || 0,
                averagePrediction: ((_d = forecastResult.summary) === null || _d === void 0 ? void 0 : _d.average_prediction) || 0,
                maxPrediction: ((_e = forecastResult.summary) === null || _e === void 0 ? void 0 : _e.max_prediction) || 0,
                successRate: ((_f = forecastResult.summary) === null || _f === void 0 ? void 0 : _f.success_rate) || 0
            }
        });
        console.log(`✅ 예측 저장 완료: ${targetKey}, ${savedCount}개 셀 저장`);
    }
    catch (error) {
        console.error("❌ 일일 예측 오류:", error);
        await logError("forecastDaily", error, { context: "daily_forecast" });
    }
});
/**
 * 수동 예측 실행 (테스트용)
 */
export const manualForecast = functions
    .region("asia-northeast3")
    .https.onCall(async (data, context) => {
    var _a, _b;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', '인증이 필요합니다.');
    }
    try {
        console.log("🔮 수동 예측 시작");
        const horizon = data.horizon || 1;
        const modelType = data.model_type || "auto";
        const confidenceLevel = data.confidence_level || 0.8;
        // 최근 30일 데이터 수집
        const days = Array.from({ length: 30 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (29 - i));
            return d.toISOString().slice(0, 10);
        });
        const cellMap = new Map();
        for (const day of days) {
            try {
                const snap = await db.collection("dailyCounts")
                    .doc(day)
                    .collection("cells")
                    .limit(50) // 테스트용으로 제한
                    .get();
                snap.docs.forEach(doc => {
                    const data = doc.data();
                    const key = data.cell;
                    if (!cellMap.has(key)) {
                        cellMap.set(key, {
                            lat: data.lat,
                            lng: data.lng,
                            series: new Array(days.indexOf(day)).fill(0)
                        });
                    }
                    const cellData = cellMap.get(key);
                    while (cellData.series.length <= days.indexOf(day)) {
                        cellData.series.push(0);
                    }
                    cellData.series[days.indexOf(day)] = data.total || 0;
                });
            }
            catch (error) {
                console.warn(`날짜 ${day} 데이터 수집 실패:`, error);
            }
        }
        // 시리즈 길이 정규화
        cellMap.forEach((cellData) => {
            while (cellData.series.length < 30) {
                cellData.series.push(0);
            }
        });
        const validCells = Array.from(cellMap.entries()).filter(([key, data]) => {
            const nonZeroCount = data.series.filter(val => val > 0).length;
            return nonZeroCount >= 3;
        });
        if (validCells.length === 0) {
            return {
                success: false,
                message: "예측할 유효한 셀이 없습니다."
            };
        }
        const cells = validCells.slice(0, 20).map(([key, data]) => ({
            cell: key,
            lat: data.lat,
            lng: data.lng,
            series: data.series
        }));
        const forecastUrl = (_a = functions.config().forecast) === null || _a === void 0 ? void 0 : _a.url;
        if (!forecastUrl) {
            throw new Error("Forecast API URL이 설정되지 않았습니다.");
        }
        const response = await fetch(`${forecastUrl}/forecast`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "yago-forecast-functions/1.0"
            },
            body: JSON.stringify({
                horizon,
                model_type: modelType,
                confidence_level: confidenceLevel,
                include_seasonality: true,
                cells: cells
            })
        });
        if (!response.ok) {
            throw new Error(`Forecast API 호출 실패: ${response.status}`);
        }
        const forecastResult = await response.json();
        return {
            success: true,
            message: "수동 예측 완료",
            result: {
                cellCount: validCells.length,
                forecastCount: ((_b = forecastResult.forecasts) === null || _b === void 0 ? void 0 : _b.length) || 0,
                executionTime: forecastResult.execution_time || 0,
                summary: forecastResult.summary || {}
            },
            forecasts: forecastResult.forecasts || []
        };
    }
    catch (error) {
        console.error("수동 예측 오류:", error);
        return {
            success: false,
            message: `예측 실패: ${error.message}`
        };
    }
});
/**
 * 예측 데이터 정리 (주간 실행)
 */
export const cleanupForecasts = functions
    .region("asia-northeast3")
    .pubsub.schedule("0 2 * * 0") // 매주 일요일 02:00
    .timeZone("Asia/Seoul")
    .onRun(async (context) => {
    console.log("🧹 예측 데이터 정리 시작");
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30); // 30일 이전 데이터 정리
        const cutoffKey = cutoffDate.toISOString().slice(0, 10);
        // 오래된 예측 데이터 삭제
        const oldForecasts = await db.collection("forecasts")
            .where("date", "<", cutoffKey)
            .get();
        const batch = db.batch();
        oldForecasts.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`✅ 예측 데이터 정리 완료: ${oldForecasts.size}개 문서 삭제`);
        // 정리 로그 저장
        await db.collection("cleanupLogs").add({
            type: "forecast_cleanup",
            deletedCount: oldForecasts.size,
            cutoffDate: cutoffKey,
            status: "completed",
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    catch (error) {
        console.error("❌ 예측 데이터 정리 오류:", error);
        await logError("cleanupForecasts", error, { context: "forecast_cleanup" });
    }
});
/**
 * 에러 로깅 유틸리티
 */
async function logError(source, error, meta) {
    try {
        await db.collection("errors").add({
            source,
            message: String((error === null || error === void 0 ? void 0 : error.message) || error),
            stack: (error === null || error === void 0 ? void 0 : error.stack) || null,
            meta: meta !== null && meta !== void 0 ? meta : null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    catch (logError) {
        console.error("에러 로깅 실패:", logError);
    }
}
//# sourceMappingURL=forecastJob.js.map