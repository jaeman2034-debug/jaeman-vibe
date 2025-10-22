#!/bin/bash

echo ""
echo "========================================"
echo "🔥 YAGO VIBE IR REPORT 자동설정 시작"
echo "========================================"
echo ""

# ① n8n 디렉토리 생성
mkdir -p n8n-workflows
echo "📁 n8n-workflows 폴더 확인 완료"
echo ""

# ② storage.rules 생성
echo "🪄 Firebase storage.rules 생성 중..."
cat > storage.rules << 'EOF'
rules_version = '2';

// ✅ Firebase Storage 보안 규칙
// YAGO VIBE IR Report 자동 업로드용
service firebase.storage {
  match /b/{bucket}/o {
    
    // 📊 IR 리포트 폴더 (reports/)
    match /reports/{fileName} {
      // ✅ 개발/테스트 환경: 모든 읽기/쓰기 허용
      allow read, write: if true;
    }
    
    // 📊 IR 리포트 폴더 (ir_reports/)
    match /ir_reports/{fileName} {
      // ✅ 개발/테스트 환경: 모든 읽기/쓰기 허용
      allow read, write: if true;
    }
    
    // 🖼️ 기타 업로드 파일
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
EOF

echo "✅ storage.rules 생성 완료"
echo ""

# ③ 환경 변수 검사
echo "🧩 환경 변수 확인..."
echo "----------------------------------------"

if [ -f "env.local" ]; then
    echo "✅ env.local 파일 발견"
    grep -q "VITE_FIREBASE_API_KEY" env.local && echo "  ✅ VITE_FIREBASE_API_KEY 설정됨" || echo "  ❌ VITE_FIREBASE_API_KEY 필요"
    grep -q "VITE_FIREBASE_PROJECT_ID" env.local && echo "  ✅ VITE_FIREBASE_PROJECT_ID 설정됨" || echo "  ❌ VITE_FIREBASE_PROJECT_ID 필요"
    grep -q "VITE_OPENAI_API_KEY" env.local && echo "  ✅ VITE_OPENAI_API_KEY 설정됨" || echo "  ❌ VITE_OPENAI_API_KEY 필요"
    grep -q "VITE_N8N_IR_WEBHOOK" env.local && echo "  ✅ VITE_N8N_IR_WEBHOOK 설정됨" || echo "  ⚠️  VITE_N8N_IR_WEBHOOK 권장"
    grep -q "VITE_ADMIN_EMAIL" env.local && echo "  ✅ VITE_ADMIN_EMAIL 설정됨" || echo "  ⚠️  VITE_ADMIN_EMAIL 권장"
else
    echo "❌ env.local 파일을 찾을 수 없습니다!"
    echo "   .env 파일을 env.local로 복사하거나 새로 생성하세요."
fi

echo "----------------------------------------"
echo ""

# ④ n8n Workflow 파일 확인
if [ -f "n8n-workflows/ir-report-email-workflow.json" ]; then
    echo "✅ n8n Workflow 파일 준비됨"
    echo "   📄 n8n-workflows/ir-report-email-workflow.json"
else
    echo "❌ n8n Workflow 파일을 찾을 수 없습니다!"
    echo "   Cursor AI가 생성한 파일을 확인하세요."
fi
echo ""

# ⑤ 다음 단계 안내
echo "========================================"
echo "🎯 다음 단계"
echo "========================================"
echo ""
echo "1️⃣ Firebase Storage Rules 배포:"
echo "   > firebase deploy --only storage"
echo ""
echo "2️⃣ n8n Workflow Import:"
echo "   - n8n 열기: http://localhost:5678"
echo "   - Workflows -> Import from File"
echo "   - 파일 선택: n8n-workflows/ir-report-email-workflow.json"
echo "   - SMTP 계정 연결 (Gmail 앱 비밀번호)"
echo "   - Workflow Active 상태로 변경"
echo ""
echo "3️⃣ 개발 서버 시작:"
echo "   > npm run dev"
echo ""
echo "4️⃣ 테스트:"
echo "   http://127.0.0.1:5183/admin/reports"
echo ""
echo "========================================"
echo "✅ 설정 완료!"
echo "========================================"
echo ""

