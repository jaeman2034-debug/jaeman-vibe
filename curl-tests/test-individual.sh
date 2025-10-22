#!/bin/bash

# 개별 테스트 스크립트
# 각 기능을 개별적으로 테스트할 수 있는 스크립트

# 환경변수
N8N_URL="${N8N_URL:-https://your-n8n-instance.com}"
SITE_BASE="${SITE_BASE:-https://yago.sports}"

# 사용법 출력
usage() {
    echo "Usage: $0 [test_name]"
    echo ""
    echo "Available tests:"
    echo "  social          - Social media publish test"
    echo "  sites           - Google Sites publish test"
    echo "  team-blog       - Team blog create test"
    echo "  scheduled       - Scheduled publish test"
    echo "  health          - Health check test"
    echo "  all             - Run all tests"
    echo ""
    echo "Environment variables:"
    echo "  N8N_URL         - n8n instance URL (default: https://your-n8n-instance.com)"
    echo "  SITE_BASE       - YAGO site base URL (default: https://yago.sports)"
    echo ""
    echo "Examples:"
    echo "  $0 social"
    echo "  N8N_URL=https://n8n.example.com $0 all"
}

# 소셜 미디어 테스트
test_social() {
    echo "🔗 Testing Social Media Publish..."
    
    local meetup_id="m_$(date +%s)"
    local caption="【개별 테스트】 $(date '+%m/%d(%a) %H:%M') · 잠실보조
https://yago.sports/r/m/$meetup_id?s=x&m=social&c=og
#YAGO #Meetup #IndividualTest"
    
    curl -X POST "$N8N_URL/webhook/social-publish" \
        -H 'Content-Type: application/json' \
        -d "{
            \"meetupId\": \"$meetup_id\",
            \"caption\": \"$caption\",
            \"images\": [{\"publicUrl\":\"https://yago.sports/og/meetups/$meetup_id/main.png\"}],
            \"channels\": [\"x\", \"instagram\"],
            \"when\": \"now\"
        }" | jq '.'
}

# Google Sites 테스트
test_sites() {
    echo "🌐 Testing Google Sites Publish..."
    
    local meetup_id="m_$(date +%s)"
    
    curl -X POST "$N8N_URL/webhook/google-sites-publish" \
        -H 'Content-Type: application/json' \
        -d "{
            \"meetupId\": \"$meetup_id\",
            \"title\": \"YAGO 개별 테스트 - $(date '+%Y-%m-%d')\",
            \"siteId\": \"REPLACE_SITE_ID\",
            \"blocks\": [
                {\"type\": \"h1\", \"text\": \"YAGO 개별 테스트\"},
                {\"type\": \"p\", \"text\": \"$(date '+%m/%d(%a) %H:%M') · 잠실보조\"},
                {\"type\": \"img\", \"src\": \"https://yago.sports/og/meetups/$meetup_id/main.png\"},
                {\"type\": \"p\", \"text\": \"개별 테스트를 위한 자동 생성된 포스트입니다.\"}
            ]
        }" | jq '.'
}

# 팀 블로그 테스트
test_team_blog() {
    echo "📝 Testing Team Blog Create..."
    
    local team_id="t_test_$(date +%s)"
    
    curl -X POST "$SITE_BASE/team-blog-create" \
        -H 'Content-Type: application/json' \
        -d "{
            \"team\": {
                \"id\": \"$team_id\",
                \"name\": \"Test Team $(date '+%H%M')\",
                \"sport\": \"soccer\",
                \"region\": \"Seoul\",
                \"logoUrl\": \"https://yago.sports/og/teams/$team_id/main.png\",
                \"bio\": \"테스트용 팀입니다.\",
                \"hashtags\": [\"#YAGO\", \"#Test\"],
                \"notionTeamsDb\": \"REPLACE_TEAMS_DB\",
                \"notionPostsDb\": \"REPLACE_POSTS_DB\",
                \"wordpressEndpoint\": \"https://example.com/wp-json/wp/v2/posts\"
            },
            \"posts\": [
                {
                    \"title\": \"테스트 포스트 - $(date '+%Y-%m-%d')\",
                    \"summary\": \"개별 테스트를 위한 포스트입니다.\",
                    \"url\": \"https://yago.sports/clubs/c1/teams/$team_id\",
                    \"og\": \"https://yago.sports/og/teams/$team_id/main.png\",
                    \"content\": \"<h2>테스트 포스트</h2><p>개별 테스트를 위한 포스트입니다.</p>\",
                    \"publishedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\",
                    \"category\": \"general\",
                    \"tags\": [\"#테스트\"]
                }
            ]
        }" | jq '.'
}

# 예약 발행 테스트
test_scheduled() {
    echo "⏰ Testing Scheduled Publish..."
    
    local meetup_id="m_$(date +%s)"
    local future_time=$(date -d "+30 minutes" -u +%Y-%m-%dT%H:%M:%S.000Z)
    
    curl -X POST "$N8N_URL/webhook/social-publish" \
        -H 'Content-Type: application/json' \
        -d "{
            \"meetupId\": \"$meetup_id\",
            \"caption\": \"【예약 발행 테스트】 $(date '+%m/%d(%a) %H:%M') · 잠실보조
https://yago.sports/r/m/$meetup_id?s=x&m=social&c=og
#YAGO #Meetup #ScheduledTest\",
            \"images\": [{\"publicUrl\":\"https://yago.sports/og/meetups/$meetup_id/main.png\"}],
            \"channels\": [\"x\"],
            \"when\": \"$future_time\"
        }" | jq '.'
}

# 헬스 체크 테스트
test_health() {
    echo "🏥 Testing Health Checks..."
    
    echo "YAGO Server:"
    curl -s -o /dev/null -w "Status: %{http_code}\n" "$SITE_BASE/health" 2>/dev/null || echo "Failed to connect"
    
    echo "n8n Instance:"
    curl -s -o /dev/null -w "Status: %{http_code}\n" "$N8N_URL/healthz" 2>/dev/null || echo "Failed to connect"
}

# 모든 테스트 실행
test_all() {
    echo "🚀 Running All Individual Tests..."
    echo "=================================="
    
    test_health
    echo ""
    
    test_social
    echo ""
    
    test_sites
    echo ""
    
    test_team_blog
    echo ""
    
    test_scheduled
    echo ""
    
    echo "✅ All individual tests completed!"
}

# 메인 실행
case "${1:-}" in
    "social")
        test_social
        ;;
    "sites")
        test_sites
        ;;
    "team-blog")
        test_team_blog
        ;;
    "scheduled")
        test_scheduled
        ;;
    "health")
        test_health
        ;;
    "all")
        test_all
        ;;
    *)
        usage
        exit 1
        ;;
esac
