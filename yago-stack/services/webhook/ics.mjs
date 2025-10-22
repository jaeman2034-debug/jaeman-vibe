import admin from 'firebase-admin';

const db = admin.firestore();

export function registerIcs(app) {
  // 팀 일정 iCal 피드
  app.get('/clubs/:clubId/teams/:teamId.ics', async (req, res) => {
    try {
      const { clubId, teamId } = req.params;
      
      // 홈팀과 어웨이팀 일정 모두 조회
      const homeFixtures = await db.collection(`clubs/${clubId}/fixtures`)
        .where('homeTeamId', '==', teamId)
        .get();
      const awayFixtures = await db.collection(`clubs/${clubId}/fixtures`)
        .where('awayTeamId', '==', teamId)
        .get();
      
      const fixtures = [...homeFixtures.docs, ...awayFixtures.docs]
        .map(d => d.data())
        .filter(f => f.status === 'scheduled')
        .sort((a, b) => a.startAt - b.startAt);
      
      const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//YAGO//Team ICS//KO',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
      ];
      
      for (const f of fixtures) {
        const startDate = new Date(f.startAt);
        const endDate = f.endAt ? new Date(f.endAt) : new Date(f.startAt + 90 * 60 * 1000);
        
        lines.push('BEGIN:VEVENT');
        lines.push('UID:' + f.id + '@yago.sports');
        lines.push('DTSTART:' + startDate.toISOString().replace(/[-:]/g, '').replace('.000', ''));
        lines.push('DTEND:' + endDate.toISOString().replace(/[-:]/g, '').replace('.000', ''));
        lines.push('SUMMARY:' + `${f.homeTeamId} vs ${f.awayTeamId}`);
        if (f.venue) {
          lines.push('LOCATION:' + f.venue);
        }
        lines.push('STATUS:CONFIRMED');
        lines.push('END:VEVENT');
      }
      
      lines.push('END:VCALENDAR');
      
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="team-${teamId}.ics"`);
      res.send(lines.join('\n'));
    } catch (e) {
      console.error('[ics-feed]', e);
      res.status(500).send('ICS generation failed');
    }
  });

  // 디비전 전체 일정 iCal 피드
  app.get('/clubs/:clubId/divisions/:divisionId.ics', async (req, res) => {
    try {
      const { clubId, divisionId } = req.params;
      
      const fixtures = await db.collection(`clubs/${clubId}/fixtures`)
        .where('divisionId', '==', divisionId)
        .where('status', '==', 'scheduled')
        .orderBy('startAt')
        .get();
      
      const fixtureData = fixtures.docs.map(d => d.data());
      
      const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//YAGO//Division ICS//KO',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH'
      ];
      
      for (const f of fixtureData) {
        const startDate = new Date(f.startAt);
        const endDate = f.endAt ? new Date(f.endAt) : new Date(f.startAt + 90 * 60 * 1000);
        
        lines.push('BEGIN:VEVENT');
        lines.push('UID:' + f.id + '@yago.sports');
        lines.push('DTSTART:' + startDate.toISOString().replace(/[-:]/g, '').replace('.000', ''));
        lines.push('DTEND:' + endDate.toISOString().replace(/[-:]/g, '').replace('.000', ''));
        lines.push('SUMMARY:' + `${f.homeTeamId} vs ${f.awayTeamId}`);
        if (f.venue) {
          lines.push('LOCATION:' + f.venue);
        }
        lines.push('STATUS:CONFIRMED');
        lines.push('END:VEVENT');
      }
      
      lines.push('END:VCALENDAR');
      
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="division-${divisionId}.ics"`);
      res.send(lines.join('\n'));
    } catch (e) {
      console.error('[ics-division-feed]', e);
      res.status(500).send('ICS generation failed');
    }
  });
}
