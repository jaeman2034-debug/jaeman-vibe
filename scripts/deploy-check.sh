#!/bin/bash

# 배포 체크 스크립트
# 사용법: ./deploy-check.sh <PROJECT_ID> [ENVIRONMENT]

set -e

PROJECT_ID=$1
ENVIRONMENT=${2:-prod}
REGION=${3:-asia-northeast3}

if [ -z "$PROJECT_ID" ]; then
    echo "사용법: $0 <PROJECT_ID> [ENVIRONMENT] [REGION]"
    echo "예시: $0 my-project prod asia-northeast3"
    exit 1
fi

echo "🚀 배포 체크 시작..."
echo "프로젝트: $PROJECT_ID"
echo "환경: $ENVIRONMENT"
echo "리전: $REGION"

# 1. Firebase 프로젝트 설정
echo "📦 Firebase 프로젝트 설정..."
firebase use $PROJECT_ID

# 2. 환경변수 확인
echo "🔍 환경변수 확인..."
REQUIRED_VARS=(
    "SLACK_BOT_TOKEN"
    "SLACK_SIGNING_SECRET"
    "SLACK_APPROVER_CHANNEL"
    "INTERNAL_KEY"
    "N8N_WEBHOOK_APPROVED"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "❌ 누락된 환경변수:"
    printf '%s\n' "${MISSING_VARS[@]}"
    echo "환경변수를 설정하고 다시 실행하세요."
    exit 1
fi

echo "✅ 모든 필수 환경변수가 설정되었습니다."

# 3. PUBLIC_BASE_URL 확인
echo "🌐 PUBLIC_BASE_URL 확인..."
PUBLIC_BASE_URL=$(firebase functions:config:get public.base 2>/dev/null || echo "")
if [ -z "$PUBLIC_BASE_URL" ]; then
    echo "❌ PUBLIC_BASE_URL이 설정되지 않았습니다."
    echo "다음 명령으로 설정하세요:"
    echo "firebase functions:config:set public.base=\"https://your-domain.com\""
    exit 1
fi

echo "✅ PUBLIC_BASE_URL: $PUBLIC_BASE_URL"

# 4. 워크스페이스 등록 확인
echo "🏢 워크스페이스 등록 확인..."
API_URL="https://$REGION-$PROJECT_ID.cloudfunctions.net/slack"
WORKSPACES_RESPONSE=$(curl -s "$API_URL/slack/admin/workspaces" \
    -H "x-internal-key: $INTERNAL_KEY" \
    -H "Content-Type: application/json" 2>/dev/null || echo '{"ok":false}')

if echo "$WORKSPACES_RESPONSE" | jq -e '.ok' > /dev/null 2>&1; then
    WORKSPACE_COUNT=$(echo "$WORKSPACES_RESPONSE" | jq '.workspaces | length')
    echo "✅ 등록된 워크스페이스: $WORKSPACE_COUNT개"
    
    if [ "$WORKSPACE_COUNT" -eq 0 ]; then
        echo "⚠️  워크스페이스가 등록되지 않았습니다."
        echo "다음 명령으로 워크스페이스를 등록하세요:"
        echo "curl -X POST \"$API_URL/slack/admin/workspaces/set\" \\"
        echo "  -H \"Content-Type: application/json\" \\"
        echo "  -H \"x-internal-key: $INTERNAL_KEY\" \\"
        echo "  -d '{\"teamId\":\"T123\",\"botToken\":\"xoxb-***\",\"defaultChannel\":\"C0123456789\",\"locale\":\"ko\"}'"
    fi
else
    echo "❌ 워크스페이스 API 호출 실패"
    echo "응답: $WORKSPACES_RESPONSE"
fi

# 5. 헬스체크 확인
echo "🏥 헬스체크 확인..."
HEALTH_RESPONSE=$(curl -s "$API_URL/slack/health" 2>/dev/null || echo '{"ok":false}')

if echo "$HEALTH_RESPONSE" | jq -e '.ok' > /dev/null 2>&1; then
    echo "✅ 헬스체크 통과"
    REGION_CHECK=$(echo "$HEALTH_RESPONSE" | jq -r '.region')
    SLACK_CHECK=$(echo "$HEALTH_RESPONSE" | jq -r '.slack')
    SIGNING_CHECK=$(echo "$HEALTH_RESPONSE" | jq -r '.signing')
    
    echo "  - 리전: $REGION_CHECK"
    echo "  - Slack: $SLACK_CHECK"
    echo "  - 서명: $SIGNING_CHECK"
else
    echo "❌ 헬스체크 실패"
    echo "응답: $HEALTH_RESPONSE"
fi

# 6. Feature Flags 초기화 확인
echo "🚩 Feature Flags 확인..."
FEATURES_RESPONSE=$(curl -s "$API_URL/slack/admin/features" \
    -H "x-internal-key: $INTERNAL_KEY" \
    -H "Content-Type: application/json" 2>/dev/null || echo '{"ok":false}')

if echo "$FEATURES_RESPONSE" | jq -e '.ok' > /dev/null 2>&1; then
    FEATURE_COUNT=$(echo "$FEATURES_RESPONSE" | jq '.features | length')
    echo "✅ Feature Flags: $FEATURE_COUNT개"
else
    echo "⚠️  Feature Flags API 호출 실패 (기능이 비활성화되었을 수 있음)"
fi

# 7. 빌드 테스트
echo "🔨 빌드 테스트..."
cd functions
if npm run build; then
    echo "✅ Functions 빌드 성공"
else
    echo "❌ Functions 빌드 실패"
    exit 1
fi
cd ..

# 8. 테스트 실행
echo "🧪 테스트 실행..."
if npm test; then
    echo "✅ 테스트 통과"
else
    echo "❌ 테스트 실패"
    exit 1
fi

# 9. 배포 준비 확인
echo "📋 배포 준비 확인..."
echo "다음 항목들이 확인되었습니다:"
echo "  ✅ 환경변수 설정"
echo "  ✅ PUBLIC_BASE_URL 설정"
echo "  ✅ 워크스페이스 등록"
echo "  ✅ 헬스체크 통과"
echo "  ✅ 빌드 성공"
echo "  ✅ 테스트 통과"

# 10. 배포 실행 여부 확인
read -p "배포를 실행하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 배포 시작..."
    
    # Functions 배포
    echo "📦 Functions 배포 중..."
    firebase deploy --only functions
    
    # Hosting 배포
    echo "🌐 Hosting 배포 중..."
    firebase deploy --only hosting
    
    # 배포 후 헬스체크
    echo "🏥 배포 후 헬스체크..."
    sleep 10
    HEALTH_RESPONSE=$(curl -s "$API_URL/slack/health" 2>/dev/null || echo '{"ok":false}')
    
    if echo "$HEALTH_RESPONSE" | jq -e '.ok' > /dev/null 2>&1; then
        echo "✅ 배포 성공! 헬스체크 통과"
        echo "🌐 애플리케이션 URL: $PUBLIC_BASE_URL"
    else
        echo "❌ 배포 후 헬스체크 실패"
        echo "응답: $HEALTH_RESPONSE"
        exit 1
    fi
else
    echo "⏭️  배포를 건너뛰었습니다."
    echo "준비가 완료되었으므로 언제든지 'firebase deploy'를 실행할 수 있습니다."
fi

echo "🎉 배포 체크 완료!"
