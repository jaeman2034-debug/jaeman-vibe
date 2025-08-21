# Vite 프록시 설정 가이드

## 개요
Vite 개발 서버를 통해 프론트엔드와 백엔드 서버 간의 프록시 연결을 설정합니다.

## 설정 파일

### 1. vite.config.ts
```typescript
export default defineConfig(({ command, mode }) => {
  // 환경 변수에서 프록시 설정 가져오기
  const API_PROXY = process.env.VITE_API_PROXY || 'http://127.0.0.1:3000';
  const FUNCTIONS_PROXY = process.env.VITE_FUNCTIONS_PROXY || 'http://127.0.0.1:5001';
  const DEV_PORT = process.env.VITE_DEV_PORT || 5173;
  
  return {
    server: {
      host: '0.0.0.0',
      port: parseInt(DEV_PORT),
      proxy: {
        // API 프록시 설정
        '/api': {
          target: API_PROXY,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('프록시 에러:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('프록시 요청:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('프록시 응답:', proxyRes.statusCode, req.url);
            });
          }
        },
        // Firebase Functions 프록시
        '/functions': {
          target: FUNCTIONS_PROXY,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/functions/, '')
        }
      }
    }
  };
});
```

## 환경 변수 설정

### .env.local (예시)
```bash
# Vite Dev Server & Proxy Configuration
VITE_DEV_PORT=5173
VITE_API_PROXY=http://127.0.0.1:3000
VITE_FUNCTIONS_PROXY=http://127.0.0.1:5001

# Firebase
VITE_USE_EMULATORS=0
```

## 프록시 동작 방식

### 1. API 프록시
- **요청**: `http://localhost:5173/api/users`
- **프록시**: `http://127.0.0.1:3000/users`
- **설명**: `/api` 경로가 제거되고 백엔드 서버로 전달

### 2. Functions 프록시
- **요청**: `http://localhost:5173/functions/hello`
- **프록시**: `http://127.0.0.1:5001/hello`
- **설명**: `/functions` 경로가 제거되고 Firebase Functions로 전달

## 사용 방법

### 1. API 클라이언트 사용
```typescript
import { apiClient } from '../lib/apiClient';

// GET 요청
const response = await apiClient.get('/users');

// POST 요청
const result = await apiClient.post('/users', { name: 'John' });
```

### 2. 직접 fetch 사용
```typescript
// /api 경로로 요청하면 자동으로 프록시됨
const response = await fetch('/api/users');
```

## 개발 서버 시작

### 1. 기본 시작
```bash
npm run dev
# 또는
yarn dev
```

### 2. 커스텀 포트로 시작
```bash
VITE_DEV_PORT=3001 npm run dev
```

### 3. 커스텀 프록시로 시작
```bash
VITE_API_PROXY=http://localhost:8000 npm run dev
```

## 문제 해결

### 1. 프록시 연결 실패
```bash
# 백엔드 서버가 실행 중인지 확인
curl http://127.0.0.1:3000/health

# 포트 충돌 확인
netstat -an | grep :3000
```

### 2. CORS 에러
- `changeOrigin: true` 설정 확인
- 백엔드 서버의 CORS 설정 확인

### 3. 타임아웃 에러
- `AbortSignal.timeout()` 사용
- 백엔드 서버 응답 시간 확인

## 모니터링

### 1. 프록시 로그
- 프록시 요청/응답이 콘솔에 출력됨
- 에러 발생 시 상세 정보 확인 가능

### 2. 네트워크 탭
- 브라우저 개발자 도구에서 요청/응답 확인
- 프록시된 요청의 실제 대상 확인

## 보안 고려사항

### 1. 개발 환경에서만 사용
- 프로덕션 빌드에서는 프록시 설정이 적용되지 않음
- 환경 변수로 프록시 설정 관리

### 2. HTTPS 설정
- `secure: false`로 설정하여 자체 서명 인증서 허용
- 프로덕션에서는 적절한 SSL 설정 필요

## 추가 설정

### 1. 커스텀 헤더 추가
```typescript
proxy: {
  '/api': {
    target: API_PROXY,
    changeOrigin: true,
    headers: {
      'X-Custom-Header': 'value'
    }
  }
}
```

### 2. 조건부 프록시
```typescript
proxy: {
  '/api': {
    target: process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000' 
      : 'https://api.production.com'
  }
}
```

## 참고 자료
- [Vite Proxy Configuration](https://vitejs.dev/config/server-options.html#server-proxy)
- [HTTP Proxy Middleware](https://github.com/chimurai/http-proxy-middleware) 