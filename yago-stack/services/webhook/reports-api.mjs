import admin from 'firebase-admin';
import { requireClubRole } from './middleware/clubGuard.mjs';
import { updateStandingsAndRatings } from './standings.mjs';

const db = admin.firestore();

export function registerReportsRoutes(app) {
  // 리포트 조회
  app.get('/api/clubs/:clubId/fixtures/:fid/report', async (req, res) => {
    try {
      const { clubId, fid } = req.params;
      const ref = db.doc(`clubs/${clubId}/fixtures/${fid}/report`);
      const snap = await ref.get();
      res.json({ report: snap.data() || null });
    } catch (e) {
      console.error('[report-read]', e);
      res.status(500).json({ error: 'read_failed' });
    }
  });

  // 리포트 작성/수정
  app.post('/api/clubs/:clubId/fixtures/:fid/report', requireClubRole(['owner', 'manager', 'assignor', 'official', 'coach', 'staff']), async (req, res) => {
    try {
      const { clubId, fid } = req.params;
      const body = req.body || {};
      const now = Date.now();
      
      const ref = db.doc(`clubs/${clubId}/fixtures/${fid}/report`);
      const existing = (await ref.get()).data();
      
      if (existing?.locked) {
        return res.status(403).json({ error: 'locked' });
      }
      
      const doc = {
        ...existing,
        ...body,
        id: fid,
        clubId,
        fixtureId: fid,
        updatedAt: now,
        createdAt: existing?.createdAt || now,
        submittedBy: req.user?.uid
      };
      
      await ref.set(doc);
      res.json({ ok: true, report: doc });
    } catch (e) {
      console.error('[report-save]', e);
      res.status(500).json({ error: 'save_failed' });
    }
  });

  // 리포트 확정(락) 및 순위/Elo 반영
  app.post('/api/clubs/:clubId/fixtures/:fid/report/lock', requireClubRole(['owner', 'manager', 'assignor']), async (req, res) => {
    try {
      const { clubId, fid } = req.params;
      const ref = db.doc(`clubs/${clubId}/fixtures/${fid}/report`);
      const snap = await ref.get();
      
      if (!snap.exists) {
        return res.status(404).json({ error: 'no_report' });
      }
      
      await ref.set({ locked: true }, { merge: true });
      await updateStandingsAndRatings({ clubId, fixtureId: fid });
      
      res.json({ ok: true });
    } catch (e) {
      console.error('[report-lock]', e);
      res.status(500).json({ error: 'lock_failed' });
    }
  });

  // 리포트 잠금 해제
  app.post('/api/clubs/:clubId/fixtures/:fid/report/unlock', requireClubRole(['owner', 'manager', 'assignor']), async (req, res) => {
    try {
      const { clubId, fid } = req.params;
      const ref = db.doc(`clubs/${clubId}/fixtures/${fid}/report`);
      await ref.set({ locked: false }, { merge: true });
      res.json({ ok: true });
    } catch (e) {
      console.error('[report-unlock]', e);
      res.status(500).json({ error: 'unlock_failed' });
    }
  });
}
