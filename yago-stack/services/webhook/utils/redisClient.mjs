import Redis from 'ioredis';

let redis = null;

export function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, { 
      maxRetriesPerRequest: 2, 
      enableAutoPipelining: true 
    });
  }
  return redis;
}
