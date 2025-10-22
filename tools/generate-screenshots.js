#!/usr/bin/env node

/**
 * 📸 야고 비서 스토어 스크린샷 자동 생성 도구
 * Puppeteer를 사용하여 웹 버전에서 스크린샷 자동 생성
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Puppeteer 설치 확인
try {
  require('puppeteer');
} catch {
  console.log('📦 Puppeteer 설치 중...');
  execSync('npm install puppeteer', { stdio: 'inherit' });
}

const puppeteer = require('puppeteer');

const screenshotConfig = {
  baseUrl: 'http://localhost:5183', // Vite 개발 서버
  outputDir: './screenshots',
  devices: {
    iphone: { width: 1170, height: 2532 }, // iPhone 14 Pro
    ipad: { width: 2048, height: 2732 },   // iPad Pro
    android: { width: 1080, height: 2340 } // Galaxy S21
  },
  pages: [
    {
      path: '/',
      name: 'home',
      title: '🏠 메인 화면',
      description: '음성 명령으로 시작하는 야고 비서'
    },
    {
      path: '/market/map',
      name: 'map',
      title: '🗺️ 지도 검색',
      description: 'AI가 추천하는 주변 스포츠 시설'
    },
    {
      path: '/market/voice',
      name: 'voice',
      title: '🎙️ 음성 검색',
      description: '말로 찾는 스마트 검색'
    },
    {
      path: '/market/route',
      name: 'navigation',
      title: '🧭 실시간 길안내',
      description: '실제 도로 기반 턴바이턴 안내'
    },
    {
      path: '/market/search',
      name: 'search',
      title: '🔍 AI 추천',
      description: 'AI가 분석한 맞춤 상품 추천'
    }
  ]
};

console.log('📸 야고 비서 스크린샷 생성 시작...');

// 1️⃣ 출력 디렉토리 생성
if (!fs.existsSync(screenshotConfig.outputDir)) {
  fs.mkdirSync(screenshotConfig.outputDir, { recursive: true });
}

// 2️⃣ 개발 서버 상태 확인
async function checkServer() {
  try {
    const response = await fetch(`${screenshotConfig.baseUrl}`);
    if (response.ok) {
      console.log('✅ 개발 서버 연결 확인');
      return true;
    }
  } catch (error) {
    console.log('⚠️ 개발 서버가 실행되지 않았습니다.');
    console.log('💡 다음 명령어로 서버를 시작하세요: npm run dev');
    return false;
  }
}

// 3️⃣ 스크린샷 생성
async function generateScreenshots() {
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('🚀 개발 서버 시작 중...');
    execSync('npm run dev &', { stdio: 'inherit' });
    
    // 서버 시작 대기
    console.log('⏳ 서버 시작 대기 중...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  console.log('🌐 브라우저 시작됨');
  
  for (const device of Object.keys(screenshotConfig.devices)) {
    const deviceConfig = screenshotConfig.devices[device];
    console.log(`📱 ${device} 스크린샷 생성 중...`);
    
    for (const page of screenshotConfig.pages) {
      try {
        const pageInstance = await browser.newPage();
        await pageInstance.setViewport({
          width: deviceConfig.width,
          height: deviceConfig.height,
          deviceScaleFactor: 2
        });
        
        // 페이지 로드
        const url = `${screenshotConfig.baseUrl}${page.path}`;
        console.log(`   📄 ${page.name} 로딩: ${url}`);
        
        await pageInstance.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });
        
        // 추가 로딩 대기 (애니메이션 완료)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 스크린샷 저장
        const filename = `${page.name}-${device}.png`;
        const filepath = path.join(screenshotConfig.outputDir, filename);
        
        await pageInstance.screenshot({
          path: filepath,
          fullPage: true,
          quality: 90
        });
        
        console.log(`   ✅ ${filename} 생성 완료`);
        
        await pageInstance.close();
        
      } catch (error) {
        console.error(`   ❌ ${page.name} 스크린샷 실패:`, error.message);
      }
    }
  }
  
  await browser.close();
  console.log('🎉 모든 스크린샷 생성 완료!');
  
  // 4️⃣ 스크린샷 정보 파일 생성
  const screenshotInfo = {
    generated: new Date().toISOString(),
    device: screenshotConfig.devices,
    pages: screenshotConfig.pages,
    files: []
  };
  
  // 생성된 파일 목록
  const files = fs.readdirSync(screenshotConfig.outputDir);
  screenshotInfo.files = files.filter(file => file.endsWith('.png'));
  
  fs.writeFileSync(
    path.join(screenshotConfig.outputDir, 'screenshots-info.json'),
    JSON.stringify(screenshotInfo, null, 2)
  );
  
  console.log('');
  console.log('📁 생성된 스크린샷:');
  console.log(`   📂 ${screenshotConfig.outputDir}/`);
  screenshotInfo.files.forEach(file => {
    console.log(`   📸 ${file}`);
  });
  
  console.log('');
  console.log('🎯 스토어 업로드 준비 완료!');
  console.log('   - App Store Connect에서 iOS 스크린샷 업로드');
  console.log('   - Google Play Console에서 Android 스크린샷 업로드');
}

generateScreenshots().catch(error => {
  console.error('❌ 스크린샷 생성 실패:', error.message);
  process.exit(1);
});
