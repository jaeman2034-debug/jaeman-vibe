#!/bin/bash

# 🎧 YAGO VIBE 올인원 도커 스택 배포 스크립트

set -e

echo "🚀 YAGO VIBE 올인원 도커 스택 배포 시작..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정의
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

# 1. 환경 변수 파일 확인
log_info "환경 변수 파일 확인 중..."
if [ ! -f ".env" ]; then
    if [ -f "env.example" ]; then
        log_warning ".env 파일이 없습니다. env.example을 복사합니다..."
        cp env.example .env
        log_warning "⚠️  .env 파일을 편집하여 실제 값들로 수정해주세요!"
        echo ""
        echo "필수 설정 항목:"
        echo "  - N8N_USER, N8N_PASS"
        echo "  - FIREBASE_PROJECT, FIREBASE_TOKEN"
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

# 2. Docker 및 Docker Compose 확인
log_info "Docker 및 Docker Compose 확인 중..."
if ! command -v docker &> /dev/null; then
    log_error "Docker가 설치되지 않았습니다!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! command -v docker compose &> /dev/null; then
    log_error "Docker Compose가 설치되지 않았습니다!"
    exit 1
fi

log_success "Docker 환경 확인 완료"

# 3. 기존 컨테이너 정리 (선택사항)
read -p "기존 컨테이너를 정리하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "기존 컨테이너 정리 중..."
    docker-compose down --remove-orphans || true
    docker system prune -f || true
    log_success "기존 컨테이너 정리 완료"
fi

# 4. 이미지 빌드 및 컨테이너 시작
log_info "도커 이미지 빌드 및 컨테이너 시작 중..."
docker-compose up -d --build

# 5. 컨테이너 상태 확인
log_info "컨테이너 상태 확인 중..."
sleep 10

# 컨테이너별 상태 확인
containers=("yago-n8n" "yago-cast-bridge" "yago-firebase-emulator")

for container in "${containers[@]}"; do
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container.*Up"; then
        log_success "$container 컨테이너 정상 실행 중"
    else
        log_error "$container 컨테이너 실행 실패"
        echo "로그 확인:"
        docker logs "$container" --tail 20
    fi
done

# 6. 서비스 헬스체크
log_info "서비스 헬스체크 수행 중..."

# n8n 헬스체크
if curl -s -f http://localhost:5678/healthz > /dev/null 2>&1; then
    log_success "n8n 서비스 정상 동작"
else
    log_warning "n8n 서비스 헬스체크 실패 (시작 중일 수 있음)"
fi

# Cast Bridge 헬스체크
if curl -s -f http://localhost:4000/status > /dev/null 2>&1; then
    log_success "Cast Bridge 서비스 정상 동작"
else
    log_warning "Cast Bridge 서비스 헬스체크 실패"
fi

# Firebase Emulator 헬스체크
if curl -s -f http://localhost:4001 > /dev/null 2>&1; then
    log_success "Firebase Emulator 서비스 정상 동작"
else
    log_warning "Firebase Emulator 서비스 헬스체크 실패"
fi

# 7. 배포 완료 메시지
echo ""
echo "🎉 YAGO VIBE 올인원 도커 스택 배포 완료!"
echo ""
echo "📱 서비스 접속 정보:"
echo "  🔧 n8n:           http://localhost:5678 (admin/supersecret)"
echo "  🎵 Cast Bridge:   http://localhost:4000"
echo "  🔥 Firebase UI:   http://localhost:4001"
echo "  🌐 프록시:        https://localhost"
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
log_success "배포 완료! 스마트 스피커 브리핑을 즐겨보세요! 🎧"

# 8. 추가 설정 안내
echo ""
echo "📋 추가 설정 안내:"
echo "  1. Kakao i 오픈빌더에서 웹훅 URL 설정:"
echo "     http://localhost:5678/webhook/briefing"
echo ""
echo "  2. IFTTT 루틴 설정:"
echo "     Webhook URL: http://localhost:5678/webhook/cast-latest"
echo ""
echo "  3. 스피커 IP 확인:"
echo "     Google Home 앱 → 설정 → Wi-Fi → 고급 네트워크 설정"
echo ""
echo "  4. .env 파일에서 스피커 IP 업데이트"
echo ""

# 9. 실시간 로그 모니터링 옵션
read -p "실시간 로그를 확인하시겠습니까? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "실시간 로그 모니터링 시작 (Ctrl+C로 종료)..."
    docker-compose logs -f
fi
