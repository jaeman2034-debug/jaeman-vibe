import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Firebase Admin 초기화 (functions/index.ts에서 처리)
// admin.initializeApp();

interface AnalysisRequest {
  imageUrl: string;
  productId: string;
}

interface AnalysisResponse {
  category: string;
  condition: 'new' | 'good' | 'fair' | 'poor';
  priceEstimate: { low: number; high: number; currency: 'KRW' };
  authenticityScore: number; // 0~1
  riskFlags: string[];
  tags: string[];
}

// AI 분석 함수 (Cloud Run 또는 외부 AI 서비스 연동)
async function analyzeImage(imageUrl: string): Promise<AnalysisResponse> {
  // TODO: 실제 AI 분석 로직 구현
  // 1. Google Cloud Vision API
  // 2. 자체 AI 모델 (TensorFlow.js, ONNX 등)
  // 3. 외부 AI 서비스 (OpenAI, Azure 등)
  
  // 임시 Mock 응답
  return {
    category: '가방',
    condition: 'good',
    priceEstimate: { low: 30000, high: 35000, currency: 'KRW' },
    authenticityScore: 0.82,
    riskFlags: [],
    tags: ['가죽', '블랙', '캐주얼']
  };
}

// HTTP 함수로 AI 분석 API 제공
export const analyze = functions.https.onRequest(async (req, res) => {
  // CORS 설정
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { imageUrl, productId }: AnalysisRequest = req.body;

    if (!imageUrl || !productId) {
      res.status(400).json({ error: 'imageUrl과 productId가 필요합니다.' });
      return;
    }

    console.log(`[ANALYZE] 분석 시작: ${productId}, 이미지: ${imageUrl}`);

    // AI 분석 실행
    const analysisResult = await analyzeImage(imageUrl);

    // Firestore에 분석 결과 저장
    try {
      await admin.firestore()
        .collection('market')
        .doc(productId)
        .update({
          analysis: analysisResult,
          analyzedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      
      console.log(`[ANALYZE] 결과 저장 완료: ${productId}`);
    } catch (dbError) {
      console.error(`[ANALYZE] DB 저장 실패: ${productId}`, dbError);
      // DB 저장 실패해도 분석 결과는 반환
    }

    // 분석 결과 반환
    res.status(200).json(analysisResult);

  } catch (error) {
    console.error('[ANALYZE] 오류:', error);
    res.status(500).json({ 
      error: '분석 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Callable 함수로도 제공 (클라이언트에서 더 안전하게 호출)
export const analyzeCallable = functions.https.onCall(async (data: AnalysisRequest, context) => {
  // 인증 확인
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  const { imageUrl, productId } = data;

  if (!imageUrl || !productId) {
    throw new functions.https.HttpsError('invalid-argument', 'imageUrl과 productId가 필요합니다.');
  }

  try {
    console.log(`[ANALYZE] Callable 분석 시작: ${productId}`);

    // AI 분석 실행
    const analysisResult = await analyzeImage(imageUrl);

    // Firestore에 분석 결과 저장
    await admin.firestore()
      .collection('market')
      .doc(productId)
      .update({
        analysis: analysisResult,
        analyzedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    return analysisResult;

  } catch (error) {
    console.error('[ANALYZE] Callable 오류:', error);
    throw new functions.https.HttpsError('internal', '분석 중 오류가 발생했습니다.');
  }
});
