import { authAdmin } from '../firebaseAdmin.mjs';

export async function authFirebase(req, res, next) {
  try {
    const h = req.headers.authorization || '';
    const m = h.match(/^Bearer (.+)$/);
    if (!m) return res.status(401).json({ error: 'missing token' });
    
    const decoded = await authAdmin.verifyIdToken(m[1]);
    req.user = decoded; // { uid, email, ... }
    next();
  } catch (e) {
    console.error('[authFirebase]', e);
    return res.status(401).json({ error: 'invalid token' });
  }
}
