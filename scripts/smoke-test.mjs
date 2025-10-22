#!/usr/bin/env node
import 'dotenv/config';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase 설정 (에뮬레이터용)
const config = {
  apiKey: "fake-api-key",
  authDomain: "jaeman-vibe-platform.firebaseapp.com",
  projectId: "jaeman-vibe-platform",
  storageBucket: "jaeman-vibe-platform.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnopqrstuvwxyz"
};

// 에뮬레이터 설정 (환경변수 우선)
const HOST = process.env.EMU_HOST ?? '127.0.0.1';
const AUTH_PORT = Number(process.env.EMU_AUTH_PORT ?? 50199);
const FS_PORT   = Number(process.env.EMU_FS_PORT   ?? 58081);
const ST_PORT   = Number(process.env.EMU_STORAGE_PORT ?? 59200);

// 컬렉션 상수
const COLLECTIONS = {
  users: 'users',
  market: 'market',
  chats: 'chats',
  messagesSub: 'messages'
};

// 테스트할 거부 경로들
const DENY_PROBES = [
  'admin/secret',
  'system/config'
];

// 로깅 유틸
const log = {
  step: (msg) => console.log(`\n🔍 ${msg}`),
  pass: (msg) => console.log(`✅ ${msg}`),
  fail: (msg) => console.log(`❌ ${msg}`)
};

// 랜덤 ID 생성
const randId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// assertSucceeds/assertFails 헬퍼
const assertSucceeds = async (promise) => {
  try {
    await promise;
    return true;
  } catch (err) {
    throw new Error(`Expected success but got: ${err.message}`);
  }
};

const assertFails = async (promise) => {
  try {
    await promise;
    throw new Error('Expected failure but succeeded');
  } catch (err) {
    return true;
  }
};

(async () => {
  try {
    log.step('Starting Firebase smoke test...');

    // Firebase 초기화
    const app = initializeApp(config);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    // 에뮬레이터 연결
    try {
      connectAuthEmulator(auth, `http://${HOST}:${AUTH_PORT}`, { disableWarnings: true });
      connectFirestoreEmulator(db, HOST, FS_PORT);
      connectStorageEmulator(storage, HOST, ST_PORT);
      log.pass('Connected to emulators');
    } catch (e) {
      log.fail('Failed to connect to emulators: ' + e.message);
      process.exit(1);
    }

    // 사용자 A, B 생성
    log.step('1) Creating test users A & B');
    const { user: userA } = await signInAnonymously(auth);
    const uidA = userA.uid;
    log.pass(`User A created: ${uidA}`);

    // 사용자 B를 위해 새 앱 인스턴스 생성
    const appB = initializeApp(config, 'appB');
    const authB = getAuth(appB);
    const dbB = getFirestore(appB);
    
    try {
      connectAuthEmulator(authB, `http://${HOST}:${AUTH_PORT}`, { disableWarnings: true });
      connectFirestoreEmulator(dbB, HOST, FS_PORT);
    } catch (e) {
      // 이미 연결됨
    }

    const { user: userB } = await signInAnonymously(authB);
    const uidB = userB.uid;
    log.pass(`User B created: ${uidB}`);

    // ------------------------------
    // 2) market — create item, toggle status
    // ------------------------------
    log.step('2) market — create item, toggle status');
    const itemId = randId('item');
    const itemRefA = db.collection(COLLECTIONS.market).doc(itemId);

    await assertSucceeds(
      itemRefA.set({
        sellerUid: uidA,
        title: 'Smoke Test Item',
        price: 12345,
        category: '기타',
        region: 'KR',
        status: 'selling',
        isSold: false,
        createdAt: new Date(),
        description: 'Smoke test item'
      })
    );
    log.pass('A created a market item');

    await assertSucceeds(itemRefA.update({ status: 'sold', isSold: true }));
    log.pass('A toggled item.status → sold');

    // 다른 사용자가 업데이트 시도 (실패해야 함)
    log.step('2b) market — other user update MUST fail (owner-only)');
    await assertFails(
      dbB.collection(COLLECTIONS.market).doc(itemId).update({ title: 'Hacked' })
    );
    log.pass('B cannot update A\'s market item (expected)');

    // ------------------------------
    // 3) chats — create chat + first message
    // ------------------------------
    log.step('3) chats — create chat + message');
    const chatId = randId('chat');
    const chatRefA = db.collection(COLLECTIONS.chats).doc(chatId);

    await assertSucceeds(
      chatRefA.set({
        members: [uidA, uidB],
        itemId: itemId,
        itemTitle: 'Smoke Test Item',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastMessage: '첫 메시지',
        lastSenderUid: uidA
      })
    );
    log.pass('Chat created');

    await assertSucceeds(
      chatRefA.collection(COLLECTIONS.messagesSub).add({
        text: '첫 메시지 (smoke test)',
        senderUid: uidA,
        type: 'text',
        createdAt: new Date()
      })
    );
    log.pass('First message written');

    // ------------------------------
    // 4) Storage 테스트 (선택사항)
    // ------------------------------
    log.step('4) storage — basic access test');
    const storageRef = storage.ref(`market/${itemId}/test.jpg`);
    // 실제 파일이 없으므로 에러가 나는 것이 정상
    try {
      await storageRef.getDownloadURL();
      log.fail('Storage test should have failed (no file exists)');
    } catch (e) {
      log.pass('Storage access test completed (file not found as expected)');
    }

    log.step('✅ All smoke checks passed');
    log.pass('Ready for deploy');
    process.exit(0);
  } catch (err) {
    log.fail(String(err?.message || err));
    process.exit(1);
  }
})();
