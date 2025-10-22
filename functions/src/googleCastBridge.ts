/**
 * ?렒 Google Cast Bridge - ?ㅻ쭏???ㅽ뵾而??곕룞
 * n8n ??HTTP ?붿껌 ??Google Nest/Chromecast濡??뚯꽦 ?ъ깮
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Firestore ?몄뒪?댁뒪
const db = admin.firestore();

// 罹먯뒪??媛?ν븳 ?ㅽ뵾而?紐⑸줉 (?ㅼ젣 ?섍꼍?먯꽌 ?ㅼ젙)
const CAST_SPEAKERS = {
  "living_room": "192.168.1.100", // 嫄곗떎 Google Nest
  "bedroom": "192.168.1.101",     // 移⑥떎 Google Home
  "kitchen": "192.168.1.102"      // 二쇰갑 Google Mini
};

export const googleCastLatest = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    // CORS ?ㅼ젙
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
          error: "吏?먰븯吏 ?딅뒗 ?ㅽ뵾而ㅼ엯?덈떎",
          available: Object.keys(CAST_SPEAKERS)
        });
        return;
      }

      console.log(`?렒 ${speaker} ?ㅽ뵾而?${speakerIP})濡?釉뚮━???ъ깮 ?붿껌`);

      // 理쒖떊 由ы룷??議고쉶
      const snapshot = await db
        .collection("ai_voice_reports")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      if (snapshot.empty) {
        res.status(404).json({
          error: "?ъ깮??釉뚮━?묒씠 ?놁뒿?덈떎"
        });
        return;
      }

      const latestReport = snapshot.docs[0].data();
      const audioUrl = latestReport.audioUrl;

      if (!audioUrl) {
        res.status(404).json({
          error: "?ㅻ뵒???뚯씪??以鍮꾨릺吏 ?딆븯?듬땲??
        });
        return;
      }

      // 濡쒖뺄 罹먯뒪??釉뚮┸吏濡??꾨떖
      const castResult = await castToSpeaker(speakerIP, audioUrl, latestReport);

      if (castResult.success) {
        res.json({
          success: true,
          message: `${speaker} ?ㅽ뵾而ㅼ뿉??釉뚮━?묒쓣 ?ъ깮?⑸땲??,
          audioUrl: audioUrl,
          speaker: speaker,
          speakerIP: speakerIP,
          reportTitle: latestReport.summary?.slice(0, 50) + "..."
        });
      } else {
        res.status(500).json({
          error: "?ㅽ뵾而??ъ깮 ?ㅽ뙣",
          details: castResult.error
        });
      }
    } catch (error) {
      console.error("??Google Cast ?ㅻ쪟:", error);
      res.status(500).json({
        error: "?ㅽ뵾而??곕룞 ?ㅻ쪟",
        details: error.message
      });
    }
  });

// ?렦 ?ㅽ뵾而ㅻ줈 罹먯뒪?명븯???⑥닔
async function castToSpeaker(speakerIP: string, audioUrl: string, reportData: any): Promise<{success: boolean, error?: string}> {
  try {
    // ?ㅼ젣 援ы쁽?먯꽌??濡쒖뺄 罹먯뒪??釉뚮┸吏 ?쒕퉬?ㅻ줈 HTTP ?붿껌
    // ?ш린?쒕뒗 ?쒕??덉씠??    console.log(`?렦 ${speakerIP}濡?罹먯뒪?? ${audioUrl}`);
    
    // 濡쒖뺄 釉뚮┸吏 ?쒕퉬???몄텧 (?ㅼ젣 ?섍꼍?먯꽌 援ы쁽)
    const bridgeUrl = `http://localhost:3001/cast`;
    const castRequest = {
      speakerIP: speakerIP,
      audioUrl: audioUrl,
      metadata: {
        title: "?렒 YAGO 釉뚮━??,
        subtitle: reportData.summary?.slice(0, 100) || "AI ?뚯꽦 由ы룷??,
        albumArt: "https://yago-vibe.firebaseapp.com/icon-512.png"
      }
    };

    // ?ㅼ젣 援ы쁽?먯꽌??fetch濡?濡쒖뺄 釉뚮┸吏 ?몄텧
    // const response = await fetch(bridgeUrl, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(castRequest)
    // });

    // ?쒕??덉씠???묐떟
    return {
      success: true
    };
  } catch (error) {
    console.error("罹먯뒪???ㅻ쪟:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// ?벑 Android App Shortcut ?곕룞
export const androidAppShortcut = functions
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
      // 理쒖떊 由ы룷??議고쉶
      const snapshot = await db
        .collection("ai_voice_reports")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      if (snapshot.empty) {
        res.json({
          success: false,
          message: "?ъ깮??釉뚮━?묒씠 ?놁뒿?덈떎",
          autoPlay: false
        });
        return;
      }

      const latestReport = snapshot.docs[0].data();

      res.json({
        success: true,
        message: "釉뚮━?묒쓣 遺덈윭?붿뒿?덈떎",
        autoPlay: true,
        report: {
          id: snapshot.docs[0].id,
          title: latestReport.summary?.slice(0, 50) + "..." || "AI ?뚯꽦 由ы룷??,
          audioUrl: latestReport.audioUrl,
          pdfUrl: latestReport.pdfUrl,
          date: latestReport.reportDate || latestReport.createdAt?.toDate?.()?.toISOString(),
          totalCount: latestReport.stats?.totalCount || 0,
          totalValue: latestReport.stats?.totalValue || 0,
          topArea: latestReport.stats?.topArea || "?뺣낫 ?놁쓬"
        }
      });
    } catch (error) {
      console.error("??Android Shortcut ?ㅻ쪟:", error);
      res.status(500).json({
        success: false,
        error: "釉뚮━?묒쓣 遺덈윭?ㅻ뒗 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎"
      });
    }
  });

// ?뵒 Google Home 猷⑦떞 ?몃━嫄?export const googleHomeRoutine = functions
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
      const { action = "play_latest" } = req.body;

      switch (action) {
        case "play_latest":
          // 理쒖떊 釉뚮━???ъ깮
          const result = await googleCastLatest(req, res);
          return result;

        case "play_yesterday":
          // ?댁젣 釉뚮━???ъ깮
          const yesterdayResult = await playYesterdayBriefing(req, res);
          return yesterdayResult;

        case "get_summary":
          // ?붿빟 ?뺣낫留?諛섑솚
          const summaryResult = await getBriefingSummary(req, res);
          return summaryResult;

        default:
          res.status(400).json({
            error: "吏?먰븯吏 ?딅뒗 ?≪뀡?낅땲??,
            supported: ["play_latest", "play_yesterday", "get_summary"]
          });
      }
    } catch (error) {
      console.error("??Google Home 猷⑦떞 ?ㅻ쪟:", error);
      res.status(500).json({
        error: "猷⑦떞 ?ㅽ뻾 ?ㅻ쪟",
        details: error.message
      });
    }
  });

// ?댁젣 釉뚮━???ъ깮
async function playYesterdayBriefing(req: any, res: any) {
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
    res.json({
      success: false,
      message: "?댁젣 ?앹꽦??釉뚮━?묒씠 ?놁뒿?덈떎"
    });
    return;
  }

  const yesterdayReport = snapshot.docs[0].data();
  const audioUrl = yesterdayReport.audioUrl;

  if (!audioUrl) {
    res.json({
      success: false,
      message: "?댁젣 釉뚮━?묒쓽 ?ㅻ뵒???뚯씪??以鍮꾨릺吏 ?딆븯?듬땲??
    });
    return;
  }

  const { speaker = "living_room" } = req.body;
  const speakerIP = CAST_SPEAKERS[speaker];
  
  const castResult = await castToSpeaker(speakerIP, audioUrl, yesterdayReport);

  if (castResult.success) {
    res.json({
      success: true,
      message: `?댁젣 釉뚮━?묒쓣 ${speaker} ?ㅽ뵾而ㅼ뿉???ъ깮?⑸땲??,
      audioUrl: audioUrl,
      speaker: speaker
    });
  } else {
    res.status(500).json({
      error: "?댁젣 釉뚮━???ъ깮 ?ㅽ뙣",
      details: castResult.error
    });
  }
}

// 釉뚮━???붿빟 ?뺣낫 諛섑솚
async function getBriefingSummary(req: any, res: any) {
  const snapshot = await db
    .collection("ai_voice_reports")
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) {
    res.json({
      success: false,
      message: "釉뚮━???뺣낫媛 ?놁뒿?덈떎"
    });
    return;
  }

  const latestReport = snapshot.docs[0].data();
  
  res.json({
    success: true,
    summary: {
      title: "?렒 YAGO 釉뚮━??,
      date: latestReport.reportDate || "?ㅻ뒛",
      totalCount: latestReport.stats?.totalCount || 0,
      totalValue: latestReport.stats?.totalValue || 0,
      topArea: latestReport.stats?.topArea || "?뺣낫 ?놁쓬",
      hasAudio: !!latestReport.audioUrl,
      hasPDF: !!latestReport.pdfUrl
    }
  });
}
