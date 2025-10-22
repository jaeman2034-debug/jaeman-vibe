@echo off
chcp 65001 >nul
echo.
echo ========================================
echo 🔥 YAGO VIBE IR REPORT 자동설정 시작
echo ========================================
echo.

REM ① n8n 디렉토리 생성
if not exist "n8n-workflows" mkdir n8n-workflows
echo 📁 n8n-workflows 폴더 확인 완료
echo.

REM ② storage.rules 생성
echo 🪄 Firebase storage.rules 생성 중...
(
echo rules_version = '2';
echo.
echo // ✅ Firebase Storage 보안 규칙
echo // YAGO VIBE IR Report 자동 업로드용
echo service firebase.storage {
echo   match /b/{bucket}/o {
echo.    
echo     // 📊 IR 리포트 폴더 (reports/^)
echo     match /reports/{fileName} {
echo       // ✅ 개발/테스트 환경: 모든 읽기/쓰기 허용
echo       allow read, write: if true;
echo     }
echo.    
echo     // 📊 IR 리포트 폴더 (ir_reports/^)
echo     match /ir_reports/{fileName} {
echo       // ✅ 개발/테스트 환경: 모든 읽기/쓰기 허용
echo       allow read, write: if true;
echo     }
echo.    
echo     // 🖼️ 기타 업로드 파일
echo     match /{allPaths=**} {
echo       allow read: if true;
echo       allow write: if request.auth != null;
echo     }
echo   }
echo }
) > storage.rules

echo ✅ storage.rules 생성 완료
echo.

REM ③ 환경 변수 검사
echo 🧩 환경 변수 확인...
echo ----------------------------------------

if exist "env.local" (
    echo ✅ env.local 파일 발견
    findstr /C:"VITE_FIREBASE_API_KEY" env.local >nul && echo   ✅ VITE_FIREBASE_API_KEY 설정됨 || echo   ❌ VITE_FIREBASE_API_KEY 필요
    findstr /C:"VITE_FIREBASE_PROJECT_ID" env.local >nul && echo   ✅ VITE_FIREBASE_PROJECT_ID 설정됨 || echo   ❌ VITE_FIREBASE_PROJECT_ID 필요
    findstr /C:"VITE_OPENAI_API_KEY" env.local >nul && echo   ✅ VITE_OPENAI_API_KEY 설정됨 || echo   ❌ VITE_OPENAI_API_KEY 필요
    findstr /C:"VITE_N8N_IR_WEBHOOK" env.local >nul && echo   ✅ VITE_N8N_IR_WEBHOOK 설정됨 || echo   ⚠️  VITE_N8N_IR_WEBHOOK 권장
    findstr /C:"VITE_ADMIN_EMAIL" env.local >nul && echo   ✅ VITE_ADMIN_EMAIL 설정됨 || echo   ⚠️  VITE_ADMIN_EMAIL 권장
) else (
    echo ❌ env.local 파일을 찾을 수 없습니다!
    echo    .env 파일을 env.local로 복사하거나 새로 생성하세요.
)

echo ----------------------------------------
echo.

REM ④ n8n Workflow 파일 확인
if exist "n8n-workflows\ir-report-email-workflow.json" (
    echo ✅ n8n Workflow 파일 준비됨
    echo    📄 n8n-workflows\ir-report-email-workflow.json
) else (
    echo ❌ n8n Workflow 파일을 찾을 수 없습니다!
    echo    Cursor AI가 생성한 파일을 확인하세요.
)
echo.

REM ⑤ 다음 단계 안내
echo ========================================
echo 🎯 다음 단계
echo ========================================
echo.
echo 1️⃣ Firebase Storage Rules 배포:
echo    ^> firebase deploy --only storage
echo.
echo 2️⃣ n8n Workflow Import:
echo    - n8n 열기: http://localhost:5678
echo    - Workflows -^> Import from File
echo    - 파일 선택: n8n-workflows\ir-report-email-workflow.json
echo    - SMTP 계정 연결 (Gmail 앱 비밀번호^)
echo    - Workflow Active 상태로 변경
echo.
echo 3️⃣ 개발 서버 시작:
echo    ^> npm run dev
echo.
echo 4️⃣ 테스트:
echo    http://127.0.0.1:5183/admin/reports
echo.
echo ========================================
echo ✅ 설정 완료!
echo ========================================
echo.
pause

