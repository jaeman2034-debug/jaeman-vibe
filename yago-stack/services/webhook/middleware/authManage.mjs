// 관리자 권한 검증 미들웨어
export function authManage(req, res, next) {
  const key = process.env.MANAGE_API_KEY || '';
  const token = req.headers['x-admin-token'] || req.query.token;
  
  if (!key) {
    return res.status(500).json({ error: 'MANAGE_API_KEY missing' });
  }
  
  if (token === key) {
    return next();
  }
  
  return res.status(401).json({ error: 'unauthorized' });
}

// 레이트 리미팅 미들웨어 (간단한 메모리 기반)
const rateLimitMap = new Map();

export function rateLimit(windowMs = 60000, max = 10) {
  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // 오래된 엔트리 정리
    if (rateLimitMap.has(key)) {
      const requests = rateLimitMap.get(key).filter(time => time > windowStart);
      rateLimitMap.set(key, requests);
    } else {
      rateLimitMap.set(key, []);
    }
    
    const requests = rateLimitMap.get(key);
    
    if (requests.length >= max) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    requests.push(now);
    next();
  };
}
