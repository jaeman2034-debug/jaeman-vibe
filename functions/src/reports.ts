import "./_admin";
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
const db = admin.firestore();
const bucket = admin.storage().bucket();

const INTERNAL_KEY = process.env.INTERNAL_KEY || '';
const TTL_DAYS = Number(process.env.REPORT_SIGNED_URL_TTL_DAYS || 30);

function checkKey(req: functions.Request) {
  const k = (req.headers['x-internal-key'] || req.headers['X-Internal-Key']) as string | undefined;
  if (!k || k !== INTERNAL_KEY) throw new Error('unauthorized');
}

// PDF 업로드 (n8n에서 호출)
export const uploadReport = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).send('Only POST');
    checkKey(req);
    
    const { path, base64, contentType = 'application/pdf' } = req.body || {};
    if (!path || !base64) return res.status(400).send('path/base64 required');
    
    const file = bucket.file(path);
    await file.save(Buffer.from(base64, 'base64'), { 
      contentType, 
      resumable: false 
    });
    
    const expires = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);
    const [url] = await file.getSignedUrl({ action: 'read', expires });
    
    return res.status(200).json({ ok: true, url });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});

// 카카오 리포트 발송 (스텁)
export const sendKakaoReport = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).send('Only POST');
    checkKey(req);
    
    const { guardianPhone, studentName, month, url } = req.body || {};
    if (!guardianPhone || !url) return res.status(400).send('guardianPhone/url required');

    // TODO: 대행사 API 연동 (알림톡 템플릿 승인 필요)
    console.log('[KAKAO:STUB] to=%s student=%s month=%s url=%s', 
      guardianPhone, studentName, month, url);

    // 로그 보관
    await db.collection('reportLogs').add({ 
      guardianPhone, 
      studentName, 
      month, 
      url, 
      createdAt: admin.firestore.FieldValue.serverTimestamp() 
    });
    
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});

// 월간 리포트 목록 조회 (n8n에서 호출)
export const listMonthlyReports = functions.https.onRequest(async (req, res) => {
  try {
    const k = (req.headers['x-internal-key'] || req.headers['X-Internal-Key']) as string | undefined;
    if (!k || k !== INTERNAL_KEY) return res.status(401).send('unauthorized');

    const month = (req.query.month as string) || 
      new Date().toISOString().slice(0,7).replace('-', ''); // YYYYMM
    
    const metricsCol = db.collection('academyMetrics').doc(month).collection('students');
    const mSnap = await metricsCol.get();

    const out: any[] = [];
    for (const m of mSnap.docs) {
      const studentId = m.id;
      const sSnap = await db.collection('academyStudents').doc(studentId).get();
      if (!sSnap.exists) continue;
      
      out.push({ 
        student: { id: studentId, ...sSnap.data() }, 
        metrics: m.data() 
      });
    }
    
    return res.json({ month, data: out });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e.message || String(e) });
  }
});
