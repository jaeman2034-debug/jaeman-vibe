import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";

const db = admin.firestore();

async function verifyWithToss(payload: any) {
  // payload: { paymentKey, orderId, amount }
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
  // PortOne(Iamport)용: 액세스 토큰 발급 -> 결제 조회 -> 금액/상태 검증
  const { PORTONE_API_KEY, PORTONE_API_SECRET } = process.env;
  if (!PORTONE_API_KEY || !PORTONE_API_SECRET) {
    throw new Error('MISSING_PORTONE_KEYS');
  }
  
  // 1) 토큰 발급
  const tokenResp = await axios.post('https://api.iamport.kr/users/getToken', {
    imp_key: PORTONE_API_KEY,
    imp_secret: PORTONE_API_SECRET
  });
  const accessToken = tokenResp.data?.response?.access_token;
  if (!accessToken) throw new Error('PORTONE_TOKEN_FAILED');

  // 2) 결제 조회
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
    // CORS 설정
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

      // 1) 외부 검증
      let result = { verified: false, amount: payload?.amount, raw: null };
      if (provider === 'toss') {
        result = await verifyWithToss(payload);
      } else if (provider === 'portone') {
        result = await verifyWithPortOne(payload);
      } else if (provider === 'mock') {
        // 로컬/스테이징 테스트용
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

      // 2) 트랜잭션: status 확정 + payment 플래그 + outbox 생성
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
