#!/bin/bash

# 🚀 YAGO VIBE 운영 환경 자동 배포 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 배너 출력
echo "🎧 YAGO VIBE 운영 환경 자동 배포 스크립트"
echo "================================================"
echo ""

# 1. 환경 변수 파일 확인
log_info "환경 변수 파일 확인 중..."
if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        log_warning ".env 파일이 없습니다. env.example을 복사합니다..."
        cp env.example .env
        log_warning "⚠️  .env 파일을 편집하여 실제 값들로 수정해주세요!"
        echo ""
        echo "필수 설정 항목:"
        echo "  - DOMAIN (예: yago.ai)"
        echo "  - FIREBASE_PROJECT, FIREBASE_TOKEN"
        echo "  - N8N_USER, N8N_PASS, N8N_ENCRYPTION_KEY"
        echo "  - OPENAI_API_KEY, SLACK_WEBHOOK_URL"
        echo "  - SPEAKER_LIVING_ROOM, SPEAKER_BEDROOM, SPEAKER_KITCHEN"
        echo ""
        read -p "설정을 완료한 후 Enter를 눌러주세요..."
    else
        log_error "env.example 파일이 없습니다!"
        exit 1
    fi
else
    log_success ".env 파일 확인 완료"
fi

# 환경 변수 로드
source .env

# 2. 시스템 요구사항 확인
log_info "시스템 요구사항 확인 중..."

# Docker 확인
if ! command -v docker &> /dev/null; then
    log_error "Docker가 설치되지 않았습니다!"
    log_info "Docker 설치 가이드: https://docs.docker.com/engine/install/"
    exit 1
fi

# Docker Compose 확인
if ! command -v docker-compose &> /dev/null && ! command -v docker compose &> /dev/null; then
    log_error "Docker Compose가 설치되지 않았습니다!"
    exit 1
fi

# 권한 확인
if ! docker ps &> /dev/null; then
    log_error "Docker 실행 권한이 없습니다!"
    log_info "sudo usermod -aG docker $USER 실행 후 재로그인하세요."
    exit 1
fi

log_success "시스템 요구사항 확인 완료"

# 3. 필요한 디렉토리 생성
log_info "필요한 디렉토리 생성 중..."
mkdir -p n8n_data
mkdir -p backups/{firestore,n8n,logs}
mkdir -p nginx/{certs,logs}
mkdir -p monitoring/{data,grafana/{dashboards,datasources}}
mkdir -p scripts

log_success "디렉토리 생성 완료"

# 4. 스크립트 실행 권한 설정
log_info "스크립트 실행 권한 설정 중..."
chmod +x scripts/*.sh

log_success "스크립트 권한 설정 완료"

# 5. 기존 컨테이너 정리 (선택사항)
read -p "기존 컨테이너를 정리하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "기존 컨테이너 정리 중..."
    docker-compose down --remove-orphans || true
    docker system prune -f || true
    log_success "기존 컨테이너 정리 완료"
fi

# 6. Docker 이미지 빌드 및 컨테이너 시작
log_info "Docker 이미지 빌드 및 컨테이너 시작 중..."
docker-compose up -d --build

# 7. 컨테이너 상태 확인
log_info "컨테이너 상태 확인 중..."
sleep 15

# 컨테이너별 상태 확인
containers=("yago-proxy" "yago-n8n" "yago-cast" "yago-watchtower")

for container in "${containers[@]}"; do
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container.*Up"; then
        log_success "$container 컨테이너 정상 실행 중"
    else
        log_error "$container 컨테이너 실행 실패"
        echo "로그 확인:"
        docker logs "$container" --tail 20
    fi
done

# 8. 서비스 헬스체크
log_info "서비스 헬스체크 수행 중..."

# Nginx 헬스체크
if curl -s -f http://localhost/health > /dev/null 2>&1; then
    log_success "Nginx 서비스 정상 동작"
else
    log_warning "Nginx 서비스 헬스체크 실패 (시작 중일 수 있음)"
fi

# n8n 헬스체크
if curl -s -f http://localhost:5678/healthz > /dev/null 2>&1; then
    log_success "n8n 서비스 정상 동작"
else
    log_warning "n8n 서비스 헬스체크 실패"
fi

# Cast Bridge 헬스체크
if curl -s -f http://localhost:4000/status > /dev/null 2>&1; then
    log_success "Cast Bridge 서비스 정상 동작"
else
    log_warning "Cast Bridge 서비스 헬스체크 실패"
fi

# 9. SSL 인증서 설정 (선택사항)
if [ ! -z "$DOMAIN" ] && [ "$DOMAIN" != "localhost" ]; then
    read -p "SSL 인증서를 설정하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "SSL 인증서 설정 중..."
        ./scripts/setup-ssl.sh
        
        if [ $? -eq 0 ]; then
            log_success "SSL 인증서 설정 완료"
        else
            log_warning "SSL 인증서 설정 실패"
        fi
    fi
fi

# 10. 백업 스케줄러 설정
log_info "백업 스케줄러 설정 중..."
chmod +x scripts/backup-*.sh

# Cron 작업 추가 (중복 방지)
CRON_JOBS=(
    "0 2 * * * $(pwd)/scripts/backup-firestore.sh"
    "0 3 * * * $(pwd)/scripts/backup-n8n.sh"
    "0 4 * * * $(pwd)/scripts/backup-logs.sh"
)

for job in "${CRON_JOBS[@]}"; do
    if ! crontab -l 2>/dev/null | grep -q "$job"; then
        (crontab -l 2>/dev/null; echo "$job") | crontab -
    fi
done

log_success "백업 스케줄러 설정 완료"

# 11. 모니터링 설정
log_info "모니터링 서비스 확인 중..."
if docker ps | grep -q "yago-prometheus\|yago-grafana"; then
    log_success "모니터링 서비스 정상 실행 중"
    log_info "Grafana 접속: http://localhost:3000 (admin/${GRAFANA_PASSWORD:-admin123})"
    log_info "Prometheus 접속: http://localhost:9090"
else
    log_warning "모니터링 서비스가 실행되지 않았습니다"
fi

# 12. 배포 완료 메시지
echo ""
echo "🎉 YAGO VIBE 운영 환경 배포 완료!"
echo ""
echo "📱 서비스 접속 정보:"
if [ ! -z "$DOMAIN" ] && [ "$DOMAIN" != "localhost" ]; then
    echo "  🔧 n8n:           https://$DOMAIN"
    echo "  🎵 Cast Bridge:   https://$DOMAIN/cast"
    echo "  📊 Grafana:       https://monitoring.$DOMAIN"
else
    echo "  🔧 n8n:           http://localhost:5678"
    echo "  🎵 Cast Bridge:   http://localhost:4000"
    echo "  📊 Grafana:       http://localhost:3000"
fi
echo ""
echo "🎧 스마트 스피커 테스트:"
echo "  📱 Kakao Mini:    '야고 브리핑 틀어줘'"
echo "  🔊 Google Home:   '오케이 구글, 야고 브리핑'"
echo ""
echo "🔧 관리 명령어:"
echo "  📊 상태 확인:     docker-compose ps"
echo "  📋 로그 확인:     docker-compose logs -f [서비스명]"
echo "  🛑 서비스 중지:   docker-compose down"
echo "  🔄 재시작:        docker-compose restart [서비스명]"
echo ""
echo "🗄️ 백업 관리:"
echo "  📅 자동 백업:     매일 02:00 (Firestore), 03:00 (n8n), 04:00 (로그)"
echo "  📂 백업 위치:     ./backups/"
echo "  🔧 수동 백업:     ./scripts/backup-*.sh"
echo ""

# 13. 추가 설정 안내
echo "📋 추가 설정 안내:"
echo "  1. Kakao i 오픈빌더에서 웹훅 URL 설정:"
if [ ! -z "$DOMAIN" ] && [ "$DOMAIN" != "localhost" ]; then
    echo "     https://$DOMAIN/webhook/briefing"
else
    echo "     http://localhost:5678/webhook/briefing"
fi
echo ""
echo "  2. IFTTT 루틴 설정:"
if [ ! -z "$DOMAIN" ] && [ "$DOMAIN" != "localhost" ]; then
    echo "     Webhook URL: https://$DOMAIN/webhook/cast-latest"
else
    echo "     Webhook URL: http://localhost:5678/webhook/cast-latest"
fi
echo ""
echo "  3. 스피커 IP 확인:"
echo "     Google Home 앱 → 설정 → Wi-Fi → 고급 네트워크 설정"
echo ""
echo "  4. .env 파일에서 스피커 IP 업데이트"
echo ""

# 14. Slack 알림 (선택사항)
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    log_info "Slack 알림 전송 중..."
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚀 YAGO VIBE 운영 환경 배포 완료!\\n\\n📊 배포 정보:\\n• 도메인: ${DOMAIN:-localhost}\\n• n8n: 정상 실행\\n• Cast Bridge: 정상 실행\\n• 백업: 자동 스케줄 설정\\n• 시간: $(date '+%Y-%m-%d %H:%M:%S')\"}" \
        "$SLACK_WEBHOOK_URL"
    
    if [ $? -eq 0 ]; then
        log_success "Slack 알림 전송 완료"
    else
        log_warning "Slack 알림 전송 실패"
    fi
fi

# 15. 실시간 로그 모니터링 옵션
read -p "실시간 로그를 확인하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "실시간 로그 모니터링 시작 (Ctrl+C로 종료)..."
    docker-compose logs -f
fi

log_success "YAGO VIBE 운영 환경 배포 완료! 🎧"
