import { renderOG, ensureDir } from './og-gen.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function saveTeamOG(team) {
  const url = `${process.env.SITE_BASE}/clubs/${team.clubId}/teams/${team.id}`;
  
  const png = await renderOG({
    title: team.name,
    subtitle: team.sport?.toUpperCase() || 'TEAM',
    dateText: team.region || '',
    location: '',
    badges: team.hashtags || [],
    url,
    theme: 'dark'
  });
  
  const dir = path.join(process.env.OG_OUTPUT || '/data/public/og', 'teams', team.id);
  await ensureDir(dir);
  const file = path.join(dir, 'main.png');
  await fs.writeFile(file, png);
  
  return {
    file,
    publicUrl: `${process.env.SITE_BASE}/og/teams/${team.id}/main.png`
  };
}

// 팀 OG 생성 API
export function registerTeamOG(app) {
  app.post('/api/clubs/:clubId/teams/:teamId/og', async (req, res) => {
    try {
      const { clubId, teamId } = req.params;
      
      // 팀 정보 조회
      const teamDoc = await admin.firestore().doc(`clubs/${clubId}/teams/${teamId}`).get();
      if (!teamDoc.exists) {
        return res.status(404).json({ error: 'team_not_found' });
      }
      
      const team = teamDoc.data();
      const result = await saveTeamOG(team);
      
      res.json({
        ok: true,
        publicUrl: result.publicUrl,
        file: result.file
      });
    } catch (e) {
      console.error('[team-og]', e);
      res.status(500).json({ error: 'og_generation_failed' });
    }
  });
}
