#!/bin/bash

# 🔐 SSL 인증서 자동 설정 스크립트 (Let's Encrypt + Cloudflare)

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# 환경 변수 확인
if [ -z "$DOMAIN" ]; then
    log_error "DOMAIN 환경 변수가 설정되지 않았습니다."
    exit 1
fi

if [ -z "$LETSENCRYPT_EMAIL" ]; then
    log_error "LETSENCRYPT_EMAIL 환경 변수가 설정되지 않았습니다."
    exit 1
fi

# SSL 인증서 디렉토리 설정
SSL_DIR="./nginx/certs"
mkdir -p "$SSL_DIR"

log_info "SSL 인증서 설정 시작: $DOMAIN"

# Certbot 설치 확인
if ! command -v certbot &> /dev/null; then
    log_info "Certbot 설치 중..."
    
    # Ubuntu/Debian
    if command -v apt &> /dev/null; then
        sudo apt update
        sudo apt install -y certbot python3-certbot-nginx
    # CentOS/RHEL
    elif command -v yum &> /dev/null; then
        sudo yum install -y certbot python3-certbot-nginx
    else
        log_error "지원되지 않는 패키지 매니저입니다."
        exit 1
    fi
    
    log_success "Certbot 설치 완료"
fi

# Nginx 설정 파일 백업
log_info "Nginx 설정 파일 백업 중..."
cp "./nginx/default.conf" "./nginx/default.conf.backup.$(date +%Y%m%d_%H%M%S)"

# 임시 HTTP 설정 파일 생성 (인증서 발급용)
log_info "임시 HTTP 설정 파일 생성 중..."

cat > "./nginx/default.conf.temp" << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 200 'SSL 설정 중입니다. 잠시 후 다시 시도해주세요.';
        add_header Content-Type text/plain;
    }
}
EOF

# 임시 설정으로 Nginx 재시작
log_info "임시 설정으로 Nginx 재시작 중..."
cp "./nginx/default.conf.temp" "./nginx/default.conf"
docker-compose restart nginx

# Let's Encrypt 인증서 발급
log_info "Let's Encrypt 인증서 발급 중..."

if [ "$LETSENCRYPT_STAGING" = "true" ]; then
    STAGING_FLAG="--staging"
    log_warning "스테이징 모드로 인증서 발급 중..."
else
    STAGING_FLAG=""
    log_info "프로덕션 모드로 인증서 발급 중..."
fi

# Certbot으로 인증서 발급
sudo certbot certonly \
    --nginx \
    --non-interactive \
    --agree-tos \
    --email "$LETSENCRYPT_EMAIL" \
    --domains "$DOMAIN,www.$DOMAIN" \
    $STAGING_FLAG

if [ $? -eq 0 ]; then
    log_success "Let's Encrypt 인증서 발급 완료"
else
    log_error "Let's Encrypt 인증서 발급 실패"
    exit 1
fi

# 인증서 파일을 nginx/certs 디렉토리로 복사
log_info "인증서 파일 복사 중..."

sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/"
sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/"

sudo chown -R $(id -u):$(id -g) "$SSL_DIR"

if [ -f "$SSL_DIR/fullchain.pem" ] && [ -f "$SSL_DIR/privkey.pem" ]; then
    log_success "인증서 파일 복사 완료"
else
    log_error "인증서 파일 복사 실패"
    exit 1
fi

# 원본 설정 파일 복원
log_info "원본 설정 파일 복원 중..."
cp "./nginx/default.conf.backup.$(date +%Y%m%d_%H%M%S)" "./nginx/default.conf"

# Nginx 재시작
log_info "Nginx 재시작 중..."
docker-compose restart nginx

# SSL 인증서 테스트
log_info "SSL 인증서 테스트 중..."
sleep 10

if curl -s -f "https://$DOMAIN/health" > /dev/null; then
    log_success "SSL 인증서 테스트 성공"
else
    log_warning "SSL 인증서 테스트 실패 (시작 중일 수 있음)"
fi

# 인증서 자동 갱신 설정
log_info "인증서 자동 갱신 설정 중..."

# Cron 작업 추가
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'cd $(pwd) && docker-compose restart nginx'") | crontab -

log_success "인증서 자동 갱신 설정 완료"

# Cloudflare 설정 (선택사항)
if [ ! -z "$CLOUDFLARE_API_TOKEN" ] && [ ! -z "$CLOUDFLARE_ZONE_ID" ]; then
    log_info "Cloudflare SSL 설정 중..."
    
    # Cloudflare CLI 설치 확인
    if ! command -v cloudflared &> /dev/null; then
        log_info "Cloudflared 설치 중..."
        curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
        sudo dpkg -i cloudflared.deb
        rm cloudflared.deb
    fi
    
    # Cloudflare SSL/TLS 모드를 Full (strict)로 설정
    curl -X PATCH "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/settings/ssl" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"value":"full"}'
    
    if [ $? -eq 0 ]; then
        log_success "Cloudflare SSL 모드 설정 완료 (Full)"
    else
        log_warning "Cloudflare SSL 모드 설정 실패"
    fi
fi

# 임시 파일 정리
rm -f "./nginx/default.conf.temp"

# SSL 설정 완료 정보
log_success "SSL 설정 완료!"
echo ""
echo "🔐 SSL 인증서 정보:"
echo "  도메인: $DOMAIN"
echo "  인증서: $SSL_DIR/fullchain.pem"
echo "  개인키: $SSL_DIR/privkey.pem"
echo "  자동 갱신: 활성화"
echo ""
echo "🌐 테스트 URL:"
echo "  https://$DOMAIN/health"
echo "  https://$DOMAIN/"
echo ""

# Slack 알림 (선택사항)
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    log_info "Slack 알림 전송 중..."
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🔐 SSL 인증서 설정 완료\\n\\n📊 SSL 정보:\\n• 도메인: $DOMAIN\\n• 인증서: Let's Encrypt\\n• 자동 갱신: 활성화\\n• 시간: $(date '+%Y-%m-%d %H:%M:%S')\"}" \
        "$SLACK_WEBHOOK_URL"
    
    if [ $? -eq 0 ]; then
        log_success "Slack 알림 전송 완료"
    else
        log_warning "Slack 알림 전송 실패"
    fi
fi

log_success "SSL 설정 작업 완료!"
