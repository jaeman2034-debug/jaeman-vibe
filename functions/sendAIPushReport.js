// 🔥 AI 푸시 리포트 자동 발송 시스템 - Firebase Functions
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Firebase Admin 초기화
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// 매일 AI 요약 리포트를 발송 (오전 8시)
exports.sendDailyReport = functions.pubsub
  .schedule("0 8 * * *") // 매일 오전 8시
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    console.log('🔥 AI 일일 리포트 자동 발송 시작');

    try {
      // 1. Firestore에서 최신 요약 가져오기
      const snapshot = await db
        .collection("adminReports")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      let summary = "오늘의 리포트 데이터를 찾을 수 없습니다.";
      let kpis = [];

      if (!snapshot.empty) {
        const latest = snapshot.docs[0].data();
        summary = latest.summary || summary;
        kpis = latest.kpis || [];
      }

      // 2. 관리자 FCM 토큰 가져오기
      const tokenRef = db.collection('adminFCMTokens').doc('admin');
      const tokenSnap = await tokenRef.get();
      
      if (!tokenSnap.exists) {
        console.log('❌ 관리자 FCM 토큰이 없습니다.');
        return null;
      }
      
      const fcmToken = tokenSnap.data().token;
      
      // 3. FCM 메시지 생성
      const payload = {
        notification: {
          title: "📊 오늘의 AI 리포트",
          body: summary.slice(0, 100) + "...",
        },
        data: {
          url: "/admin/home?autoplay=tts",
          type: 'ai-report',
          summary: summary,
          timestamp: Date.now().toString()
        },
        token: fcmToken,
        webpush: {
          notification: {
            title: "📊 오늘의 AI 리포트",
            body: summary.slice(0, 100) + "...",
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-96.png',
            tag: 'ai-report',
            requireInteraction: true,
            actions: [
              {
                action: 'listen',
                title: '🔊 듣기',
                icon: '/icons/icon-96.png'
              },
              {
                action: 'view',
                title: '📱 보기',
                icon: '/icons/icon-96.png'
              }
            ]
          }
        }
      };

      // 4. FCM 발송
      const response = await messaging.send(payload);
      console.log("✅ FCM 발송 완료:", response);

      return { success: true, response };

    } catch (error) {
      console.error('❌ AI 일일 리포트 발송 실패:', error);
      return null;
    }
  });

// FCM 토큰 구독 함수
exports.subscribeAdmin = functions.https.onCall(async (data, context) => {
  const { token } = data;
  if (!token) throw new functions.https.HttpsError("invalid-argument", "token 필요");

  await messaging.subscribeToTopic(token, "adminReport");
  return { success: true };
});

// 수동 발송 함수 (테스트용)
exports.sendTestAIPushReport = functions.https.onCall(async (data, context) => {
  // 관리자만 호출 가능
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', '관리자만 호출 가능합니다.');
  }

  try {
    const db = admin.firestore();
    
    // 관리자 FCM 토큰 가져오기
    const tokenRef = db.collection('adminFCMTokens').doc('admin');
    const tokenSnap = await tokenRef.get();
    
    if (!tokenSnap.exists) {
      throw new functions.https.HttpsError('not-found', '관리자 FCM 토큰이 없습니다.');
    }
    
    const fcmToken = tokenSnap.data().token;
    
    // 테스트 메시지
    const testMessage = {
      notification: {
        title: '🧪 AI 리포트 테스트',
        body: '테스트 푸시 알림입니다. 클릭하면 TTS가 자동 재생됩니다! 🔊'
      },
      data: {
        url: '/admin/home?autoplay=tts',
        type: 'test',
        timestamp: Date.now().toString()
      },
      token: fcmToken
    };

    const response = await admin.messaging().send(testMessage);
    console.log('✅ 테스트 AI 푸시 리포트 발송 성공:', response);
    
    return { success: true, response };
    
  } catch (error) {
    console.error('❌ 테스트 AI 푸시 리포트 발송 실패:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
