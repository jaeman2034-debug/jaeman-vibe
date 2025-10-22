import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';
import axios from 'axios';
import * as crypto from 'crypto';

const db = admin.firestore();

// 스캐너 관련 상수
const CHECKIN_SECRET = process.env.CHECKIN_SECRET || 'dev-secret-change-me';

function hmacSign(str: string) {
  return crypto.createHmac('sha256', CHECKIN_SECRET).update(str).digest('hex');
}

// ===== 결제 검증 시스템 =====

async function verifyWithToss(payload: any) {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) throw new Error('MISSING_TOSS_SECRET_KEY');

  const url = 'https://api.tosspayments.com/v1/payments/confirm';
  const auth = Buffer.from(`${secretKey}:`).toString('base64');

  const resp = await axios.post(url, {
    paymentKey: payload.paymentKey,
    orderId: payload.orderId,
    amount: payload.amount
  }, {
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json'
    }
  });

  const ok = resp.status === 200 && resp.data && resp.data.status === 'DONE';
  return {
    verified: ok,
    amount: resp.data?.totalAmount ?? payload.amount,
    raw: resp.data
  };
}

async function verifyWithPortOne(payload: any) {
  const { PORTONE_API_KEY, PORTONE_API_SECRET } = process.env;
  if (!PORTONE_API_KEY || !PORTONE_API_SECRET) {
    throw new Error('MISSING_PORTONE_KEYS');
  }
  
  const tokenResp = await axios.post('https://api.iamport.kr/users/getToken', {
    imp_key: PORTONE_API_KEY,
    imp_secret: PORTONE_API_SECRET
  });
  const accessToken = tokenResp.data?.response?.access_token;
  if (!accessToken) throw new Error('PORTONE_TOKEN_FAILED');

  const queryKey = payload.impUid ? `imp_uid=${payload.impUid}` : `merchant_uid=${payload.merchantUid}`;
  const payResp = await axios.get(`https://api.iamport.kr/payments?${queryKey}`, {
    headers: { Authorization: accessToken }
  });

  const payment = payResp.data?.response?.list?.[0];
  const ok = payment && payment.status === 'paid' && Number(payment.amount) === Number(payload.amount);
  return {
    verified: !!ok,
    amount: payment?.amount ?? payload.amount,
    raw: payment
  };
}

export const verifyPayment = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
      const { eventId, registrationId, provider, payload } = req.body || {};
      if (!eventId || !registrationId || !provider) {
        return res.status(400).json({ error: 'MISSING_PARAMS' });
      }

      const regRef = db.doc(`events/${eventId}/registrations/${registrationId}`);
      const regSnap = await regRef.get();
      if (!regSnap.exists) {
        return res.status(404).json({ error: 'REG_NOT_FOUND' });
      }
      const reg = regSnap.data() || {};

      let result = { verified: false, amount: payload?.amount, raw: null };
      if (provider === 'toss') {
        result = await verifyWithToss(payload);
      } else if (provider === 'portone') {
        result = await verifyWithPortOne(payload);
      } else if (provider === 'mock') {
        result = { 
          verified: true, 
          amount: payload?.amount ?? reg?.payment?.amount ?? 0, 
          raw: { mock: true } 
        };
      } else {
        return res.status(400).json({ error: 'PROVIDER_UNSUPPORTED' });
      }

      if (!result.verified) {
        return res.status(402).json({ error: 'VERIFY_FAILED' });
      }

      await db.runTransaction(async (tx) => {
        const fresh = await tx.get(regRef);
        if (!fresh.exists) throw new Error('REG_NOT_FOUND_TX');

        const now = admin.firestore.FieldValue.serverTimestamp();

        tx.update(regRef, {
          status: 'confirmed',
          payment: {
            ...(fresh.data()?.payment || {}),
            provider,
            amount: result.amount,
            verified: true,
            verifiedAt: now
          },
          confirmedAt: now
        });

        const outRef = db.collection('events').doc(eventId).collection('outbox').doc();
        tx.set(outRef, {
          type: 'PAYMENT_CONFIRMED',
          registrationId,
          uid: fresh.data()?.uid,
          email: fresh.data()?.email || null,
          createdAt: now
        });
      });

      return res.json({ ok: true, provider, amount: result.amount });
    } catch (err: any) {
      console.error('[verifyPayment] error:', err);
      return res.status(500).json({ 
        error: 'SERVER_ERROR', 
        message: String(err?.message || err) 
      });
    }
  });

// ===== n8n 연동 =====

export const outboxToN8N = functions
  .region('us-central1')
  .firestore.document('events/{eventId}/outbox/{docId}')
  .onCreate(async (snap, ctx) => {
    const { eventId } = ctx.params as any;
    const outbox = snap.data() || {};

    try {
      const [eventSnap, regSnap] = await Promise.all([
        db.doc(`events/${eventId}`).get(),
        outbox.registrationId ? db.doc(`events/${eventId}/registrations/${outbox.registrationId}`).get() : Promise.resolve(null as any),
      ]);

      const event = eventSnap?.exists ? eventSnap.data() : {};
      const reg = regSnap?.exists ? regSnap.data() : {};

      let fcmToken: string | null = null;
      if (reg?.uid) {
        const userSnap = await db.doc(`users/${reg.uid}`).get();
        fcmToken = (userSnap.get && userSnap.get('profile.fcmToken')) || null;
      }

      const toICS = (ts: any) => {
        if (!ts) return null;
        const d = ts?.toDate ? ts.toDate() : new Date(ts);
        return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
      };

      const payload = {
        _type: outbox.type,
        eventId,
        registrationId: outbox.registrationId,
        user: { uid: reg?.uid || null, email: reg?.email || null, fcmToken },
        event: {
          id: eventId,
          title: event?.title || '이벤트',
          startUtc: toICS(event?.startAt || event?.startUTC),
          endUtc: toICS(event?.endAt || event?.endUTC),
          location: event?.location || event?.place || null,
        },
        createdAt: new Date().toISOString(),
      } as any;

      const url = process.env.N8N_WEBHOOK_URL;
      const secret = process.env.N8N_SHARED_SECRET || '';
      if (!url) {
        console.warn('[outboxToN8N] N8N_WEBHOOK_URL not set; skipping');
        return;
      }
      await axios.post(url, payload, { headers: { 'x-auth': secret } });
    } catch (e) {
      console.error('[outboxToN8N] error:', e);
    }
  });

export const sendFcm = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-auth');
      res.status(204).send('');
      return;
    }
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
      const secret = req.get('x-auth');
      if (secret !== (process.env.N8N_SHARED_SECRET || '')) {
        return res.status(401).json({ error: 'UNAUTHORIZED' });
      }

      const { token, uid, title, body, data } = (req as any).body || {};
      let fcmToken: string | null = token || null;

      if (!fcmToken && uid) {
        const snap = await db.doc(`users/${uid}`).get();
        fcmToken = (snap.get && snap.get('profile.fcmToken')) || null;
      }
      if (!fcmToken) return res.status(400).json({ error: 'MISSING_TOKEN' });

      const msg = {
        token: fcmToken,
        notification: { title: title || '알림', body: body || '' },
        data: data && typeof data === 'object'
          ? Object.fromEntries(Object.entries(data).map(([k, v]) => [String(k), String(v as any)]))
          : {},
      } as any;

      const id = await admin.messaging().send(msg);
      return res.json({ ok: true, id });
    } catch (e: any) {
      console.error('[sendFcm] error', e);
      return res.status(500).json({ error: 'SERVER_ERROR', message: String(e?.message || e) });
    }
  });

// ===== 스태프 전용 스캐너 시스템 =====

export const issueTicket = functions.region("us-central1").https.onCall(async (data, context) => {
  const { eventId, registrationId, ttlSec } = data || {};
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'LOGIN_REQUIRED');
  if (!eventId || !registrationId) throw new functions.https.HttpsError('invalid-argument', 'MISSING_PARAMS');

  const regRef = db.doc(`events/${eventId}/registrations/${registrationId}`);
  const [regSnap, staffSnap] = await Promise.all([
    regRef.get(),
    db.doc(`events/${eventId}/staff/${context.auth.uid}`).get()
  ]);
  if (!regSnap.exists) throw new functions.https.HttpsError('not-found', 'REG_NOT_FOUND');

  const reg = regSnap.data();
  const isOwner = reg?.uid === context.auth.uid;
  const isStaff = staffSnap.exists;
  if (!isOwner && !isStaff)
    throw new functions.https.HttpsError('permission-denied', 'NOT_ALLOWED');

  if (reg?.status !== 'confirmed')
    throw new functions.https.HttpsError('failed-precondition', 'NOT_CONFIRMED');

  const now = Math.floor(Date.now() / 1000);
  const ttl = Math.min(Number(ttlSec || 60 * 60 * 24 * 3), 60 * 60 * 24 * 7);
  const exp = now + ttl;

  const base = `${eventId}.${registrationId}.${reg?.uid}.${exp}`;
  const sig = hmacSign(base);
  const token = `${base}.${sig}`;

  await regRef.set({
    ticket: {
      lastIssuedAt: admin.firestore.FieldValue.serverTimestamp(),
      exp
    }
  }, { merge: true });

  return { token, exp };
});

export const scanCheckin = functions.region("us-central1").https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'LOGIN_REQUIRED');
  const { token } = data || {};
  if (!token || typeof token !== 'string')
    throw new functions.https.HttpsError('invalid-argument', 'MISSING_TOKEN');

  const parts = token.split('.');
  if (parts.length !== 5)
    throw new functions.https.HttpsError('invalid-argument', 'BAD_TOKEN_FORMAT');

  const [eventId, registrationId, uid, expStr, sig] = parts;
  const exp = Number(expStr || 0);
  const base = `${eventId}.${registrationId}.${uid}.${exp}`;
  const expectSig = hmacSign(base);
  if (expectSig !== sig)
    throw new functions.https.HttpsError('permission-denied', 'INVALID_SIGNATURE');

  if (Math.floor(Date.now() / 1000) > exp)
    throw new functions.https.HttpsError('deadline-exceeded', 'TOKEN_EXPIRED');

  const staffRef = db.doc(`events/${eventId}/staff/${context.auth.uid}`);
  const staffDoc = await staffRef.get();
  if (!staffDoc.exists)
    throw new functions.https.HttpsError('permission-denied', 'NOT_EVENT_STAFF');

  const regRef = db.doc(`events/${eventId}/registrations/${registrationId}`);
  let result = { already: false, attendee: null };

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(regRef);
    if (!snap.exists) throw new functions.https.HttpsError('not-found', 'REG_NOT_FOUND');
    const reg = snap.data();

    if (reg?.uid !== uid) throw new functions.https.HttpsError('permission-denied', 'UID_MISMATCH');

    if (reg?.status !== 'confirmed')
      throw new functions.https.HttpsError('failed-precondition', 'NOT_CONFIRMED');

    const now = admin.firestore.FieldValue.serverTimestamp();
    const already = !!reg?.checkedInAt;

    if (!already) {
      tx.update(regRef, {
        checkedInAt: now,
        checkedInBy: context.auth.uid,
        checkinCount: (reg?.checkinCount || 0) + 1,
        checkinHistory: admin.firestore.FieldValue.arrayUnion({
          by: context.auth.uid,
          at: now
        })
      });
    }

    result = {
      already,
      attendee: {
        uid: reg?.uid,
        email: reg?.email || null,
        name: reg?.name || reg?.displayName || null
      }
    };
  });

  return { ok: true, ...result, eventId, registrationId };
});
