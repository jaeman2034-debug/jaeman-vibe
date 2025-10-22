#!/bin/bash

# Slack 승인→발행 시스템 테스트 스크립트
# Patchset V21: Slack Approval System

# 환경변수 설정
FUNCTIONS_URL="${FUNCTIONS_URL:-https://asia-northeast3-your-project.cloudfunctions.net/slack}"
INTERNAL_KEY="${INTERNAL_KEY:-your-internal-key}"
SLACK_CHANNEL="${SLACK_CHANNEL:-C0123456789}"

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 테스트 1: 헬스체크
test_health() {
    log "Testing Health Check..."
    
    local response=$(curl -s "$FUNCTIONS_URL/slack/health")
    
    if echo "$response" | grep -q "healthy"; then
        success "Health check passed"
        echo "Response: $response" | jq '.'
    else
        error "Health check failed"
        echo "Response: $response"
    fi
}

# 테스트 2: 승인 카드 띄우기 (마켓)
test_market_approval() {
    log "Testing Market Approval Request..."
    
    local market_id="market_$(date +%s)"
    local response=$(curl -s -X POST "$FUNCTIONS_URL/slack/internal/approval/notify" \
        -H "Content-Type: application/json" \
        -H "x-internal-key: $INTERNAL_KEY" \
        -d "{
            \"channel\": \"$SLACK_CHANNEL\",
            \"type\": \"market\",
            \"refId\": \"$market_id\",
            \"title\": \"아모 축구공 등록\",
            \"summary\": \"가격 39,900원 • 송산2동 • 카테고리: 공\",
            \"url\": \"https://yagovibe.com/market/$market_id\",
            \"image\": \"https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=축구공\",
            \"payload\": {
                \"price\": 39900,
                \"region\": \"송산2동\",
                \"category\": \"공\",
                \"condition\": \"새상품\"
            }
        }")
    
    if echo "$response" | grep -q "ok.*true"; then
        success "Market approval request sent"
        echo "Response: $response" | jq '.'
    else
        error "Market approval request failed"
        echo "Response: $response"
    fi
}

# 테스트 3: 승인 카드 띄우기 (모임)
test_meetup_approval() {
    log "Testing Meetup Approval Request..."
    
    local meetup_id="meetup_$(date +%s)"
    local response=$(curl -s -X POST "$FUNCTIONS_URL/slack/internal/approval/notify" \
        -H "Content-Type: application/json" \
        -H "x-internal-key: $INTERNAL_KEY" \
        -d "{
            \"channel\": \"$SLACK_CHANNEL\",
            \"type\": \"meetup\",
            \"refId\": \"$meetup_id\",
            \"title\": \"주말 축구 모임\",
            \"summary\": \"9/21(일) 14:00 • 잠실보조 • 8vs8 • 참가비 5,000원\",
            \"url\": \"https://yagovibe.com/meetups/$meetup_id\",
            \"image\": \"https://via.placeholder.com/400x300/10B981/FFFFFF?text=축구모임\",
            \"payload\": {
                \"date\": \"2024-09-21\",
                \"time\": \"14:00\",
                \"location\": \"잠실보조\",
                \"maxParticipants\": 16,
                \"fee\": 5000
            }
        }")
    
    if echo "$response" | grep -q "ok.*true"; then
        success "Meetup approval request sent"
        echo "Response: $response" | jq '.'
    else
        error "Meetup approval request failed"
        echo "Response: $response"
    fi
}

# 테스트 4: 승인 카드 띄우기 (구인)
test_job_approval() {
    log "Testing Job Approval Request..."
    
    local job_id="job_$(date +%s)"
    local response=$(curl -s -X POST "$FUNCTIONS_URL/slack/internal/approval/notify" \
        -H "Content-Type: application/json" \
        -H "x-internal-key: $INTERNAL_KEY" \
        -d "{
            \"channel\": \"$SLACK_CHANNEL\",
            \"type\": \"job\",
            \"refId\": \"$job_id\",
            \"title\": \"축구 코치 모집\",
            \"summary\": \"주 3회 • 시간협의 • 급여 30만원 • 경력 2년 이상\",
            \"url\": \"https://yagovibe.com/jobs/$job_id\",
            \"image\": \"https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=구인공고\",
            \"payload\": {
                \"position\": \"축구 코치\",
                \"schedule\": \"주 3회\",
                \"salary\": 300000,
                \"experience\": \"2년 이상\",
                \"location\": \"서울\"
            }
        }")
    
    if echo "$response" | grep -q "ok.*true"; then
        success "Job approval request sent"
        echo "Response: $response" | jq '.'
    else
        error "Job approval request failed"
        echo "Response: $response"
    fi
}

# 테스트 5: 잘못된 내부 키로 요청
test_invalid_key() {
    log "Testing Invalid Internal Key..."
    
    local response=$(curl -s -X POST "$FUNCTIONS_URL/slack/internal/approval/notify" \
        -H "Content-Type: application/json" \
        -H "x-internal-key: invalid-key" \
        -d "{
            \"channel\": \"$SLACK_CHANNEL\",
            \"type\": \"test\",
            \"refId\": \"test\",
            \"title\": \"Test\"
        }")
    
    if echo "$response" | grep -q "Invalid internal key"; then
        success "Invalid key properly rejected"
    else
        error "Invalid key not properly rejected"
        echo "Response: $response"
    fi
}

# 테스트 6: 필수 필드 누락
test_missing_fields() {
    log "Testing Missing Required Fields..."
    
    local response=$(curl -s -X POST "$FUNCTIONS_URL/slack/internal/approval/notify" \
        -H "Content-Type: application/json" \
        -H "x-internal-key: $INTERNAL_KEY" \
        -d "{
            \"channel\": \"$SLACK_CHANNEL\"
        }")
    
    if echo "$response" | grep -q "Missing required fields"; then
        success "Missing fields properly rejected"
    else
        error "Missing fields not properly rejected"
        echo "Response: $response"
    fi
}

# 테스트 7: 슬래시 명령어 (선택사항)
test_slash_command() {
    log "Testing Slash Command (if configured)..."
    
    # 이 테스트는 Slack 앱에서 슬래시 명령어가 설정된 경우에만 작동
    warning "Slash command test requires Slack app configuration"
    warning "Use: /preview 테스트 제목 | 테스트 요약 | https://example.com | https://example.com/image.jpg"
}

# 메인 실행 함수
main() {
    echo "🚀 Slack 승인→발행 시스템 테스트"
    echo "=================================="
    echo "Functions URL: $FUNCTIONS_URL"
    echo "Slack Channel: $SLACK_CHANNEL"
    echo ""
    
    # 기본 테스트
    test_health
    echo ""
    
    # 승인 요청 테스트
    test_market_approval
    echo ""
    
    test_meetup_approval
    echo ""
    
    test_job_approval
    echo ""
    
    # 보안 테스트
    test_invalid_key
    echo ""
    
    test_missing_fields
    echo ""
    
    # 슬래시 명령어 테스트
    test_slash_command
    echo ""
    
    echo "🏁 All tests completed!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Check Slack channel for approval cards"
    echo "2. Click [✅ 승인] or [✋ 반려] buttons"
    echo "3. Verify Firestore updates"
    echo "4. Check n8n webhook calls (if configured)"
}

# 스크립트 실행
main "$@"
