#!/bin/bash

# 시크릿 동기화 스크립트
# 사용법: ./sync-secrets.sh <PROJECT_ID> [ENVIRONMENT]

set -e

PROJECT_ID=$1
ENVIRONMENT=${2:-prod}
REGION=${3:-asia-northeast3}

if [ -z "$PROJECT_ID" ]; then
    echo "사용법: $0 <PROJECT_ID> [ENVIRONMENT] [REGION]"
    echo "예시: $0 my-project prod asia-northeast3"
    exit 1
fi

echo "🚀 시크릿 동기화 시작..."
echo "프로젝트: $PROJECT_ID"
echo "환경: $ENVIRONMENT"
echo "리전: $REGION"

# gcloud 인증 확인
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ gcloud 인증이 필요합니다. 'gcloud auth login'을 실행하세요."
    exit 1
fi

# 프로젝트 설정
gcloud config set project $PROJECT_ID

# Secret Manager API 활성화
echo "📦 Secret Manager API 활성화..."
gcloud services enable secretmanager.googleapis.com

# 시크릿 정의
declare -A SECRETS=(
    ["slack-bot-token-$ENVIRONMENT"]="Slack Bot Token (xoxb-...)"
    ["slack-signing-secret-$ENVIRONMENT"]="Slack Signing Secret"
    ["slack-signing-secret-old-$ENVIRONMENT"]="Slack Signing Secret (Old)"
    ["internal-key-$ENVIRONMENT"]="Internal API Key"
    ["internal-hmac-secret-$ENVIRONMENT"]="Internal HMAC Secret"
    ["n8n-webhook-approved-$ENVIRONMENT"]="n8n Webhook URL (Primary)"
    ["n8n-webhook-approved-fo-$ENVIRONMENT"]="n8n Webhook URL (Fallback)"
    ["sentry-dsn-$ENVIRONMENT"]="Sentry DSN"
    ["bigquery-dataset-$ENVIRONMENT"]="BigQuery Dataset"
)

# 시크릿 생성 또는 업데이트
for secret_id in "${!SECRETS[@]}"; do
    description="${SECRETS[$secret_id]}"
    
    echo "🔐 처리 중: $secret_id"
    
    # 시크릿이 존재하는지 확인
    if gcloud secrets describe $secret_id --quiet 2>/dev/null; then
        echo "  ✅ 시크릿이 이미 존재합니다."
        
        # 새 버전 추가 여부 확인
        read -p "  새 버전을 추가하시겠습니까? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "  📝 새 버전 추가 중..."
            read -s -p "  $description: " secret_value
            echo
            
            echo "$secret_value" | gcloud secrets versions add $secret_id --data-file=-
            echo "  ✅ 새 버전이 추가되었습니다."
        fi
    else
        echo "  🆕 새 시크릿 생성 중..."
        read -s -p "  $description: " secret_value
        echo
        
        # 시크릿 생성
        gcloud secrets create $secret_id \
            --replication-policy="automatic" \
            --labels="environment=$ENVIRONMENT,service=slack-approval"
        
        # 첫 번째 버전 추가
        echo "$secret_value" | gcloud secrets versions add $secret_id --data-file=-
        echo "  ✅ 시크릿이 생성되었습니다."
    fi
done

# Firebase Functions 환경변수 업데이트
echo "🔄 Firebase Functions 환경변수 업데이트..."

# Firebase Functions Config 설정
firebase functions:config:set \
    slack.bot_token="$(gcloud secrets versions access latest --secret=slack-bot-token-$ENVIRONMENT)" \
    slack.signing_secret="$(gcloud secrets versions access latest --secret=slack-signing-secret-$ENVIRONMENT)" \
    slack.signing_secret_old="$(gcloud secrets versions access latest --secret=slack-signing-secret-old-$ENVIRONMENT)" \
    internal.key="$(gcloud secrets versions access latest --secret=internal-key-$ENVIRONMENT)" \
    internal.hmac="$(gcloud secrets versions access latest --secret=internal-hmac-secret-$ENVIRONMENT)" \
    n8n.approved_webhook="$(gcloud secrets versions access latest --secret=n8n-webhook-approved-$ENVIRONMENT)" \
    n8n.approved_webhook_fo="$(gcloud secrets versions access latest --secret=n8n-webhook-approved-fo-$ENVIRONMENT)" \
    sentry.dsn="$(gcloud secrets versions access latest --secret=sentry-dsn-$ENVIRONMENT)" \
    bigquery.dataset="$(gcloud secrets versions access latest --secret=bigquery-dataset-$ENVIRONMENT)"

echo "✅ Firebase Functions Config가 업데이트되었습니다."

# Terraform 상태 동기화
if [ -f "terraform/secrets.tf" ]; then
    echo "🏗️ Terraform 상태 동기화..."
    cd terraform
    
    # Terraform 초기화
    terraform init
    
    # Terraform 계획
    terraform plan -var="project_id=$PROJECT_ID" -var="environment=$ENVIRONMENT" -var="region=$REGION"
    
    # 적용 여부 확인
    read -p "Terraform 변경사항을 적용하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        terraform apply -var="project_id=$PROJECT_ID" -var="environment=$ENVIRONMENT" -var="region=$REGION" -auto-approve
        echo "✅ Terraform이 적용되었습니다."
    else
        echo "⏭️ Terraform 적용을 건너뛰었습니다."
    fi
    
    cd ..
fi

# 시크릿 목록 출력
echo "📋 생성된 시크릿 목록:"
gcloud secrets list --filter="labels.service=slack-approval AND labels.environment=$ENVIRONMENT" --format="table(name,createTime,labels.environment)"

echo "🎉 시크릿 동기화가 완료되었습니다!"

# 다음 단계 안내
echo ""
echo "📝 다음 단계:"
echo "1. Firebase Functions 배포: firebase deploy --only functions"
echo "2. 헬스체크 확인: curl https://$REGION-$PROJECT_ID.cloudfunctions.net/slack/slack/health"
echo "3. 테스트 실행: ./e2e_smoke_test.sh"
