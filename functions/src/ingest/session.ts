import "../_admin";
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';
import fetch from 'node-fetch';

const ALLOWED_ORIGIN = defineSecret('ALLOWED_ORIGIN');
const N8N_WEBHOOK_SESSION_EVENT = defineSecret('N8N_WEBHOOK_SESSION_EVENT');

export const ingestSessionEvent = onRequest({ 
  secrets: [ALLOWED_ORIGIN, N8N_WEBHOOK_SESSION_EVENT] 
}, async (req, res) => {
  const origin = ALLOWED_ORIGIN.value();
  
  // CORS 설정
  res.set('Access-Control-Allow-Origin', origin || '*');
  res.set('Access-Control-Allow-Headers', 'authorization, content-type');
  res.set('Vary', 'Origin');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    // Firebase ID 토큰 검증 (가능 시)
    let uid = 'anon';
    const authz = req.get('authorization');
    if (authz?.startsWith('Bearer ')) {
      const idToken = authz.slice('Bearer '.length);
      try {
        const decoded = await admin.auth().verifyIdToken(idToken);
        uid = decoded.uid;
      } catch (tokenError) {
        logger.warn('Invalid ID token, proceeding as anonymous:', tokenError);
      }
    }

    const { type, ts, meta } = req.body || {};
    if (!type) {
      return res.status(400).json({ error: 'type required' });
    }

    const event = {
      type,
      ts: typeof ts === 'number' ? ts : Date.now(),
      uid,
      meta: meta || {},
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      ua: req.get('user-agent') || '',
      url: req.body?.url || '',
    };

    // 서버→n8n 포워드 (서버-사이드 보안)
    const n8nUrl = N8N_WEBHOOK_SESSION_EVENT.value();
    if (n8nUrl) {
      try {
        await fetch(n8nUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-internal-key': process.env.N8N_TOKEN || 'n8n_default_token_please_change'
          },
          body: JSON.stringify(event),
        });
        logger.info(`Session event forwarded to n8n: ${type} from ${uid}`);
      } catch (n8nError) {
        logger.error('Failed to forward to n8n:', n8nError);
        // n8n 전송 실패해도 클라이언트에는 성공 응답
      }
    }

    return res.json({ ok: true });
  } catch (e: any) {
    logger.error('Session event ingest error:', e);
    return res.status(500).json({ error: e?.message || 'ingest failed' });
  }
});