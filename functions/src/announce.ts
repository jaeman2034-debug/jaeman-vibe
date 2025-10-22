import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendToEventAttendees, sendToTopic, topic } from './fcm';
const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();

async function assertStaff(eventId: string, uid?: string){
  if (!uid) throw new functions.https.HttpsError('unauthenticated','login');
  const role = await db.doc(`events/${eventId}/roles/${uid}`).get();
  if (!role.exists) throw new functions.https.HttpsError('permission-denied','staff only');
  return uid!;
}

// 간단 욕설 필터(운영용 리스트 + 기본 리스트)
const DEFAULT_BAD = ['씨발','개새','병신','fuck','shit']; // 예시(실서비스는 외부 리스트로 교체)
async function moderate(text: string){
  const s = (text||'').toLowerCase();
  const adminSettings = await db.doc('admin/settings/moderation').get().catch(()=>null);
  const custom = adminSettings?.exists ? (adminSettings.data()?.banned || []) : [];
  const banned = new Set<string>([...DEFAULT_BAD, ...custom.map((x:string)=>String(x).toLowerCase())]);
  for (const w of banned) if (w && s.includes(w)) {
    throw new functions.https.HttpsError('failed-precondition', `금칙어 포함: ${w}`);
  }
}

// 레이트리밋: 유저별 이벤트당 5분 1회
async function rateLimit(eventId:string, uid:string, windowMs=5*60*1000){
  const ref = db.doc(`events/${eventId}/ratelimits/${uid}`);
  const snap = await ref.get();
  const nowMs = Date.now();
  const last = snap.exists ? (snap.data()!.last as number) : 0;
  if (nowMs - last < windowMs) {
    throw new functions.https.HttpsError('resource-exhausted', '잠시 후 다시 시도하세요(5분 제한)');
  }
  await ref.set({ last: nowMs }, { merge:true });
}

export const createAnnouncement = functions.https.onCall(async (data, ctx)=>{
  const { eventId, title, text } = data as any;
  const uid = await assertStaff(eventId, (ctx as any).auth?.uid);
  if (!text || String(text).trim().length < 2) throw new functions.https.HttpsError('invalid-argument','내용을 입력하세요');
  await moderate(`${title||''}\n${text}`);
  await rateLimit(eventId, uid);

  const docRef = await db.collection(`events/${eventId}/announcements`).add({
    title: title?.slice(0,80) || null,
    text: text.slice(0,5000),
    pinned: false,
    createdAt: now(),
    authorId: uid
  });
  await db.collection(`events/${eventId}/logs`).add({
    action:'announce.create', actorId: uid, at: now(), meta:{ id: docRef.id }
  });

  // 공지 생성 푸시 알림
  try {
    // 개별 발송 (토큰 없는 유저 커버)
    await sendToEventAttendees(eventId, {
      title: '새 공지',
      body: title || text.slice(0, 40) + (text.length > 40 ? '...' : '')
    }, { 
      type: 'announce.create', 
      announcementId: docRef.id 
    });

    // 토픽 발송
    await sendToTopic(topic(eventId, 'announce'), {
      title: '새 공지',
      body: title || text.slice(0, 40) + (text.length > 40 ? '...' : '')
    }, { 
      type: 'announce.create', 
      eventId,
      announcementId: docRef.id 
    });
  } catch (error) {
    console.error('공지 생성 푸시 발송 실패:', error);
  }

  return { ok: true, id: docRef.id };
});

export const updateAnnouncement = functions.https.onCall(async (data, ctx)=>{
  const { eventId, annId, title, text } = data as any;
  const uid = await assertStaff(eventId, (ctx as any).auth?.uid);
  if (text) await moderate(`${title||''}\n${text}`);
  await db.doc(`events/${eventId}/announcements/${annId}`).set({
    ...(title!==undefined ? { title: title?.slice(0,80) || null } : {}),
    ...(text!==undefined ? { text: text.slice(0,5000) } : {}),
    updatedAt: now(),
    editorId: uid
  }, { merge:true });
  await db.collection(`events/${eventId}/logs`).add({
    action:'announce.update', actorId: uid, at: now(), meta:{ id: annId }
  });
  return { ok:true };
});

export const deleteAnnouncement = functions.https.onCall(async (data, ctx)=>{
  const { eventId, annId } = data as any;
  const uid = await assertStaff(eventId, (ctx as any).auth?.uid);
  await db.doc(`events/${eventId}/announcements/${annId}`).delete();
  await db.collection(`events/${eventId}/logs`).add({
    action:'announce.delete', actorId: uid, at: now(), meta:{ id: annId }
  });
  return { ok:true };
});
