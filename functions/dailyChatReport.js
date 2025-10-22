// 📊 일일 AI 채팅 통계 자동 보고서 (Slack)
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const fetch = require("node-fetch");

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Slack Webhook URL
const SLACK_WEBHOOK_URL = functions.config().slack?.webhook_url || process.env.SLACK_WEBHOOK_URL;

/**
 * 📊 일일 AI 채팅 통계 자동 보고서 (매일 23시 실행)
 */
exports.dailyChatReport = functions.pubsub
  .schedule("0 23 * * *") // 매일 23시 (한국시간)
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    console.log("📊 YAGO VIBE 일일 통계 리포트 실행 시작");
    try {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      
      console.log(`📅 분석 날짜: ${todayStr}`);

      // 모든 메시지 수집 (오늘 하루)
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

      const dailyStats = {};

      messagesSnapshot.forEach((doc) => {
        const msg = doc.data();
        const msgDate = msg.createdAt?.toDate();
        
        if (!msgDate) return;

        const dateKey = msgDate.toISOString().split("T")[0];
        
        if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = { ai: 0, seller: 0, total: 0 };
        }

        dailyStats[dateKey].total++;

        // AI vs 판매자 구분
        if (msg.senderId === "yago-bot" || msg.senderId === "AI" || msg.isAI) {
          dailyStats[dateKey].ai++;
          aiCount++;
        } else {
          dailyStats[dateKey].seller++;
          sellerCount++;
        }

        // 응답시간 계산
        if (lastTimestamp) {
          const timeDiff = msgDate.getTime() - lastTimestamp.getTime();
          if (timeDiff > 0 && timeDiff < 30 * 60 * 1000) { // 30분 이내 응답만
            totalResponseTime += timeDiff;
            responseCount++;
          }
        }
        lastTimestamp = msgDate;
      });

      const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount / 1000 / 60) : 0;
      const totalMessages = aiCount + sellerCount;

      // AI 응답률 계산
      const aiResponseRate = totalMessages > 0 ? ((aiCount / totalMessages) * 100).toFixed(1) : 0;

      console.log(`📊 통계 계산 완료: AI ${aiCount}건, 판매자 ${sellerCount}건, 평균 응답시간 ${avgResponseTime}분`);

      // Slack 메시지 생성 (간단한 텍스트 형태)
      const slackMessage = {
        text: `📊 *YAGO VIBE AI 응답 리포트* (${todayStr})
🤖 AI 응답: *${aiCount}건*
👤 판매자 응답: *${sellerCount}건*
⏱ 평균 응답시간: *${avgResponseTime}분*
🕓 전송 시각: ${new Date().toLocaleTimeString("ko-KR")}`,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `📊 YAGO VIBE AI 응답 리포트 (${todayStr})`,
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*📅 분석 날짜*\n${todayStr}`,
              },
              {
                type: "mrkdwn",
                text: `*🤖 AI 응답 수*\n${aiCount.toLocaleString()}건`,
              },
              {
                type: "mrkdwn",
                text: `*👤 판매자 응답 수*\n${sellerCount.toLocaleString()}건`,
              },
              {
                type: "mrkdwn",
                text: `*💬 총 메시지 수*\n${totalMessages.toLocaleString()}건`,
              },
              {
                type: "mrkdwn",
                text: `*⏱️ 평균 응답시간*\n${avgResponseTime}분`,
              },
              {
                type: "mrkdwn",
                text: `*📈 AI 응답률*\n${aiResponseRate}%`,
              },
            ],
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*📊 주요 지표*\n• AI가 전체 응답의 ${aiResponseRate}%를 처리했습니다\n• 평균 응답시간은 ${avgResponseTime}분입니다\n• 총 ${totalMessages}건의 메시지가 교환되었습니다`,
            },
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `🤖 YAGO VIBE AI 시스템 | 자동 생성된 일일 보고서`,
              },
            ],
          },
        ],
      };

      // Slack으로 전송
      if (SLACK_WEBHOOK_URL) {
        try {
          const response = await fetch(SLACK_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(slackMessage),
          });

          if (response.ok) {
            console.log("✅ Slack 보고서 전송 완료");
          } else {
            console.error("❌ Slack 전송 실패:", response.status, response.statusText);
          }
        } catch (slackError) {
          console.error("❌ Slack 전송 오류:", slackError);
        }
      } else {
        console.warn("⚠️ SLACK_WEBHOOK_URL이 설정되지 않았습니다");
      }

      // Firestore에 일일 통계 저장 (선택사항)
      try {
        await db.collection("dailyStats").doc(todayStr).set({
          date: todayStr,
          aiCount,
          sellerCount,
          totalMessages,
          avgResponseTime,
          aiResponseRate: parseFloat(aiResponseRate),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log("✅ 일일 통계 Firestore 저장 완료");
      } catch (firestoreError) {
        console.error("❌ Firestore 저장 실패:", firestoreError);
      }

      console.log("📊 일일 AI 채팅 통계 보고서 완료");
      return { success: true, stats: { aiCount, sellerCount, totalMessages, avgResponseTime } };

    } catch (error) {
      console.error("❌ 일일 보고서 생성 실패:", error);
      return { success: false, error: error.message };
    }
  });

/**
 * 🧪 수동으로 일일 보고서 생성 (테스트용)
 */
exports.generateDailyReport = functions.https.onCall(async (data, context) => {
  try {
    const { date } = data;
    const targetDate = date || new Date().toISOString().split("T")[0];
    
    console.log(`🧪 수동 보고서 생성: ${targetDate}`);

    // 오늘 날짜의 메시지 수집
    const startTime = new Date(targetDate + "T00:00:00Z");
    const endTime = new Date(targetDate + "T23:59:59Z");

    const messagesSnapshot = await db
      .collectionGroup("messages")
      .where("createdAt", ">=", startTime)
      .where("createdAt", "<=", endTime)
      .get();

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
        if (timeDiff > 0 && timeDiff < 30 * 60 * 1000) {
          totalResponseTime += timeDiff;
          responseCount++;
        }
      }
      lastTimestamp = msgDate;
    });

    const avgResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount / 1000 / 60) : 0;
    const totalMessages = aiCount + sellerCount;

    // Slack으로 전송
    if (SLACK_WEBHOOK_URL) {
      const slackMessage = {
        text: `🧪 *테스트 리포트* (${targetDate})
🤖 AI 응답: *${aiCount}건*
👤 판매자 응답: *${sellerCount}건*
⏱ 평균 응답시간: *${avgResponseTime}분*
📊 총 메시지: *${totalMessages}건*`,
      };

      await fetch(SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slackMessage),
      });
    }

    return { 
      success: true, 
      message: `${targetDate} 일일 보고서가 생성되었습니다.`,
      date: targetDate,
      stats: { aiCount, sellerCount, avgResponseTime, totalMessages }
    };

  } catch (error) {
    console.error("❌ 수동 보고서 생성 실패:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});
