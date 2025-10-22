#!/usr/bin/env node

/**
 * 🎯 야고 비서 스토어 자산 종합 생성 도구
 * 아이콘, 스플래시, 스크린샷, 설명문, 개인정보 처리방침을 모두 자동 생성
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const colors = {
  success: '\x1b[32m',
  error: '\x1b[31m',
  warning: '\x1b[33m',
  info: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, type = 'info') {
  const color = colors[type] || colors.info;
  console.log(`${color}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(`✅ ${description} 확인됨: ${filePath}`, 'success');
    return true;
  } else {
    log(`❌ ${description} 없음: ${filePath}`, 'error');
    return false;
  }
}

async function generateAllAssets() {
  console.log('🎯 야고 비서 스토어 자산 종합 생성 시작...\n');

  const steps = [
    {
      name: '아이콘 생성',
      command: 'node tools/generate-icons.js',
      description: 'iOS/Android 아이콘 자동 생성'
    },
    {
      name: '스플래시 스크린 생성',
      command: 'node tools/generate-splash.js',
      description: '스플래시 스크린 자동 생성'
    },
    {
      name: '개인정보 처리방침 생성',
      command: 'node tools/generate-privacy-policy.js',
      description: '개인정보 처리방침 PDF/HTML 생성'
    },
    {
      name: '스크린샷 생성',
      command: 'node tools/generate-screenshots.js',
      description: '스토어 스크린샷 자동 생성',
      optional: true
    }
  ];

  const results = [];

  for (const step of steps) {
    try {
      log(`\n🔄 ${step.description} 중...`, 'info');
      
      if (step.optional) {
        log(`⚠️  ${step.name}은 선택사항입니다 (개발 서버 실행 필요)`, 'warning');
        const shouldRun = process.argv.includes('--screenshots');
        if (!shouldRun) {
          log(`⏭️  ${step.name} 건너뛰기 (--screenshots 플래그로 활성화 가능)`, 'info');
          continue;
        }
      }

      execSync(step.command, { stdio: 'inherit' });
      log(`✅ ${step.name} 완료`, 'success');
      results.push({ step: step.name, status: 'success' });

    } catch (error) {
      log(`❌ ${step.name} 실패: ${error.message}`, 'error');
      results.push({ step: step.name, status: 'failed', error: error.message });
      
      if (!step.optional) {
        log(`🚨 필수 단계 실패로 중단됩니다`, 'error');
        break;
      }
    }
  }

  // 결과 검증
  log('\n🔍 생성된 자산 검증 중...', 'info');

  const requiredAssets = [
    { path: './assets/icon.png', desc: '메인 아이콘' },
    { path: './assets/splash.png', desc: '스플래시 스크린' },
    { path: './assets/icons/adaptive/foreground.png', desc: '적응형 아이콘 (전경)' },
    { path: './assets/icons/adaptive/background.png', desc: '적응형 아이콘 (배경)' },
    { path: './store/privacy_policy.pdf', desc: '개인정보 처리방침 (PDF)' },
    { path: './store/privacy_policy.html', desc: '개인정보 처리방침 (HTML)' },
    { path: './store/descriptions.md', desc: '앱 설명문' },
    { path: './store/meta.json', desc: '스토어 메타데이터' }
  ];

  const optionalAssets = [
    { path: './screenshots/home-iphone.png', desc: 'iPhone 스크린샷' },
    { path: './screenshots/home-android.png', desc: 'Android 스크린샷' }
  ];

  let allRequired = true;
  let optionalCount = 0;

  log('\n📋 필수 자산:', 'info');
  for (const asset of requiredAssets) {
    if (checkFile(asset.path, asset.desc)) {
      // 파일 크기 확인
      const stats = fs.statSync(asset.path);
      const sizeKB = Math.round(stats.size / 1024);
      log(`   📏 크기: ${sizeKB}KB`, 'info');
    } else {
      allRequired = false;
    }
  }

  log('\n📋 선택 자산:', 'info');
  for (const asset of optionalAssets) {
    if (checkFile(asset.path, asset.desc)) {
      optionalCount++;
    }
  }

  // 최종 결과
  log('\n🎉 자산 생성 완료!', 'success');
  log(`📊 결과 요약:`, 'info');
  log(`   ✅ 성공: ${results.filter(r => r.status === 'success').length}개`, 'success');
  log(`   ❌ 실패: ${results.filter(r => r.status === 'failed').length}개`, 'error');
  log(`   📁 필수 자산: ${allRequired ? '완료' : '미완료'}`, allRequired ? 'success' : 'error');
  log(`   📸 스크린샷: ${optionalCount}/${optionalAssets.length}개`, 'info');

  // 스토어 제출 체크리스트
  log('\n📋 스토어 제출 체크리스트:', 'info');
  const checklist = [
    { item: '아이콘 및 스플래시 스크린', status: allRequired },
    { item: '개인정보 처리방침 PDF', status: checkFile('./store/privacy_policy.pdf', '') },
    { item: '앱 설명문 (한글/영문)', status: checkFile('./store/descriptions.md', '') },
    { item: '스토어 메타데이터', status: checkFile('./store/meta.json', '') },
    { item: '스크린샷 (선택사항)', status: optionalCount > 0 }
  ];

  for (const item of checklist) {
    const status = item.status ? '✅' : '❌';
    log(`   ${status} ${item.item}`, item.status ? 'success' : 'error');
  }

  // 다음 단계 안내
  log('\n🚀 다음 단계:', 'info');
  log('   1. assets/ 폴더의 아이콘을 mobile/app.json에 연결', 'info');
  log('   2. store/ 폴더의 파일들을 스토어에 업로드', 'info');
  log('   3. screenshots/ 폴더의 이미지를 스토어에 업로드', 'info');
  log('   4. EAS 빌드 실행: npx eas build --platform all', 'info');
  log('   5. 스토어 제출: npx eas submit --platform all', 'info');

  // 문제 해결 안내
  if (!allRequired) {
    log('\n⚠️  문제 해결:', 'warning');
    log('   - 기본 로고 파일(assets/logo.png)이 1024x1024 PNG 형식인지 확인', 'warning');
    log('   - 필요한 패키지 설치: npm install sharp pdf-lib puppeteer', 'warning');
    log('   - 스크린샷 생성을 위해서는 개발 서버가 실행되어야 합니다', 'warning');
  }

  log('\n🎯 야고 비서 스토어 준비 완료!', 'success');
}

// 실행
generateAllAssets().catch(error => {
  log(`❌ 전체 자산 생성 실패: ${error.message}`, 'error');
  process.exit(1);
});
