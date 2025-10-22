#!/bin/bash

# YAGO Sports Automation Playbooks - cURL Tests
# Patchset V21: n8n Workflows + Notion Schemas + cURL Tests

# 환경변수 설정 (실제 값으로 변경 필요)
N8N_URL="${N8N_URL:-https://your-n8n-instance.com}"
SITE_BASE="${SITE_BASE:-https://yago.sports}"
MEETUP_ID="m_$(date +%s)"
TEAM_ID="t_roma_$(date +%s)"

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

# 테스트 1: 소셜 미디어 퍼블리시
test_social_publish() {
    log "Testing Social Media Publish..."
    
    local response=$(curl -s -X POST "$N8N_URL/webhook/social-publish" \
        -H 'Content-Type: application/json' \
        -d "{
            \"meetupId\": \"$MEETUP_ID\",
            \"caption\": \"【테스트 밋업】 $(date '+%m/%d(%a) %H:%M') · 잠실보조\\nhttps://yago.sports/r/m/$MEETUP_ID?s=x&m=social&c=og\\n#YAGO #Meetup #Test\",
            \"images\": [{\"publicUrl\":\"https://yago.sports/og/meetups/$MEETUP_ID/main.png\"}],
            \"channels\": [\"x\", \"instagram\", \"naverblog\"],
            \"when\": \"now\"
        }")
    
    if echo "$response" | grep -q "success"; then
        success "Social publish test passed"
        echo "Response: $response"
    else
        error "Social publish test failed"
        echo "Response: $response"
    fi
}

# 테스트 2: Google Sites 퍼블리시
test_google_sites_publish() {
    log "Testing Google Sites Publish..."
    
    local response=$(curl -s -X POST "$N8N_URL/webhook/google-sites-publish" \
        -H 'Content-Type: application/json' \
        -d "{
            \"meetupId\": \"$MEETUP_ID\",
            \"title\": \"YAGO Meetup 테스트 - $(date '+%Y-%m-%d')\",
            \"siteId\": \"REPLACE_SITE_ID\",
            \"blocks\": [
                {\"type\": \"h1\", \"text\": \"YAGO 테스트 밋업\"},
                {\"type\": \"p\", \"text\": \"$(date '+%m/%d(%a) %H:%M') · 잠실보조\"},
                {\"type\": \"img\", \"src\": \"https://yago.sports/og/meetups/$MEETUP_ID/main.png\", \"alt\": \"Meetup OG Image\"},
                {\"type\": \"p\", \"text\": \"테스트를 위한 자동 생성된 포스트입니다.\"},
                {\"type\": \"ul\", \"items\": [\"자동화 테스트\", \"n8n 워크플로\", \"YAGO Sports\"]},
                {\"type\": \"a\", \"href\": \"https://yago.sports/r/m/$MEETUP_ID\", \"text\": \"밋업 상세보기\"}
            ]
        }")
    
    if echo "$response" | grep -q "success"; then
        success "Google Sites publish test passed"
        echo "Response: $response"
    else
        error "Google Sites publish test failed"
        echo "Response: $response"
    fi
}

# 테스트 3: 팀 블로그 생성
test_team_blog_create() {
    log "Testing Team Blog Create..."
    
    local response=$(curl -s -X POST "$SITE_BASE/team-blog-create" \
        -H 'Content-Type: application/json' \
        -d "{
            \"team\": {
                \"id\": \"$TEAM_ID\",
                \"name\": \"AS Roma Seoul Test\",
                \"sport\": \"soccer\",
                \"region\": \"Seoul\",
                \"logoUrl\": \"https://yago.sports/og/teams/$TEAM_ID/main.png\",
                \"bio\": \"서울의 AS 로마 팬클럽입니다. 매주 토요일 잠실에서 경기를 합니다.\",
                \"hashtags\": [\"#YAGO\", \"#Roma\", \"#Soccer\", \"#Seoul\"],
                \"notionTeamsDb\": \"REPLACE_TEAMS_DB\",
                \"notionPostsDb\": \"REPLACE_POSTS_DB\",
                \"wordpressEndpoint\": \"https://example.com/wp-json/wp/v2/posts\"
            },
            \"posts\": [
                {
                    \"title\": \"개막전 리뷰 - $(date '+%Y-%m-%d')\",
                    \"summary\": \"3-1 승리로 시즌을 시작했습니다. 골든타임에 2골을 넣으며 완벽한 경기를 펼쳤습니다.\",
                    \"url\": \"https://yago.sports/clubs/c1/teams/$TEAM_ID\",
                    \"og\": \"https://yago.sports/og/teams/$TEAM_ID/main.png\",
                    \"content\": \"<h2>경기 요약</h2><p>3-1 승리로 시즌을 시작했습니다.</p><h2>주요 순간</h2><ul><li>전반 15분: 첫 골</li><li>후반 30분: 골든타임 2골</li></ul>\",
                    \"publishedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",
                    \"category\": \"match-report\",
                    \"tags\": [\"#승리\", \"#골든타임\", \"#경기리뷰\"]
                },
                {
                    \"title\": \"팀 소개 - $(date '+%Y-%m-%d')\",
                    \"summary\": \"AS Roma Seoul 팬클럽을 소개합니다.\",
                    \"url\": \"https://yago.sports/clubs/c1/teams/$TEAM_ID\",
                    \"og\": \"https://yago.sports/og/teams/$TEAM_ID/main.png\",
                    \"content\": \"<h2>팀 소개</h2><p>서울의 AS 로마 팬클럽입니다.</p>\",
                    \"publishedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",
                    \"category\": \"team-news\",
                    \"tags\": [\"#팀소식\", \"#소개\"]
                }
            ]
        }")
    
    if echo "$response" | grep -q "success"; then
        success "Team blog create test passed"
        echo "Response: $response"
    else
        error "Team blog create test failed"
        echo "Response: $response"
    fi
}

# 테스트 4: 서버 상태 확인
test_server_health() {
    log "Testing Server Health..."
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$SITE_BASE/health" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        success "Server health check passed"
    else
        warning "Server health check returned: $response"
    fi
}

# 테스트 5: n8n 워크플로 상태 확인
test_n8n_health() {
    log "Testing n8n Health..."
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$N8N_URL/healthz" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        success "n8n health check passed"
    else
        warning "n8n health check returned: $response"
    fi
}

# 테스트 6: 예약 발행 테스트
test_scheduled_publish() {
    log "Testing Scheduled Publish..."
    
    local future_time=$(date -d "+1 hour" -u +%Y-%m-%dT%H:%M:%S.000Z)
    
    local response=$(curl -s -X POST "$N8N_URL/webhook/social-publish" \
        -H 'Content-Type: application/json' \
        -d "{
            \"meetupId\": \"$MEETUP_ID\",
            \"caption\": \"【예약 발행 테스트】 $(date '+%m/%d(%a) %H:%M') · 잠실보조\\nhttps://yago.sports/r/m/$MEETUP_ID?s=x&m=social&c=og\\n#YAGO #Meetup #Scheduled\",
            \"images\": [{\"publicUrl\":\"https://yago.sports/og/meetups/$MEETUP_ID/main.png\"}],
            \"channels\": [\"x\"],
            \"when\": \"$future_time\"
        }")
    
    if echo "$response" | grep -q "success"; then
        success "Scheduled publish test passed"
        echo "Response: $response"
    else
        error "Scheduled publish test failed"
        echo "Response: $response"
    fi
}

# 메인 실행 함수
main() {
    echo "🚀 YAGO Sports Automation Playbooks - cURL Tests"
    echo "=================================================="
    echo "N8N URL: $N8N_URL"
    echo "SITE BASE: $SITE_BASE"
    echo "MEETUP ID: $MEETUP_ID"
    echo "TEAM ID: $TEAM_ID"
    echo ""
    
    # 기본 상태 확인
    test_server_health
    test_n8n_health
    echo ""
    
    # 자동화 테스트
    test_social_publish
    echo ""
    
    test_google_sites_publish
    echo ""
    
    test_team_blog_create
    echo ""
    
    test_scheduled_publish
    echo ""
    
    echo "🏁 All tests completed!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Check n8n workflows are activated"
    echo "2. Verify credentials are configured"
    echo "3. Check Notion databases are created"
    echo "4. Monitor logs for any errors"
}

# 스크립트 실행
main "$@"
