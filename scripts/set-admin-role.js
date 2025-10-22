#!/usr/bin/env node

/**
 * 관리자 권한 설정 스크립트
 * 
 * 사용법:
 * 1. Firebase Admin SDK 키 파일을 다운로드하여 프로젝트 루트에 저장
 * 2. 환경 변수 설정: GOOGLE_APPLICATION_CREDENTIALS=./path/to/serviceAccountKey.json
 * 3. 스크립트 실행: node scripts/set-admin-role.js <USER_UID> <ROLE>
 * 
 * 예시:
 * node scripts/set-admin-role.js abc123def456 admin
 * node scripts/set-admin-role.js xyz789uvw012 superadmin
 */

const admin = require('firebase-admin');

// Firebase Admin 초기화
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: 'demo-jaeman-vibe' // 프로젝트 ID 변경 필요
    });
  } catch (error) {
    console.error('Firebase Admin 초기화 실패:', error);
    process.exit(1);
  }
}

async function setUserRole(uid, role) {
  try {
    // 사용자 존재 확인
    const userRecord = await admin.auth().getUser(uid);
    console.log(`사용자 확인됨: ${userRecord.email} (${userRecord.displayName || '이름 없음'})`);
    
    // 현재 권한 확인
    const currentClaims = userRecord.customClaims || {};
    console.log(`현재 권한: ${currentClaims.role || 'user'}`);
    
    // 권한 설정
    await admin.auth().setCustomUserClaims(uid, { role });
    console.log(`✅ 권한 설정 완료: ${uid} → ${role}`);
    
    // 설정된 권한 확인
    const updatedUser = await admin.auth().getUser(uid);
    const updatedClaims = updatedUser.customClaims || {};
    console.log(`✅ 확인된 권한: ${updatedClaims.role}`);
    
    console.log('\n📝 중요: 사용자가 재로그인해야 권한이 적용됩니다.');
    
  } catch (error) {
    console.error('❌ 권한 설정 실패:', error.message);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.log('사용법: node scripts/set-admin-role.js <USER_UID> <ROLE>');
    console.log('권한 옵션: user, admin, superadmin');
    console.log('\n예시:');
    console.log('  node scripts/set-admin-role.js abc123def456 admin');
    console.log('  node scripts/set-admin-role.js xyz789uvw012 superadmin');
    process.exit(1);
  }
  
  const [uid, role] = args;
  
  // 권한 유효성 검사
  const validRoles = ['user', 'admin', 'superadmin'];
  if (!validRoles.includes(role)) {
    console.error(`❌ 잘못된 권한: ${role}`);
    console.log(`허용된 권한: ${validRoles.join(', ')}`);
    process.exit(1);
  }
  
  console.log(`🔧 권한 설정 시작...`);
  console.log(`사용자 UID: ${uid}`);
  console.log(`설정할 권한: ${role}`);
  console.log('');
  
  await setUserRole(uid, role);
  
  console.log('\n🎉 권한 설정이 완료되었습니다!');
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { setUserRole };
