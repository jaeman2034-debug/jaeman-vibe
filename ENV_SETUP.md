# 환경 변수 설정 가이드

## 필수 환경 변수

### 1. Firebase 설정
```bash
# .env.local
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

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