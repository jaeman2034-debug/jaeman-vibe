#!/bin/bash

# 🔧 n8n 워크플로우 백업 스크립트

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
if [ -z "$N8N_USER" ] || [ -z "$N8N_PASS" ]; then
    log_error "N8N_USER 또는 N8N_PASS 환경 변수가 설정되지 않았습니다."
    exit 1
fi

# 백업 디렉토리 설정
BACKUP_DIR="/backups/n8n"
DATE=$(date '+%Y-%m-%d_%H-%M-%S')
BACKUP_FILE="$BACKUP_DIR/n8n_backup_$DATE.tar.gz"

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

log_info "n8n 워크플로우 백업 시작"

# n8n 컨테이너 상태 확인
if ! docker ps | grep -q "yago-n8n"; then
    log_error "n8n 컨테이너가 실행 중이지 않습니다."
    exit 1
fi

log_info "n8n 컨테이너에서 데이터 백업 중..."

# n8n 데이터 디렉토리 백업
docker exec yago-n8n tar -czf /tmp/n8n_backup.tar.gz -C /home/node/.n8n .

# 백업 파일을 호스트로 복사
docker cp yago-n8n:/tmp/n8n_backup.tar.gz "$BACKUP_FILE"

# 컨테이너 내 임시 파일 삭제
docker exec yago-n8n rm -f /tmp/n8n_backup.tar.gz

if [ -f "$BACKUP_FILE" ]; then
    log_success "n8n 데이터 백업 완료: $BACKUP_FILE"
else
    log_error "n8n 데이터 백업 실패"
    exit 1
fi

# 워크플로우 개별 백업 (REST API 사용)
log_info "n8n 워크플로우 개별 백업 중..."

WORKFLOW_BACKUP_DIR="$BACKUP_DIR/workflows_$DATE"
mkdir -p "$WORKFLOW_BACKUP_DIR"

# n8n REST API를 사용한 워크플로우 백업
WORKFLOWS_RESPONSE=$(curl -s -u "$N8N_USER:$N8N_PASS" \
    "https://yago.ai/api/v1/workflows")

if [ $? -eq 0 ] && echo "$WORKFLOWS_RESPONSE" | jq -e '.data' > /dev/null 2>&1; then
    log_info "워크플로우 목록 조회 성공"
    
    # 각 워크플로우를 개별 파일로 저장
    echo "$WORKFLOWS_RESPONSE" | jq -r '.data[] | .id' | while read -r workflow_id; do
        log_info "워크플로우 백업 중: $workflow_id"
        
        WORKFLOW_RESPONSE=$(curl -s -u "$N8N_USER:$N8N_PASS" \
            "https://yago.ai/api/v1/workflows/$workflow_id")
        
        if [ $? -eq 0 ]; then
            echo "$WORKFLOW_RESPONSE" > "$WORKFLOW_BACKUP_DIR/workflow_$workflow_id.json"
            log_success "워크플로우 백업 완료: $workflow_id"
        else
            log_warning "워크플로우 백업 실패: $workflow_id"
        fi
    done
    
    # 워크플로우 백업을 압축
    tar -czf "$WORKFLOW_BACKUP_DIR.tar.gz" -C "$WORKFLOW_BACKUP_DIR" .
    rm -rf "$WORKFLOW_BACKUP_DIR"
    
    log_success "워크플로우 개별 백업 완료: $WORKFLOW_BACKUP_DIR.tar.gz"
else
    log_warning "n8n REST API 접근 실패, 데이터 백업만 수행"
fi

# 오래된 백업 파일 정리 (30일 이상)
log_info "오래된 백업 파일 정리 중..."
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
find "$BACKUP_DIR" -name "n8n_backup_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "workflows_*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete

# 백업 통계
DATA_BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
WORKFLOW_BACKUP_SIZE=$(du -h "$WORKFLOW_BACKUP_DIR.tar.gz" 2>/dev/null | cut -f1 || echo "N/A")
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "n8n_backup_*.tar.gz" -type f | wc -l)

log_success "n8n 백업 완료!"
log_info "데이터 백업: $BACKUP_FILE ($DATA_BACKUP_SIZE)"
if [ -f "$WORKFLOW_BACKUP_DIR.tar.gz" ]; then
    log_info "워크플로우 백업: $WORKFLOW_BACKUP_DIR.tar.gz ($WORKFLOW_BACKUP_SIZE)"
fi
log_info "총 백업 파일 수: $BACKUP_COUNT"

# Slack 알림 (선택사항)
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    log_info "Slack 알림 전송 중..."
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🔧 n8n 백업 완료\\n\\n📊 백업 정보:\\n• 데이터 백업: $DATA_BACKUP_SIZE\\n• 워크플로우 백업: $WORKFLOW_BACKUP_SIZE\\n• 총 백업 수: $BACKUP_COUNT\\n• 시간: $(date '+%Y-%m-%d %H:%M:%S')\"}" \
        "$SLACK_WEBHOOK_URL"
    
    if [ $? -eq 0 ]; then
        log_success "Slack 알림 전송 완료"
    else
        log_warning "Slack 알림 전송 실패"
    fi
fi

log_success "n8n 백업 작업 완료!"
