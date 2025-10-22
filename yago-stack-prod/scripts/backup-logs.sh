#!/bin/bash

# 📋 로그 백업 스크립트

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

# 백업 디렉토리 설정
BACKUP_DIR="/backups/logs"
DATE=$(date '+%Y-%m-%d_%H-%M-%S')
BACKUP_FILE="$BACKUP_DIR/logs_backup_$DATE.tar.gz"

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

log_info "로그 백업 시작"

# 임시 디렉토리 생성
TEMP_DIR="/tmp/logs_backup_$DATE"
mkdir -p "$TEMP_DIR"

# Docker 컨테이너 로그 백업
log_info "Docker 컨테이너 로그 수집 중..."

CONTAINERS=("yago-n8n" "yago-cast" "yago-proxy" "yago-watchtower")

for container in "${CONTAINERS[@]}"; do
    if docker ps --format "{{.Names}}" | grep -q "^$container$"; then
        log_info "컨테이너 로그 백업 중: $container"
        
        # 컨테이너 로그를 파일로 저장
        docker logs "$container" > "$TEMP_DIR/${container}_logs.txt" 2>&1
        
        if [ $? -eq 0 ]; then
            log_success "컨테이너 로그 백업 완료: $container"
        else
            log_warning "컨테이너 로그 백업 실패: $container"
        fi
    else
        log_warning "컨테이너가 실행 중이지 않음: $container"
    fi
done

# Nginx 로그 백업
log_info "Nginx 로그 백업 중..."

if [ -d "./nginx/logs" ]; then
    cp -r ./nginx/logs "$TEMP_DIR/nginx_logs"
    log_success "Nginx 로그 백업 완료"
else
    log_warning "Nginx 로그 디렉토리를 찾을 수 없음"
fi

# 시스템 로그 백업 (선택사항)
log_info "시스템 로그 백업 중..."

# Docker 데몬 로그
if [ -f "/var/log/docker.log" ]; then
    cp /var/log/docker.log "$TEMP_DIR/docker_daemon.log"
fi

# 시스템 로그
if [ -f "/var/log/syslog" ]; then
    # 최근 24시간 로그만 백업
    journalctl --since "24 hours ago" > "$TEMP_DIR/system.log" 2>/dev/null || true
fi

# 디스크 사용량 정보
df -h > "$TEMP_DIR/disk_usage.txt"
free -h > "$TEMP_DIR/memory_usage.txt"
docker system df > "$TEMP_DIR/docker_disk_usage.txt"

# Docker 컨테이너 상태 정보
docker ps -a > "$TEMP_DIR/container_status.txt"
docker images > "$TEMP_DIR/docker_images.txt"

# 네트워크 정보
docker network ls > "$TEMP_DIR/docker_networks.txt"

log_success "시스템 정보 수집 완료"

# 백업 파일 생성
log_info "로그 백업 파일 생성 중..."

tar -czf "$BACKUP_FILE" -C "$TEMP_DIR" .

if [ -f "$BACKUP_FILE" ]; then
    log_success "로그 백업 완료: $BACKUP_FILE"
else
    log_error "로그 백업 실패"
    exit 1
fi

# 임시 디렉토리 정리
rm -rf "$TEMP_DIR"

# 오래된 백업 파일 정리 (7일 이상)
log_info "오래된 로그 백업 파일 정리 중..."
RETENTION_DAYS=${LOG_BACKUP_RETENTION_DAYS:-7}
find "$BACKUP_DIR" -name "logs_backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete

# 백업 통계
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "logs_backup_*.tar.gz" -type f | wc -l)

log_success "로그 백업 완료!"
log_info "백업 파일: $BACKUP_FILE"
log_info "백업 크기: $BACKUP_SIZE"
log_info "총 로그 백업 파일 수: $BACKUP_COUNT"

# 백업 파일 내용 요약
log_info "백업 파일 내용:"
tar -tzf "$BACKUP_FILE" | head -10

# Slack 알림 (선택사항)
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    log_info "Slack 알림 전송 중..."
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"📋 로그 백업 완료\\n\\n📊 백업 정보:\\n• 파일: $BACKUP_FILE\\n• 크기: $BACKUP_SIZE\\n• 총 백업 수: $BACKUP_COUNT\\n• 시간: $(date '+%Y-%m-%d %H:%M:%S')\"}" \
        "$SLACK_WEBHOOK_URL"
    
    if [ $? -eq 0 ]; then
        log_success "Slack 알림 전송 완료"
    else
        log_warning "Slack 알림 전송 실패"
    fi
fi

log_success "로그 백업 작업 완료!"
