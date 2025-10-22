// 🔥 AI 리포트 Firestore 저장 함수
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Firebase Admin 초기화
admin.initializeApp();

const db = admin.firestore();

// AI 리포트를 Firestore에 저장하는 함수
exports.saveAIReport = functions.https.onRequest(async (req, res) => {
  // CORS 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { summary, kpis, date } = req.body;

    if (!summary) {
      res.status(400).send('Summary is required');
      return;
    }

    const today = date || new Date().toISOString().split('T')[0];
    
    // AI 리포트 데이터 구조
    const reportData = {
      summary: summary,
      kpis: kpis || [
        { label: "신규 가입", value: 0 },
        { label: "거래량", value: 0 },
        { label: "응답률", value: "0%" },
        { label: "활성 사용자", value: 0 }
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      date: today,
      type: 'daily-report'
    };

    // Firestore에 저장
    const docRef = await db.collection('adminReports').doc(today).set(reportData);
    
    console.log('✅ AI 리포트 저장 완료:', today);

    // 응답
    res.status(200).json({
      success: true,
      message: 'AI 리포트가 저장되었습니다',
      documentId: today,
      data: reportData
    });

  } catch (error) {
    console.error('❌ AI 리포트 저장 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 최신 AI 리포트 조회 함수
exports.getLatestAIReport = functions.https.onCall(async (data, context) => {
  try {
    const snapshot = await db
      .collection('adminReports')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return {
        success: false,
        message: '저장된 리포트가 없습니다'
      };
    }

    const latestReport = snapshot.docs[0].data();
    
    return {
      success: true,
      report: latestReport
    };

  } catch (error) {
    console.error('❌ AI 리포트 조회 실패:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
