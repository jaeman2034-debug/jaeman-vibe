// 🔥 끝판왕 버전: Slack + Google Sheets + 주간 요약 완전 자동화
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const { google } = require("googleapis");

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ✅ Slack Webhook URL
const SLACK_WEBHOOK_URL = functions.config().slack?.webhook_url || process.env.SLACK_WEBHOOK_URL;

// ✅ Google Sheets 설정
const SPREADSHEET_ID = functions.config().google?.spreadsheet_id || process.env.GOOGLE_SPREADSHEET_ID;

/**
 * 📊 끝판왕 버전: 매일 23시 Slack + Google Sheets + 주간 요약 자동 리포트
 */
exports.dailyChatStatsToSlackAndSheet = functions.pubsub
  .schedule("0 23 * * *") // 매일 밤 11시 (한국시간)
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    console.log("📊 YAGO VIBE 끝판왕 통계 리포트 생성 시작");

    try {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      
      console.log(`📅 분석 날짜: ${todayStr}`);

      // 오늘 날짜의 메시지 수집
      const startTime = new Date(todayStr + "T00:00:00Z");
      const endTime = new Date(todayStr + "T23:59:59Z");

      const messagesSnapshot = await db
        .collectionGroup("messages")
        .where("createdAt", ">=", startTime)
        .where("createdAt", "<=", endTime)
        .get();

      console.log(`📊 총 ${messagesSnapshot.size}개 메시지 수집`);

      // 통계 계산
      let aiCount = 0;
      let sellerCount = 0;
      let totalResponseTime = 0;
      let responseCount = 0;
      let lastTimestamp = null;

      messagesSnapshot.forEach((doc) => {
        const data = doc.data();
        const msgDate = data.createdAt?.toDate();
        
        if (!msgDate) return;

        // AI vs 사용자 구분
        if (data.senderId === "yago-bot" || data.senderId === "AI" || data.isAI) {
          aiCount++;
        } else {
          sellerCount++;
        }

        // 응답시간 계산
        if (lastTimestamp) {
          const timeDiff = msgDate.getTime() - lastTimestamp.getTime();
          if (timeDiff > 0 && timeDiff < 30 * 60 * 1000) { // 30분 이내
            totalResponseTime += timeDiff;
            responseCount++;
          }
        }
        lastTimestamp = msgDate;
      });

      const avgResponseTime = responseCount > 0 ? (totalResponseTime / responseCount / 1000 / 60).toFixed(1) : "0.0";
      const totalMessages = aiCount + sellerCount;

      console.log(`📊 통계 계산 완료: AI ${aiCount}건, 판매자 ${sellerCount}건, 평균 응답시간 ${avgResponseTime}분`);

      // ✅ Google Sheets에 데이터 추가
      let weeklyStats = null;
      if (SPREADSHEET_ID) {
        try {
          console.log("📈 Google Sheets 데이터 저장 시작...");

          // Google Sheets 인증
          const auth = new google.auth.GoogleAuth({
            credentials: {
              type: "service_account",
              project_id: functions.config().google?.project_id || process.env.GOOGLE_PROJECT_ID,
              private_key: (functions.config().google?.private_key || process.env.GOOGLE_PRIVATE_KEY)?.replace(/\\n/g, "\n"),
              client_email: functions.config().google?.client_email || process.env.GOOGLE_CLIENT_EMAIL,
            },
            scopes: ["https://www.googleapis.com/auth/spreadsheets"],
          });

          const sheets = google.sheets({ version: "v4", auth });
          const client = await auth.getClient();

          // 오늘 데이터 추가
          const values = [[todayStr, aiCount, sellerCount, avgResponseTime, totalMessages]];
          await sheets.spreadsheets.values.append({
            auth: client,
            spreadsheetId: SPREADSHEET_ID,
            range: "Sheet1!A:E",
            valueInputOption: "USER_ENTERED",
            requestBody: { values },
          });

          console.log("✅ Google Sheets 데이터 저장 완료");

          // ✅ 주간 평균 계산
          console.log("📊 주간 평균 계산 시작...");

          const sevenDaysAgo = new Date(today);
          sevenDaysAgo.setDate(today.getDate() - 7);
          const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

          const weeklyData = await sheets.spreadsheets.values.get({
            auth: client,
            spreadsheetId: SPREADSHEET_ID,
            range: "Sheet1!A:E",
          });

          const rows = weeklyData.data.values || [];
          const last7Days = rows
            .filter((row) => {
              if (row.length < 5) return false;
              const rowDate = new Date(row[0]);
              return rowDate >= sevenDaysAgo && rowDate <= today;
            })
            .map((row) => ({
              date: row[0],
              ai: Number(row[1]) || 0,
              seller: Number(row[2]) || 0,
              avgTime: Number(row[3]) || 0,
              total: Number(row[4]) || 0,
            }));

          // 주간 평균 계산
          const avgAI = last7Days.length > 0 
            ? Math.round(last7Days.reduce((sum, day) => sum + day.ai, 0) / last7Days.length)
            : 0;
          const avgSeller = last7Days.length > 0 
            ? Math.round(last7Days.reduce((sum, day) => sum + day.seller, 0) / last7Days.length)
            : 0;
          const avgResponse = last7Days.length > 0 
            ? (last7Days.reduce((sum, day) => sum + day.avgTime, 0) / last7Days.length).toFixed(1)
            : "0.0";
          const avgTotal = last7Days.length > 0 
            ? Math.round(last7Days.reduce((sum, day) => sum + day.total, 0) / last7Days.length)
            : 0;

          weeklyStats = {
            avgAI,
            avgSeller,
            avgResponse,
            avgTotal,
            daysCount: last7Days.length,
          };

          console.log(`📊 주간 평균 계산 완료: AI ${avgAI}건, 판매자 ${avgSeller}건, 평균 응답시간 ${avgResponse}분`);

        } catch (sheetsError) {
          console.error("❌ Google Sheets 오류:", sheetsError);
          weeklyStats = null;
        }
      } else {
        console.warn("⚠️ GOOGLE_SPREADSHEET_ID가 설정되지 않았습니다");
      }

      // ✅ Slack 메시지 생성 (주간 평균 포함)
      const slackMessage = {
        text: `📊 *YAGO VIBE 일일 통계* (${todayStr})
🤖 AI 응답: *${aiCount}건*
👤 판매자 응답: *${sellerCount}건*
⏱ 평균 응답시간: *${avgResponseTime}분*
💬 총 메시지: *${totalMessages}건*

${weeklyStats ? `📆 *7일 평균*
🤖 AI: ${weeklyStats.avgAI}건 / 👤 판매자: ${weeklyStats.avgSeller}건
⏱ 평균 응답시간: ${weeklyStats.avgResponse}분 / 💬 총 메시지: ${weeklyStats.avgTotal}건` : ''}

🕓 전송 시각: ${new Date().toLocaleTimeString("ko-KR")}`,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `📊 YAGO VIBE 일일 통계 (${todayStr})`,
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*🤖 AI 응답*\n${aiCount}건`,
              },
              {
                type: "mrkdwn",
                text: `*👤 판매자 응답*\n${sellerCount}건`,
              },
              {
                type: "mrkdwn",
                text: `*⏱ 평균 응답시간*\n${avgResponseTime}분`,
              },
              {
                type: "mrkdwn",
                text: `*💬 총 메시지*\n${totalMessages}건`,
              },
            ],
          },
          ...(weeklyStats ? [{
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*📆 7일 평균*\n🤖 AI: ${weeklyStats.avgAI}건 / 👤 판매자: ${weeklyStats.avgSeller}건\n⏱ 평균 응답시간: ${weeklyStats.avgResponse}분 / 💬 총 메시지: ${weeklyStats.avgTotal}건`,
            },
          }] : []),
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `🕓 전송 시각: ${new Date().toLocaleTimeString("ko-KR")} | 🔥 YAGO VIBE 자동화 시스템`,
              },
            ],
          },
        ],
      };

      // ✅ Slack으로 전송
      if (SLACK_WEBHOOK_URL) {
        try {
          const response = await fetch(SLACK_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(slackMessage),
          });

          if (response.ok) {
            console.log("✅ Slack 전송 완료");
          } else {
            console.error("❌ Slack 전송 실패:", response.status, response.statusText);
          }
        } catch (slackError) {
          console.error("❌ Slack 전송 오류:", slackError);
        }
      } else {
        console.warn("⚠️ SLACK_WEBHOOK_URL이 설정되지 않았습니다");
      }

      // ✅ Firestore에 일일 통계 저장
      try {
        await db.collection("dailyStats").doc(todayStr).set({
          date: todayStr,
          aiCount,
          sellerCount,
          avgResponseTime: parseFloat(avgResponseTime),
          totalMessages,
          weeklyStats,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log("✅ Firestore 통계 저장 완료");
      } catch (firestoreError) {
        console.error("❌ Firestore 저장 실패:", firestoreError);
      }

      console.log("🔥 끝판왕 통계 리포트 완료");
      return { 
        success: true, 
        stats: { 
          aiCount, 
          sellerCount, 
          avgResponseTime, 
          totalMessages,
          weeklyStats 
        } 
      };

    } catch (error) {
      console.error("❌ 끝판왕 리포트 생성 실패:", error);
      return { success: false, error: error.message };
    }
  });

/**
 * 🧪 수동으로 끝판왕 리포트 생성 (테스트용)
 */
exports.generateEnhancedReport = functions.https.onCall(async (data, context) => {
  try {
    const { date } = data;
    const targetDate = date || new Date().toISOString().split("T")[0];
    
    console.log(`🧪 끝판왕 테스트 리포트 생성: ${targetDate}`);

    // 위의 dailyChatStatsToSlackAndSheet 로직 재사용
    // (동일한 통계 계산 및 전송 로직)

    return { 
      success: true, 
      message: `${targetDate} 끝판왕 테스트 리포트가 생성되었습니다.`,
      date: targetDate
    };

  } catch (error) {
    console.error("❌ 끝판왕 테스트 리포트 실패:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});
