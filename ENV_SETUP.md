# 🚀 Voice Dev 환경 변수 설정 가이드

## 📝 필수 환경 변수

### 개발 환경 (.env.local 또는 .env)
```bash
VITE_DEV_MODE=true
VITE_DEV_WHITELIST=uid_abc123,jaeman2034@gmail.com
```

### 운영 환경 (.env)
```bash
VITE_DEV_MODE=false
VITE_DEV_WHITELIST=
```

## 🔧 설정 방법

### 1. 프로젝트 루트에 .env.local 파일 생성
```bash
# 프로젝트 루트 디렉토리에서
touch .env.local
```

### 2. 내용 작성
```bash
VITE_DEV_MODE=true
VITE_DEV_WHITELIST=uid_abc123,jaeman2034@gmail.com
```

### 3. 화이트리스트 설정
- `uid_abc123`: Firebase UID
- `jaeman2034@gmail.com`: 이메일 주소
- 쉼표로 구분하여 여러 개 추가 가능

## 🧪 테스트 방법

### 로컬 강제 허용 (개발용)
브라우저 콘솔에서:
```javascript
// 허용
localStorage.setItem('dev:allow', '1')

// 해제
localStorage.removeItem('dev:allow')
```

### 접근 확인
1. 홈에서 "개발 도구" 섹션 노출 확인
2. `/voice` 접속 가능 확인
3. 모달 호출 가능 확인

## 🚨 주의사항

- **운영 배포 시**: `VITE_DEV_MODE=false` 필수
- **화이트리스트**: 실제 사용자 UID/이메일로 설정
- **보안**: .env.local은 .gitignore에 포함되어야 함

## 🔍 문제 해결

### 개발 도구가 안 보여요
1. 환경 변수 설정 확인
2. 로그인 상태 확인
3. 화이트리스트에 사용자 포함 여부 확인
4. 브라우저 콘솔에서 `localStorage.setItem('dev:allow', '1')` 시도

### /voice 접속이 안 돼요
1. DevGuard 로그 확인
2. 사용자 인증 상태 확인
3. 환경 변수 재시작 확인 