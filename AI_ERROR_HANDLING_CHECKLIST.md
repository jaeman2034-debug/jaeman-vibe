# AI 분석 기능 에러/디버깅 체크리스트

## 🚨 클라이언트 콘솔/네트워크 체크

### 1. API 호출 상태 확인
- [ ] **POST /api/ai/analyze** 가 200 OK 응답하는지 확인
- [ ] 네트워크 탭에서 요청/응답 내용 확인
- [ ] 요청 본문에 `imageBase64` 필드가 포함되어 있는지 확인

### 2. 에러 응답 분석
실패 시 응답 JSON의 `error` 필드 확인:

| Error Code | 의미 | 해결 방법 |
|------------|------|-----------|
| `imageBase64-missing` | 바디에 이미지 없음 | 파일 처리 로직 확인 |
| `image-too-large` | 10MB 초과 | 이미지 압축 확인 |
| `invalid-image-format` | 지원하지 않는 형식 | JPG/PNG/WebP 사용 |
| `openai-key-missing` | 서버 .env에 키 누락 | 서버 환경변수 확인 |
| `openai-unauthorized` | 키 오타/권한 문제 | API 키 재확인 |
| `openai-rate-limit` | 사용량 제한 | 잠시 후 재시도 |
| `ai-timeout` | 분석 시간 초과 | 네트워크 상태 확인 |
| `ai-analyze-failed` | 기타 서버 내부 에러 | 서버 로그 확인 |

## 🔍 서버 로그 체크

### 1. 서버 시작 로그
```bash
🚀 [SERVER] AI 상품 분석 서버 시작
📍 포트: http://localhost:3001
🤖 OpenAI: ✅ (또는 ❌)
🗺️  Kakao: ✅ (또는 ❌)
⏰ 시작시간: [timestamp]
```

### 2. API 요청 로그
```bash
[timestamp] POST /api/ai/analyze
[AI_ANALYZE] 이미지 분석 시작 (크기: XXX KB)
[AI_ANALYZE] 분석 완료 (XXXms)
```

### 3. 에러 로그 패턴
```bash
[AI_ANALYZE] 오류 발생 (XXXms): [에러 상세]
[/api/ai/analyze] failed: [OpenAI 응답 코드/메시지]
```

## 🌐 환경/프록시 체크

### 1. Vite 프록시 설정
- [ ] `vite.config.ts`에 `/api` → `http://localhost:3001` 프록시 설정 확인
- [ ] 현재 설정: ✅ `/api` → `http://localhost:3001`

### 2. 서버 포트 확인
- [ ] 서버가 3001 포트에서 실행 중인지 확인
- [ ] `netstat -an | findstr 3001` (Windows) 또는 `lsof -i :3001` (Mac/Linux)

### 3. 환경변수 로드
- [ ] 서버 재시작 후 `.env` 값이 로드되는지 확인
- [ ] `dotenv` 로그에서 환경변수 로드 상태 확인
- [ ] `OPENAI_API_KEY` 값이 정상적으로 설정되었는지 확인

## 🛠️ 문제 해결 단계

### Step 1: 기본 연결 확인
```bash
# 서버 상태 확인
curl http://localhost:3001/api/health

# 응답 예시
{
  "ok": true,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "openai": true,
    "kakao": true
  }
}
```

### Step 2: AI 분석 API 테스트
```bash
# 간단한 테스트 이미지로 API 호출
curl -X POST http://localhost:3001/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{"imageBase64":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="}'
```

### Step 3: 클라이언트 연결 테스트
```javascript
// 브라우저 콘솔에서 테스트
fetch('/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

## 📋 디버깅 체크리스트

### 클라이언트 측
- [ ] 이미지 파일이 정상적으로 선택되었는지 확인
- [ ] `files[0]`이 유효한 File 객체인지 확인
- [ ] `analyzeProductImage()` 함수가 호출되는지 확인
- [ ] 네트워크 요청이 `/api/ai/analyze`로 전송되는지 확인
- [ ] 에러 메시지가 사용자에게 표시되는지 확인

### 서버 측
- [ ] 서버가 정상적으로 시작되었는지 확인
- [ ] `.env` 파일이 서버 디렉토리에 있는지 확인
- [ ] `OPENAI_API_KEY`가 정상적으로 로드되었는지 확인
- [ ] CORS 설정이 클라이언트 도메인을 허용하는지 확인
- [ ] 요청 로그가 정상적으로 출력되는지 확인

### 네트워크 측
- [ ] Vite dev 서버가 실행 중인지 확인
- [ ] Express 서버가 3001 포트에서 실행 중인지 확인
- [ ] 프록시 설정이 정상적으로 작동하는지 확인
- [ ] 방화벽이나 보안 소프트웨어가 포트를 차단하지 않는지 확인

## 🚀 빠른 시작 가이드

### 1. 서버 시작
```bash
# 터미널 1: 백엔드 서버
cd [프로젝트_루트]
node server.cjs

# 터미널 2: 프론트엔드 개발 서버
npm run dev
```

### 2. 환경변수 설정
```bash
# .env 파일 생성 (서버 루트에)
OPENAI_API_KEY=your_openai_api_key_here
KAKAO_REST_KEY=your_kakao_rest_key_here
```

### 3. 테스트 순서
1. 서버 시작 및 로그 확인
2. `/api/health` 엔드포인트 테스트
3. 상품 등록 페이지 접속
4. 이미지 업로드 후 AI 분석 버튼 클릭
5. 네트워크 탭에서 API 호출 확인
6. 콘솔에서 응답/에러 확인

## 🔧 일반적인 문제 해결

### OpenAI API 키 문제
```bash
# .env 파일 확인
cat .env | grep OPENAI_API_KEY

# 서버 재시작
pkill -f "node server.cjs"
node server.cjs
```

### 포트 충돌 문제
```bash
# 포트 사용 중인 프로세스 확인
netstat -ano | findstr :3001

# 프로세스 종료
taskkill /PID [PID] /F
```

### CORS 문제
```bash
# 서버 CORS 설정 확인
# server.cjs의 cors 설정이 클라이언트 도메인을 포함하는지 확인
```

### 이미지 크기 문제
```bash
# 클라이언트에서 이미지 압축 확인
# aiService.ts의 compressAndConvertToBase64 함수 동작 확인
``` 