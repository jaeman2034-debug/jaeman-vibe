import crypto from 'node:crypto';
import fetch from 'node-fetch';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getCounters, addHold, releaseHold, incPaid, decPaid, isFull } from './utils/capacity.mjs';
import { getRedis } from './utils/redisClient.mjs';
import { markPaid as markPaidRedis } from './utils/capacity-redis.mjs';
import { c_paid_src } from './metrics-bus.mjs';
import { c_paid, emit } from './metrics-bus.mjs';

const DATA_PUBLIC = process.env.DATA_PUBLIC || '/data/public';
const TICKETS_DIR = path.join(DATA_PUBLIC, 'tickets');

async function ensureDir(p) { 
  await fs.mkdir(p, { recursive: true }); 
}

// 디렉토리 생성
await ensureDir(TICKETS_DIR);

const base = () => (process.env.DOMAIN && !process.env.DOMAIN.startsWith('http')
  ? `https://${process.env.DOMAIN}`
  : (process.env.DOMAIN || 'http://127.0.0.1'));

function makeOrderId(reservationId) {
  return `yago_${reservationId}`; // PG 오더 ID 규칙(고유)
}

export async function createPendingTicket({ meetupId, user, amount, currency = 'KRW', eventStart, eventEnd, bucket = 'default' }) {
  const reservationId = 'r_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  
  // 용량 확인 (버킷별)
  const c = await getCounters(meetupId);
  const full = isFull(c, bucket);
  
  const ticket = { 
    id: reservationId, 
    meetupId, 
    user, 
    amount, 
    currency, 
    state: 'pending', 
    createdAt: Date.now(), 
    eventStart, 
    eventEnd,
    bucket
  };
  
  await fs.writeFile(path.join(TICKETS_DIR, `${reservationId}.json`), JSON.stringify(ticket));
  
  if (full) {
    // 정원이 가득 찬 경우 대기열 권고
    return { ticket, waitlist: true };
  }
  
  // 홀드 추가 (15분 유효)
  await addHold(meetupId, bucket, reservationId);
  return ticket;
}

export async function markPaid({ reservationId, provider, payload }) {
  const f = path.join(TICKETS_DIR, `${reservationId}.json`);
  const j = JSON.parse(await fs.readFile(f, 'utf8'));
  
  j.state = 'paid';
  j.paidAt = Date.now();
  j.payment = { provider, payload };
  
  await fs.writeFile(f, JSON.stringify(j));
  
  // 홀드 해제 및 유료 카운트 증가 (버킷별)
  const redis = getRedis();
  if (redis) {
    await markPaidRedis({ meetupId: j.meetupId, bucket: j.bucket || 'default', rid: reservationId });
  } else {
    await releaseHold(j.meetupId, reservationId);
    await incPaid(j.meetupId, j.bucket || 'default');
  }
  
  // 메트릭 계측
  c_paid.inc({ meetup: j.meetupId, bucket: j.bucket || 'default', provider: j.payment?.provider || 'unknown' });
  c_paid_src.inc({ meetup: j.meetupId, source: j.utm?.source || 'unknown' });
  emit('paid', { meetupId: j.meetupId, bucket: j.bucket || 'default', reservationId });
  
  return j;
}

// ────────────────────────────── Toss
export async function tossCreateCheckout({ reservationId, amount, title }) {
  const orderId = makeOrderId(reservationId);
  const successUrl = base() + (process.env.PAYMENTS_RETURN_SUCCESS || '/payments/success') + `?reservationId=${reservationId}`;
  const failUrl = base() + (process.env.PAYMENTS_RETURN_FAIL || '/payments/fail') + `?reservationId=${reservationId}`;

  // TODO: Toss 결제 요청 API 스펙에 맞춰 URL/헤더/바디 구성
  // 공식 문서: https://docs.tosspayments.com/
  const url = 'https://api.tosspayments.com/v1/payments'; // 예시(확인 필요)
  const body = { 
    amount, 
    orderId, 
    orderName: title || 'YAGO Meetup', 
    successUrl, 
    failUrl,
    currency: 'KRW'
  };
  const auth = 'Basic ' + Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString('base64');
  const resp = await fetch(url, { 
    method: 'POST', 
    headers: { 
      'Authorization': auth, 
      'Content-Type': 'application/json' 
    }, 
    body: JSON.stringify(body) 
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error('Toss checkout error: ' + (data?.message || resp.status));
  return { redirectUrl: data.checkout?.url || data.next_redirect_pc_url || data.url || successUrl, orderId, raw: data };
}

export function tossVerifySignature(req) {
  // TODO: 공식 문서의 서명 검증 규칙 적용
  // 예: const sig = req.headers['x-toss-signature']; HMAC(secret, body) 비교 등
  // 참고: https://docs.tosspayments.com/guides/webhook
  const signature = req.headers['x-toss-signature'];
  if (!signature) return false;
  
  // TODO: 실제 서명 검증 로직 구현
  // const expectedSignature = crypto
  //   .createHmac('sha256', process.env.TOSS_SECRET_KEY)
  //   .update(req.body.toString())
  //   .digest('hex');
  // return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  
  return true; // 임시로 항상 true 반환
}

// ────────────────────────────── PortOne
export async function portoneCreateCheckout({ reservationId, amount, title }) {
  const orderId = makeOrderId(reservationId);
  const successUrl = base() + (process.env.PAYMENTS_RETURN_SUCCESS || '/payments/success') + `?reservationId=${reservationId}`;
  const failUrl = base() + (process.env.PAYMENTS_RETURN_FAIL || '/payments/fail') + `?reservationId=${reservationId}`;

  // TODO: PortOne 결제 요청 API 스펙에 맞춰 URL/헤더/바디 구성
  // 공식 문서: https://developers.portone.io/
  const url = 'https://api.portone.io/payments'; // 예시(확인 필요)
  const body = { 
    amount, 
    orderId, 
    orderName: title || 'YAGO Meetup', 
    successUrl, 
    failUrl,
    currency: 'KRW'
  };
  const headers = { 
    'Authorization': `Bearer ${process.env.PORTONE_API_KEY}`, 
    'Content-Type': 'application/json' 
  };
  const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await resp.json();
  if (!resp.ok) throw new Error('PortOne checkout error: ' + (data?.message || resp.status));
  return { redirectUrl: data.redirectUrl || data.paymentUrl || successUrl, orderId, raw: data };
}

export function portoneVerifySignature(req) {
  // TODO: 포트원 웹훅 서명 검증 로직 적용 (예: X-PortOne-Signature HMAC 등)
  // 참고: https://developers.portone.io/docs/ko/webhook
  const signature = req.headers['x-portone-signature'];
  if (!signature) return false;
  
  // TODO: 실제 서명 검증 로직 구현
  // const expectedSignature = crypto
  //   .createHmac('sha256', process.env.PORTONE_API_SECRET)
  //   .update(req.body.toString())
  //   .digest('hex');
  // return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  
  return true; // 임시로 항상 true 반환
}
