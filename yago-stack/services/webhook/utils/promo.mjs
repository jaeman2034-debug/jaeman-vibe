import { getRedis } from './redisClient.mjs';
import crypto from 'node:crypto';

export async function issuePromo({ meetupId, bucket, rid, ttlMin }) {
  const r = getRedis(); 
  if (!r) throw new Error('no redis');
  
  const token = 'p_' + crypto.randomBytes(12).toString('base64url');
  const exp = Date.now() + (ttlMin ?? Number(process.env.WAITLIST_PROMO_TTL_MIN || 120)) * 60_000;
  
  await r.hset(`yago:promo:${token}`, { 
    meetupId, 
    bucket, 
    rid, 
    expTs: String(exp) 
  });
  await r.pexpireat(`yago:promo:${token}`, exp);
  
  return { token, expTs: exp };
}

export async function consumePromo(token) {
  const r = getRedis(); 
  if (!r) throw new Error('no redis');
  
  const key = `yago:promo:${token}`;
  const data = await r.hgetall(key);
  
  if (!data || !data.expTs) return null;
  
  const exp = Number(data.expTs);
  if (Date.now() > exp) return null;
  
  await r.del(key);
  return { 
    meetupId: data.meetupId, 
    bucket: data.bucket, 
    rid: data.rid 
  };
}
