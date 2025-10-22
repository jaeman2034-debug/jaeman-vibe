import admin from 'firebase-admin';
import { authFirebase } from './middleware/authFirebase.mjs';
import { requireClubRole } from './middleware/clubGuard.mjs';

const db = admin.firestore();

// 팀 생성
export function registerTeamRoutes(app) {
  app.post('/api/clubs/:clubId/teams', authFirebase, await requireClubRole(['owner', 'manager', 'coach']), async (req, res) => {
    try {
      const clubId = req.params.clubId;
      const body = req.body || {};
      const ref = db.collection('clubs').doc(clubId).collection('teams').doc();
      const tp = {
        id: ref.id,
        clubId,
        name: body.name,
        sport: body.sport || 'multi',
        region: body.region || '',
        logoUrl: body.logoUrl || '',
        bannerUrl: body.bannerUrl || '',
        bio: body.bio || '',
        hashtags: body.hashtags || [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        visibility: body.visibility || 'public'
      };
      await ref.set(tp);
      
      // 생성자 멤버로 등록
      const uid = req.user?.uid;
      if (uid) {
        await ref.collection('members').doc(uid).set({
          uid,
          role: 'owner',
          joinedAt: Date.now(),
          pending: false
        });
      }
      
      res.json({ ok: true, team: tp });
    } catch (e) {
      console.error('[team-create]', e);
      res.status(500).json({ error: 'create_failed' });
    }
  });

  // 팀 정보 수정
  app.post('/api/clubs/:clubId/teams/:teamId', authFirebase, await requireClubRole(['owner', 'manager', 'coach', 'captain']), async (req, res) => {
    try {
      const { clubId, teamId } = req.params;
      const ref = db.doc(`clubs/${clubId}/teams/${teamId}`);
      await ref.set({ ...req.body, updatedAt: Date.now() }, { merge: true });
      res.json({ ok: true });
    } catch (e) {
      console.error('[team-update]', e);
      res.status(500).json({ error: 'update_failed' });
    }
  });

  // 멤버 초대(대기)
  app.post('/api/clubs/:clubId/teams/:teamId/invite', authFirebase, await requireClubRole(['owner', 'manager', 'coach', 'captain']), async (req, res) => {
    try {
      const { clubId, teamId } = req.params;
      const { email, role = 'member' } = req.body || {};
      const rid = 'inv_' + Date.now().toString(36);
      const jrRef = db.doc(`clubs/${clubId}/teams/${teamId}/joinRequests/${rid}`);
      await jrRef.set({
        id: rid,
        teamId,
        fromUid: email,
        message: 'invite',
        state: 'pending',
        createdAt: Date.now()
      });
      res.json({ ok: true, requestId: rid });
    } catch (e) {
      console.error('[team-invite]', e);
      res.status(500).json({ error: 'invite_failed' });
    }
  });

  // 가입 요청(사용자)
  app.post('/api/teams/:teamId/join', authFirebase, async (req, res) => {
    try {
      const { teamId } = req.params;
      const { clubId, message } = req.body || {};
      const uid = req.user?.uid;
      const rid = 'jr_' + Date.now().toString(36);
      const jrRef = db.doc(`clubs/${clubId}/teams/${teamId}/joinRequests/${rid}`);
      await jrRef.set({
        id: rid,
        teamId,
        fromUid: uid,
        message,
        state: 'pending',
        createdAt: Date.now()
      });
      res.json({ ok: true, requestId: rid });
    } catch (e) {
      console.error('[team-join]', e);
      res.status(500).json({ error: 'join_failed' });
    }
  });

  // 요청 승인/거절
  app.post('/api/clubs/:clubId/teams/:teamId/joinRequests/:rid/:action(approve|reject)', authFirebase, await requireClubRole(['owner', 'manager', 'coach', 'captain']), async (req, res) => {
    try {
      const { clubId, teamId, rid, action } = req.params;
      const jrRef = db.doc(`clubs/${clubId}/teams/${teamId}/joinRequests/${rid}`);
      const jr = (await jrRef.get()).data();
      if (!jr) return res.status(404).json({ error: 'not_found' });
      
      if (action === 'approve') {
        await db.doc(`clubs/${clubId}/teams/${teamId}/members/${jr.fromUid}`).set({
          uid: jr.fromUid,
          role: 'member',
          joinedAt: Date.now(),
          pending: false
        });
        await jrRef.set({ state: 'approved' }, { merge: true });
      } else {
        await jrRef.set({ state: 'rejected' }, { merge: true });
      }
      res.json({ ok: true });
    } catch (e) {
      console.error('[team-request-action]', e);
      res.status(500).json({ error: 'action_failed' });
    }
  });

  // 디비전 생성
  app.post('/api/clubs/:clubId/divisions', authFirebase, await requireClubRole(['owner', 'manager']), async (req, res) => {
    try {
      const { clubId } = req.params;
      const ref = db.collection('clubs').doc(clubId).collection('divisions').doc();
      await ref.set({
        id: ref.id,
        clubId,
        name: req.body?.name || 'Division',
        level: req.body?.level || '',
        createdAt: Date.now()
      });
      res.json({ ok: true, divisionId: ref.id });
    } catch (e) {
      console.error('[division-create]', e);
      res.status(500).json({ error: 'create_failed' });
    }
  });

  // 대진표 생성
  app.post('/api/clubs/:clubId/fixtures', authFirebase, await requireClubRole(['owner', 'manager', 'coach']), async (req, res) => {
    try {
      const { clubId } = req.params;
      const body = req.body || {};
      const ref = db.collection('clubs').doc(clubId).collection('fixtures').doc();
      await ref.set({
        id: ref.id,
        clubId,
        divisionId: body.divisionId || null,
        homeTeamId: body.homeTeamId,
        awayTeamId: body.awayTeamId,
        startAt: body.startAt,
        endAt: body.endAt || body.startAt + 90 * 60 * 1000,
        venue: body.venue || '',
        status: 'scheduled'
      });
      res.json({ ok: true, fixtureId: ref.id });
    } catch (e) {
      console.error('[fixture-create]', e);
      res.status(500).json({ error: 'create_failed' });
    }
  });
}
