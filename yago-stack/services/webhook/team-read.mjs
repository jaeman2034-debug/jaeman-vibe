import admin from 'firebase-admin';

const db = admin.firestore();

export function registerTeamRead(app) {
  // 팀 정보 조회
  app.get('/api/teams/:teamId', async (req, res) => {
    try {
      const { teamId } = req.params;
      const clubId = req.query.clubId;
      if (!clubId) return res.status(400).json({ error: 'clubId_required' });
      
      const snap = await db.doc(`clubs/${clubId}/teams/${teamId}`).get();
      if (!snap.exists) return res.status(404).json({ error: 'team_not_found' });
      
      res.json({ team: snap.data() });
    } catch (e) {
      console.error('[team-read]', e);
      res.status(500).json({ error: 'read_failed' });
    }
  });

  // 팀 멤버 조회
  app.get('/api/teams/:teamId/members', async (req, res) => {
    try {
      const { teamId } = req.params;
      const clubId = req.query.clubId;
      if (!clubId) return res.status(400).json({ error: 'clubId_required' });
      
      const col = await db.collection(`clubs/${clubId}/teams/${teamId}/members`).get();
      res.json({ items: col.docs.map(d => d.data()) });
    } catch (e) {
      console.error('[team-members-read]', e);
      res.status(500).json({ error: 'read_failed' });
    }
  });

  // 팀 가입 요청 조회
  app.get('/api/clubs/:clubId/teams/:teamId/joinRequests', async (req, res) => {
    try {
      const { clubId, teamId } = req.params;
      const col = await db.collection(`clubs/${clubId}/teams/${teamId}/joinRequests`)
        .orderBy('createdAt', 'desc')
        .get();
      res.json({ items: col.docs.map(d => d.data()) });
    } catch (e) {
      console.error('[team-requests-read]', e);
      res.status(500).json({ error: 'read_failed' });
    }
  });

  // 디비전 목록 조회
  app.get('/api/clubs/:clubId/divisions', async (req, res) => {
    try {
      const { clubId } = req.params;
      const col = await db.collection(`clubs/${clubId}/divisions`).get();
      res.json({ items: col.docs.map(d => d.data()) });
    } catch (e) {
      console.error('[divisions-read]', e);
      res.status(500).json({ error: 'read_failed' });
    }
  });

  // 팀 일정 조회
  app.get('/api/clubs/:clubId/teams/:teamId/fixtures', async (req, res) => {
    try {
      const { clubId, teamId } = req.params;
      const homeFixtures = await db.collection(`clubs/${clubId}/fixtures`)
        .where('homeTeamId', '==', teamId)
        .get();
      const awayFixtures = await db.collection(`clubs/${clubId}/fixtures`)
        .where('awayTeamId', '==', teamId)
        .get();
      
      const fixtures = [...homeFixtures.docs, ...awayFixtures.docs]
        .map(d => d.data())
        .sort((a, b) => a.startAt - b.startAt);
      
      res.json({ items: fixtures });
    } catch (e) {
      console.error('[team-fixtures-read]', e);
      res.status(500).json({ error: 'read_failed' });
    }
  });
}
