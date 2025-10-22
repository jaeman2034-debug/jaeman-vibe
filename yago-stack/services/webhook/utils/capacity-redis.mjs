import { getRedis } from './redisClient.mjs';

const r = getRedis();

// Redis 키 헬퍼 함수들
function kCap(meet) { return `yago:meetup:${meet}:cap:capacity`; }
function kPaid(meet) { return `yago:meetup:${meet}:cap:paid`; }
function kPend(meet) { return `yago:meetup:${meet}:cap:pending`; }
function kHold(meet, b) { return `yago:meetup:${meet}:holds:${b}`; }
function kWList(meet, b) { return `yago:meetup:${meet}:wait:${b}`; }
function kWCount(meet) { return `yago:meetup:${meet}:waitcount`; }

export async function setBucketCaps(meetupId, caps) {
  if (!r) throw new Error('no redis');
  const pipe = r.pipeline();
  for (const [b, v] of Object.entries(caps)) {
    pipe.hset(kCap(meetupId), b, String(v));
  }
  await pipe.exec();
  return caps;
}

// 3.1 HOLD — 좌석 확보 (결제 시작)
export async function holdSeat({ meetupId, bucket, rid, ttlMin }) {
  if (!r) throw new Error('no redis');
  
  const ttl = (ttlMin ?? Number(process.env.HOLD_TTL_MIN || 15)) * 60_000;
  const now = Date.now();
  const exp = now + ttl;
  
  const lua = `
    local kCap = KEYS[1]; local kPaid = KEYS[2]; local kPend = KEYS[3]; local kHold = KEYS[4];
    local bucket = ARGV[1]; local rid = ARGV[2]; local exp = tonumber(ARGV[3]); local now = tonumber(ARGV[4]);
    
    -- 만료된 hold 청소
    local expired = redis.call('zrangebyscore', kHold, 0, now)
    if #expired > 0 then
      for _,eid in ipairs(expired) do
        -- pending 감소
        local cur = tonumber(redis.call('hget', kPend, bucket) or '0')
        if cur > 0 then redis.call('hset', kPend, bucket, cur-1) end
      end
      redis.call('zremrangebyscore', kHold, 0, now)
    end
    
    local cap = tonumber(redis.call('hget', kCap, bucket) or '999999999')
    local paid = tonumber(redis.call('hget', kPaid, bucket) or '0')
    local pend = tonumber(redis.call('hget', kPend, bucket) or '0')
    
    if (paid + pend) >= cap then return 0 end
    
    redis.call('hset', kPend, bucket, pend+1)
    redis.call('zadd', kHold, exp, rid)
    return exp
  `;
  
  const res = await r.eval(lua, 4, 
    kCap(meetupId), 
    kPaid(meetupId), 
    kPend(meetupId), 
    kHold(meetupId, bucket), 
    bucket, 
    rid, 
    String(exp), 
    String(now)
  );
  
  return Number(res) > 0 ? { ok: true, expTs: Number(res) } : { ok: false, reason: 'full' };
}

// 3.2 MARK PAID — 결제 성공 처리
export async function markPaid({ meetupId, bucket, rid }) {
  if (!r) throw new Error('no redis');
  
  const lua = `
    local kPaid = KEYS[1]; local kPend = KEYS[2]; local kHold = KEYS[3];
    local bucket = ARGV[1]; local rid = ARGV[2];
    
    local pend = tonumber(redis.call('hget', kPend, bucket) or '0')
    if pend > 0 then redis.call('hset', kPend, bucket, pend-1) end
    redis.call('zrem', kHold, rid)
    
    local paid = tonumber(redis.call('hget', kPaid, bucket) or '0')
    redis.call('hset', kPaid, bucket, paid+1)
    return 1
  `;
  
  await r.eval(lua, 3, 
    kPaid(meetupId), 
    kPend(meetupId), 
    kHold(meetupId, bucket), 
    bucket, 
    rid
  );
}

// 3.3 CANCEL — paid 감소 + 대기열 승급 후보 pop
export async function cancelAndPromote({ meetupId, bucket }) {
  if (!r) throw new Error('no redis');
  
  const lua = `
    local kPaid = KEYS[1]; local kWList = KEYS[2]; local kWCount = KEYS[3]; local bucket = ARGV[1]
    
    local paid = tonumber(redis.call('hget', kPaid, bucket) or '0')
    if paid > 0 then redis.call('hset', kPaid, bucket, paid-1) end
    
    local head = redis.call('lpop', kWList)
    if head then
      local len = redis.call('llen', kWList)
      redis.call('hset', kWCount, bucket, len)
      return head
    end
    return ''
  `;
  
  const out = await r.eval(lua, 3, 
    kPaid(meetupId), 
    kWList(meetupId, bucket), 
    kWCount(meetupId), 
    bucket
  );
  
  return out ? String(out) : '';
}

// 3.4 WAITLIST ENQ
export async function waitlistEnq({ meetupId, bucket, rid, user }) {
  if (!r) throw new Error('no redis');
  
  const j = JSON.stringify({ rid, user, ts: Date.now() });
  await r.rpush(kWList(meetupId, bucket), j);
  const len = await r.llen(kWList(meetupId, bucket));
  await r.hset(kWCount(meetupId), bucket, String(len));
  return len;
}

export async function getSnapshot(meetupId) {
  if (!r) throw new Error('no redis');
  
  const [cap, paid, pend] = await r.multi()
    .hgetall(kCap(meetupId))
    .hgetall(kPaid(meetupId))
    .hgetall(kPend(meetupId))
    .exec();
  
  return { 
    capacity: cap[1], 
    paid: paid[1], 
    pending: pend[1] 
  };
}
