# Firebase 인증 오류 가이드 (400 오류 중심)

## 개요
Firebase Authentication에서 발생하는 다양한 오류 코드와 해결 방법을 상세히 설명합니다. 특히 400번대 오류(클라이언트 오류)에 집중합니다.

## 주요 400번대 오류 코드

### 1. 이메일/비밀번호 로그인 관련

#### `auth/invalid-email` (400)
- **원인**: 이메일 형식이 올바르지 않음
- **해결방법**: 
  - 올바른 이메일 형식 입력 (예: user@example.com)
  - 공백 제거
  - @ 기호와 도메인 확인

#### `auth/user-not-found` (400)
- **원인**: 존재하지 않는 계정으로 로그인 시도
- **해결방법**:
  - 회원가입 먼저 진행
  - 이메일 주소 재확인
  - 다른 로그인 방식 시도 (Google 등)

#### `auth/wrong-password` (400)
- **원인**: 비밀번호가 올바르지 않음
- **해결방법**:
  - 비밀번호 재확인
  - 대소문자 구분 확인
  - Caps Lock 상태 확인

#### `auth/invalid-login-credentials` (400)
- **원인**: 이메일 또는 비밀번호가 올바르지 않음
- **해결방법**:
  - 입력 정보 전체 재확인
  - 계정이 존재하는지 확인
  - 회원가입 필요 여부 확인

### 2. 회원가입 관련

#### `auth/email-already-in-use` (400)
- **원인**: 이미 사용 중인 이메일로 회원가입 시도
- **해결방법**:
  - 다른 이메일 주소 사용
  - 기존 계정으로 로그인 시도
  - 비밀번호 찾기 기능 사용

#### `auth/weak-password` (400)
- **원인**: 비밀번호가 너무 약함
- **해결방법**:
  - 8자 이상 설정
  - 영문, 숫자, 특수문자 포함
  - 개인정보 포함 금지

### 3. 보안 및 제한 관련

#### `auth/too-many-requests` (400)
- **원인**: 로그인 시도가 너무 많음
- **해결방법**:
  - 15분 후 재시도
  - 비밀번호 찾기 기능 사용
  - 다른 로그인 방식 시도

#### `auth/operation-not-allowed` (400)
- **원인**: 해당 로그인 방식이 허용되지 않음
- **해결방법**:
  - 관리자에게 문의
  - 다른 로그인 방식 사용
  - Firebase 콘솔에서 설정 확인

#### `auth/user-disabled` (400)
- **원인**: 비활성화된 계정
- **해결방법**:
  - 관리자에게 문의
  - 계정 복구 절차 진행

### 4. 네트워크 및 기술적 오류

#### `auth/network-request-failed` (400)
- **원인**: 네트워크 연결 문제
- **해결방법**:
  - 인터넷 연결 상태 확인
  - 방화벽 설정 확인
  - VPN 사용 중이라면 해제

#### `auth/timeout` (400)
- **원인**: 요청 시간 초과
- **해결방법**:
  - 네트워크 상태 확인
  - 잠시 후 재시도
  - 다른 네트워크 환경에서 시도

## 오류 처리 및 로깅

### 1. 콘솔 로깅
```typescript
import { logAuthError, formatAuthErrorForUser } from '../features/auth/authService';

try {
  await signInWithEmail(email, password);
} catch (error) {
  // 상세한 오류 로깅
  logAuthError('Email Login', error, { email });
  
  // 사용자 친화적 메시지 생성
  const userError = formatAuthErrorForUser(error);
  console.log('User message:', userError.message);
  console.log('Solution:', userError.solution);
}
```

### 2. 오류 분석 결과
```typescript
import { getAuthErrorInfo } from '../features/auth/authService';

const errorInfo = getAuthErrorInfo(error);
if (errorInfo) {
  console.log('Error code:', errorInfo.code);
  console.log('User message:', errorInfo.userMessage);
  console.log('Solution:', errorInfo.solution);
  console.log('Severity:', errorInfo.severity);
}
```

## 사용자 인터페이스 가이드

### 1. 오류 메시지 표시
```typescript
const [error, setError] = useState<string>('');
const [solution, setSolution] = useState<string>('');

try {
  await loginWithEmail(email, password);
} catch (error) {
  const userError = formatAuthErrorForUser(error);
  setError(userError.message);
  setSolution(userError.solution);
}
```

### 2. 오류 심각도별 UI 처리
```typescript
const getErrorStyle = (severity: 'info' | 'warning' | 'error') => {
  switch (severity) {
    case 'info':
      return { background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' };
    case 'warning':
      return { background: '#fef3c7', color: '#92400e', border: '1px solid #fbbf24' };
    case 'error':
      return { background: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' };
    default:
      return { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
  }
};
```

## 문제 해결 체크리스트

### 1. 기본 확인사항
- [ ] 이메일 형식이 올바른가?
- [ ] 비밀번호에 공백이 없는가?
- [ ] Caps Lock이 꺼져 있는가?
- [ ] 인터넷 연결이 안정적인가?

### 2. 계정 관련 확인사항
- [ ] 해당 이메일로 계정이 존재하는가?
- [ ] 계정이 비활성화되지 않았는가?
- [ ] 다른 로그인 방식으로 가입되지 않았는가?

### 3. 설정 관련 확인사항
- [ ] Firebase 프로젝트 설정이 올바른가?
- [ ] 이메일/비밀번호 로그인이 활성화되어 있는가?
- [ ] 도메인 제한이 설정되어 있지 않은가?

## 개발자 디버깅

### 1. Firebase 콘솔 확인
- Authentication > Users 탭에서 계정 상태 확인
- Authentication > Sign-in method에서 로그인 방식 활성화 상태 확인
- Authentication > Settings에서 도메인 제한 확인

### 2. 네트워크 탭 분석
- 브라우저 개발자 도구 > Network 탭
- Firebase API 호출 상태 확인
- 요청/응답 헤더 및 바디 분석

### 3. 로그 분석
```typescript
// 상세한 오류 정보 로깅
console.group('[AUTH DEBUG]');
console.log('Email:', email);
console.log('Password length:', password?.length);
console.log('Is emulator:', isUsingEmulators);
console.log('Auth instance:', auth);
console.groupEnd();
```

## 예방 방법

### 1. 입력값 검증
```typescript
// 이메일 형식 검증
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  throw new Error('올바른 이메일 형식을 입력해주세요.');
}

// 비밀번호 강도 검증
if (password.length < 8) {
  throw new Error('비밀번호는 8자 이상이어야 합니다.');
}
```

### 2. 사용자 안내
- 명확한 오류 메시지 제공
- 구체적인 해결 방법 제시
- 다음 단계 안내

### 3. 재시도 제한
- 로그인 실패 시 적절한 대기 시간 설정
- 사용자에게 남은 시도 횟수 안내
- 계정 잠금 시 복구 방법 제공

## 참고 자료
- [Firebase Auth Error Codes](https://firebase.google.com/docs/auth/admin/errors)
- [Firebase Auth Troubleshooting](https://firebase.google.com/docs/auth/troubleshooting)
- [Firebase Console](https://console.firebase.google.com/) 