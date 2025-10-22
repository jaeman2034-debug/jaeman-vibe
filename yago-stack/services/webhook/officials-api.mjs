import admin from 'firebase-admin';
import { requireClubRole } from './middleware/clubGuard.mjs';

const db = admin.firestore();

export function registerOfficialsRoutes(app) {
  // 심판 프로필 등록/수정
  app.post('/api/clubs/:clubId/officials/:uid', requireClubRole(['owner', 'manager', 'assignor']), async (req, res) => {
    try {
      const { clubId, uid } = req.params;
      const body = req.body || {};
      await db.doc(`clubs/${clubId}/officials/${uid}`).set({
        uid,
        ...body,
        active: body.active !== false
      }, { merge: true });
      res.json({ ok: true });
    } catch (e) {
      console.error('[official-create]', e);
      res.status(500).json({ error: 'create_failed' });
    }
  });

  // 심판 목록 조회
  app.get('/api/clubs/:clubId/officials', async (req, res) => {
    try {
      const { clubId } = req.params;
      const snap = await db.collection(`clubs/${clubId}/officials`)
        .where('active', '!=', false)
        .get();
      res.json({ items: snap.docs.map(d => d.data()) });
    } catch (e) {
      console.error('[officials-list]', e);
      res.status(500).json({ error: 'list_failed' });
    }
  });

  // 특정 경기 배정 조회
  app.get('/api/clubs/:clubId/fixtures/:fid/assignments', async (req, res) => {
    try {
      const { clubId, fid } = req.params;
      const col = await db.collection(`clubs/${clubId}/fixtures/${fid}/assignments`).get();
      res.json({ items: col.docs.map(d => d.data()) });
    } catch (e) {
      console.error('[assignments-list]', e);
      res.status(500).json({ error: 'list_failed' });
    }
  });

  // 특정 경기 배정 저장
  app.post('/api/clubs/:clubId/fixtures/:fid/assignments', requireClubRole(['owner', 'manager', 'assignor']), async (req, res) => {
    try {
      const { clubId, fid } = req.params;
      const items = req.body?.items || [];
      
      const batch = db.batch();
      for (const it of items) {
        const ref = db.doc(`clubs/${clubId}/fixtures/${fid}/assignments/${it.uid}`);
        batch.set(ref, {
          ...it,
          assignedAt: Date.now()
        });
      }
      await batch.commit();
      res.json({ ok: true });
    } catch (e) {
      console.error('[assignments-save]', e);
      res.status(500).json({ error: 'save_failed' });
    }
  });

  // 심판 배정 삭제
  app.delete('/api/clubs/:clubId/fixtures/:fid/assignments/:uid', requireClubRole(['owner', 'manager', 'assignor']), async (req, res) => {
    try {
      const { clubId, fid, uid } = req.params;
      await db.doc(`clubs/${clubId}/fixtures/${fid}/assignments/${uid}`).delete();
      res.json({ ok: true });
    } catch (e) {
      console.error('[assignment-delete]', e);
      res.status(500).json({ error: 'delete_failed' });
    }
  });
}
