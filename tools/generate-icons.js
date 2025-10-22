#!/usr/bin/env node

/**
 * 🎨 야고 비서 아이콘 자동 생성 도구
 * 기본 로고에서 모든 플랫폼 아이콘 자동 생성
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const colors = {
  background: '#000000',
  foreground: '#FFFFFF',
  accent: '#10B981'
};

const iconSizes = {
  ios: [20, 29, 40, 58, 60, 76, 80, 87, 114, 120, 152, 167, 180, 1024],
  android: [48, 72, 96, 144, 192],
  adaptive: [108, 108] // foreground, background
};

console.log('🎨 야고 비서 아이콘 생성 시작...');

// 1️⃣ 기본 로고 확인
const logoPath = './assets/logo.png';
if (!fs.existsSync(logoPath)) {
  console.error('❌ 기본 로고 파일이 없습니다: assets/logo.png');
  console.log('💡 1024x1024 PNG 형식의 로고를 준비해주세요.');
  process.exit(1);
}

// 2️⃣ Expo 아이콘 생성
try {
  console.log('📱 Expo 아이콘 생성 중...');
  execSync(`npx expo generate icons --background "${colors.background}" --foreground "${colors.foreground}"`, {
    stdio: 'inherit'
  });
  console.log('✅ Expo 아이콘 생성 완료');
} catch (error) {
  console.error('❌ Expo 아이콘 생성 실패:', error.message);
}

// 3️⃣ 추가 아이콘 생성 (Sharp 사용)
try {
  console.log('🔧 Sharp로 추가 아이콘 생성 중...');
  
  // Sharp 설치 확인
  try {
    require('sharp');
  } catch {
    console.log('📦 Sharp 설치 중...');
    execSync('npm install sharp', { stdio: 'inherit' });
  }
  
  const sharp = require('sharp');
  
  // iOS 아이콘 생성
  const iosDir = './assets/icons/ios';
  if (!fs.existsSync(iosDir)) fs.mkdirSync(iosDir, { recursive: true });
  
  for (const size of iconSizes.ios) {
    await sharp(logoPath)
      .resize(size, size)
      .png()
      .toFile(`${iosDir}/icon-${size}.png`);
    console.log(`📱 iOS 아이콘 생성: ${size}x${size}`);
  }
  
  // Android 아이콘 생성
  const androidDir = './assets/icons/android';
  if (!fs.existsSync(androidDir)) fs.mkdirSync(androidDir, { recursive: true });
  
  for (const size of iconSizes.android) {
    await sharp(logoPath)
      .resize(size, size)
      .png()
      .toFile(`${androidDir}/icon-${size}.png`);
    console.log(`🤖 Android 아이콘 생성: ${size}x${size}`);
  }
  
  // Adaptive 아이콘 생성
  const adaptiveDir = './assets/icons/adaptive';
  if (!fs.existsSync(adaptiveDir)) fs.mkdirSync(adaptiveDir, { recursive: true });
  
  // Foreground (투명 배경)
  await sharp(logoPath)
    .resize(108, 108)
    .png()
    .toFile(`${adaptiveDir}/foreground.png`);
  
  // Background (색상 배경)
  await sharp({
    create: {
      width: 108,
      height: 108,
      channels: 4,
      background: colors.background
    }
  })
    .png()
    .toFile(`${adaptiveDir}/background.png`);
  
  console.log('✅ 추가 아이콘 생성 완료');
  
} catch (error) {
  console.error('❌ Sharp 아이콘 생성 실패:', error.message);
}

// 4️⃣ 아이콘 검증
console.log('🔍 아이콘 검증 중...');

const requiredIcons = [
  './assets/icon.png',
  './assets/icons/adaptive/foreground.png',
  './assets/icons/adaptive/background.png'
];

let allIconsExist = true;
for (const icon of requiredIcons) {
  if (fs.existsSync(icon)) {
    console.log(`✅ ${icon} 존재`);
  } else {
    console.log(`❌ ${icon} 없음`);
    allIconsExist = false;
  }
}

if (allIconsExist) {
  console.log('🎉 모든 아이콘 생성 완료!');
  console.log('');
  console.log('📁 생성된 아이콘:');
  console.log('   - assets/icon.png (메인 아이콘)');
  console.log('   - assets/icons/ios/ (iOS 아이콘들)');
  console.log('   - assets/icons/android/ (Android 아이콘들)');
  console.log('   - assets/icons/adaptive/ (적응형 아이콘)');
} else {
  console.log('⚠️ 일부 아이콘 생성에 실패했습니다.');
  process.exit(1);
}
