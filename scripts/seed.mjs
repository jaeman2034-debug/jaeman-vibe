// scripts/seed.mjs
// ✅ 무조건 올바른 포트로 강제 설정 (프로세스/시스템에 뭐가 있든 덮어씀)
const PROJECT_ID = 'jaeman-vibe-platform';
process.env.GCLOUD_PROJECT = PROJECT_ID;
process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID;
process.env.FIREBASE_EMULATOR_HUB = '127.0.0.1:4441';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = '127.0.0.1:9199';

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

initializeApp({ projectId: PROJECT_ID });

const db = getFirestore();
const auth = getAuth();

// (옵션) 일부 버전에선 이게 있음 — 있으면 한 번 더 안전장치
try { auth.useEmulator?.('http://127.0.0.1:9099'); } catch {}

async function main() {
  console.log('🌱 Seeding to emulators...', {
    FIREBASE_AUTH_EMULATOR_HOST: process.env.FIREBASE_AUTH_EMULATOR_HOST,
    FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST,
  });

  // Auth 유저 생성(이미 있으면 재사용)
  let uid;
  try {
    const u = await auth.createUser({ email: 'dev@example.com', password: 'password123' });
    uid = u.uid;
  } catch (e) {
    if (e.errorInfo?.code === 'auth/email-already-exists') {
      uid = (await auth.getUserByEmail('dev@example.com')).uid;
    } else {
      throw e;
    }
  }

  await db.collection('products').doc('football-1').set({
    name: 'Football #1', price: 29900, currency: 'KRW', createdAt: new Date(), owner: uid,
  });
  await db.doc('meta/health').set({ ok: true, at: new Date() });

  console.log('✅ Seed done!');
}

main().catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); });
