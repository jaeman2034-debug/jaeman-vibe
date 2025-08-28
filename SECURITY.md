# 🔒 보안 설정 가이드

## 1. 환경변수 설정

### `.env.local` 파일에 추가할 보안 설정:

```bash
# AI 분석 API 모드 (개발/배포)
VITE_USE_MOCK_API=true  # 개발 시 true, 배포 시 false

# Firebase App Check (프로덕션)
VITE_FIREBASE_APPCHECK_DEBUG_TOKEN=  # 프로덕션에서는 비워두기

# HTTPS 강제 (PWA 배포 시)
VITE_FORCE_HTTPS=true
```

## 2. 권한 관리

### 마이크 권한 (STT)
- **PWA (HTTPS)**: 안정적인 마이크 접근
- **로컬 개발 (HTTP)**: 브라우저 정책 확인 필요
- **권한 거부 시**: 사용자 친화적 안내 메시지

### 위치 권한
- **사용자 선택 필수**: 강제로 위치 정보 수집 금지
- **위치 숨기기 옵션**: 언제든지 위치 서비스 비활성화 가능
- **권한 상태 표시**: 현재 권한 상태를 명확하게 표시

## 3. Firebase 보안 규칙

### Storage 규칙 (이미 적용됨)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 공개 읽기(목록/다운로드) 허용: /market 경로만
    match /market/{allPaths=**} {
      allow read: if true;
      // 로그인 사용자만 쓰기, 5MB 이하 이미지로 제한
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }

    // 나머지는 차단
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### Firestore 규칙 (권장)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // market 컬렉션: 로그인 사용자만 읽기/쓰기
    match /market/{document=**} {
      allow read: if true;  // 공개 읽기
      allow write: if request.auth != null;  // 로그인 사용자만 쓰기
    }
    
    // users 컬렉션: 본인 데이터만 접근
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 4. App Check 설정

### 프로덕션 배포 시
1. **디버그 토큰 제거**: `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN` 환경변수 삭제
2. **ReCaptcha 설정**: Firebase Console에서 도메인 등록
3. **운영 트래픽만 허용**: 디버그 토큰으로 인한 보안 우회 방지

### 개발 환경
1. **디버그 토큰 사용**: `VITE_FIREBASE_APPCHECK_DEBUG_TOKEN` 설정
2. **로컬 도메인 등록**: `localhost`, `127.0.0.1` 등록

## 5. HTTPS 강제 (PWA 배포 시)

### 서비스 워커에서 HTTPS 체크
```typescript
// src/service-worker.ts
if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
  throw new Error('HTTPS가 필요합니다.');
}
```

### 환경변수로 HTTPS 강제
```typescript
// src/main.ts
if (import.meta.env.VITE_FORCE_HTTPS === 'true' && 
    location.protocol !== 'https:' && 
    location.hostname !== 'localhost') {
  location.href = location.href.replace('http:', 'https:');
}
```

## 6. 권한 요청 모범 사례

### 점진적 권한 요청
1. **첫 방문**: 기본 기능만 제공
2. **사용자 액션**: 권한이 필요한 기능 사용 시 권한 요청
3. **권한 거부 시**: 대안 기능 제공

### 권한 상태 표시
- **권한 허용**: ✅ 녹색 표시
- **권한 거부**: ❌ 빨간색 표시  
- **권한 대기**: ⏳ 노란색 표시

## 7. 데이터 보안

### 이미지 업로드
- **파일 크기 제한**: 5MB 이하
- **MIME 타입 검증**: `image/*`만 허용
- **바이러스 스캔**: 업로드된 파일 검증 (선택사항)

### 사용자 데이터
- **개인정보 암호화**: 민감한 정보는 암호화 저장
- **데이터 보존 기간**: 불필요한 데이터 자동 삭제
- **GDPR 준수**: 사용자 데이터 삭제 요청 처리

## 8. 모니터링 및 로깅

### 보안 이벤트 로깅
```typescript
// src/utils/security.ts
export const logSecurityEvent = (event: string, details: any) => {
  console.warn('[SECURITY]', event, details);
  // Firebase Analytics 또는 외부 로깅 서비스로 전송
};
```

### 주요 모니터링 항목
- 권한 거부 횟수
- 인증 실패 횟수
- 파일 업로드 크기/타입 위반
- API 호출 빈도 이상

## 9. 배포 체크리스트

### 보안 설정 확인
- [ ] App Check 디버그 토큰 제거
- [ ] HTTPS 강제 설정 (PWA)
- [ ] Firebase 보안 규칙 배포
- [ ] 환경변수 보안 설정
- [ ] 권한 요청 UI 테스트

### 성능 및 보안 테스트
- [ ] 권한 거부 시 동작 확인
- [ ] 파일 업로드 제한 테스트
- [ ] 인증 없는 접근 차단 확인
- [ ] CORS 설정 검증

---

**⚠️ 주의사항**: 이 가이드는 기본적인 보안 설정을 다룹니다. 실제 프로덕션 환경에서는 추가적인 보안 검토가 필요할 수 있습니다. 