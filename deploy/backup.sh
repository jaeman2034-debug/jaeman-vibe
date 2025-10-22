#!/bin/bash

# YAGO Stack 백업 스크립트
# 사용법: ./backup.sh

set -e

BACKUP_DIR="/var/backups/yago"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_DIR="/opt/yago-stack"

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

log_info "YAGO Stack 백업 시작..."

# 1. 데이터 볼륨 백업
log_info "데이터 볼륨 백업 중..."
sudo docker run --rm \
  -v yago_data_public:/data:ro \
  -v "$BACKUP_DIR":/backup \
  alpine:latest \
  tar czf "/backup/data_public_$DATE.tar.gz" -C /data .

# 2. 캐시 볼륨 백업
log_info "캐시 볼륨 백업 중..."
sudo docker run --rm \
  -v yago_data_cache:/data:ro \
  -v "$BACKUP_DIR":/backup \
  alpine:latest \
  tar czf "/backup/data_cache_$DATE.tar.gz" -C /data .

# 3. 설정 파일 백업
log_info "설정 파일 백업 중..."
sudo tar czf "$BACKUP_DIR/config_$DATE.tar.gz" \
  -C "$PROJECT_DIR" \
  .env \
  caddy/ \
  secrets/ \
  systemd/

# 4. Docker Compose 설정 백업
log_info "Docker Compose 설정 백업 중..."
sudo cp "$PROJECT_DIR/docker-compose.yml" "$BACKUP_DIR/docker-compose_$DATE.yml"

# 5. 오래된 백업 정리 (30일 이상)
log_info "오래된 백업 파일 정리 중..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.yml" -mtime +30 -delete

log_success "백업이 완료되었습니다: $BACKUP_DIR"

# 백업 파일 목록 출력
log_info "생성된 백업 파일:"
ls -lh "$BACKUP_DIR"/*$DATE*

# 백업 크기 확인
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
log_info "전체 백업 크기: $BACKUP_SIZE"
