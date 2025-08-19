# AI 기능 사용 가이드 🚀

## 📋 개요

이 프로젝트는 React + Firebase 기반으로 AI 기능을 통합한 중고마켓 애플리케이션입니다. AI 촬영, 분석, 위치 기반 검색, 추천 시스템을 단계별로 구현했습니다.

## 🎯 구현된 AI 기능

### 1. AI 상품 촬영 (`AICameraCapture.tsx`)
- **기능**: 웹캠/폰 카메라를 통한 상품 촬영
- **특징**: 
  - 실시간 품질 체크 (라플라시안 분산 기반 선명도 측정)
  - 가이드 오버레이로 최적 각도 안내
  - 자동 품질 평가 및 촬영 권장
  - WebP 압축으로 최적화된 이미지 생성

#### **핵심 구현 포인트**
```typescript
// 품질 체크 (라플라시안 분산)
const checkQuality = (imageData: ImageData): QualityCheck => {
  // 중앙 영역만 분석하여 정확도 향상
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const regionSize = Math.min(width, height) * 0.6;
  
  // 라플라시안 필터로 선명도 측정
  const laplacian = Math.abs(
    gray * 4 - 
    data[idx - 4] - data[idx + 4] - 
    data[(y-1) * width * 4 + x * 4] - 
    data[(y+1) * width * 4 + x * 4]
  );
};
```

#### **향후 개선 방향**
- **배경 제거**: ONNX Runtime Web + U²-Net 모델 적용
- **자동 셔터**: 품질 임계값 도달 시 자동 촬영
- **다중 각도**: 정면/측면/라벨 각도 자동 인식

### 2. AI 상품 분석 (`AIProductAnalysis.tsx`)
- **기능**: 촬영된 이미지의 AI 분석
- **특징**:
  - 카테고리/속성/상태 자동 추출
  - 제안 제목 및 태그 생성
  - 결함 감지 및 상태 평가
  - 신뢰도 점수 제공

#### **현재 구현 (시뮬레이션)**
```typescript
// OpenAI Vision API 또는 Cloud Vision 연동 예정
const mockAnalysis: ProductAnalysis = {
  category: '축구화',
  attributes: ['아디다스', '프레데터', 'FG', '270', '블랙'],
  condition: 'used',
  suggestedTitle: '아디다스 프레데터 FG 270 블랙 축구화',
  tags: ['축구화', '아디다스', '프레데터', 'FG', '블랙', '중고'],
  defects: ['약간의 마모', '깨끗함'],
  confidence: 0.87
};
```

#### **실제 AI 모델 연동 방법**
```typescript
// OpenAI Vision API 예시
const analyzeWithOpenAI = async (images: File[]) => {
  const formData = new FormData();
  images.forEach((file, index) => {
    formData.append(`image${index}`, file);
  });
  
  const response = await fetch('/api/ai/analyze', {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};
```

### 3. 위치 기반 검색 (`LocationBasedSearch.tsx`)
- **기능**: 사용자 위치 설정 및 지오해시 생성
- **특징**:
  - GPS 권한 관리 및 상태 표시
  - 역지오코딩으로 주소 정보 제공
  - 지오해시 기반 근접 검색 지원
  - 수동 위치 설정 옵션

#### **지오해시 구현**
```typescript
// 간단한 지오해시 생성 (실제로는 더 정교한 알고리즘 사용)
const generateGeohash = (lat: number, lng: number): string => {
  const latInt = Math.floor((lat + 90) * 1000);
  const lngInt = Math.floor((lng + 180) * 1000);
  return `${latInt.toString(36)}${lngInt.toString(36)}`.substring(0, 8);
};
```

#### **Firebase 지오해시 쿼리 예시**
```typescript
// Firestore에서 근접 상품 검색
const findNearbyItems = async (userLocation: Location, radiusKm: number) => {
  const geohash = generateGeohash(userLocation.latitude, userLocation.longitude);
  const geohashPrefix = geohash.substring(0, 4); // 4자리 정밀도
  
  const q = query(
    collection(db, 'market_items'),
    where('geohash', '>=', geohashPrefix),
    where('geohash', '<=', geohashPrefix + '\uf8ff'),
    orderBy('geohash')
  );
  
  return getDocs(q);
};
```

### 4. AI 검색/추천 (`AISearchRecommend.tsx`)
- **기능**: 다중 모달 검색 및 AI 추천
- **특징**:
  - 텍스트/이미지/음성 검색 지원
  - 임베딩 기반 의미론적 검색
  - 거리/가격 가중 랭킹
  - 실시간 필터링 및 정렬

#### **검색 타입별 구현**
```typescript
// 이미지 검색 (드래그 앤 드롭)
const handleImageSearch = (event: React.DragEvent) => {
  event.preventDefault();
  setSearchType('image');
  // 이미지 업로드 및 AI 분석
};

// 음성 검색 (Web Speech API)
const handleVoiceSearch = () => {
  setSearchType('voice');
  // SpeechRecognition API 사용
};
```

#### **AI 추천 알고리즘 예시**
```typescript
// 사용자 행동 기반 추천 점수 계산
const calculateRecommendationScore = (
  item: MarketItem,
  userPreferences: UserPreferences,
  userLocation: Location
) => {
  let score = 0;
  
  // 카테고리 선호도
  if (userPreferences.favoriteCategories.includes(item.category)) {
    score += 30;
  }
  
  // 가격 범위
  if (item.price >= userPreferences.minPrice && item.price <= userPreferences.maxPrice) {
    score += 25;
  }
  
  // 거리 가중치
  const distance = calculateDistance(userLocation, item.location);
  if (distance <= 5) score += 20;
  else if (distance <= 10) score += 15;
  else if (distance <= 20) score += 10;
  
  return score;
};
```

## 🔧 통합 관리 (`useAIFeatures.ts`)

### **상태 관리**
```typescript
interface AIFeaturesState {
  capturedImages: File[];
  analysis: ProductAnalysis | null;
  location: Location | null;
  isProcessing: boolean;
}
```

### **워크플로우 관리**
```typescript
// AI 워크플로우 완료
const completeAIWorkflow = useCallback(() => {
  if (state.capturedImages.length > 0 && state.analysis) {
    return {
      success: true,
      data: {
        images: state.capturedImages,
        analysis: state.analysis,
        location: state.location
      }
    };
  }
  return { success: false, error: '필수 정보가 누락되었습니다.' };
}, [state]);
```

## 🚀 AI 워크플로우 페이지 (`AIProductWorkflow.tsx`)

### **단계별 진행**
1. **시작**: AI 기능 소개 및 워크플로우 시작
2. **촬영**: AI 카메라로 상품 촬영 및 품질 체크
3. **분석**: AI가 이미지 분석하여 상품 정보 추출
4. **위치**: 검색/추천을 위한 위치 정보 설정
5. **완료**: AI 분석 결과로 상품 등록 또는 검색

### **진행률 표시**
```typescript
const getProgressPercentage = () => {
  const totalSteps = 4;
  const completedSteps = Object.values(workflowProgress).filter(p => p === 100).length;
  return (completedSteps / totalSteps) * 100;
};
```

## 📱 사용자 경험 (UX) 특징

### **직관적인 인터페이스**
- 단계별 진행 상황 시각화
- 실시간 품질 피드백
- 진행률 바 및 상태 표시
- 모달 기반 단계별 작업

### **반응형 디자인**
- 모바일 우선 설계
- 터치 친화적 컨트롤
- 적응형 레이아웃
- 접근성 고려

## 🔮 향후 개발 계획

### **단기 (1-2개월)**
- [ ] OpenAI Vision API 연동
- [ ] 실제 AI 모델 배포 (ONNX Runtime Web)
- [ ] 배경 제거 기능 구현
- [ ] 음성 검색 완성

### **중기 (3-6개월)**
- [ ] 개인화 추천 알고리즘
- [ ] 실시간 채팅 AI 어시스턴트
- [ ] 가격 예측 AI 모델
- [ ] 사기 탐지 시스템

### **장기 (6개월+)**
- [ ] AR 상품 미리보기
- [ ] AI 기반 가격 협상
- [ ] 다국어 지원
- [ ] 크로스 플랫폼 동기화

## 🛠️ 기술 스택

### **프론트엔드**
- **React 18**: 함수형 컴포넌트, Hooks
- **TypeScript**: 타입 안전성 및 개발자 경험
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **React Router**: SPA 라우팅

### **AI/ML**
- **Web APIs**: MediaDevices, Geolocation, Canvas
- **Computer Vision**: 라플라시안 필터, 이미지 처리
- **Natural Language**: 텍스트 분석, 태그 생성
- **Machine Learning**: 임베딩, 추천 시스템

### **백엔드/데이터**
- **Firebase**: 인증, 데이터베이스, 스토리지
- **Cloud Functions**: 서버리스 AI 처리
- **Firestore**: 실시간 데이터베이스
- **Cloud Storage**: 이미지 저장 및 관리

## 📚 참고 자료

### **AI 모델**
- [U²-Net: Going Deeper with Nested U-Structure for Salient Object Detection](https://arxiv.org/abs/2005.09007)
- [MODNet: Real-Time Trimap-Free Portrait Matting](https://arxiv.org/abs/2011.11961)
- [ONNX Runtime Web](https://github.com/microsoft/onnxruntime/tree/main/js/web)

### **위치 서비스**
- [Geohash Algorithm](https://en.wikipedia.org/wiki/Geohash)
- [Google Geocoding API](https://developers.google.com/maps/documentation/geocoding)
- [OpenStreetMap Nominatim](https://nominatim.org/)

### **웹 기술**
- [MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

## 🎉 결론

이 AI 기능 통합 프로젝트는 **사용자 경험을 혁신적으로 개선**하는 것을 목표로 합니다. 단순한 상품 등록을 넘어서, AI가 사용자의 모든 과정을 도와주는 **스마트한 마켓플레이스**를 구현했습니다.

각 기능은 **모듈화**되어 있어 독립적으로 개발하고 테스트할 수 있으며, **점진적 개선**을 통해 사용자에게 더 나은 서비스를 제공할 수 있습니다.

**AI의 힘으로 중고거래를 더욱 쉽고 즐겁게 만들어보세요!** 🚀✨ 