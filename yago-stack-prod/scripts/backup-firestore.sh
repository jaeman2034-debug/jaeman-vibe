#!/bin/bash

# 🗄️ Firestore 백업 스크립트

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
if [ -z "$FIREBASE_PROJECT" ]; then
    log_error "FIREBASE_PROJECT 환경 변수가 설정되지 않았습니다."
    exit 1
fi

if [ -z "$FIREBASE_TOKEN" ]; then
    log_error "FIREBASE_TOKEN 환경 변수가 설정되지 않았습니다."
    exit 1
fi

# 백업 디렉토리 설정
BACKUP_DIR="/backups/firestore"
DATE=$(date '+%Y-%m-%d_%H-%M-%S')
BACKUP_FILE="$BACKUP_DIR/firestore_backup_$DATE.json"

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

log_info "Firestore 백업 시작: $FIREBASE_PROJECT"

# Firestore 데이터 백업
log_info "Firestore 데이터 수집 중..."

# Firebase CLI를 사용한 백업 (gcloud auth가 설정되어 있다고 가정)
if command -v gcloud &> /dev/null; then
    log_info "gcloud를 사용하여 Firestore 백업 중..."
    
    # Firestore export 실행
    gcloud firestore export gs://$FIREBASE_PROJECT-backups/firestore/$DATE \
        --project=$FIREBASE_PROJECT \
        --async
    
    if [ $? -eq 0 ]; then
        log_success "Firestore 백업 완료: gs://$FIREBASE_PROJECT-backups/firestore/$DATE"
    else
        log_error "Firestore 백업 실패"
        exit 1
    fi
else
    # REST API를 사용한 백업
    log_info "REST API를 사용하여 Firestore 백업 중..."
    
    # 주요 컬렉션들 백업
    COLLECTIONS=("ai_voice_reports" "notification_reports" "notification_logs" "market_items")
    
    echo "{" > "$BACKUP_FILE"
    echo "  \"backup_date\": \"$DATE\"," >> "$BACKUP_FILE"
    echo "  \"project_id\": \"$FIREBASE_PROJECT\"," >> "$BACKUP_FILE"
    echo "  \"collections\": {" >> "$BACKUP_FILE"
    
    for collection in "${COLLECTIONS[@]}"; do
        log_info "컬렉션 백업 중: $collection"
        
        # REST API로 컬렉션 데이터 가져오기
        RESPONSE=$(curl -s -H "Authorization: Bearer $FIREBASE_TOKEN" \
            "https://firestore.googleapis.com/v1/projects/$FIREBASE_PROJECT/databases/(default)/documents/$collection")
        
        if [ $? -eq 0 ]; then
            echo "    \"$collection\": $RESPONSE" >> "$BACKUP_FILE"
            if [ "$collection" != "${COLLECTIONS[-1]}" ]; then
                echo "," >> "$BACKUP_FILE"
            fi
            log_success "컬렉션 백업 완료: $collection"
        else
            log_warning "컬렉션 백업 실패: $collection"
        fi
    done
    
    echo "  }" >> "$BACKUP_FILE"
    echo "}" >> "$BACKUP_FILE"
    
    log_success "Firestore 백업 완료: $BACKUP_FILE"
fi

# 백업 파일 압축
log_info "백업 파일 압축 중..."
gzip "$BACKUP_FILE"
BACKUP_FILE="$BACKUP_FILE.gz"

# 오래된 백업 파일 정리 (30일 이상)
log_info "오래된 백업 파일 정리 중..."
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
find "$BACKUP_DIR" -name "firestore_backup_*.json.gz" -type f -mtime +$RETENTION_DAYS -delete

# 백업 통계
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "firestore_backup_*.json.gz" -type f | wc -l)

log_success "Firestore 백업 완료!"
log_info "백업 파일: $BACKUP_FILE"
log_info "백업 크기: $BACKUP_SIZE"
log_info "총 백업 파일 수: $BACKUP_COUNT"

# Slack 알림 (선택사항)
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    log_info "Slack 알림 전송 중..."
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🗄️ Firestore 백업 완료\\n\\n📊 백업 정보:\\n• 프로젝트: $FIREBASE_PROJECT\\n• 파일: $BACKUP_FILE\\n• 크기: $BACKUP_SIZE\\n• 총 백업 수: $BACKUP_COUNT\\n• 시간: $(date '+%Y-%m-%d %H:%M:%S')\"}" \
        "$SLACK_WEBHOOK_URL"
    
    if [ $? -eq 0 ]; then
        log_success "Slack 알림 전송 완료"
    else
        log_warning "Slack 알림 전송 실패"
    fi
fi

log_success "Firestore 백업 작업 완료!"
