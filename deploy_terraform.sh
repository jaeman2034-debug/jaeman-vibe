#!/bin/bash

# 🚀 Terraform IaC 배포 스크립트

echo "🏗️ Terraform IaC 배포 시작..."

# 변수 확인
if [ -z "$1" ]; then
  echo "❌ 사용법: $0 <PROJECT_ID> [EMAIL_ADDRESS]"
  echo "예시: $0 my-project-id alerts@example.com"
  exit 1
fi

PROJECT_ID=$1
EMAIL_ADDRESS=${2:-""}
REGION="asia-northeast3"
MONITORING_RELAY_URL="https://${REGION}-${PROJECT_ID}.cloudfunctions.net/monitoringToSlack"

echo "📋 배포 정보:"
echo "   프로젝트: $PROJECT_ID"
echo "   리전: $REGION"
echo "   모니터링 릴레이 URL: $MONITORING_RELAY_URL"
echo "   이메일: ${EMAIL_ADDRESS:-'설정 안함'}"
echo ""

# Terraform 초기화
echo "🔧 Terraform 초기화 중..."
cd infra
terraform init

# Terraform 계획
echo "📋 Terraform 계획 생성 중..."
terraform plan \
  -var "project_id=$PROJECT_ID" \
  -var "region=$REGION" \
  -var "monitoring_relay_url=$MONITORING_RELAY_URL" \
  -var "email_address=$EMAIL_ADDRESS"

# 사용자 확인
echo ""
read -p "위 계획을 적용하시겠습니까? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ 배포가 취소되었습니다."
  exit 1
fi

# Terraform 적용
echo "🚀 Terraform 적용 중..."
terraform apply \
  -var "project_id=$PROJECT_ID" \
  -var "region=$REGION" \
  -var "monitoring_relay_url=$MONITORING_RELAY_URL" \
  -var "email_address=$EMAIL_ADDRESS" \
  -auto-approve

echo ""
echo "✅ Terraform IaC 배포 완료!"
echo ""
echo "📊 생성된 리소스:"
terraform output

cd ..
echo ""
echo "🎯 다음 단계:"
echo "1. Firebase Functions 배포 확인"
echo "2. Slack 웹훅 URL 설정 확인"
echo "3. 모니터링 대시보드 확인"
