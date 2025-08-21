# 위치 기반 상품 목록 사용법

## 🚀 간소화된 위치 저장소

### **기본 사용법**

```typescript
import { useLocationStore } from '@/stores/locationStore';

// 컴포넌트에서
const { userLoc, load, setUserLoc, clear, fetchCurrent, isLoading, error } = useLocationStore();

// 페이지 진입 시 자동으로 저장된 위치 로드
useEffect(() => {
  useLocationStore.getState().load();
}, []);
```

### **주요 함수들**

| 함수 | 설명 | 사용 예시 |
|------|------|-----------|
| `load()` | localStorage에서 위치 정보 읽어오기 | `useEffect(() => { load(); }, [])` |
| `setUserLoc(location)` | 위치 정보 설정 및 저장 | `setUserLoc({ lat: 37.5, lng: 127.0, timestamp: Date.now() })` |
| `fetchCurrent()` | 현재 GPS 위치 가져오기 | `await fetchCurrent()` |
| `clear()` | 위치 정보 삭제 | `clear()` |

### **목록 페이지에서 자동 위치 로드**

```typescript
// src/pages/market/MarketList.tsx
import { useLocationStore } from '@/stores/locationStore';

export function MarketList() {
  const { userLoc, load } = useLocationStore();

  // 페이지 진입 시 저장된 위치 자동 로드
  useEffect(() => {
    load(); // 한 번만 호출하면 됨
  }, [load]);

  return (
    <div>
      {/* 사용자 위치가 있으면 거리 표시, 없으면 행정동 표시 */}
      {products.map(product => (
        <MarketCard 
          key={product.id} 
          item={product}
          showDistance={true} // userLoc이 있으면 자동으로 거리 계산
        />
      ))}
    </div>
  );
}
```

### **위치 설정 컴포넌트**

```typescript
import { LocationSetup } from '@/components/location/LocationSetup';

<LocationSetup
  onLocationSet={(location) => {
    console.log('위치 설정됨:', location);
    // 추가 작업...
  }}
  showCurrentLocation={true}
/>
```

### **거리 표시 로직**

```typescript
// MarketCard 내부에서 자동 처리
if (사용자_위치_있음 && 상품_위치_있음 && showDistance) {
  // 거리 표시: "📍 500m", "📍 2.3km"
  badge = formatDistance(haversineKm(사용자위치, 상품위치));
} else if (상품_위치_있음) {
  // 행정동 표시: "🏠 삼성동"
  badge = product.region_dong || product.region_sigungu;
} else {
  // 위치 없음: "위치 미설정"
  badge = "위치 미설정";
}
```

## 🎯 장점

1. **한 번만 설정**: 위치 설정 후 페이지 새로고침해도 유지
2. **자동 로드**: `useEffect(() => { load(); }, [])` 한 줄로 자동 복원
3. **간단한 API**: `userLoc`, `load()`, `fetchCurrent()` 등 직관적인 함수명
4. **24시간 유효성**: 자동으로 만료된 위치 정보 정리
5. **에러 처리**: GPS 실패 시 적절한 에러 메시지 표시

## 📱 사용자 경험

1. **첫 방문**: 위치 설정 버튼 클릭 → GPS 권한 허용 → 위치 저장
2. **재방문**: 페이지 진입 시 자동으로 저장된 위치 로드 → 거리 즉시 표시
3. **위치 변경**: 언제든지 위치 설정 버튼으로 새 위치 설정
4. **위치 삭제**: 초기화 버튼으로 위치 정보 삭제

## 🔧 설정 필요사항

1. **Zustand 설치**: `npm install zustand` ✅
2. **카카오 API 키**: `.env.local`에 `VITE_KAKAO_REST_KEY` 설정
3. **HTTPS 환경**: GPS 사용을 위해 HTTPS 필요 (로컬 개발 시 localhost 허용) 