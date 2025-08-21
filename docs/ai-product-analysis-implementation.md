# AI 상품분석 구현 가이드 🚀

## 📋 개요

이 문서는 AI 상품분석 기능의 구현 방법과 Cloud Functions를 통한 실제 AI 모델 연동 방법을 설명합니다.

## 🎯 구현 목표

### **1. 구조화된 상품 정보 추출**
- **카테고리**: 축구화, 유니폼, 보호장비 등
- **브랜드**: NIKE, Adidas, Puma 등
- **모델**: Mercurial Vapor 13 Elite, Predator FG 등
- **색상**: 블랙/골드, 화이트, 레드 등
- **사이즈**: 270mm, L, M 등

### **2. 상태 등급 및 품질 평가**
- **A 등급**: 최상 - 새상품에 가까운 상태
- **B 등급**: 상 - 사용감이 있지만 깨끗한 상태
- **C 등급**: 하 - 사용감이 많고 마모가 심한 상태
- **결함 포인트**: 구체적인 마모/오염/손상 지점

### **3. AI 생성 콘텐츠**
- **자동 제목**: 브랜드 + 모델 + 색상 + 사이즈 + 카테고리
- **상품 설명**: 특징과 장점을 포함한 상세 설명
- **해시태그**: 검색 최적화를 위한 관련 키워드

### **4. OCR 및 AI 분석**
- **라벨 텍스트**: 상품명, 모델명, 사이즈 등
- **상자 정보**: 제조국, 재질, 주의사항 등
- **품질 점수**: AI가 평가한 상품 상태 점수
- **신뢰도**: 분석 결과의 정확도

## 🛠️ 구현 선택지

### **1. 클라우드 LLM 비전 (권장)**

#### **Google Gemini 1.5 Pro Vision**
```typescript
// Cloud Functions에서 호출
const analyzeWithGemini = async (images: Buffer[]) => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-vision" });
  
  const prompt = `
    다음 이미지를 분석하여 상품 정보를 추출해주세요:
    
    요구사항:
    1. 카테고리 (축구화, 유니폼, 보호장비 등)
    2. 브랜드 (NIKE, Adidas 등)
    3. 모델명 (정확한 모델명)
    4. 색상 (주요 색상)
    5. 사이즈 (숫자 또는 문자)
    6. 상태 등급 (A: 최상, B: 상, C: 하)
    7. 결함/특징 (구체적인 마모, 오염, 손상 지점)
    8. 제안 제목 (브랜드 + 모델 + 색상 + 사이즈 + 카테고리)
    9. 제안 설명 (상품 특징과 장점)
    10. 태그 (검색용 키워드)
    
    JSON 형식으로 응답해주세요.
  `;
  
  const imageParts = images.map(img => ({
    inlineData: { data: img.toString('base64'), mimeType: 'image/jpeg' }
  }));
  
  const result = await model.generateContent([prompt, ...imageParts]);
  const response = await result.response;
  const text = response.text();
  
  // JSON 파싱 및 반환
  return JSON.parse(text);
};
```

#### **OpenAI GPT-4o-mini Vision**
```typescript
// Cloud Functions에서 호출
const analyzeWithOpenAI = async (images: Buffer[]) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  const prompt = `
    다음 이미지를 분석하여 상품 정보를 추출해주세요.
    
    응답 형식:
    {
      "category": "카테고리",
      "brand": "브랜드",
      "model": "모델명",
      "color": "색상",
      "size": "사이즈",
      "condition": "A|B|C",
      "defects": ["결함1", "결함2"],
      "suggestedTitle": "제안 제목",
      "suggestedDescription": "제안 설명",
      "tags": ["태그1", "태그2"],
      "quality_score": 0.88,
      "confidence": 0.92
    }
  `;
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          ...images.map(img => ({
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${img.toString('base64')}`
            }
          }))
        ]
      }
    ],
    max_tokens: 1000,
    temperature: 0.1
  });
  
  const content = response.choices[0].message.content;
  return JSON.parse(content);
};
```

### **2. 온디바이스 경량 모델 (보조)**

#### **TensorFlow.js MobileNet**
```typescript
// 클라이언트에서 실행
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow/tfjs-models/mobilenet';

const analyzeWithMobileNet = async (imageElement: HTMLImageElement) => {
  // MobileNet 모델 로드
  const model = await mobilenet.load();
  
  // 이미지 분류
  const predictions = await model.classify(imageElement);
  
  // 상위 5개 예측 결과
  return predictions.slice(0, 5).map(p => ({
    className: p.className,
    probability: p.probability
  }));
};
```

#### **ONNX Runtime Web CLIP**
```typescript
// 클라이언트에서 실행
import { InferenceSession, Tensor } from 'onnxruntime-web';

const analyzeWithCLIP = async (imageElement: HTMLImageElement) => {
  // CLIP 모델 로드
  const session = await InferenceSession.create('./models/clip.onnx');
  
  // 이미지 전처리
  const imageTensor = preprocessImage(imageElement);
  
  // 특징 추출
  const features = await session.run({
    'input': imageTensor
  });
  
  // 텍스트와 이미지 유사도 계산
  const textFeatures = await extractTextFeatures();
  const similarity = calculateSimilarity(features, textFeatures);
  
  return similarity;
};
```

## 🔧 Cloud Functions 구현

### **1. 함수 구조**
```typescript
// functions/src/ai/analyzeProduct.ts
import * as functions from 'firebase-functions';
import { analyzeWithGemini } from './gemini';
import { analyzeWithOpenAI } from './openai';
import { extractOCR } from './ocr';
import { generateEmbedding } from './embedding';

export const analyzeProduct = functions.https.onCall(async (data, context) => {
  // 인증 확인
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
  }
  
  try {
    const { images, analysisType = 'gemini' } = data;
    
    // 이미지 검증
    if (!images || images.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', '이미지가 필요합니다.');
    }
    
    // 이미지를 Buffer로 변환
    const imageBuffers = images.map((img: string) => Buffer.from(img, 'base64'));
    
    // AI 분석 실행
    let analysis;
    switch (analysisType) {
      case 'gemini':
        analysis = await analyzeWithGemini(imageBuffers);
        break;
      case 'openai':
        analysis = await analyzeWithOpenAI(imageBuffers);
        break;
      default:
        throw new functions.https.HttpsError('invalid-argument', '지원하지 않는 분석 타입입니다.');
    }
    
    // OCR 텍스트 추출 (추가)
    const ocrResults = await Promise.all(
      imageBuffers.map(img => extractOCR(img))
    );
    analysis.ai.ocr = ocrResults.flat();
    
    // 임베딩 생성 (선택사항)
    if (data.generateEmbedding) {
      analysis.ai.embedding = await generateEmbedding(analysis);
    }
    
    return {
      success: true,
      data: analysis
    };
    
  } catch (error) {
    console.error('AI 분석 실패:', error);
    throw new functions.https.HttpsError('internal', 'AI 분석 중 오류가 발생했습니다.');
  }
});
```

### **2. OCR 텍스트 추출**
```typescript
// functions/src/ai/ocr.ts
import { ImageAnnotatorClient } from '@google-cloud/vision';

const client = new ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

export const extractOCR = async (imageBuffer: Buffer): Promise<string[]> => {
  try {
    const [result] = await client.textDetection(imageBuffer);
    const detections = result.textAnnotations;
    
    if (!detections || detections.length === 0) {
      return [];
    }
    
    // 첫 번째 요소는 전체 텍스트, 나머지는 개별 단어
    const texts = detections.slice(1).map(text => text.description || '');
    
    // 의미있는 텍스트만 필터링
    return texts.filter(text => 
      text.length > 1 && 
      /[A-Za-z0-9가-힣]/.test(text)
    );
    
  } catch (error) {
    console.error('OCR 추출 실패:', error);
    return [];
  }
};
```

### **3. 임베딩 생성**
```typescript
// functions/src/ai/embedding.ts
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

export const generateEmbedding = async (analysis: any): Promise<number[]> => {
  try {
    // 상품 정보를 텍스트로 결합
    const text = `
      카테고리: ${analysis.category}
      브랜드: ${analysis.brand}
      모델: ${analysis.model}
      색상: ${analysis.color}
      사이즈: ${analysis.size}
      상태: ${analysis.condition}
      결함: ${analysis.defects.join(', ')}
      설명: ${analysis.suggestedDescription}
      태그: ${analysis.tags.join(', ')}
    `;
    
    // 임베딩 생성
    const result = await embeddings.embedQuery(text);
    return result;
    
  } catch (error) {
    console.error('임베딩 생성 실패:', error);
    return [];
  }
};
```

## 📊 저장 스키마

### **1. Firestore 문서 구조**
```typescript
// market_items/{id}
{
  // 기본 정보
  title: "NIKE 머큐리얼 베이퍼 13 엘리트 블랙/골드 축구화 270mm",
  description: "프로 선수들이 사용하는 프리미엄 축구화입니다...",
  price: 180000,
  images: ["https://...", "https://..."],
  ownerId: "user123",
  createdAt: Timestamp,
  status: "active",
  category: "축구화",
  region: "서울",
  
  // 구조화된 속성
  brand: "NIKE",
  model: "Mercurial Vapor 13 Elite",
  color: "블랙/골드",
  size: "270mm",
  
  // 상태 및 품질
  condition: "B",
  defects: ["발끝 약간 마모", "뒤축 오염", "전반적으로 깨끗함"],
  
  // AI 분석 결과
  ai: {
    quality_score: 0.88,
    confidence: 0.92,
    tags: ["축구화", "NIKE", "머큐리얼", "베이퍼13", "엘리트", "FG", "270mm", "블랙", "골드", "중고"],
    ocr: ["NIKE", "Mercurial Vapor 13 Elite", "FG 270mm", "Made in Vietnam"],
    embedding: [0.1, 0.2, 0.3, 0.4, 0.5] // 1536차원 벡터
  },
  
  // 지리 정보
  geo: {
    latitude: 37.5665,
    longitude: 126.9780,
    geohash: "wxs7v",
    region: "서울"
  }
}
```

### **2. 인덱스 설정**
```typescript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "market_items",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "market_items",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "geo.geohash", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "market_items",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ai.embedding", "vectorConfig": { "dimension": 1536, "distanceMeasure": "COSINE" } }
      ]
    }
  ]
}
```

## 🚀 클라이언트 연동

### **1. AI 분석 호출**
```typescript
// src/services/aiService.ts
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const analyzeProduct = httpsCallable(functions, 'analyzeProduct');

export const analyzeProductImages = async (
  images: File[], 
  analysisType: 'gemini' | 'openai' = 'gemini'
) => {
  try {
    // 이미지를 base64로 변환
    const imagePromises = images.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(file);
      });
    });
    
    const imageBase64s = await Promise.all(imagePromises);
    
    // Cloud Functions 호출
    const result = await analyzeProduct({
      images: imageBase64s,
      analysisType,
      generateEmbedding: true
    });
    
    return result.data;
    
  } catch (error) {
    console.error('AI 분석 실패:', error);
    throw error;
  }
};
```

### **2. 컴포넌트에서 사용**
```typescript
// src/components/ai/AIProductAnalysis.tsx
import { analyzeProductImages } from '../../services/aiService';

const analyzeImages = async () => {
  setIsAnalyzing(true);
  setProgress(0);
  setError(null);

  try {
    // AI 분석 실행
    const analysis = await analyzeProductImages(images, 'gemini');
    
    setAnalysis(analysis);
    setProgress(100);
    
    // 완료 후 자동으로 결과 전달
    setTimeout(() => {
      onAnalysisComplete(analysis);
    }, 1000);

  } catch (err) {
    console.error('AI 분석 실패:', err);
    setError('AI 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
  } finally {
    setIsAnalyzing(false);
  }
};
```

## 🔮 향후 개선 방향

### **1. 단기 (1-2개월)**
- [ ] Google Gemini 1.5 Pro Vision 연동
- [ ] OpenAI GPT-4o-mini Vision 연동
- [ ] OCR 텍스트 추출 정확도 향상
- [ ] 다국어 지원 (한국어/영어)

### **2. 중기 (3-6개월)**
- [ ] 온디바이스 경량 모델 배포
- [ ] 벡터 검색 및 유사 상품 추천
- [ ] 개인화된 품질 평가 모델
- [ ] 실시간 분석 결과 캐싱

### **3. 장기 (6개월+)**
- [ ] 멀티모달 AI (이미지 + 텍스트 + 음성)
- [ ] AR 상품 상태 평가
- [ ] 예측 분석 (가격, 수요 등)
- [ ] 자동 상품 분류 및 태깅

## 💡 성능 최적화 팁

### **1. 이미지 전처리**
- **압축**: WebP 형식으로 변환하여 용량 최소화
- **리사이징**: 분석에 필요한 최적 해상도로 조정
- **배치 처리**: 여러 이미지를 한 번에 전송

### **2. 캐싱 전략**
- **결과 캐싱**: 동일한 이미지에 대한 중복 분석 방지
- **CDN 활용**: 이미지 전송 속도 향상
- **로컬 스토리지**: 임시 분석 결과 저장

### **3. 에러 처리**
- **재시도 로직**: 네트워크 오류 시 자동 재시도
- **폴백 모델**: 메인 AI 실패 시 경량 모델 사용
- **사용자 피드백**: 분석 실패 시 수동 입력 옵션

## 🎉 결론

이 AI 상품분석 시스템은 **구조화된 데이터 추출**과 **스마트 콘텐츠 생성**을 통해 사용자 경험을 혁신적으로 개선합니다.

**클라우드 LLM**을 메인으로 하고 **온디바이스 모델**을 보조로 하는 하이브리드 접근법으로, 정확성과 성능을 모두 확보할 수 있습니다.

**점진적 구현**을 통해 MVP부터 시작하여 고도화된 AI 기능까지 단계적으로 발전시킬 수 있습니다! 🚀✨ 