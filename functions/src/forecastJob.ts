import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import fetch from "node-fetch";

/**
 * ?? ?쇨퀬 鍮꾩꽌 AI ?덉륫 ?쒖뒪??- Firebase Functions
 * Cloud Run API ?몄텧 諛?Firestore ??? */

// Firebase Admin 珥덇린??admin.initializeApp();
const db = admin.firestore();

/**
 * 洹몃━?????앹꽦 ?좏떥由ы떚
 */
const createGridKey = (lat: number, lng: number): string => {
  const gridLat = Math.round(lat * 100) / 100;
  const gridLng = Math.round(lng * 100) / 100;
  return `${gridLat}_${gridLng}`;
};

/**
 * ?쇱씪 ?곗씠??吏묎퀎 (留ㅼ씪 23:00 ?ㅽ뻾)
 */
export const aggregateDaily = functions
  .region("asia-northeast3")
  .pubsub.schedule("0 23 * * *") // 留ㅼ씪 23:00
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    console.log("?뱤 ?쇱씪 ?곗씠??吏묎퀎 ?쒖옉:", new Date().toISOString());

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateKey = yesterday.toISOString().slice(0, 10);

      console.log(`?뱟 吏묎퀎 ????좎쭨: ${dateKey}`);

      // 1截뤴깵 ?뚯꽦 ?몄뀡 吏묎퀎
      const voiceSnap = await db.collection("voiceSessions")
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(yesterday))
        .where("createdAt", "<", admin.firestore.Timestamp.fromDate(new Date()))
        .get();

      // 2截뤴깵 ?곹뭹 ?깅줉 吏묎퀎
      const itemSnap = await db.collection("marketItems")
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(yesterday))
        .where("createdAt", "<", admin.firestore.Timestamp.fromDate(new Date()))
        .get();

      // 3截뤴깵 ? 紐⑥쭛 吏묎퀎
      const teamSnap = await db.collection("teamRecruitments")
        .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(yesterday))
        .where("createdAt", "<", admin.firestore.Timestamp.fromDate(new Date()))
        .get();

      console.log(`?뱤 ?곗씠???섏쭛 ?꾨즺: ?뚯꽦 ${voiceSnap.size}嫄? ?곹뭹 ${itemSnap.size}嫄? ? ${teamSnap.size}嫄?);

      // 4截뤴깵 洹몃━?쒕퀎 吏묎퀎
      const gridMap = new Map<string, {
        lat: number;
        lng: number;
        voiceCount: number;
        itemCount: number;
        teamCount: number;
      }>();

      // ?뚯꽦 ?몄뀡 吏묎퀎
      voiceSnap.docs.forEach(doc => {
        const data = doc.data();
        let lat: number, lng: number;

        if (data.geo?.lat && data.geo?.lng) {
          lat = data.geo.lat;
          lng = data.geo.lng;
        } else {
          return; // ?꾩튂 ?뺣낫媛 ?놁쑝硫??ㅽ궢
        }

        const key = createGridKey(lat, lng);

        if (!gridMap.has(key)) {
          gridMap.set(key, { lat, lng, voiceCount: 0, itemCount: 0, teamCount: 0 });
        }
        gridMap.get(key)!.voiceCount++;
      });

      // ?곹뭹 ?깅줉 吏묎퀎
      itemSnap.docs.forEach(doc => {
        const data = doc.data();
        let lat: number, lng: number;

        if (data.location?.latitude && data.location?.longitude) {
          lat = data.location.latitude;
          lng = data.location.longitude;
        } else {
          return; // ?꾩튂 ?뺣낫媛 ?놁쑝硫??ㅽ궢
        }

        const key = createGridKey(lat, lng);

        if (!gridMap.has(key)) {
          gridMap.set(key, { lat, lng, voiceCount: 0, itemCount: 0, teamCount: 0 });
        }
        gridMap.get(key)!.itemCount++;
      });

      // ? 紐⑥쭛 吏묎퀎
      teamSnap.docs.forEach(doc => {
        const data = doc.data();
        let lat: number, lng: number;

        if (data.location?.latitude && data.location?.longitude) {
          lat = data.location.latitude;
          lng = data.location.longitude;
        } else {
          return; // ?꾩튂 ?뺣낫媛 ?놁쑝硫??ㅽ궢
        }

        const key = createGridKey(lat, lng);

        if (!gridMap.has(key)) {
          gridMap.set(key, { lat, lng, voiceCount: 0, itemCount: 0, teamCount: 0 });
        }
        gridMap.get(key)!.teamCount++;
      });

      // 5截뤴깵 Firestore ???      const batch = db.batch();
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

      // 吏묎퀎 濡쒓렇 ???      await db.collection("aggregationLogs").add({
        date: dateKey,
        type: "daily_aggregation",
        voiceCount: voiceSnap.size,
        itemCount: itemSnap.size,
        teamCount: teamSnap.size,
        gridCells: savedCells,
        status: "completed",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`???쇱씪 吏묎퀎 ?꾨즺: ${dateKey}, ${savedCells}媛?洹몃━?????);

    } catch (error) {
      console.error("???쇱씪 吏묎퀎 ?ㅻ쪟:", error);
      await logError("aggregateDaily", error, { context: "daily_aggregation" });
    }
  });

/**
 * ?쇱씪 ?덉륫 ?ㅽ뻾 (留ㅼ씪 21:00 ?ㅽ뻾)
 */
export const forecastDaily = functions
  .region("asia-northeast3")
  .pubsub.schedule("0 21 * * *") // 留ㅼ씪 21:00
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    console.log("?뵰 ?쇱씪 ?덉륫 ?쒖옉:", new Date().toISOString());

    try {
      const today = new Date();
      const horizonDate = new Date(today);
      horizonDate.setDate(today.getDate() + 1);
      const targetKey = horizonDate.toISOString().slice(0, 10);

      console.log(`?렞 ?덉륫 ????좎쭨: ${targetKey}`);

      // 1截뤴깵 理쒓렐 30???곗씠???섏쭛
      const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return d.toISOString().slice(0, 10);
      });

      console.log(`?뱤 ?섏쭛 湲곌컙: ${days[0]} ~ ${days[days.length - 1]}`);

      // 2截뤴깵 紐⑤뱺 ? ?곗씠???섏쭛
      const cellMap = new Map<string, {
        lat: number;
        lng: number;
        series: number[];
      }>();

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
            
            const cellData = cellMap.get(key)!;
            
            // ?쒕━利?湲몄씠 留욎텛湲?            while (cellData.series.length <= days.indexOf(day)) {
              cellData.series.push(0);
            }
            
            cellData.series[days.indexOf(day)] = data.total || 0;
          });
        } catch (error) {
          console.warn(`?좑툘 ?좎쭨 ${day} ?곗씠???섏쭛 ?ㅽ뙣:`, error);
        }
      }

      // 3截뤴깵 ?쒕━利?湲몄씠 ?뺢퇋??(紐⑤뱺 ???30???곗씠?곕? 媛吏?꾨줉)
      cellMap.forEach((cellData) => {
        while (cellData.series.length < 30) {
          cellData.series.push(0);
        }
      });

      console.log(`?뱢 ?섏쭛??? ?? ${cellMap.size}`);

      // 4截뤴깵 鍮??곗씠???꾪꽣留?(理쒖냼 3???댁긽???곗씠?곌? ?덈뒗 ?留?
      const validCells = Array.from(cellMap.entries()).filter(([key, data]) => {
        const nonZeroCount = data.series.filter(val => val > 0).length;
        return nonZeroCount >= 3;
      });

      console.log(`???좏슚??? ?? ${validCells.length}`);

      if (validCells.length === 0) {
        console.log("???덉륫???좏슚??????놁뒿?덈떎.");
        return;
      }

      // 5截뤴깵 Cloud Run API ?몄텧 以鍮?      const cells = validCells.map(([key, data]) => ({
        cell: key,
        lat: data.lat,
        lng: data.lng,
        series: data.series
      }));

      const forecastUrl = functions.config().forecast?.url;
      if (!forecastUrl) {
        throw new Error("Forecast API URL???ㅼ젙?섏? ?딆븯?듬땲??");
      }

      console.log(`?뙋 Cloud Run API ?몄텧: ${forecastUrl}`);

      // 6截뤴깵 Cloud Run API ?몄텧
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
        timeout: 60000 // 60珥???꾩븘??      });

      if (!response.ok) {
        throw new Error(`Forecast API ?몄텧 ?ㅽ뙣: ${response.status} ${response.statusText}`);
      }

      const forecastResult = await response.json();
      console.log(`?렞 ?덉륫 ?꾨즺: ${forecastResult.forecasts?.length || 0}媛??`);

      // 7截뤴깵 Firestore ???      const batch = db.batch();
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
          } catch (error) {
            console.error(`??? ${forecast.cell} ????ㅽ뙣:`, error);
            errorCount++;
          }
        }
      }

      await batch.commit();

      // 8截뤴깵 ?덉륫 濡쒓렇 ???      await db.collection("forecastLogs").add({
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
          totalCells: forecastResult.forecasts?.length || 0,
          averagePrediction: forecastResult.summary?.average_prediction || 0,
          maxPrediction: forecastResult.summary?.max_prediction || 0,
          successRate: forecastResult.summary?.success_rate || 0
        }
      });

      console.log(`???덉륫 ????꾨즺: ${targetKey}, ${savedCount}媛?? ???);

    } catch (error) {
      console.error("???쇱씪 ?덉륫 ?ㅻ쪟:", error);
      await logError("forecastDaily", error, { context: "daily_forecast" });
    }
  });

/**
 * ?섎룞 ?덉륫 ?ㅽ뻾 (?뚯뒪?몄슜)
 */
export const manualForecast = functions
  .region("asia-northeast3")
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', '?몄쬆???꾩슂?⑸땲??');
    }

    try {
      console.log("?뵰 ?섎룞 ?덉륫 ?쒖옉");

      const horizon = data.horizon || 1;
      const modelType = data.model_type || "auto";
      const confidenceLevel = data.confidence_level || 0.8;

      // 理쒓렐 30???곗씠???섏쭛
      const days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        return d.toISOString().slice(0, 10);
      });

      const cellMap = new Map<string, {
        lat: number;
        lng: number;
        series: number[];
      }>();

      for (const day of days) {
        try {
          const snap = await db.collection("dailyCounts")
            .doc(day)
            .collection("cells")
            .limit(50) // ?뚯뒪?몄슜?쇰줈 ?쒗븳
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
            
            const cellData = cellMap.get(key)!;
            while (cellData.series.length <= days.indexOf(day)) {
              cellData.series.push(0);
            }
            cellData.series[days.indexOf(day)] = data.total || 0;
          });
        } catch (error) {
          console.warn(`?좎쭨 ${day} ?곗씠???섏쭛 ?ㅽ뙣:`, error);
        }
      }

      // ?쒕━利?湲몄씠 ?뺢퇋??      cellMap.forEach((cellData) => {
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
          message: "?덉륫???좏슚??????놁뒿?덈떎." 
        };
      }

      const cells = validCells.slice(0, 20).map(([key, data]) => ({ // ?뚯뒪?몄슜?쇰줈 20媛??쒗븳
        cell: key,
        lat: data.lat,
        lng: data.lng,
        series: data.series
      }));

      const forecastUrl = functions.config().forecast?.url;
      if (!forecastUrl) {
        throw new Error("Forecast API URL???ㅼ젙?섏? ?딆븯?듬땲??");
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
        throw new Error(`Forecast API ?몄텧 ?ㅽ뙣: ${response.status}`);
      }

      const forecastResult = await response.json();

      return {
        success: true,
        message: "?섎룞 ?덉륫 ?꾨즺",
        result: {
          cellCount: validCells.length,
          forecastCount: forecastResult.forecasts?.length || 0,
          executionTime: forecastResult.execution_time || 0,
          summary: forecastResult.summary || {}
        },
        forecasts: forecastResult.forecasts || []
      };

    } catch (error) {
      console.error("?섎룞 ?덉륫 ?ㅻ쪟:", error);
      return { 
        success: false, 
        message: `?덉륫 ?ㅽ뙣: ${error.message}` 
      };
    }
  });

/**
 * ?덉륫 ?곗씠???뺣━ (二쇨컙 ?ㅽ뻾)
 */
export const cleanupForecasts = functions
  .region("asia-northeast3")
  .pubsub.schedule("0 2 * * 0") // 留ㅼ＜ ?쇱슂??02:00
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    console.log("?㏏ ?덉륫 ?곗씠???뺣━ ?쒖옉");

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // 30???댁쟾 ?곗씠???뺣━

      const cutoffKey = cutoffDate.toISOString().slice(0, 10);

      // ?ㅻ옒???덉륫 ?곗씠????젣
      const oldForecasts = await db.collection("forecasts")
        .where("date", "<", cutoffKey)
        .get();

      const batch = db.batch();
      oldForecasts.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      console.log(`???덉륫 ?곗씠???뺣━ ?꾨즺: ${oldForecasts.size}媛?臾몄꽌 ??젣`);

      // ?뺣━ 濡쒓렇 ???      await db.collection("cleanupLogs").add({
        type: "forecast_cleanup",
        deletedCount: oldForecasts.size,
        cutoffDate: cutoffKey,
        status: "completed",
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

    } catch (error) {
      console.error("???덉륫 ?곗씠???뺣━ ?ㅻ쪟:", error);
      await logError("cleanupForecasts", error, { context: "forecast_cleanup" });
    }
  });

/**
 * ?먮윭 濡쒓퉭 ?좏떥由ы떚
 */
async function logError(source: string, error: any, meta?: any) {
  try {
    await db.collection("errors").add({
      source,
      message: String(error?.message || error),
      stack: error?.stack || null,
      meta: meta ?? null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (logError) {
    console.error("?먮윭 濡쒓퉭 ?ㅽ뙣:", logError);
  }
}
