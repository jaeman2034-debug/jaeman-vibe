#!/usr/bin/env node

/**
 * 환경별 보안 규칙 적용 스크립트
 * 
 * 사용법:
 * - 개발 환경: node scripts/apply-security-rules.js dev
 * - 프로덕션 환경: node scripts/apply-security-rules.js prod
 * - 기본값: 개발 환경
 */

import fs from 'fs';
import path from 'path';

const ENV = process.argv[2] || 'dev';
const isProduction = ENV === 'prod';

console.log(`🔒 ${isProduction ? '프로덕션' : '개발'} 환경 보안 규칙 적용 중...`);

// Firestore 규칙 적용
const firestoreSource = isProduction ? 'firestore.rules.production' : 'firestore.rules.development';
const firestoreTarget = 'firestore.rules';

try {
  fs.copyFileSync(firestoreSource, firestoreTarget);
  console.log(`✅ Firestore 규칙 적용 완료: ${firestoreSource} → ${firestoreTarget}`);
} catch (error) {
  console.error(`❌ Firestore 규칙 적용 실패: ${error.message}`);
  process.exit(1);
}

// Storage 규칙 적용
const storageSource = isProduction ? 'storage.rules.production' : 'storage.rules.development';
const storageTarget = 'storage.rules';

try {
  fs.copyFileSync(storageSource, storageTarget);
  console.log(`✅ Storage 규칙 적용 완료: ${storageSource} → ${storageTarget}`);
} catch (error) {
  console.error(`❌ Storage 규칙 적용 실패: ${error.message}`);
  process.exit(1);
}

console.log(`\n🎉 ${isProduction ? '프로덕션' : '개발'} 환경 보안 규칙 적용이 완료되었습니다!`);
console.log(`\n📋 적용된 규칙:`);
console.log(`   - Firestore: ${firestoreSource}`);
console.log(`   - Storage: ${storageSource}`);

if (isProduction) {
  console.log(`\n⚠️  주의사항:`);
  console.log(`   - 프로덕션 환경에서는 엄격한 보안 규칙이 적용됩니다.`);
  console.log(`   - 모든 데이터 접근이 제한되며, 인증된 사용자만 접근할 수 있습니다.`);
  console.log(`   - 테스트 후 문제가 없다면 firebase deploy로 배포하세요.`);
} else {
  console.log(`\n💡 개발 환경에서는 더 유연한 접근이 허용됩니다.`);
  console.log(`   - 인증된 사용자는 대부분의 데이터에 접근할 수 있습니다.`);
  console.log(`   - 프로덕션 배포 전에 반드시 보안 규칙을 검토하세요.`);
}

console.log(`\n🚀 다음 단계:`);
console.log(`   1. firebase emulators:start로 로컬 테스트`);
console.log(`   2. 보안 규칙 테스트 및 검증`);
console.log(`   3. 문제없으면 firebase deploy로 배포`); 