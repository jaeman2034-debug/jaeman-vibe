# 환경 변수 설정 가이드

## 🚨 Firebase API 키 오류 해결

**오류 메시지**: `Firebase: Error (auth/invalid-api-key)`

이 오류는 Firebase 환경 변수가 설정되지 않았거나 잘못 설정되었을 때 발생합니다.

## 필수 환경 변수

### 1. Firebase 설정
프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# .env.local
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=jaeman-vibe-platform.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=jaeman-vibe-platform
VITE_FIREBASE_STORAGE_BUCKET=jaeman-vibe-platform.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

**Firebase 설정값 찾는 방법:**
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. `jaeman-vibe-platform` 프로젝트 선택
3. 프로젝트 설정 (⚙️) → 일반 탭
4. "내 앱" 섹션에서 웹 앱 선택
5. `firebaseConfig` 객체에서 값들을 복사

### 2. 카카오 REST API 키 (위치 서비스용)
```bash
# .env.local
VITE_KAKAO_REST_KEY=your_kakao_rest_api_key
```

**카카오 REST API 키 발급 방법:**
1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 애플리케이션 생성
3. REST API 키 복사
4. `.env.local`에 `VITE_KAKAO_REST_KEY=복사한_키` 형태로 추가

## 🔑 Kakao 설정 팁

### 개발 환경 설정
1. **환경 변수 설정**: `.env.local`에 `VITE_KAKAO_REST_KEY=xxxxxxxxxxxxxxxx` 추가
2. **허용 도메인**: 카카오 개발자 콘솔에 `http://localhost:5173` 추가
3. **프록시 설정**: Vite 개발 서버에서 `/kakao` 경로를 카카오 API로 프록시

### 운영 환경 전환 시 주의사항
- **보안**: REST 키는 **서버(프록시/함수)**에서 호출하도록 이전 권장
- **도메인**: 실제 운영 도메인을 카카오 개발자 콘솔에 추가
- **API 제한**: 일일 사용량 제한 확인 및 모니터링

## 환경 변수 설정 후

1. **개발 서버 재시작**: 환경 변수 변경 후에는 반드시 개발 서버를 재시작해야 합니다
2. **브라우저 새로고침**: 변경사항이 반영되도록 브라우저를 새로고침하세요
3. **캐시 삭제**: 브라우저 개발자 도구에서 캐시를 삭제하는 것도 도움이 될 수 있습니다

## 위치 서비스 사용법

### 상품 등록 시 자동 위치 저장
```typescript
import { createMarketItem } from '@/features/market/create/submit';

const payload = {
  title: "축구화",
  price: 50000,
  category: "sports",
  condition: "used"
};

try {
  const itemId = await createMarketItem(payload);
  console.log('상품 등록 완료:', itemId);
} catch (error) {
  console.error('등록 실패:', error);
}
```

### 저장되는 위치 정보
- **좌표**: `location.lat`, `location.lng`
- **행정동**: `region_sido`, `region_sigungu`, `region_dong`
- **전체 주소**: `region_full`
- **지오해시**: `geohash` (거리 검색용)

## 주의사항

1. **위치 권한**: 브라우저에서 위치 접근 권한 허용 필요
2. **API 제한**: 카카오 API는 일일 사용량 제한이 있음
3. **정확도**: `enableHighAccuracy: true`로 설정하여 최대한 정확한 위치 사용
4. **에러 처리**: 위치 정보 가져오기 실패 시 적절한 사용자 안내 필요
5. **환경 변수 보안**: `.env.local` 파일은 절대 Git에 커밋하지 마세요 