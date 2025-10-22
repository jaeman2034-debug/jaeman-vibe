import fetch from 'node-fetch';

export function registerTeamBlog(app) {
  // 팀 블로그 생성 웹훅
  app.post('/team-blog-create', async (req, res) => {
    try {
      const { team, posts } = req.body || {};
      
      if (!team || !posts || !Array.isArray(posts)) {
        return res.status(400).json({ error: 'invalid_payload' });
      }
      
      const url = (process.env.N8N_URL || '') + (process.env.N8N_TEAM_BLOG_HOOK || '/webhook/team-blog-create');
      
      if (!process.env.N8N_URL) {
        console.log('[team-blog] N8N_URL not configured, skipping webhook call');
        return res.json({ ok: true, skipped: true });
      }
      
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team, posts })
      });
      
      const response = await r.json().catch(() => ({}));
      
      return res.json({ 
        ok: r.ok, 
        status: r.status,
        response 
      });
    } catch (e) {
      console.error('[team-blog-create]', e);
      return res.status(500).json({ ok: false, error: 'webhook_failed' });
    }
  });

  // 팀 블로그 생성 (관리자용)
  app.post('/api/clubs/:clubId/teams/:teamId/blog', async (req, res) => {
    try {
      const { clubId, teamId } = req.params;
      const { posts } = req.body || {};
      
      // 팀 정보 조회
      const teamDoc = await admin.firestore().doc(`clubs/${clubId}/teams/${teamId}`).get();
      if (!teamDoc.exists) {
        return res.status(404).json({ error: 'team_not_found' });
      }
      
      const team = teamDoc.data();
      
      // 블로그 생성 요청
      const blogResponse = await fetch(`${process.env.DOMAIN || ''}/team-blog-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team, posts })
      });
      
      const result = await blogResponse.json();
      
      res.json({ 
        ok: blogResponse.ok, 
        result 
      });
    } catch (e) {
      console.error('[team-blog-admin]', e);
      res.status(500).json({ error: 'blog_creation_failed' });
    }
  });
}
