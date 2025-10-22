import admin from 'firebase-admin';
import { requireClubRole } from './middleware/clubGuard.mjs';

const db = admin.firestore();

function ym(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function registerAvailabilityRoutes(app) {
  // 가용성 저장 (본인 또는 운영자)
  app.post('/api/clubs/:clubId/officials/:uid/availability', requireClubRole(['owner', 'manager', 'assignor', 'official']), async (req, res) => {
    try {
      const { clubId, uid } = req.params;
      const body = req.body || {};
      const y = ym(body.anchor || Date.now());
      
      const ref = db.doc(`clubs/${clubId}/officials/${uid}/availability/${y}`);
      await ref.set({
        uid,
        clubId,
        slots: body.slots || [],
        preferences: body.preferences || {}
      }, { merge: true });
      
      res.json({ ok: true });
    } catch (e) {
      console.error('[availability-save]', e);
      res.status(500).json({ error: 'save_failed' });
    }
  });

  // 가용성 조회 (기간)
  app.get('/api/clubs/:clubId/officials/:uid/availability', async (req, res) => {
    try {
      const { clubId, uid } = req.params;
      const from = Number(req.query.from || 0);
      const to = Number(req.query.to || 0);
      
      const ys = new Set([ym(from || Date.now()), ym(to || Date.now())]);
      const outs = [];
      
      for (const y of ys) {
        const snap = await db.doc(`clubs/${clubId}/officials/${uid}/availability/${y}`).get();
        if (snap.exists) {
          outs.push(snap.data());
        }
      }
      
      // 병합/필터
      const slots = (outs.flatMap(x => x.slots || []))
        .filter(s => (!from || s.endAt >= from) && (!to || s.startAt <= to));
      
      res.json({ uid, clubId, slots });
    } catch (e) {
      console.error('[availability-read]', e);
      res.status(500).json({ error: 'read_failed' });
    }
  });

  // 모든 심판 가용성 조회 (배정용)
  app.get('/api/clubs/:clubId/officials/availability', async (req, res) => {
    try {
      const { clubId } = req.params;
      const from = Number(req.query.from || 0);
      const to = Number(req.query.to || 0);
      
      // 모든 활성 심판 조회
      const officialsCol = await db.collection(`clubs/${clubId}/officials`)
        .where('active', '!=', false)
        .get();
      
      const officials = officialsCol.docs.map(d => d.data());
      const results = [];
      
      for (const official of officials) {
        const ys = new Set([ym(from || Date.now()), ym(to || Date.now())]);
        const outs = [];
        
        for (const y of ys) {
          const snap = await db.doc(`clubs/${clubId}/officials/${official.uid}/availability/${y}`).get();
          if (snap.exists) {
            outs.push(snap.data());
          }
        }
        
        const slots = (outs.flatMap(x => x.slots || []))
          .filter(s => (!from || s.endAt >= from) && (!to || s.startAt <= to));
        
        results.push({
          uid: official.uid,
          name: official.name || official.uid,
          slots,
          preferences: official.preferences || {}
        });
      }
      
      res.json({ officials: results });
    } catch (e) {
      console.error('[availability-all]', e);
      res.status(500).json({ error: 'read_failed' });
    }
  });

  // 가용성 삭제
  app.delete('/api/clubs/:clubId/officials/:uid/availability', requireClubRole(['owner', 'manager', 'assignor', 'official']), async (req, res) => {
    try {
      const { clubId, uid } = req.params;
      const { slotId } = req.body || {};
      
      if (!slotId) {
        return res.status(400).json({ error: 'slot_id_required' });
      }
      
      const y = ym(slotId);
      const ref = db.doc(`clubs/${clubId}/officials/${uid}/availability/${y}`);
      const snap = await ref.get();
      
      if (!snap.exists) {
        return res.status(404).json({ error: 'not_found' });
      }
      
      const data = snap.data();
      const updatedSlots = (data.slots || []).filter(s => s.startAt !== slotId);
      
      await ref.set({ slots: updatedSlots }, { merge: true });
      
      res.json({ ok: true });
    } catch (e) {
      console.error('[availability-delete]', e);
      res.status(500).json({ error: 'delete_failed' });
    }
  });
}
