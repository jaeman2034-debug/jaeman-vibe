#!/usr/bin/env node

/**
 * 💫 야고 비서 스플래시 스크린 자동 생성 도구
 */

import fs from 'fs';
import path from 'path';

try {
  require('sharp');
} catch {
  console.log('📦 Sharp 설치 중...');
  const { execSync } = require('child_process');
  execSync('npm install sharp', { stdio: 'inherit' });
}

const sharp = require('sharp');

const splashConfig = {
  backgroundColor: '#000000',
  logoSize: 200,
  textColor: '#FFFFFF',
  textSize: 24,
  slogan: '말하면 길이 열립니다',
  brandName: '⚽ YAGO VIBE'
};

console.log('💫 야고 비서 스플래시 스크린 생성 시작...');

// 1️⃣ 기본 로고 확인
const logoPath = './assets/logo.png';
if (!fs.existsSync(logoPath)) {
  console.error('❌ 기본 로고 파일이 없습니다: assets/logo.png');
  process.exit(1);
}

// 2️⃣ 스플래시 스크린 생성
async function generateSplash() {
  try {
    // 로고 이미지 로드
    const logo = await sharp(logoPath)
      .resize(splashConfig.logoSize, splashConfig.logoSize)
      .png()
      .toBuffer();
    
    // 텍스트 이미지 생성 (SVG를 PNG로 변환)
    const textSvg = `
      <svg width="400" height="100" xmlns="http://www.w3.org/2000/svg">
        <text x="200" y="40" font-family="Arial, sans-serif" font-size="24" 
              fill="${splashConfig.textColor}" text-anchor="middle" font-weight="bold">
          ${splashConfig.brandName}
        </text>
        <text x="200" y="70" font-family="Arial, sans-serif" font-size="16" 
              fill="${splashConfig.textColor}" text-anchor="middle">
          ${splashConfig.slogan}
        </text>
      </svg>
    `;
    
    const textImage = await sharp(Buffer.from(textSvg))
      .png()
      .toBuffer();
    
    // 다양한 해상도의 스플래시 생성
    const splashSizes = [
      { width: 1242, height: 2208, name: 'splash-iphone' },
      { width: 2048, height: 2732, name: 'splash-ipad' },
      { width: 1080, height: 1920, name: 'splash-android' }
    ];
    
    for (const size of splashSizes) {
      // 배경 생성
      const background = await sharp({
        create: {
          width: size.width,
          height: size.height,
          channels: 3,
          background: splashConfig.backgroundColor
        }
      }).png().toBuffer();
      
      // 로고와 텍스트를 중앙에 배치
      const logoX = (size.width - splashConfig.logoSize) / 2;
      const logoY = (size.height - splashConfig.logoSize - 100) / 2;
      const textX = (size.width - 400) / 2;
      const textY = logoY + splashConfig.logoSize + 20;
      
      const splash = await sharp(background)
        .composite([
          { input: logo, left: Math.round(logoX), top: Math.round(logoY) },
          { input: textImage, left: Math.round(textX), top: Math.round(textY) }
        ])
        .png()
        .toFile(`./assets/${size.name}.png`);
      
      console.log(`✅ ${size.name} 생성: ${size.width}x${size.height}`);
    }
    
    // 메인 스플래시 생성 (Expo 기본)
    const mainSplash = await sharp({
      create: {
        width: 1284,
        height: 2778,
        channels: 3,
        background: splashConfig.backgroundColor
      }
    })
      .composite([
        { 
          input: logo, 
          left: Math.round((1284 - splashConfig.logoSize) / 2), 
          top: Math.round((2778 - splashConfig.logoSize - 100) / 2) 
        },
        { 
          input: textImage, 
          left: Math.round((1284 - 400) / 2), 
          top: Math.round((2778 - splashConfig.logoSize - 100) / 2 + splashConfig.logoSize + 20) 
        }
      ])
      .png()
      .toFile('./assets/splash.png');
    
    console.log('✅ 메인 스플래시 생성: assets/splash.png');
    
    // 3️⃣ app.json 업데이트
    const appJsonPath = './mobile/app.json';
    if (fs.existsSync(appJsonPath)) {
      const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
      
      appJson.expo.splash = {
        image: "./assets/splash.png",
        backgroundColor: splashConfig.backgroundColor,
        resizeMode: "contain"
      };
      
      fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
      console.log('✅ app.json 스플래시 설정 업데이트');
    }
    
    console.log('🎉 모든 스플래시 스크린 생성 완료!');
    console.log('');
    console.log('📁 생성된 스플래시:');
    console.log('   - assets/splash.png (메인)');
    console.log('   - assets/splash-iphone.png (iPhone)');
    console.log('   - assets/splash-ipad.png (iPad)');
    console.log('   - assets/splash-android.png (Android)');
    
  } catch (error) {
    console.error('❌ 스플래시 생성 실패:', error.message);
    process.exit(1);
  }
}

generateSplash();
