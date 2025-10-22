#!/bin/bash
# YAGO Stack 빠른 실행 스크립트

echo "🚀 YAGO Stack 빠른 실행을 시작합니다..."

# 환경변수 파일 확인
if [ ! -f .env ]; then
  echo "📝 .env 파일이 없습니다. env.template을 복사합니다..."
  cp env.template .env
  echo "⚠️  .env 파일을 편집하여 필요한 값들을 설정하세요!"
  echo "   특히 DOMAIN, SITE_NAME, SITE_URL 등을 확인하세요."
  read -p "계속하시겠습니까? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Docker 설치 확인
if ! command -v docker &> /dev/null; then
  echo "🐳 Docker가 설치되지 않았습니다. 설치를 시작합니다..."
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  echo "⚠️  로그아웃 후 다시 로그인하거나 'newgrp docker'를 실행하세요."
fi

# Docker Compose 설치 확인
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
  echo "🐳 Docker Compose가 설치되지 않았습니다. 설치를 시작합니다..."
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
fi

# 서비스 빌드 및 시작
echo "🔨 서비스를 빌드하고 시작합니다..."
docker compose up -d --build

# 상태 확인
echo "⏳ 서비스 시작을 기다립니다..."
sleep 10

# 헬스체크
echo "🏥 서비스 상태를 확인합니다..."
if curl -s http://127.0.0.1/og?title=YAGO%20VIBE > /dev/null; then
  echo "✅ OG 서비스 정상 동작"
else
  echo "❌ OG 서비스 오류"
fi

if curl -s http://127.0.0.1/webhook/healthz > /dev/null; then
  echo "✅ 웹훅 서비스 정상 동작"
else
  echo "❌ 웹훅 서비스 오류"
fi

echo ""
echo "🎉 YAGO Stack이 성공적으로 시작되었습니다!"
echo ""
echo "📋 테스트 명령어:"
echo "  OG 이미지: curl 'http://127.0.0.1/og?title=YAGO%20VIBE&subtitle=테스트' -o test.png"
echo "  피드: curl http://127.0.0.1/feed.json"
echo "  웹훅: curl -X POST http://127.0.0.1/webhook/post-published -H 'Content-Type: application/json' -d '{\"id\":\"test\",\"title\":\"테스트 포스트\"}'"
echo ""
echo "📊 로그 확인: docker compose logs -f"
echo "🛑 중지: docker compose down"
