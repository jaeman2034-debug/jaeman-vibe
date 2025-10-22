// Notion 블로그 기능 설정 스크립트
// Firebase Functions 환경변수 설정

import { execSync } from 'child_process';

console.log('🚀 Notion 블로그 기능 설정을 시작합니다...\n');

// 1. 환경변수 설정
console.log('📝 Firebase Functions 환경변수 설정 중...');

const envVars = [
  'N8N_WEBHOOK_CLUB_BLOG_CREATE=https://your-n8n-host/webhook/club-blog-create',
  'INTERNAL_KEY=your-random-internal-key-32-chars-minimum'
];

envVars.forEach(envVar => {
  const [key, value] = envVar.split('=');
  try {
    execSync(`firebase functions:config:set ${key}="${value}"`, { stdio: 'inherit' });
    console.log(`✅ ${key} 설정 완료`);
  } catch (error) {
    console.error(`❌ ${key} 설정 실패:`, error.message);
  }
});

console.log('\n📋 다음 단계:');
console.log('1. n8n에서 워크플로우 임포트: n8n-workflows/yago-club-blog-notion.json');
console.log('2. Notion API 자격증명 설정');
console.log('3. 환경변수 설정: INTERNAL_KEY, NOTION_DATABASE_ID');
console.log('4. 워크플로우 활성화');
console.log('5. Functions 배포: firebase deploy --only functions');
console.log('6. 테스트: 클럽 관리 페이지에서 "Notion 블로그 생성" 버튼 클릭');

console.log('\n🎉 설정 완료!');
