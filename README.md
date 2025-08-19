# YAGO SPORTS - AI Platform

## 🚀 빠른 시작

### 옵션 A: 백엔드 설정 (Express) - 5분 컷

1. **빠른 시작** (권장)
   ```bash
   # quick-start.bat 실행 (자동 설치 + 시작)
   # 또는 수동으로:
   npm install
   node server.cjs
   ```

2. **수동 시작**
   ```bash
   # 의존성 설치
   npm install
   
   # 포트 정리 (Windows)
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # 서버 시작
   node server.cjs
   ```
   
   성공 시: `[API] listening on 3000`

3. **헬스 체크 확인**
   ```bash
   curl http://localhost:3000/api/health
   # 응답: {"ok":true,"ts":1234567890}
   ```

### 프론트엔드 설정 (Vite)

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **개발 서버 시작**
   ```bash
   npm run dev
   ```
   
   성공 시: `Local: http://localhost:5173/`

3. **프록시 확인**
   - Vite가 `/api` → `localhost:3000`으로 프록시
   - 브라우저에서 `http://localhost:5173/api/health` 접속 시 JSON 응답 확인

## 🔧 API 엔드포인트

- `GET /api/health` - 서버 상태 확인
- `POST /api/chat` - 채팅 API (임시 echo 응답)

## 📁 주요 파일

- `server.js` - Express 백엔드
- `vite.config.ts` - Vite 설정 (프록시 포함)
- `src/pages/StartScreen.tsx` - 프론트엔드 헬스 체크
- `kill-port-3000.bat` - 포트 3000 프로세스 종료
- `start-backend.bat` - 백엔드 자동 시작

## 🚨 문제 해결

### "Unexpected end of JSON input"
- 백엔드가 실행 중인지 확인
- `http://localhost:3000/api/health` 직접 접속
- Vite 프록시 설정 확인

### "recRef is not defined"
- `useSpeech.ts`에서 `recRef` 선언 확인
- PTT 버튼 클릭/해제 시 콘솔 에러 확인

### 포트 충돌
- `kill-port-3000.bat` 실행
- 백엔드 → 프론트엔드 순서로 시작
