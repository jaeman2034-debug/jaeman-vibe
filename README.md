# 🚀 Jaeman Vibe - Voice-First 마켓플레이스

## 📋 프로젝트 개요

Voice-First 마켓플레이스로, 음성 명령으로 상품을 검색하고 필터링할 수 있는 혁신적인 플랫폼입니다.

## ✨ 주요 기능

- 🎙️ **음성 제어**: 음성으로 상품 검색, 필터링, 정렬
- 📍 **위치 기반 서비스**: 현재 위치 기반 상품 추천
- 🤖 **AI 분석**: 상품 이미지 자동 분석 및 가격 제안
- 📱 **모바일 최적화**: 터치 친화적 UI/UX
- 🔒 **보안 강화**: Firebase App Check 및 권한 관리

## 🛠️ 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Firebase (Firestore, Storage, Functions)
- **AI**: Mock API (개발용) / Firebase Functions (배포용)
- **지도**: 카카오/구글 역지오코딩 API
- **스타일링**: Tailwind CSS

## 🚀 시작하기

### 1. 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Firebase 설정
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_APP_ID=your_app_id

# App Check (개발용)
VITE_FIREBASE_APPCHECK_DEBUG_TOKEN=your_debug_token_here
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key

# AI 분석 API 모드
VITE_USE_MOCK_API=true  # 개발 시 true, 배포 시 false

# 지오코딩 API 키 (선택사항)
VITE_KAKAO_REST_API_KEY=your_kakao_rest_api_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# HTTPS 강제 (PWA 배포 시)
VITE_FORCE_HTTPS=false
```

### 2. 카카오 API 설정 (위치 서비스용)

위치 기반 서비스를 사용하려면 카카오 REST API 키가 필요합니다:

1. **API 키 발급**: [Kakao Developers](https://developers.kakao.com/)에서 애플리케이션 생성
2. **환경 변수 설정**: `.env.local`에 `VITE_KAKAO_REST_KEY=your_key` 추가
3. **허용 도메인**: 카카오 개발자 콘솔에 `http://localhost:5173` 추가
4. **프록시 설정**: Vite 개발 서버에서 `/kakao` 경로를 카카오 API로 프록시 (이미 설정됨)

**⚠️ 운영 환경 주의사항**: REST 키는 보안을 위해 서버(프록시/함수)에서 호출하도록 이전 권장

### 3. 의존성 설치

```bash
npm install
```

### 4. 개발 서버 실행

```bash
npm run dev
```

### 5. Firebase Functions 배포 (선택사항)

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

## 🎙️ 음성 명령 가이드

### 기본 명령
- **"상품등록"** - 상품 등록 화면 열기
- **"축구"** - 축구 카테고리 필터
- **"5킬로"** - 5km 이내 상품만 표시
- **"5만원 이하"** - 5만원 이하 상품만 표시

### 고급 명령
- **"가격순"** - 가격순으로 정렬
- **"거리순"** - 거리순으로 정렬
- **"5번 즐겨찾기"** - 5번 상품 즐겨찾기
- **"필터해제"** - 모든 필터 초기화
- **"도움말"** - 음성 명령 도움말 표시

## 🚀 패키지 E - 다중 이미지·고급 검색/필터·운영 대시보드

### 주요 기능
- **다중 이미지 시스템**: 드래그 앤 드롭, 갤러리 관리, 커버 설정
- **고급 검색/필터**: 가격 범위, 날짜, 정렬 옵션
- **운영 대시보드**: 통계 집계, 백필 스케줄링, 실시간 모니터링
- **음성 명령 확장**: 고급 필터, 가격 범위, 정렬 명령
- **접근제어 강화**: 타 계정 수정 방지, 관리자 전용 기능

### 새로운 컴포넌트
```
src/features/images/
├── components/
│   ├── ImageUploader.tsx      # 다중 이미지 업로드
│   └── ImageGallery.tsx       # 이미지 갤러리 관리
src/features/search/
├── components/
│   └── AdvancedFilters.tsx    # 고급 검색/필터
src/admin/
├── Dashboard.tsx              # 운영 대시보드
```

### 음성 명령 확장
- **"가격 10000에서 50000"** - 가격 범위 설정
- **"최저가"** - 가격 오름차순 정렬
- **"최고가"** - 가격 내림차순 정렬
- **"최신"** - 등록일 내림차순 정렬
- **"오래된"** - 등록일 오름차순 정렬

## 🔧 개발 가이드

### 컴포넌트 구조
```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── VoiceController.tsx    # 음성 제어
│   ├── MarketDGItem.tsx       # 상품 목록 아이템
│   ├── ProductCard.tsx        # 상품 카드
│   ├── AnalysisPanel.tsx      # AI 분석 패널
│   └── LocationBadge.tsx      # 위치 표시
├── hooks/              # 커스텀 훅
│   └── useGeolocation.ts      # 위치 서비스
├── utils/              # 유틸리티 함수
│   ├── backfill.ts            # 기존 상품 행정동 정보 보정
│   └── geo.ts                 # 위치 관련 유틸리티
```

### 백필 유틸리티 (기존 상품 데이터 보정)

기존 상품들의 행정동 정보를 일괄 보정하는 유틸리티가 포함되어 있습니다.

#### 브라우저 콘솔에서 실행

앱을 실행한 후 브라우저 개발자 콘솔에서 다음 함수들을 사용할 수 있습니다:

```javascript
// 1. 기존 상품들의 행정동 정보 보정
backfillDong();

// 2. market 컬렉션을 products 컬렉션으로 마이그레이션
migrateMarketToProducts();
```

#### 백필 함수 상세

**`backfillDong()`**
- `products` 컬렉션의 기존 상품들을 대상으로 함
- 이미 `address`가 있거나 `geo` 좌표가 없는 상품은 건너뜀
- 카카오 API 속도 제한을 고려하여 120ms 딜레이 적용
- 진행 상황을 콘솔에 상세히 출력

**`migrateMarketToProducts()`**
- 기존 `market` 컬렉션의 상품들을 새로운 `products` 구조로 변환
- 행정동 정보도 함께 생성
- 기존 데이터 구조와의 하위 호환성 유지

#### 사용 시 주의사항

1. **API 제한**: 카카오 API 일일 사용량 제한 확인
2. **데이터 백업**: 실행 전 중요 데이터 백업 권장
3. **테스트 환경**: 운영 환경에서 실행하기 전 테스트 환경에서 먼저 실행
4. **일회성**: 한 번만 실행하면 되는 유틸리티 (중복 실행 금지)

### 주요 훅
- `useGeolocation()`: 사용자 위치 추적 및 권한 관리
- `VoiceController`: 음성 인식 및 TTS 설정

### 타입 정의
- `MarketDGItemData`: 상품 데이터 구조
- `Analysis`: AI 분석 결과 구조
- `GeocodingResult`: 지오코딩 결과 구조

## 🔒 보안 설정

### Firebase 보안 규칙
- **Storage**: 로그인 사용자만 쓰기, 5MB 이하 이미지 제한
- **Firestore**: 인증된 사용자만 데이터 수정
- **App Check**: 프로덕션에서 디버그 토큰 제거

### 권한 관리
- **마이크**: PWA에서 안정적, 로컬 개발 시 브라우저 정책 확인
- **위치**: 사용자 선택 필수, 언제든지 비활성화 가능
- **데이터**: 개인정보 암호화, GDPR 준수

## 📱 모바일 최적화

### 접근성
- 큰 마이크 버튼 (44x44px 이상)
- TTS 볼륨/속도 조절
- 터치 친화적 UI

### PWA 지원
- HTTPS 강제 설정
- 서비스 워커
- 오프라인 지원

## 🚀 배포

### 1. 프로덕션 환경변수
```bash
VITE_USE_MOCK_API=false
VITE_FIREBASE_APPCHECK_DEBUG_TOKEN=
VITE_FORCE_HTTPS=true
```

### 2. Firebase Functions 배포
```bash
firebase deploy --only functions
```

### 3. 정적 파일 배포
```bash
npm run build
firebase deploy --only hosting
```

## 🧪 테스트

### 음성 명령 테스트
1. 마이크 버튼 클릭
2. 명령어 발음
3. TTS 피드백 확인

### 위치 서비스 테스트
1. 위치 권한 허용
2. "현재 위치로 채우기" 버튼 클릭
3. 역지오코딩 결과 확인

### AI 분석 테스트
1. 상품 등록 시 자동 분석 실행
2. "분석하기" 버튼으로 수동 분석
3. Mock API 결과 확인

## 📚 추가 자료

- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)
- [보안 설정 가이드](./SECURITY.md)

## 🤝 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요.

## 📄 라이선스

MIT License

---

**Voice-First 마켓플레이스로 더 나은 사용자 경험을 만들어보세요!** 🎙️✨
