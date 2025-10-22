import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import fetch from 'node-fetch';
import crypto from 'node:crypto';
import QRCode from 'qrcode';
import { createEvent } from 'ics';
import pino from 'pino-http';
import client from 'prom-client';
import bodyParser from 'body-parser';
import { setupFeedEndpoint } from './feed.mjs';
import { authManage, rateLimit } from './middleware/authManage.mjs';
import { authFirebase } from './middleware/authFirebase.mjs';
import { requireClubRole } from './middleware/clubGuard.mjs';
import admin from 'firebase-admin';
import { createPendingTicket, tossCreateCheckout, portoneCreateCheckout, tossVerifySignature, portoneVerifySignature, markPaid } from './payments.mjs';
import { renderOg } from './og.mjs';
import { generateSitemap } from './sitemap.mjs';
import { createInvite, acceptInvite, getInviteInfo } from './invites.mjs';
import { portoneWebhook } from './portoneWebhook.mjs';
import { tossWebhook } from './tossWebhook.mjs';
import { readTicket, writeTicket, canCancel, getTicketsByMeetup, getTicketsByUser } from './utils/tickets.mjs';
import { cancelTicketCore, getCancellationInfo } from './payments-cancel.mjs';
import { applePass } from './wallet-apple.mjs';
import { googleWalletLink } from './wallet-google.mjs';
import { getCounters, setCapacity, cleanupHolds, setBucketCaps, isFull } from './utils/capacity.mjs';
import { getRedis } from './utils/redisClient.mjs';
import { holdSeat, getSnapshot } from './utils/capacity-redis.mjs';
import { consumePromo } from './utils/promo.mjs';
import { getMeetupBuckets, setMeetupBuckets } from './meetup-buckets.mjs';
import { checkEligibility } from './utils/eligibility.mjs';
import crypto from 'node:crypto';
import { bus, register, c_rsvp, c_checkout, c_paid, c_checkin, g_capacity, emit, c_rsvp_src, c_checkout_src, c_paid_src } from './metrics-bus.mjs';
import { Parser as CsvParser } from 'json2csv';
import { TICKETS_DIR } from './utils/tickets.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { startAlerts } from './alerts.mjs';
import { startCapacityAlerts } from './alerts-capacity.mjs';
import { publishMeetup, publishGoogleSites } from './publish.mjs';
import { meetRedirect } from './redirect.mjs';
import { aggregateROI } from './reports.mjs';
import { slackDaily, slackWeekly } from './reports-slack.mjs';
import { addCosts, listCosts } from './roi-costs.mjs';
import { registerTeamRoutes } from './team-api.mjs';
import { registerTeamRead } from './team-read.mjs';
import { registerIcs } from './ics.mjs';
import { registerTeamBlog } from './team-blog.mjs';
import { registerTeamOG } from './og-gen-team.mjs';
import { registerOfficialsRoutes } from './officials-api.mjs';
import { registerReportsRoutes } from './reports-api.mjs';
import { getTable, getRatings } from './standings.mjs';
import { registerAvailabilityRoutes } from './officials-availability.mjs';
import { recommendAssignments, commitAssignments } from './auto-assign.mjs';
import { aggregatePayouts, payoutCsv, setPayoutRules, getPayoutRules } from './payouts.mjs';
import { notifyAutoAssign, notifyMonthlyPayouts } from './assign-slack.mjs';
import cookie from 'cookie';

const app = express();

// UTM 처리 함수
function getUtmFromReq(req) {
  try {
    const c = cookie.parse(req.headers.cookie || '');
    if (c.utm_src) return { source: c.utm_src };
  } catch {}
  return {};
}

// Structured logging
app.use(pino({
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: { singleLine: true }
  } : undefined
}));

app.use(express.json());

// 웹훅별 바디 파서 구성
// PortOne 검증에는 "문자열(raw) body"가 필요하므로 해당 경로만 text 파서 사용
app.use('/webhook/portone', bodyParser.text({ type: 'application/json' }));
// Toss는 일반 JSON으로 충분
app.use('/webhook/toss', express.json());

// Prometheus metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'yago_', register: client.register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'yago_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new client.Counter({
  name: 'yago_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Metrics middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);
      
    httpRequestTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
  });
  
  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.set('X-Version', process.env.VERSION || 'dev');
  res.set('X-Commit', process.env.COMMIT || 'dev');
  res.json({ 
    ok: true, 
    timestamp: Date.now(),
    version: process.env.VERSION || 'dev',
    commit: process.env.COMMIT || 'dev',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
const PORT = 3001;

const DATA_PUBLIC = '/data/public';
const OG_DIR = path.join(DATA_PUBLIC, 'og');
const TICKETS_DIR = path.join(DATA_PUBLIC, 'tickets');
const EMAIL_FALLBACK = 'guest@yago.local';

async function ensureDir(p) { 
  await fs.mkdir(p, { recursive: true }); 
}

// 체크인 시그니처 생성/검증
function sign(id) { 
  return crypto.createHmac('sha256', process.env.CHECKIN_SECRET || 'dev-secret')
    .update(id).digest('hex').slice(0, 16); 
}

function base() { 
  return process.env.DOMAIN ? `https://${process.env.DOMAIN}` : 'http://127.0.0.1'; 
}

app.post('/webhook/post-published', async (req, res) => {
  const { id, title, summary = '', coverImageUrl = '', url = '' } = req.body || {};
  if (!id || !title) return res.status(400).json({ error: 'id and title required' });
  
  try {
    await ensureDir(OG_DIR);
    
    // OG 이미지 생성 요청
    const ogResp = await fetch(`http://og:3000/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(summary)}`);
    if (!ogResp.ok) throw new Error(`OG service ${ogResp.status}`);
    
    const buf = Buffer.from(await ogResp.arrayBuffer());
    const ogPath = path.join(OG_DIR, `${id}.png`);
    await fs.writeFile(ogPath, buf);

    const base = process.env.DOMAIN ? `https://${process.env.DOMAIN}` : 'http://127.0.0.1';
    const ogUrl = `${base}/ogimg/og/${id}.png`;

    // n8n 자동배포 (선택)
    if (process.env.N8N_WEBHOOK_POST_PUBLISHED) {
      const hookUrl = process.env.N8N_WEBHOOK_POST_PUBLISHED;
      const payload = { id, title, summary, url, ogUrl, coverImageUrl };
      
      try {
        await fetch(hookUrl, {
          method: 'POST', 
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${process.env.N8N_TOKEN || ''}` 
          },
          body: JSON.stringify(payload)
        });
        console.log('[WEBHOOK] n8n 알림 전송 완료');
      } catch (err) {
        console.warn('[WEBHOOK] n8n 알림 실패:', err.message);
      }
    }

    res.json({ id, ogUrl, message: 'OK' });
  } catch (err) {
    console.error('[WEBHOOK]', err);
    res.status(500).json({ error: String(err) });
  }
});

app.post('/team-blog-create', async (req, res) => {
  const { clubId, clubName, sport, region, logoUrl = '', description = '' } = req.body || {};
  if (!clubId || !clubName) return res.status(400).json({ error: 'clubId, clubName required' });
  try {
    // 1) 클럽용 OG 생성
    const ogResp = await fetch(`http://og:3000/og?title=${encodeURIComponent(clubName)}&subtitle=${encodeURIComponent(sport || '')}`);
    if (!ogResp.ok) throw new Error(`OG service ${ogResp.status}`);
    const buf = Buffer.from(await ogResp.arrayBuffer());
    await ensureDir(OG_DIR);
    const ogId = `club-${clubId}`;
    await fs.writeFile(path.join(OG_DIR, `${ogId}.png`), buf);

    const base = process.env.DOMAIN ? `https://${process.env.DOMAIN}` : 'http://127.0.0.1';
    const ogUrl = `${base}/ogimg/og/${ogId}.png`;

    // 2) n8n으로 전달 (Notion/Apps Script 퍼블리시)
    if (process.env.N8N_WEBHOOK_TEAM_BLOG_CREATE) {
      const payload = { clubId, clubName, sport, region, logoUrl, description, ogUrl, createdAt: Date.now() };
      await fetch(process.env.N8N_WEBHOOK_TEAM_BLOG_CREATE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.N8N_TOKEN || ''}` },
        body: JSON.stringify(payload)
      });
    }
    return res.json({ ok: true, clubId, ogUrl });
  } catch (e) {
    console.error('[team-blog-create]', e);
    return res.status(500).json({ error: String(e) });
  }
});

// 예약 생성 (무료 RSVP 또는 테스트 예약)
app.post('/reserve', async (req, res) => {
  const { meetupId, user = { name: 'Guest' }, amount = 0, eventStart, eventEnd, bucket = 'default', utm } = req.body || {};
  const utmSrc = (utm?.source) || getUtmFromReq(req).source || 'unknown';
  if (!meetupId) return res.status(400).json({ error: 'meetupId required' });
  
  try {
    await ensureDir(TICKETS_DIR);
    
    // 버킷 정의 조회 및 자격 검증
    const buckets = await getMeetupBuckets(meetupId);
    const def = buckets.find(b => b.key === bucket) || buckets[0];
    
    // 사용자 프로필 조회(익명은 규칙 중 성/나이 요구 시 차단)
    let profile = null;
    try {
      const uid = req.user?.uid;
      if (uid) {
        const snap = await admin.firestore().doc(`users/${uid}`).get();
        profile = snap?.data()?.profile || null;
      }
    } catch {}
    
    const elig = checkEligibility({ profile, rules: def?.rules });
    if (!elig.ok) {
      return res.status(400).json({ error: 'not_eligible', reason: elig.reason });
    }
    
    const reservationId = 'r_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    
    // 용량 확인 (버킷별)
    const c = await getCounters(meetupId);
    const full = isFull(c, bucket);
    
    // 상태 결정: 유료는 pending, 무료는 용량에 따라 paid 또는 waitlisted
    let state;
    if (amount > 0) {
      state = 'pending';
    } else if (full) {
      state = 'waitlisted';
    } else {
      state = 'paid';
    }
    
    const ticket = { 
      id: reservationId, 
      meetupId, 
      user, 
      amount,
      currency: 'KRW',
      state, 
      createdAt: Date.now(),
      eventStart,
      eventEnd,
      bucket,
      utm: { source: utmSrc }
    };
    
    await fs.writeFile(
      path.join(TICKETS_DIR, `${reservationId}.json`), 
      JSON.stringify(ticket)
    );
    
    // 카운터 업데이트 (버킷별)
    if (state === 'paid') {
      await incPaid(meetupId, bucket);
    }
    
    // 메트릭 계측 (유/무료 무관)
    c_rsvp.inc({ meetup: meetupId, bucket: bucket || 'default' });
    c_rsvp_src.inc({ meetup: meetupId, source: utmSrc });
    emit('rsvp', { meetupId, bucket, reservationId });
    
    if (state === 'waitlisted') {
      const position = await wlPush(meetupId, bucket, { 
        id: reservationId, 
        user, 
        ts: Date.now() 
      });
      
      return res.json({ 
        reservationId, 
        waitlisted: true, 
        position,
        message: '정원이 가득 찼습니다. 대기열에 등록되었습니다.',
        state: 'waitlisted'
      });
    }
    
    const checkinUrl = `${base()}/checkin?id=${reservationId}&sig=${sign(reservationId)}`;
    const qrPngUrl = `${base()}/ticket/${reservationId}.png`;
    const icsUrl = `${base()}/ics/${reservationId}.ics`;
    
    return res.json({ reservationId, checkinUrl, qrPngUrl, icsUrl, state });
  } catch (e) {
    console.error('[reserve]', e);
    res.status(500).json({ error: String(e) });
  }
});

// QR 이미지(PNG)
app.get('/ticket/:id.png', async (req, res) => {
  try {
    const id = req.params.id;
    const url = `${base()}/checkin?id=${id}&sig=${sign(id)}`;
    const png = await QRCode.toBuffer(url, { 
      width: 320, 
      errorCorrectionLevel: 'M' 
    });
    res.setHeader('Content-Type', 'image/png');
    res.send(png);
  } catch (e) { 
    console.error('[ticket-qr]', e);
    res.status(500).send('QR error'); 
  }
});

// 체크인 — 남발/중복 방지
app.get('/checkin', rateLimit(), async (req, res) => {
  const { id, sig } = req.query;
  if (!id || !sig) return res.status(400).json({ error: 'id,sig required' });
  if (sig !== sign(String(id))) return res.status(401).json({ error: 'invalid signature' });
  
  try {
    const f = path.join(TICKETS_DIR, `${id}.json`);
    const json = JSON.parse(await fs.readFile(f, 'utf8'));
    
    if (json.state === 'checkedIn') {
      return res.json({ ok: true, id, state: 'already_checked_in', checkedInAt: json.checkedInAt });
    }
    
    json.state = 'checkedIn';
    json.checkedInAt = Date.now();
    await fs.writeFile(f, JSON.stringify(json));
    res.json({ ok: true, id, state: 'checkedIn' });
  } catch (e) { 
    console.error('[checkin]', e);
    res.status(404).json({ error: 'ticket not found' }); 
  }
});

// ICS 달력 티켓 발급 — 실제 일정 반영
app.get('/ics/:id.ics', async (req, res) => {
  try {
    const id = req.params.id;
    const f = path.join(TICKETS_DIR, `${id}.json`);
    const t = JSON.parse(await fs.readFile(f, 'utf8'));
    
    // 실제 일정 반영 (reserve에서 받은 eventStart/end 사용)
    const begin = t.eventStart ? new Date(t.eventStart) : new Date((t.createdAt || Date.now()) + 10 * 60 * 1000);
    const end = t.eventEnd ? new Date(t.eventEnd) : new Date(begin.getTime() + 60 * 60 * 1000);

    const event = {
      title: `참가 티켓 — ${t.meetupId}`,
      description: `현장 체크인 QR: ${base()}/ticket/${id}.png\n체크인 URL: ${base()}/checkin?id=${id}&sig=${sign(id)}`,
      start: [begin.getFullYear(), begin.getMonth() + 1, begin.getDate(), begin.getHours(), begin.getMinutes()],
      end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), end.getHours(), end.getMinutes()],
      url: `${base()}/checkin?id=${id}&sig=${sign(id)}`,
      alarms: [{ 
        action: 'display', 
        description: '체크인 시간입니다', 
        trigger: { minutes: 30, before: true } 
      }],
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      organizer: { name: 'YAGO SPORTS', email: 'noreply@yago.sports' }
    };
    
    createEvent(event, (err, icsStr) => {
      if (err) {
        console.error('[ics]', err);
        return res.status(500).send(String(err));
      }
      
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${id}.ics"`);
      return res.send(icsStr);
    });
  } catch (e) { 
    console.error('[ics]', e);
    res.status(404).send('not found'); 
  }
});

// 주최자용 참가자 목록 CSV 다운로드 — 보안 가드 적용
app.get('/manage/meetups/:id/attendees.csv', authManage, async (req, res) => {
  try {
    const mid = req.params.id;
    const files = await fs.readdir(TICKETS_DIR);
    const rows = [['reservationId', 'meetupId', 'name', 'state', 'createdAt', 'checkedInAt']];
    
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      const t = JSON.parse(await fs.readFile(path.join(TICKETS_DIR, f), 'utf8'));
      if (t.meetupId !== mid) continue;
      
      rows.push([
        t.id || f.replace('.json', ''), 
        t.meetupId, 
        t.user?.name || '', 
        t.state || '', 
        t.createdAt || '', 
        t.checkedInAt || ''
      ]);
    }
    
    const csv = rows.map(r => r.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="attendees-${mid}.csv"`);
    res.send(csv);
  } catch (e) {
    console.error('[csv]', e);
    res.status(500).send('CSV generation failed');
  }
});

// ────────────────────────────── 결제 관련 라우트

// 1) Checkout 세션 생성
app.post('/payments/checkout', async (req, res) => {
  try {
    const { meetupId, user = { name: 'Guest' }, provider = 'toss', amount, currency = 'KRW', eventStart, eventEnd, title, bucket = 'default', utm } = req.body || {};
    const utmSrc = (utm?.source) || getUtmFromReq(req).source || 'unknown';
    if (!meetupId || !amount) return res.status(400).json({ error: 'meetupId, amount required' });

    // 버킷 정의 조회 및 자격 검증
    const buckets = await getMeetupBuckets(meetupId);
    const def = buckets.find(b => b.key === bucket) || buckets[0];
    
    // 사용자 프로필 조회(익명은 규칙 중 성/나이 요구 시 차단)
    let profile = null;
    try {
      const uid = req.user?.uid;
      if (uid) {
        const snap = await admin.firestore().doc(`users/${uid}`).get();
        profile = snap?.data()?.profile || null;
      }
    } catch {}
    
    const elig = checkEligibility({ profile, rules: def?.rules });
    if (!elig.ok) {
      return res.status(400).json({ error: 'not_eligible', reason: elig.reason });
    }

    const result = await createPendingTicket({ meetupId, user, amount, currency, eventStart, eventEnd, bucket });
    
    // Redis가 있으면 hold 시도
    const redis = getRedis();
    if (redis) {
      const h = await holdSeat({ meetupId, bucket, rid: result.id, ttlMin: Number(process.env.HOLD_TTL_MIN || 15) });
      if (!h.ok) {
        return res.status(409).json({ 
          error: 'full', 
          waitlistRecommended: true,
          message: '정원이 가득 찼습니다. 대기열에 등록하시겠습니까?'
        });
      }
    } else {
      // Redis가 없으면 기존 로직 사용
      if (result && result.waitlist) {
        return res.status(409).json({ 
          error: 'full', 
          waitlistRecommended: true,
          message: '정원이 가득 찼습니다. 대기열에 등록하시겠습니까?'
        });
      }
    }
    
    const ticket = result.ticket || result;
    // UTM 정보를 티켓에 추가
    try {
      const f = path.join(TICKETS_DIR, `${ticket.id}.json`);
      const j = JSON.parse(await fs.readFile(f, 'utf8'));
      j.utm = { source: utmSrc };
      await fs.writeFile(f, JSON.stringify(j));
    } catch {}
    
    const fn = provider === 'portone' ? portoneCreateCheckout : tossCreateCheckout;
    const { redirectUrl, orderId, raw } = await fn({ reservationId: ticket.id, amount, title });

    // 메트릭 계측
    c_checkout.inc({ meetup: meetupId, bucket, provider });
    c_checkout_src.inc({ meetup: meetupId, source: utmSrc });
    emit('checkout', { meetupId, bucket, provider, reservationId: ticket.id });

    return res.json({ reservationId: ticket.id, provider, orderId, redirectUrl, raw });
  } catch (e) { 
    console.error('[checkout]', e); 
    res.status(500).json({ error: String(e) }); 
  }
});

// 2) 리턴 URL (선택: 프론트에서 처리해도 됨)
app.get('/payments/success', async (req, res) => {
  const reservationId = req.query.reservationId || '';
  // 프론트로 리다이렉트
  res.redirect(`/meetups/thanks?reservationId=${encodeURIComponent(reservationId)}`);
});

app.get('/payments/fail', async (req, res) => {
  const reservationId = req.query.reservationId || '';
  res.redirect(`/meetups/fail?reservationId=${encodeURIComponent(reservationId)}`);
});

// 3) Toss 웹훅 (새로운 검증 시스템)
app.post('/webhook/toss', tossWebhook);

// 4) PortOne 웹훅 (새로운 검증 시스템)
app.post('/webhook/portone', portoneWebhook);

// 기존 레거시 웹훅 (호환성 유지)
app.post('/webhook/payments/toss', express.raw({ type: '*/*' }), async (req, res) => {
  try {
    if (!tossVerifySignature(req)) return res.status(401).end();
    const body = JSON.parse(req.body.toString('utf8'));
    const reservationId = (body?.orderId || '').replace(/^yago_/, '');
    if (!reservationId) return res.status(400).end();
    await markPaid({ reservationId, provider: 'toss', payload: body });
    res.status(200).end();
  } catch (e) { 
    console.error('[toss-webhook-legacy]', e); 
    res.status(500).end(); 
  }
});

app.post('/webhook/payments/portone', express.raw({ type: '*/*' }), async (req, res) => {
  try {
    if (!portoneVerifySignature(req)) return res.status(401).end();
    const body = JSON.parse(req.body.toString('utf8'));
    const reservationId = (body?.orderId || body?.merchant_uid || '').replace(/^yago_/, '');
    if (!reservationId) return res.status(400).end();
    await markPaid({ reservationId, provider: 'portone', payload: body });
    res.status(200).end();
  } catch (e) { 
    console.error('[portone-webhook-legacy]', e); 
    res.status(500).end(); 
  }
});

// 5) 취소/환불(기본 스텁)
app.post('/payments/cancel', authManage, async (req, res) => {
  // TODO: provider 별 결제 취소 API 호출(금액/사유), markPaid → state='cancelled' 로 변경
  return res.json({ ok: true });
});

// 6) 웹훅 테스트 엔드포인트 (개발용)
app.get('/webhook/test/portone', async (req, res) => {
  res.json({
    message: 'PortOne webhook endpoint ready',
    url: `${base()}/webhook/portone`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
});

app.get('/webhook/test/toss', async (req, res) => {
  res.json({
    message: 'Toss webhook endpoint ready',
    url: `${base()}/webhook/toss`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
});

// ────────────────────────────── SEO & OG 관련 라우트

// OG 이미지 생성
app.get('/og', async (req, res) => {
  try {
    const { title, subtitle, sport, club, date, bg } = req.query;
    const png = await renderOg({ title, subtitle, sport, club, date, bg });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(png);
  } catch (e) { 
    console.error('[og]', e); 
    res.status(500).send('OG error: ' + e.message); 
  }
});

// 사이트맵 생성
app.get('/sitemap.xml', async (req, res) => {
  try {
    const base = (process.env.DOMAIN && !process.env.DOMAIN.startsWith('http')) 
      ? `https://${process.env.DOMAIN}` 
      : (process.env.DOMAIN || 'http://127.0.0.1');
    const xml = await generateSitemap(base);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(xml);
  } catch (e) { 
    console.error('[sitemap]', e); 
    res.status(500).send('Sitemap error: ' + e.message); 
  }
});

// robots.txt
app.get('/robots.txt', (req, res) => {
  const base = (process.env.DOMAIN && !process.env.DOMAIN.startsWith('http')) 
    ? `https://${process.env.DOMAIN}` 
    : (process.env.DOMAIN || 'http://127.0.0.1');
  res.type('text/plain');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(`User-agent: *
Allow: /
Sitemap: ${base}/sitemap.xml
`);
});

// ────────────────────────────── Wallet 발급 (Apple/Google)

// Apple Wallet (.pkpass) 발급
app.get('/wallet/apple/:id.pkpass', applePass);

// Google Wallet Save to Google Pay 링크 생성
app.get('/wallet/google/:id.link', googleWalletLink);

// ────────────────────────────── Capacity & Waitlist 관리

// 정원/좌석 정보 조회 (누구나 접근 가능)
app.get('/api/meetups/:id/capacity', async (req, res) => {
  try {
    const meetupId = req.params.id;
    const counter = await getCounters(meetupId);
    
    res.json({
      capacity: counter.capacity,
      paid: counter.paid,
      pending: counter.pending,
      waitlist: counter.waitlist,
      available: Math.max(0, counter.capacity - (counter.paid + counter.pending)),
      isFull: (counter.paid + counter.pending) >= counter.capacity
    });
  } catch (e) {
    console.error('[capacity-get]', e);
    res.status(500).json({ error: 'failed to get capacity' });
  }
});

// 정원 설정 (클럽 관리자만)
app.post('/api/clubs/:clubId/meetups/:id/capacity', authFirebase, requireClubRole(['owner', 'manager']), async (req, res) => {
  try {
    const meetupId = req.params.id;
    const capacity = Number(req.body?.capacity);
    
    if (capacity < 0) {
      return res.status(400).json({ error: 'capacity must be non-negative' });
    }
    
    const counter = await setCapacity(meetupId, capacity);
    
    res.json({ 
      ok: true, 
      capacity: counter.capacity,
      message: `정원이 ${capacity === Infinity ? '무제한' : capacity}명으로 설정되었습니다.`
    });
  } catch (e) {
    console.error('[capacity-set]', e);
    res.status(500).json({ error: 'failed to set capacity' });
  }
});

// 만료된 홀드 정리 (관리자/크론용)
app.post('/admin/cron/capacity-clean/:id', async (req, res) => {
  try {
    // 보안: MANAGE_API_KEY 또는 내부 호출만 허용
    const key = req.headers['x-admin-token'] || req.query.token;
    if (key !== process.env.MANAGE_API_KEY) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    
    const meetupId = req.params.id;
    const counter = await cleanupHolds(meetupId);
    
    res.json({ 
      ok: true, 
      pending: counter.pending, 
      holds: counter.holds.length,
      cleaned: counter.holds.length
    });
  } catch (e) {
    console.error('[capacity-clean]', e);
    res.status(500).json({ error: 'failed to clean holds' });
  }
});

// ────────────────────────────── Firebase Auth & 역할 기반 API

// 내 티켓 조회 (Firebase 인증 필요)
app.get('/api/my-tickets', authFirebase, async (req, res) => {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email || EMAIL_FALLBACK;
    
    const tickets = await getTicketsByUser(uid, email);
    res.json({ items: tickets });
  } catch (e) {
    console.error('[my-tickets]', e);
    res.status(500).json({ error: 'list failed' });
  }
});

// 티켓 취소 정보 조회
app.get('/api/tickets/:id/cancel-info', authFirebase, async (req, res) => {
  try {
    const ticketId = req.params.id;
    const uid = req.user?.uid;
    const email = req.user?.email;
    
    const ticket = await readTicket(ticketId);
    const isOwner = (ticket.user?.uid && ticket.user.uid === uid) || 
                   (ticket.user?.email && ticket.user.email === email);
    
    if (!isOwner) {
      return res.status(403).json({ error: 'not owner' });
    }
    
    const cancelInfo = getCancellationInfo(ticket);
    res.json(cancelInfo);
  } catch (e) {
    console.error('[ticket-cancel-info]', e);
    res.status(500).json({ error: 'failed to get cancel info' });
  }
});

// 사용자 티켓 취소
app.post('/api/tickets/:id/cancel', authFirebase, async (req, res) => {
  try {
    const ticketId = req.params.id;
    const reason = (req.body?.reason || '').slice(0, 140);
    const uid = req.user?.uid;
    const email = req.user?.email;
    
    const ticket = await readTicket(ticketId);
    const isOwner = (ticket.user?.uid && ticket.user.uid === uid) || 
                   (ticket.user?.email && ticket.user.email === email);
    
    if (!isOwner) {
      return res.status(403).json({ error: 'not owner' });
    }
    
    if (!canCancel(ticket)) {
      return res.status(400).json({ error: 'not cancelable' });
    }
    
    const updatedTicket = await cancelTicketCore(ticket, { 
      actor: 'user', 
      reason 
    });
    
    res.json({ ok: true, ticket: updatedTicket });
  } catch (e) {
    console.error('[ticket-cancel]', e);
    res.status(500).json({ error: 'cancel failed' });
  }
});

// 사용자 역할 조회
app.get('/api/clubs/:clubId/my-role', authFirebase, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { clubId } = req.params;
    
    const doc = await (await import('firebase-admin')).default.firestore()
      .doc(`clubs/${clubId}/members/${uid}`)
      .get();
    
    if (!doc.exists) return res.json({ role: null });
    res.json({ role: doc.data().role });
  } catch (e) {
    console.error('[my-role]', e);
    res.status(500).json({ role: null });
  }
});

// 초대 토큰 생성
app.post('/api/clubs/:clubId/invites', authFirebase, requireClubRole(['owner', 'manager']), async (req, res) => {
  try {
    const { clubId } = req.params;
    const { role = 'player', ttlHours = 48 } = req.body || {};
    
    const token = await createInvite({ clubId, role, ttlHours });
    const base = (process.env.DOMAIN && !process.env.DOMAIN.startsWith('http')) 
      ? `https://${process.env.DOMAIN}` 
      : (process.env.DOMAIN || 'http://127.0.0.1');
    
    res.json({ 
      token, 
      url: `${base}/invite?token=${token}`,
      role,
      expiresAt: Date.now() + ttlHours * 3600 * 1000
    });
  } catch (e) {
    console.error('[create-invite]', e);
    res.status(500).json({ error: String(e) });
  }
});

// 초대 토큰 수락
app.post('/api/invites/accept', authFirebase, async (req, res) => {
  try {
    const { token } = req.body || {};
    const uid = req.user.uid;
    
    if (!token) return res.status(400).json({ error: 'token required' });
    
    const inv = await acceptInvite({ token, uid });
    res.json({ ok: true, inv });
  } catch (e) {
    console.error('[accept-invite]', e);
    res.status(400).json({ ok: false, error: String(e.message || e) });
  }
});

// 초대 토큰 정보 조회
app.get('/api/invites/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const info = await getInviteInfo({ token });
    
    if (!info) return res.status(404).json({ error: 'invalid invite' });
    res.json(info);
  } catch (e) {
    console.error('[invite-info]', e);
    res.status(500).json({ error: String(e) });
  }
});

// 관리자 참가자 목록 조회
app.get('/api/clubs/:clubId/meetups/:id/attendees', authFirebase, requireClubRole(['owner', 'manager', 'coach']), async (req, res) => {
  try {
    const meetupId = req.params.id;
    const tickets = await getTicketsByMeetup(meetupId);
    
    const attendees = tickets.map(t => ({
      id: t.id,
      user: t.user,
      state: t.state,
      amount: t.amount || 0,
      currency: t.currency || 'KRW',
      paidAt: t.paidAt,
      checkedInAt: t.checkedInAt,
      cancelledAt: t.cancelledAt,
      createdAt: t.createdAt
    }));
    
    // 이름순 정렬
    attendees.sort((a, b) => (a.user?.name || '').localeCompare(b.user?.name || ''));
    
    res.json({ items: attendees });
  } catch (e) {
    console.error('[attendees-list]', e);
    res.status(500).json({ error: 'failed to get attendees' });
  }
});

// 관리자 티켓 취소
app.post('/api/clubs/:clubId/tickets/:id/cancel', authFirebase, requireClubRole(['owner', 'manager']), async (req, res) => {
  try {
    const ticketId = req.params.id;
    const reason = (req.body?.reason || 'admin cancel').slice(0, 140);
    
    const ticket = await readTicket(ticketId);
    const updatedTicket = await cancelTicketCore(ticket, { 
      actor: 'admin', 
      reason 
    });
    
    res.json({ ok: true, ticket: updatedTicket });
  } catch (e) {
    console.error('[admin-cancel]', e);
    res.status(500).json({ error: 'admin cancel failed' });
  }
});

// 클럽 관리 API (점진 전환 예시)
// 기존: /manage/meetups/:id/attendees.csv
// 신규: /api/clubs/:clubId/meetups/:id/attendees.csv
app.get('/api/clubs/:clubId/meetups/:id/attendees.csv', authFirebase, requireClubRole(['owner', 'manager']), async (req, res) => {
  try {
    const { clubId, id } = req.params;
    const tickets = await getTicketsByMeetup(id);
    
    const csvHeader = 'ID,Name,Email,State,Amount,Paid At,Checked In At\n';
    const csvRows = tickets.map(t => [
      t.id,
      t.user?.name || '',
      t.user?.email || '',
      t.state,
      t.amount || 0,
      t.paidAt ? new Date(t.paidAt).toISOString() : '',
      t.checkedInAt ? new Date(t.checkedInAt).toISOString() : ''
    ].join(',')).join('\n');
    
    const csv = csvHeader + csvRows;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="attendees-${id}.csv"`);
    res.send(csv);
  } catch (e) {
    console.error('[club-csv]', e);
    res.status(500).send('CSV generation failed');
  }
});

// ────────────────────────────── 팀 블로그 자동 생성

// n8n 팀 블로그 생성 프록시
app.post('/webhook/team-blog-create', async (req, res) => {
  try {
    const n8nUrl = process.env.N8N_URL;
    if (!n8nUrl) {
      console.warn('[team-blog] N8N_URL not configured, skipping n8n workflow');
      return res.json({ ok: true, message: 'n8n not configured' });
    }

    const webhookUrl = `${n8nUrl}/webhook/team-blog-create`;
    const payload = {
      ...req.body,
      baseUrl: process.env.DOMAIN && !process.env.DOMAIN.startsWith('http') 
        ? `https://${process.env.DOMAIN}` 
        : (process.env.DOMAIN || 'http://127.0.0.1')
    };

    const r = await fetch(webhookUrl, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload) 
    });
    
    const j = await r.json().catch(() => ({ ok: r.ok }));
    res.status(r.ok ? 200 : 500).json(j);
  } catch (e) { 
    console.error('[team-blog]', e);
    res.status(500).json({ error: String(e) }); 
  }
});

// 팀 블로그 생성 테스트 엔드포인트
app.post('/webhook/team-blog-test', async (req, res) => {
  try {
    const testPayload = {
      clubId: "c1",
      clubName: "YAGO FC",
      sport: "soccer",
      branch: "academy",
      leafs: ["U10"],
      title: "U10 기초 아카데미 3기 모집",
      subtitle: "초보 환영 · 장비 대여",
      eventStart: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7일 후
      eventEnd: Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000, // 2시간 후
      venue: "송산2동 체육공원",
      city: "의정부",
      price: 15000,
      tags: ["초보", "유소년"],
      ctaUrl: "https://yago.sports/meetups/m1"
    };

    // n8n으로 전달
    const n8nUrl = process.env.N8N_URL;
    if (!n8nUrl) {
      return res.json({ ok: true, message: 'n8n not configured', testPayload });
    }

    const webhookUrl = `${n8nUrl}/webhook/team-blog-create`;
    const payload = {
      ...testPayload,
      baseUrl: process.env.DOMAIN && !process.env.DOMAIN.startsWith('http') 
        ? `https://${process.env.DOMAIN}` 
        : (process.env.DOMAIN || 'http://127.0.0.1')
    };

    const r = await fetch(webhookUrl, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload) 
    });
    
    const j = await r.json().catch(() => ({ ok: r.ok }));
    res.status(r.ok ? 200 : 500).json({ testPayload, n8nResponse: j });
  } catch (e) { 
    console.error('[team-blog-test]', e);
    res.status(500).json({ error: String(e) }); 
  }
});

// 버킷 쿼터 관리 API
app.get('/api/meetups/:id/capacity', async (req, res) => {
  try {
    const redis = getRedis();
    if (redis) {
      const c = await getSnapshot(req.params.id);
      res.json({ 
        capacity: c.capacity, 
        paid: c.paid, 
        pending: c.pending, 
        waitlist: {} // Redis에서는 별도로 관리
      });
    } else {
      // Redis가 없으면 기존 파일 기반 로직 사용
      const c = await getCounters(req.params.id);
      res.json({ 
        capacity: c.capacity, 
        paid: c.paid, 
        pending: c.pending, 
        waitlist: c.waitlist 
      });
    }
  } catch (e) {
    console.error('[capacity-get]', e);
    res.status(500).json({ error: String(e) });
  }
});

// 설정(관리자): { capacity: { default: 16, women: 8, u10: 6 } }
app.post('/api/clubs/:clubId/meetups/:id/capacity/buckets', authFirebase, await requireClubRole(['owner','manager']), async (req, res) => {
  try {
    const caps = req.body?.capacity || {}; 
    const redis = getRedis();
    if (redis) {
      const out = await setBucketCaps(req.params.id, caps); 
      res.json({ ok: true, capacity: out });
    } else {
      // Redis가 없으면 기존 파일 기반 로직 사용
      const out = await setBucketCaps(req.params.id, caps); 
      res.json({ ok: true, capacity: out });
    }
  } catch (e) {
    console.error('[capacity-set]', e);
    res.status(500).json({ error: String(e) });
  }
});

// 승급 토큰 소비 엔드포인트
app.post('/waitlist/claim', async (req, res) => {
  try {
    const { token, user, meetupId, amount = 0, eventStart, eventEnd } = req.body || {};
    const info = await consumePromo(token);
    if (!info || info.meetupId !== meetupId) {
      return res.status(400).json({ error: 'invalid token' });
    }
    // 토큰 소비: 지금 시점에서 즉시 RSVP(무료) 또는 결제 hold 후 checkout
    // 간단: 무료면 /reserve 로 위임, 유료면 /payments/checkout 로 위임하도록 프런트에서 사용
    return res.json({ ok: true, bucket: info.bucket, rid: info.rid });
  } catch (e) {
    console.error('[waitlist-claim]', e);
    res.status(500).json({ error: 'claim failed' });
  }
});

// 버킷 정의 CRUD API
app.get('/api/meetups/:id/buckets', async (req, res) => {
  try {
    const buckets = await getMeetupBuckets(req.params.id);
    res.json({ items: buckets });
  } catch (e) {
    console.error('[buckets-get]', e);
    res.status(500).json({ error: String(e) });
  }
});

app.post('/api/clubs/:clubId/meetups/:id/buckets', authFirebase, await requireClubRole(['owner', 'manager']), async (req, res) => {
  try {
    const items = req.body?.items || [];
    const out = await setMeetupBuckets(req.params.id, items);
    res.json({ ok: true, items: out });
  } catch (e) {
    console.error('[buckets-set]', e);
    res.status(500).json({ error: String(e) });
  }
});

// 사용자 프로필 저장 API
app.post('/api/me/profile', authFirebase, async (req, res) => {
  try {
    const uid = req.user.uid;
    await admin.firestore().doc(`users/${uid}`).set({ profile: req.body || {} }, { merge: true });
    res.json({ ok: true });
  } catch (e) {
    console.error('[profile-save]', e);
    res.status(500).json({ error: String(e) });
  }
});

// 체크인 시그니처 검증 함수
function verifySig(id, sig) {
  const secret = process.env.CHECKIN_SECRET || 'checkin-dev';
  const h = crypto.createHmac('sha256', secret).update(id).digest('hex').slice(0, 16);
  return h === sig;
}

// POST 체크인 라우트 (idempotent)
app.post('/api/checkin', authFirebase, await requireClubRole(['owner', 'manager', 'coach', 'staff']), async (req, res) => {
  try {
    const { id, sig, meetupId, scannerId } = req.body || {};
    if (!id || !sig) return res.status(400).json({ error: 'bad_request' });
    if (!verifySig(id, sig)) return res.status(400).json({ error: 'invalid_sig' });
    
    const t = await readTicket(id);
    if (!t) return res.status(404).json({ error: 'not_found' });
    if (meetupId && t.meetupId !== meetupId) return res.status(400).json({ error: 'wrong_meetup' });
    
    if (t.state === 'checkedIn') {
      return res.json({ ok: true, id, already: true, checkedInAt: t.checkedInAt });
    }
    
    t.state = 'checkedIn';
    t.checkedInAt = Date.now();
    t.checkin = { scannerId };
    await writeTicket(t);
    
    // 메트릭 계측
    c_checkin.inc({ meetup: t.meetupId, bucket: t.bucket || 'default' });
    emit('checkin', { meetupId: t.meetupId, bucket: t.bucket || 'default', id });
    
    return res.json({ ok: true, id, checkedInAt: t.checkedInAt });
  } catch (e) {
    console.error('[checkin-post]', e);
    return res.status(500).json({ error: 'checkin_failed' });
  }
});

app.get('/webhook/healthz', (_req, res) => res.json({ ok: true, service: 'webhook' }));

// 메트릭 엔드포인트
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// SSE: 관리자 실시간 스트림
app.get('/admin/live', async (req, res) => {
  res.writeHead(200, { 
    'Content-Type': 'text/event-stream', 
    'Cache-Control': 'no-cache', 
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });
  
  const on = (msg) => res.write(`event: e\n` + `data: ${JSON.stringify(msg)}\n\n`);
  bus.on('evt', on);
  
  req.on('close', () => bus.off('evt', on));
});

// CSV 익스포트 - 참가자 목록
app.get('/clubs/:clubId/meetups/:id/attendees.csv', authFirebase, await requireClubRole(['owner', 'manager', 'coach', 'staff']), async (req, res) => {
  try {
    const mid = req.params.id;
    const files = await fs.readdir(TICKETS_DIR);
    const rows = [];
    
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      const t = JSON.parse(await fs.readFile(path.join(TICKETS_DIR, f), 'utf8'));
      if (t.meetupId !== mid) continue;
      
      rows.push({
        id: t.id,
        name: t.user?.name || '',
        email: t.user?.email || '',
        state: t.state,
        amount: t.amount || 0,
        bucket: t.bucket || 'default',
        paidAt: t.paidAt ? new Date(t.paidAt).toISOString() : '',
        checkedInAt: t.checkedInAt ? new Date(t.checkedInAt).toISOString() : ''
      });
    }
    
    const csv = new CsvParser({ 
      fields: ['id', 'name', 'email', 'state', 'amount', 'bucket', 'paidAt', 'checkedInAt'] 
    }).parse(rows);
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${mid}-attendees.csv"`);
    res.send(csv);
  } catch (e) {
    console.error('[csv-export]', e);
    res.status(500).json({ error: 'export_failed' });
  }
});

// 퍼블리시 엔드포인트
app.post('/admin/publish/meetups/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const snap = await admin.firestore().doc(`meetups/${id}`).get();
    const meetup = snap.data()?.meta || { id, title: 'Untitled', dateStart: Date.now() };
    meetup.id = id;
    
    // 1) OG 생성 + SNS 발행
    const channels = req.body?.channels || ['x', 'instagram'];
    const when = req.body?.when || 'now';
    const out = await publishMeetup({ meetup, channels, when });
    
    // 2) (옵션) Google Sites
    if (req.body?.sites) await publishGoogleSites({ meetup });
    
    res.json({ ok: true, out });
  } catch (e) {
    console.error('[publish]', e);
    res.status(500).json({ ok: false, error: e?.message || 'publish failed' });
  }
});

// ROI 리포트 API
app.get('/admin/reports/meetups/:id/roi', authFirebase, await requireClubRole(['owner', 'manager']), async (req, res) => {
  try {
    const id = req.params.id;
    const from = Number(req.query.from || '') || undefined;
    const to = Number(req.query.to || '') || undefined;
    const rows = await aggregateROI({ meetupId: id, fromTs: from, toTs: to });
    res.json({ items: rows, from, to });
  } catch (e) {
    console.error('[roi-report]', e);
    res.status(500).json({ error: 'report_failed' });
  }
});

// 비용 관리 API
app.get('/admin/reports/meetups/:id/costs', authFirebase, await requireClubRole(['owner', 'manager']), async (req, res) => {
  try {
    const id = req.params.id;
    const from = Number(req.query.from || '') || undefined;
    const to = Number(req.query.to || '') || undefined;
    res.json({ items: await listCosts(id, { from, to }) });
  } catch (e) {
    console.error('[costs-list]', e);
    res.status(500).json({ error: 'list_failed' });
  }
});

app.post('/admin/reports/meetups/:id/costs', authFirebase, await requireClubRole(['owner', 'manager']), async (req, res) => {
  try {
    const id = req.params.id;
    const items = req.body?.items || [];
    res.json(await addCosts(id, items));
  } catch (e) {
    console.error('[costs-add]', e);
    res.status(500).json({ error: 'add_failed' });
  }
});

// ROI CSV 익스포트
app.get('/admin/reports/meetups/:id/roi.csv', authFirebase, await requireClubRole(['owner', 'manager']), async (req, res) => {
  try {
    const id = req.params.id;
    const from = Number(req.query.from || '') || undefined;
    const to = Number(req.query.to || '') || undefined;
    const rows = await aggregateROI({ meetupId: id, fromTs: from, toTs: to });
    const csv = new CsvParser({ fields: ['source', 'visits', 'rsvp', 'checkout', 'paid', 'revenue', 'cost', 'arpu', 'cac', 'roas'] }).parse(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${id}-roi.csv"`);
    res.send(csv);
  } catch (e) {
    console.error('[roi-csv]', e);
    res.status(500).json({ error: 'export_failed' });
  }
});

// 어트리뷰션 CSV 익스포트
app.get('/admin/attribution/:id.csv', authFirebase, await requireClubRole(['owner', 'manager']), async (req, res) => {
  try {
    const mid = req.params.id;
    const files = await fs.readdir(TICKETS_DIR);
    const rows = [];
    
    for (const f of files) {
      if (!f.endsWith('.json')) continue;
      const t = JSON.parse(await fs.readFile(path.join(TICKETS_DIR, f), 'utf8'));
      if (t.meetupId !== mid) continue;
      rows.push({
        id: t.id,
        source: t.utm?.source || '',
        state: t.state,
        amount: t.amount || 0,
        bucket: t.bucket || 'default',
        paidAt: t.paidAt || '',
        createdAt: t.createdAt
      });
    }
    
    const csv = new CsvParser({ fields: ['id', 'source', 'state', 'amount', 'bucket', 'createdAt', 'paidAt'] }).parse(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${mid}-attribution.csv"`);
    res.send(csv);
  } catch (e) {
    console.error('[attribution-csv]', e);
    res.status(500).json({ error: 'export_failed' });
  }
});

// 리디렉트 엔드포인트
app.get('/r/m/:id', meetRedirect);

// 피드 엔드포인트 설정
setupFeedEndpoint(app);

// 최근 meetup ID 추적을 위한 글로벌 변수 초기화
if (!globalThis._yago_recent_meetups) {
  globalThis._yago_recent_meetups = new Set();
}

// 이벤트 버스에서 meetup ID 추적
bus.on('evt', (e) => {
  if (e.meetupId) {
    globalThis._yago_recent_meetups.add(e.meetupId);
    // 24시간 후 자동 제거
    setTimeout(() => {
      globalThis._yago_recent_meetups.delete(e.meetupId);
    }, 24 * 60 * 60 * 1000);
  }
});

// 알림 워커 시작
startAlerts();
startCapacityAlerts();

// 팀 API 등록
registerTeamRoutes(app);
registerTeamRead(app);
registerIcs(app);
registerTeamBlog(app);
registerTeamOG(app);

// 심판/리포트/순위 API 등록
registerOfficialsRoutes(app);
registerReportsRoutes(app);
registerAvailabilityRoutes(app);

// 순위/Elo 조회 API
app.get('/api/clubs/:clubId/divisions/:div/table', async (req, res) => {
  try {
    const rows = await getTable({ clubId: req.params.clubId, divisionId: req.params.div });
    res.json({ items: rows });
  } catch (e) {
    console.error('[table-api]', e);
    res.status(500).json({ error: 'table_failed' });
  }
});

app.get('/api/clubs/:clubId/divisions/:div/ratings', async (req, res) => {
  try {
    const rows = await getRatings({ clubId: req.params.clubId, divisionId: req.params.div });
    res.json({ items: rows });
  } catch (e) {
    console.error('[ratings-api]', e);
    res.status(500).json({ error: 'ratings_failed' });
  }
});

// CSV 익스포트
app.get('/clubs/:clubId/divisions/:div/table.csv', async (req, res) => {
  try {
    const rows = await getTable({ clubId: req.params.clubId, divisionId: req.params.div });
    const csv = new CsvParser({ 
      fields: ['teamId', 'played', 'win', 'draw', 'loss', 'gf', 'ga', 'gd', 'pts'] 
    }).parse(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.div}-table.csv"`);
    res.send(csv);
  } catch (e) {
    console.error('[table-csv]', e);
    res.status(500).send('CSV generation failed');
  }
});

app.get('/clubs/:clubId/divisions/:div/ratings.csv', async (req, res) => {
  try {
    const rows = await getRatings({ clubId: req.params.clubId, divisionId: req.params.div });
    const csv = new CsvParser({ 
      fields: ['teamId', 'rating', 'updatedAt'] 
    }).parse(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.div}-ratings.csv"`);
    res.send(csv);
  } catch (e) {
    console.error('[ratings-csv]', e);
    res.status(500).send('CSV generation failed');
  }
});

// 자동 배정 API
app.post('/api/clubs/:clubId/fixtures/auto-assign', async (req, res) => {
  try {
    const { clubId } = req.params;
    const { fixtureIds, minRestMin = 30, commit = false } = req.body || {};
    
    const suggestions = await recommendAssignments({ clubId, fixtureIds, minRestMin });
    
    if (commit) {
      await commitAssignments({ clubId, suggestions });
    }
    
    // Slack 알림
    await notifyAutoAssign({ clubId, suggestions, committed: !!commit });
    
    res.json({ suggestions, committed: !!commit });
  } catch (e) {
    console.error('[auto-assign]', e);
    res.status(500).json({ error: 'auto_assign_failed' });
  }
});

// 수당 정산 API
app.get('/admin/clubs/:clubId/payouts', async (req, res) => {
  try {
    const from = Number(req.query.from || 0);
    const to = Number(req.query.to || Date.now());
    const result = await aggregatePayouts({ clubId: req.params.clubId, from, to });
    res.json(result);
  } catch (e) {
    console.error('[payouts-api]', e);
    res.status(500).json({ error: 'payouts_failed' });
  }
});

app.get('/admin/clubs/:clubId/payouts.csv', async (req, res) => {
  try {
    const from = Number(req.query.from || 0);
    const to = Number(req.query.to || Date.now());
    const csv = await payoutCsv({ clubId: req.params.clubId, from, to });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="payouts-${req.params.clubId}.csv"`);
    res.send(csv);
  } catch (e) {
    console.error('[payouts-csv]', e);
    res.status(500).send('CSV generation failed');
  }
});

// 수당 규칙 API
app.get('/api/clubs/:clubId/payout-rules', async (req, res) => {
  try {
    const result = await getPayoutRules({ clubId: req.params.clubId });
    res.json(result);
  } catch (e) {
    console.error('[payout-rules-get]', e);
    res.status(500).json({ error: 'payout_rules_failed' });
  }
});

app.post('/api/clubs/:clubId/payout-rules', requireClubRole(['owner', 'manager', 'assignor']), async (req, res) => {
  try {
    const { rules } = req.body || {};
    const result = await setPayoutRules({ clubId: req.params.clubId, rules });
    res.json(result);
  } catch (e) {
    console.error('[payout-rules-set]', e);
    res.status(500).json({ error: 'payout_rules_failed' });
  }
});

// 월별 수당 요약 스케줄러 (매월 1일 09:00 KST)
setInterval(async () => {
  const now = new Date();
  const day = now.getDate();
  const hr = now.getUTCHours(); // 00Z=09KST
  
  // 매월 1일 09:00 KST에 월별 수당 요약 전송
  if (day === 1 && hr === 0) {
    try {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      const year = lastMonth.getFullYear();
      const month = lastMonth.getMonth() + 1;
      
      // 모든 클럽에 대해 월별 수당 요약 전송
      const clubs = await admin.firestore().collection('clubs').get();
      for (const clubDoc of clubs.docs) {
        const clubId = clubDoc.id;
        const { monthlyPayoutSummary } = await import('./payouts.mjs');
        const summary = await monthlyPayoutSummary({ clubId, year, month });
        await notifyMonthlyPayouts({ clubId, year, month, summary });
      }
    } catch (e) {
      console.error('[monthly-payout-scheduler]', e);
    }
  }
}, 60 * 60 * 1000); // 1시간마다 체크

// Slack 다이제스트 스케줄러 (09:05 KST 근사 실행)
setInterval(async () => {
  const now = new Date();
  const hr = now.getUTCHours(); // 00Z=09KST
  if (hr === 0 && now.getUTCMinutes() >= 5 && now.getUTCMinutes() < 7) {
    const ids = Array.from(globalThis._yago_recent_meetups || []);
    if (ids.length) {
      await slackDaily({ meetupIds: ids });
      if (now.getUTCDay() === 0) { // 월요일 오전(KST)
        await slackWeekly({ meetupIds: ids });
      }
    }
  }
}, 60 * 1000);

app.listen(PORT, () => console.log(`[WEBHOOK] http://0.0.0.0:${PORT}`));
