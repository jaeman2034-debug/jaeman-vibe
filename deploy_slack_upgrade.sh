#!/bin/bash

# Slack 업그레이드 배포 스크립트

echo "🚀 Slack 업그레이드 배포 시작..."

# 1. Functions 의존성 설치
echo "📦 Functions 의존성 설치 중..."
cd functions
npm install axios

# 2. Functions 배포
echo "🔧 monitoringToSlack 함수 배포 중..."
firebase deploy --only functions:monitoringToSlack

cd ..

# 3. 환경변수 설정 안내
echo ""
echo "🔧 환경변수 설정 안내:"
echo "다음 명령어로 환경변수를 설정하세요:"
echo ""
echo "firebase functions:secrets:set SLACK_WEBHOOK_URL"
echo "firebase functions:config:set alert_min_interval_sec=120"
echo ""

# 4. 테스트 안내
echo "🧪 테스트 방법:"
echo "1. 환경변수 설정 후 Functions 재배포:"
echo "   firebase deploy --only functions:monitoringToSlack"
echo ""
echo "2. 테스트 실행:"
echo "   # Linux/Mac"
echo "   ./test_monitoring_slack.sh"
echo ""
echo "   # Windows PowerShell"
echo "   .\test_monitoring_slack.ps1 -ProjectId <YOUR_PROJECT_ID>"
echo ""

# 5. Slack 워크스페이스 설정 안내
echo "📱 Slack 워크스페이스 설정:"
echo "1. Slack 앱 생성: https://api.slack.com/apps"
echo "2. Incoming Webhooks 활성화"
echo "3. 웹훅 URL 복사 후 SLACK_WEBHOOK_URL에 설정"
echo ""

echo "✅ Slack 업그레이드 배포 완료!"
echo ""
echo "🎯 새로운 기능:"
echo "   - Slack Blocks 리치 포맷"
echo "   - 디듀프 (중복 알림 방지)"
echo "   - 상태별 이모지/컬러"
echo "   - Cloud Monitoring 링크 버튼"
