// E2E: 이벤트/등록 시드 → verifyPayment(mock) → outbox 확인
// 실행: node scripts/e2e-smoke.mjs

import 'dotenv/config';
import fetch from 'node-fetch';
import admin from 'firebase-admin';

// ---- 설정(필요시 .env로 교체) ----
const PROJECT_ID = process.env.PROJECT_ID || 'jaeman-vibe-platform';
const REGION = process.env.REGION || 'asia-northeast3';
const FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080';
const FN_BASE = process.env.FN_BASE || `http://127.0.0.1:5001/${PROJECT_ID}/${REGION}`;
const N8N_SHARED_SECRET = process.env.N8N_SHARED_SECRET || 'change-me';

const EVENT_ID = process.env.EVENT_ID || 'E1';
const REG_ID = process.env.REG_ID || 'R1';
const TEST_UID = process.env.TEST_UID || 'test-user-uid';
const TEST_EMAIL = process.env.TEST_EMAIL || 'tester@example.com';
const AMOUNT = Number(process.env.AMOUNT || 10000);

// ---- Admin SDK: 에뮬레이터 모드 ----
process.env.FIRESTORE_EMULATOR_HOST = FIRESTORE_EMULATOR_HOST;
if (!admin.apps.length) {
  admin.initializeApp({ projectId: PROJECT_ID });
}
const db = admin.firestore();

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

async function seedEvent() {
  const eventRef = db.doc(`events/${EVENT_ID}`);
  await eventRef.set({
    title: '테스트 경기',
    startAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 3600_000)), // +1h
    endAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 7200_000)),   // +2h
    location: '서울월드컵경기장'
  }, { merge: true });
  console.log('✓ event seeded');
}

async function seedRegistration() {
  const regRef = db.doc(`events/${EVENT_ID}/registrations/${REG_ID}`);
  await regRef.set({
    uid: TEST_UID,
    email: TEST_EMAIL,
    status: 'pending',
    payment: { provider: 'mock', amount: AMOUNT, verified: false }
  }, { merge: true });
  console.log('✓ registration seeded (pending)');
}

async function callVerifyPayment() {
  const url = `${FN_BASE}/verifyPayment`;
  const body = {
    eventId: EVENT_ID,
    registrationId: REG_ID,
    provider: 'mock',
    payload: { amount: AMOUNT }
  };
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok) throw new Error(`verifyPayment failed ${res.status} ${JSON.stringify(json)}`);
  console.log('✓ verifyPayment ok', json);
}

async function assertConfirmedAndOutbox() {
  // wait small
  await sleep(200);
  const regSnap = await db.doc(`events/${EVENT_ID}/registrations/${REG_ID}`).get();
  if (!regSnap.exists) throw new Error('registration missing');
  const reg = regSnap.data();
  if (reg.status !== 'confirmed' || !reg.payment?.verified) {
    throw new Error('registration not confirmed/verified');
  }
  console.log('✓ registration confirmed');

  const outbox = await db.collection(`events/${EVENT_ID}/outbox`).orderBy('createdAt', 'desc').limit(1).get();
  if (outbox.empty) throw new Error('outbox not created');
  const doc = outbox.docs[0].data();
  if (doc.type !== 'PAYMENT_CONFIRMED' || doc.registrationId !== REG_ID) {
    throw new Error('outbox payload mismatch');
  }
  console.log('✓ outbox created', outbox.docs[0].id);
}

async function callSendFcmDryRun() {
  const url = `${FN_BASE}/sendFcm`;
  const body = {
    uid: TEST_UID,
    title: '[테스트] 푸시',
    body: '팬아웃 경로 검증',
    data: { ping: '1', eventId: EVENT_ID, registrationId: REG_ID }
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-auth': N8N_SHARED_SECRET },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`sendFcm failed ${res.status} ${JSON.stringify(json)}`);
  console.log('✓ sendFcm ok', json);
}

(async () => {
  try {
    console.log('== E2E start ==');
    await seedEvent();
    await seedRegistration();
    await callVerifyPayment();
    await assertConfirmedAndOutbox();
    await callSendFcmDryRun();
    console.log('== ALL GREEN ✅ ==');
    process.exit(0);
  } catch (e) {
    console.error('E2E failed ❌:', e.message || e);
    process.exit(1);
  }
})();
