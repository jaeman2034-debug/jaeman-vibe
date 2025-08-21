# 배포 가이드 (Render + Vercel)

## 백엔드(Render)
1. GitHub 연결 → New → Web Service
2. Build Command: (비움)  Start Command: `node server.cjs`
3. Environment: Node 20+
4. Environment Variables:
   - KAKAO_REST_KEY=...
   - FIREBASE_PROJECT_ID=...
   - FIREBASE_STORAGE_BUCKET=...
   - (택1) FIREBASE_ADMIN_JSON=<서비스계정 JSON 전체 문자열>
     *또는* (택2)
     - GOOGLE_APPLICATION_CREDENTIALS=/opt/render/project/src/secrets/firebase-admin.json
     - Secrets에 firebase-admin.json 업로드
5. Deploy 후, 도메인 예: https://jaeman-api.onrender.com
   - 헬스체크: https://jaeman-api.onrender.com/healthz → `ok`

## 프런트(Vercel)
1. vercel.json 의 RENDER_SERVICE_URL 을 실제 Render 도메인으로 교체 후 커밋/푸시
2. Vercel → New Project → 이 레포 선택
   - Build: `npm run build`
   - Output: `dist`
3. Environment Variables(Production):
   - VITE_KAKAO_JS_KEY=...
   - VITE_FIREBASE_API_KEY=...
   - VITE_FIREBASE_AUTH_DOMAIN=...
   - VITE_FIREBASE_PROJECT_ID=...
   - VITE_FIREBASE_STORAGE_BUCKET=...
   - VITE_FIREBASE_MESSAGING_SENDER_ID=...
   - VITE_FIREBASE_APP_ID=...
4. Deploy → 예: https://jaeman-vibe.vercel.app

## 콘솔 화이트리스트
- Kakao Developers → 앱 → 플랫폼 → 웹 → 사이트 도메인
  - https://jaeman-vibe.vercel.app
- Firebase Authentication → 허용 도메인
  - jaeman-vibe.vercel.app

## 스모크 테스트
- /products/new: 주소 검색/저장 → Firestore/Storage 확인
- /products/near: 반경/정렬/동네 토글, 지도/길찾기
- /api/* 호출이 Vercel → Render 로 rewrite 되는지 Network 탭 확인
