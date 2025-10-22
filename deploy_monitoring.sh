#!/bin/bash

# 프로덕션 관제 시스템 배포 스크립트

echo "🚀 YAGO VIBE 프로덕션 관제 시스템 배포 시작..."

# 1. Functions 의존성 설치 및 배포
echo "📦 Functions 의존성 설치 중..."
cd functions
npm install @google-cloud/monitoring

echo "🔧 Functions 배포 중..."
firebase deploy --only functions

cd ..

# 2. Hosting 배포 (rewrite 설정 포함)
echo "🌐 Hosting 배포 중..."
firebase deploy --only hosting

# 3. BigQuery Export 확장 설치 안내
echo "📊 BigQuery Export 확장 설치 안내:"
echo "다음 명령어를 실행하세요:"
echo ""
echo "firebase ext:install firestore-bigquery-export \\"
echo "  --project \$(firebase use --current) \\"
echo "  --local \\"
echo "  --params=\"LOCATION=asia-northeast3,COLLECTION_PATH=events/*/registrations;events/*/outbox;telemetry,DATASET_ID=vibe,REFRESH_EXPORTED_DOCUMENTS=true\""
echo ""

# 4. BigQuery 뷰 생성 안내
echo "📈 BigQuery 뷰 생성 안내:"
echo "bigquery_views.sql 파일의 쿼리를 BigQuery 콘솔에서 실행하세요."
echo ""

# 5. Cloud Monitoring 알림 정책 생성 안내
echo "🚨 Cloud Monitoring 알림 정책 생성 안내:"
echo "1. 알림 채널을 먼저 생성하세요 (이메일/Slack/Webhook 등)"
echo "2. 다음 명령어를 실행하세요:"
echo ""
echo "# 변수 치환 필요:"
echo "# \${PROJECT_NUMBER}: GCP 프로젝트 넘버"
echo "# \${NOTIF_CHANNEL_ID}: 알림 채널 ID"
echo ""
echo "gcloud monitoring policies create --policy-from-file=policy_pending_fanout.json"
echo "gcloud monitoring policies create --policy-from-file=policy_fanout_failed_fcm.json"
echo ""

# 6. n8n 워크플로우 업데이트 안내
echo "🔄 n8n 워크플로우 업데이트 안내:"
echo "n8n_workflow_fanout_with_ack.json 파일을 n8n에 Import하세요."
echo "환경변수 설정:"
echo "- N8N_SHARED_SECRET (기존)"
echo "- FNS_SEND_FCM_URL (기존)"
echo "- FNS_FANOUT_ACK_URL = https://<functions-host>/fanoutAck"
echo ""

# 7. Looker Studio 대시보드 구성 안내
echo "📊 Looker Studio 대시보드 구성 안내:"
echo "looker_studio_dashboard_guide.md 파일을 참고하여 대시보드를 구성하세요."
echo ""

echo "✅ 배포 완료! 모든 관제 시스템이 준비되었습니다."
echo ""
echo "🔍 테스트 체크리스트:"
echo "- [ ] Functions: fanoutAck, fanoutGauge 정상 동작"
echo "- [ ] n8n: ACK 호출 포함 워크플로우 동작"
echo "- [ ] BigQuery: 데이터 유입 확인"
echo "- [ ] Cloud Monitoring: 메트릭 수집 확인"
echo "- [ ] Looker Studio: 대시보드 데이터 표시 확인"
echo ""
echo "🎯 프로덕션 관제 시스템 구축 완료!"
