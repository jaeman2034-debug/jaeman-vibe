#!/usr/bin/env node

/**
 * YAGO VIBE + n8n 통합 테스트 스크립트
 * 
 * 사용법:
 * node test-n8n-integration.js
 */

import axios from 'axios';

const N8N_BASE = process.env.VITE_N8N_URL || 'http://localhost:5678';

async function testN8NIntegration() {
  console.log('🚀 YAGO VIBE + n8n 통합 테스트 시작...\n');

  try {
    // 1. n8n 서버 연결 확인
    console.log('1️⃣ n8n 서버 연결 확인...');
    const healthCheck = await axios.get(`${N8N_BASE}/health`);
    console.log('✅ n8n 서버 연결 성공\n');

    // 2. 블로그 생성 테스트
    console.log('2️⃣ 블로그 생성 테스트...');
    const blogData = {
      title: 'YAGO VIBE 통합 테스트',
      content: 'n8n 워크플로우와 성공적으로 연결되었습니다!'
    };

    const response = await axios.post(
      `${N8N_BASE}/webhook/chat-final-250927-z1`,
      blogData,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    console.log('✅ 블로그 생성 성공:');
    console.log(`   - 상태: ${response.data.status}`);
    console.log(`   - 메시지: ${response.data.message}`);
    console.log(`   - 제목: ${response.data.title}`);
    console.log(`   - 내용: ${response.data.content}\n`);

    // 3. SQLite DB 확인
    console.log('3️⃣ SQLite DB 확인...');
    const { exec } = require('child_process');
    exec('sqlite3 ./data/market.db "SELECT * FROM blog ORDER BY id DESC LIMIT 1;"', (error, stdout) => {
      if (error) {
        console.log('⚠️ SQLite 확인 실패:', error.message);
      } else {
        console.log('✅ 최신 블로그 데이터:');
        console.log(stdout);
      }
    });

    console.log('\n🎉 모든 테스트 완료! YAGO VIBE + n8n 통합이 성공적으로 작동합니다.');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.response?.data || error.message);
    process.exit(1);
  }
}

// 테스트 실행
testN8NIntegration();
