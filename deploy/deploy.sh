#!/bin/bash

# YAGO Stack 배포 스크립트
# 사용법: ./deploy.sh [dev|prod|ghcr]

set -e

DEPLOY_ENV=${1:-prod}
PROJECT_DIR="/opt/yago-stack"

echo "🚀 YAGO Stack 배포 시작 (환경: $DEPLOY_ENV)"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정의
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Docker 설치 확인
check_docker() {
    log_info "Docker 설치 확인 중..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker가 설치되지 않았습니다."
        exit 1
    fi
    
    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose가 설치되지 않았습니다."
        exit 1
    fi
    
    log_success "Docker 및 Docker Compose가 설치되어 있습니다."
}

# 디렉토리 확인
check_directory() {
    log_info "배포 디렉토리 확인 중..."
    if [ ! -d "$PROJECT_DIR" ]; then
        log_warning "배포 디렉토리가 존재하지 않습니다. 생성 중..."
        sudo mkdir -p "$PROJECT_DIR"
    fi
    
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        log_error ".env 파일이 없습니다. env.production을 복사하여 설정하세요."
        exit 1
    fi
    
    log_success "배포 디렉토리가 준비되었습니다."
}

# 환경변수 확인
check_env() {
    log_info "환경변수 확인 중..."
    
    source "$PROJECT_DIR/.env"
    
    required_vars=("DOMAIN" "CADDY_EMAIL" "VITE_FB_API_KEY" "VITE_FB_PROJECT_ID")
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "필수 환경변수 $var가 설정되지 않았습니다."
            exit 1
        fi
    done
    
    log_success "필수 환경변수가 설정되어 있습니다."
}

# Docker 이미지 빌드 및 실행
deploy_services() {
    log_info "Docker 서비스 배포 중..."
    
    cd "$PROJECT_DIR"
    
    # 기존 서비스 중지
    log_info "기존 서비스 중지 중..."
    sudo docker compose down || true
    
    # GHCR 배포 모드 확인
    if [ -f "docker-compose.ghcr.yml" ] && [ "$DEPLOY_ENV" = "ghcr" ]; then
        log_info "GHCR 모드로 배포 중..."
        
        # GHCR 로그인 확인
        if ! docker info | grep -q "ghcr.io"; then
            log_warning "GHCR 로그인이 필요합니다. GITHUB_TOKEN을 설정하세요."
        fi
        
        # 이미지 풀 및 배포
        log_info "GHCR에서 이미지 풀 중..."
        sudo docker compose -f docker-compose.ghcr.yml pull
        sudo docker compose -f docker-compose.ghcr.yml up -d
        
        log_success "GHCR 이미지 배포가 완료되었습니다."
    else
        # 로컬 빌드 모드
        log_info "로컬 이미지 빌드 중..."
        sudo docker compose build --no-cache
        
        # 서비스 시작
        log_info "서비스 시작 중..."
        sudo docker compose up -d
        
        log_success "로컬 빌드 배포가 완료되었습니다."
    fi
}

# 헬스체크
health_check() {
    log_info "헬스체크 실행 중..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "헬스체크 시도 $attempt/$max_attempts"
        
        # 웹 서비스 체크
        if curl -f -s "https://$DOMAIN/" > /dev/null; then
            log_success "웹 서비스가 정상 작동 중입니다."
            break
        fi
        
        # 웹훅 서비스 체크
        if curl -f -s "https://$DOMAIN/webhook/healthz" > /dev/null; then
            log_success "웹훅 서비스가 정상 작동 중입니다."
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "헬스체크 실패. 서비스가 정상적으로 시작되지 않았습니다."
            return 1
        fi
        
        sleep 10
        ((attempt++))
    done
    
    return 0
}

# 스모크 테스트
smoke_test() {
    log_info "스모크 테스트 실행 중..."
    
    local domain="$DOMAIN"
    local tests_passed=0
    local total_tests=5
    
    # 1. 홈페이지
    if curl -f -s "https://$domain/" > /dev/null; then
        log_success "✅ 홈페이지 접근 성공"
        ((tests_passed++))
    else
        log_error "❌ 홈페이지 접근 실패"
    fi
    
    # 2. OG 이미지 생성
    if curl -f -s "https://$domain/og?title=test&sport=soccer" > /dev/null; then
        log_success "✅ OG 이미지 생성 성공"
        ((tests_passed++))
    else
        log_error "❌ OG 이미지 생성 실패"
    fi
    
    # 3. 사이트맵
    if curl -f -s "https://$domain/sitemap.xml" > /dev/null; then
        log_success "✅ 사이트맵 접근 성공"
        ((tests_passed++))
    else
        log_error "❌ 사이트맵 접근 실패"
    fi
    
    # 4. 헬스체크
    if curl -f -s "https://$domain/webhook/healthz" > /dev/null; then
        log_success "✅ 헬스체크 성공"
        ((tests_passed++))
    else
        log_error "❌ 헬스체크 실패"
    fi
    
    # 5. 팀 블로그 테스트
    if curl -f -s -X POST "https://$domain/webhook/team-blog-test" > /dev/null; then
        log_success "✅ 팀 블로그 테스트 성공"
        ((tests_passed++))
    else
        log_error "❌ 팀 블로그 테스트 실패"
    fi
    
    log_info "스모크 테스트 결과: $tests_passed/$total_tests 통과"
    
    if [ $tests_passed -eq $total_tests ]; then
        log_success "🎉 모든 스모크 테스트가 통과했습니다!"
        return 0
    else
        log_error "일부 스모크 테스트가 실패했습니다."
        return 1
    fi
}

# Systemd 서비스 설정
setup_systemd() {
    log_info "Systemd 서비스 설정 중..."
    
    if [ ! -f "/etc/systemd/system/yago-stack.service" ]; then
        log_info "Systemd 유닛 파일 복사 중..."
        sudo cp "$PROJECT_DIR/systemd/yago-stack.service" /etc/systemd/system/
        sudo systemctl daemon-reload
        sudo systemctl enable yago-stack
        log_success "Systemd 서비스가 설정되었습니다."
    else
        log_info "Systemd 서비스가 이미 설정되어 있습니다."
    fi
}

# 메인 실행
main() {
    log_info "YAGO Stack 배포를 시작합니다..."
    
    check_docker
    check_directory
    check_env
    deploy_services
    
    log_info "서비스 시작 대기 중..."
    sleep 30
    
    if health_check; then
        log_success "서비스가 정상적으로 시작되었습니다."
        
        if smoke_test; then
            setup_systemd
            log_success "🎉 YAGO Stack 배포가 완료되었습니다!"
            log_info "서비스 관리: sudo systemctl start/stop/restart yago-stack"
            log_info "로그 확인: sudo docker compose logs -f"
        else
            log_error "스모크 테스트 실패. 배포를 확인하세요."
            exit 1
        fi
    else
        log_error "서비스 시작 실패. 로그를 확인하세요."
        log_info "로그 확인: sudo docker compose logs -f"
        exit 1
    fi
}

# 스크립트 실행
main "$@"
