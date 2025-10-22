import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

const N8N_URL = process.env.N8N_WEBHOOK_CLUB_BLOG_CREATE || process.env.N8N_WEBHOOK_URL || '';
const INTERNAL_KEY = process.env.INTERNAL_KEY || '';

export const createClubBlog = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  const claims = context.auth.token as Record<string, any>;
  const isAdmin = claims.admin === true || claims.role === 'admin' || claims['roles']?.includes?.('admin');
  if (!isAdmin) {
    throw new functions.https.HttpsError('permission-denied', '관리자만 실행할 수 있습니다.');
  }

  const clubId = String(data?.clubId || '').trim();
  if (!clubId) {
    throw new functions.https.HttpsError('invalid-argument', 'clubId가 필요합니다.');
  }
  if (!N8N_URL || !INTERNAL_KEY) {
    throw new functions.https.HttpsError('failed-precondition', '서버 환경변수가 설정되지 않았습니다.');
  }

  const ref = db.collection('clubs').doc(clubId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new functions.https.HttpsError('not-found', '클럽 문서를 찾을 수 없습니다.');
  }
  const club = snap.data() || {};

  // n8n으로 전달할 페이로드
  const payload = {
    clubId,
    name: club.name || '',
    sport: club.sport || '',
    region: club.region || '',
    logoUrl: club.logoUrl || '',
    coverImageUrl: club.coverImageUrl || '',
    intro: club.intro || '',
    contactUrl: club.contactUrl || '',
    joinUrl: club.joinUrl || '',
    fee: club.fee || null,
    schedule: club.schedule || []
  };

  const res = await fetch(N8N_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Key': INTERNAL_KEY
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new functions.https.HttpsError('internal', `n8n 실패: ${res.status} ${text}`);
  }

  const result = await res.json().catch(() => ({}));
  const notionUrl: string | undefined = result?.notionUrl;

  if (notionUrl) {
    await ref.update({
      blogProvider: 'notion',
      blogUrl: notionUrl,
      blogCreatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  return { ok: true, notionUrl: notionUrl || null };
});
