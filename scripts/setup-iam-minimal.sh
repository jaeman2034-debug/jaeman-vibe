#!/bin/bash

# 🔐 최소 권한 IAM 바인딩 스크립트

if [ -z "$1" ]; then
  echo "❌ 사용법: $0 <PROJECT_ID>"
  echo "예시: $0 my-project-id"
  exit 1
fi

PROJECT_ID=$1
SA_FUN="fn-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
SA_TF="tf-deployer@${PROJECT_ID}.iam.gserviceaccount.com"

echo "🔐 최소 권한 IAM 바인딩 시작..."
echo "📋 프로젝트: $PROJECT_ID"
echo ""

# Functions CI 배포용 SA 권한
echo "🔧 Functions CI 배포용 SA 권한 설정..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_FUN" \
  --role="roles/cloudfunctions.developer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_FUN" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_FUN" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_FUN" \
  --role="roles/iam.serviceAccountUser"

echo "✅ Functions CI 권한 설정 완료"
echo ""

# Terraform용 SA 권한 (모니터링만)
echo "🏗️ Terraform용 SA 권한 설정..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_TF" \
  --role="roles/monitoring.alertPolicyEditor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_TF" \
  --role="roles/monitoring.notificationChannelEditor"

echo "✅ Terraform 권한 설정 완료"
echo ""

echo "🎯 설정된 권한:"
echo "   Functions CI: Cloud Functions, Cloud Run, Artifact Registry, Service Account User"
echo "   Terraform: Monitoring Alert Policy, Notification Channel"
echo ""
echo "⚠️  주의: Owner/Editor 권한은 부여하지 않았습니다."
echo "   필요시 개별 역할을 추가로 부여하세요."
