#!/usr/bin/env node

/**
 * Firebase Emulator 데이터 초기화 스크립트
 * Cypress 테스트 전에 Firestore 데이터를 완전히 초기화합니다.
 * 
 * 사용법:
 * node scripts/reset-firebase-emulator.js
 * 
 * 또는 package.json 스크립트로:
 * npm run reset:emulator
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 Firebase Emulator 데이터 초기화 시작...');

try {
  // 1. Firebase 에뮬레이터 프로세스 확인 및 종료
  console.log('📋 1. 기존 Firebase 에뮬레이터 프로세스 확인 중...');
  
  try {
    const emulatorProcesses = execSync('netstat -ano | findstr :4000', { encoding: 'utf8' });
    if (emulatorProcesses) {
      console.log('⚠️  Firebase 에뮬레이터가 실행 중입니다. 종료 후 재시작합니다.');
      
      // Firebase 에뮬레이터 종료
      execSync('firebase emulators:exec "echo Emulator stopped" --only firestore,auth,storage', { 
        stdio: 'inherit',
        timeout: 10000 
      });
    }
  } catch (error) {
    console.log('✅ Firebase 에뮬레이터가 실행 중이지 않습니다.');
  }

  // 2. 기존 데이터 백업 디렉토리 정리
  console.log('📋 2. 기존 데이터 백업 디렉토리 정리 중...');
  
  const backupDir = path.join(__dirname, '..', '.firebase-backups');
  const emulatorDataDir = path.join(__dirname, '..', '.firebase-data');
  
  // 백업 디렉토리 생성 (없으면)
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // 기존 에뮬레이터 데이터 백업 (있는 경우)
  if (fs.existsSync(emulatorDataDir)) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}`);
    
    console.log(`📦 기존 데이터를 ${backupPath}로 백업 중...`);
    execSync(`xcopy "${emulatorDataDir}" "${backupPath}" /E /I /H /Y`, { 
      stdio: 'inherit' 
    });
    
    // 기존 에뮬레이터 데이터 삭제
    execSync(`rmdir /S /Q "${emulatorDataDir}"`, { 
      stdio: 'inherit' 
    });
  }

  // 3. 새로운 초기 데이터 생성
  console.log('📋 3. 새로운 초기 데이터 생성 중...');
  
  // 초기 데이터 디렉토리 생성
  fs.mkdirSync(emulatorDataDir, { recursive: true });
  
  // 초기 Firestore 데이터 생성
  const initialData = {
    posts: {
      'demo-post-001': {
        title: 'FC88 공식 블로그 오픈 🎉',
        content: 'FC88 팀 공식 블로그가 오픈되었습니다!\n앞으로 이곳에서 팀 소식, 경기 일정, 선수 인터뷰, 훈련 후기 등을 공유할 예정입니다.\n많은 관심과 구독 부탁드립니다 🙌',
        authorUid: 'demo-admin',
        authorName: '관리자 FC88',
        authorIcon: 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23f59e0b\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'white\' font-family=\'system-ui, sans-serif\' font-size=\'16\' font-weight=\'bold\'%3EFC88%3C/text%3E%3C/svg%3E',
        thumbnailUrl: 'https://picsum.photos/400/300?random=fc88',
        imageUrl: 'https://picsum.photos/800/600?random=fc88',
        teamId: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: ['공지', 'FC88', '블로그오픈'],
        likes: 0,
        views: 6
      }
    }
  };

  // 초기 데이터 파일 생성
  const initialDataPath = path.join(emulatorDataDir, 'initial-data.json');
  fs.writeFileSync(initialDataPath, JSON.stringify(initialData, null, 2));
  
  console.log('✅ 초기 데이터 생성 완료:', initialDataPath);

  // 4. Firebase 에뮬레이터 시작 (백그라운드)
  console.log('📋 4. Firebase 에뮬레이터 시작 중...');
  
  // 에뮬레이터 시작 명령어 (Windows용)
  const startCommand = 'firebase emulators:start --only firestore,auth,storage --import ./.firebase-data --export-on-exit';
  
  console.log('🚀 Firebase 에뮬레이터를 시작합니다...');
  console.log('💡 에뮬레이터는 백그라운드에서 실행됩니다.');
  console.log('💡 Cypress 테스트를 실행할 수 있습니다.');
  
  // 에뮬레이터를 백그라운드에서 시작
  const emulatorProcess = execSync(`start /B ${startCommand}`, { 
    stdio: 'pipe',
    shell: true 
  });

  // 5. 에뮬레이터 준비 대기
  console.log('📋 5. Firebase 에뮬레이터 준비 대기 중...');
  
  let emulatorReady = false;
  let attempts = 0;
  const maxAttempts = 30;

  while (!emulatorReady && attempts < maxAttempts) {
    try {
      // Firestore 에뮬레이터 연결 테스트
      execSync('curl -s http://localhost:4000', { 
        timeout: 2000,
        stdio: 'pipe' 
      });
      emulatorReady = true;
      console.log('✅ Firebase 에뮬레이터가 준비되었습니다!');
    } catch (error) {
      attempts++;
      console.log(`⏳ 에뮬레이터 준비 중... (${attempts}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  if (!emulatorReady) {
    console.log('⚠️  에뮬레이터가 준비되지 않았지만 계속 진행합니다.');
  }

  // 6. 완료 메시지
  console.log('🎉 Firebase Emulator 데이터 초기화 완료!');
  console.log('');
  console.log('📊 초기화된 데이터:');
  console.log('   - FC88 공식 블로그 오픈 글 1개');
  console.log('   - 깨끗한 Firestore 환경');
  console.log('   - Auth 및 Storage 에뮬레이터 준비');
  console.log('');
  console.log('🚀 이제 Cypress 테스트를 실행할 수 있습니다:');
  console.log('   npm run cypress:simple');
  console.log('   npm run cypress:blog');
  console.log('   npm run cypress:open');
  console.log('');
  console.log('🔧 에뮬레이터 관리:');
  console.log('   - Firebase Console: http://localhost:4000');
  console.log('   - 종료: Ctrl+C 또는 에뮬레이터 프로세스 종료');

} catch (error) {
  console.error('❌ Firebase Emulator 초기화 중 오류 발생:', error.message);
  console.error('💡 수동으로 다음 명령어를 실행해보세요:');
  console.error('   firebase emulators:start --only firestore,auth,storage');
  process.exit(1);
}

// Promise를 위한 헬퍼 함수
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
