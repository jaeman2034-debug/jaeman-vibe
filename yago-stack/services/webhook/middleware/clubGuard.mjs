import { dbAdmin } from '../firebaseAdmin.mjs';

export function requireClubRole(roleList = ['owner', 'manager']) {
  return async (req, res, next) => {
    try {
      const { clubId } = req.params;
      const uid = req.user?.uid;
      
      if (!uid) return res.status(401).json({ error: 'unauthorized' });
      if (!clubId) return res.status(400).json({ error: 'clubId required' });
      
      const doc = await dbAdmin.doc(`clubs/${clubId}/members/${uid}`).get();
      if (!doc.exists) return res.status(403).json({ error: 'not a member' });
      
      const role = doc.data().role;
      if (!roleList.includes(role)) {
        return res.status(403).json({ 
          error: 'insufficient role', 
          required: roleList, 
          current: role 
        });
      }
      
      req.clubRole = role; // 추가 정보 제공
      next();
    } catch (e) { 
      console.error('[clubGuard]', e);
      return res.status(500).json({ error: 'guard error' }); 
    }
  };
}
