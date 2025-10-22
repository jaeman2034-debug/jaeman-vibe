"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMonthlyReports = exports.sendKakaoReport = exports.uploadReport = void 0;
require("./_admin");
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const db = admin.firestore();
const bucket = admin.storage().bucket();
const INTERNAL_KEY = process.env.INTERNAL_KEY || '';
const TTL_DAYS = Number(process.env.REPORT_SIGNED_URL_TTL_DAYS || 30);
function checkKey(req) {
    const k = (req.headers['x-internal-key'] || req.headers['X-Internal-Key']);
    if (!k || k !== INTERNAL_KEY)
        throw new Error('unauthorized');
}
// PDF 업로드 (n8n에서 호출)
exports.uploadReport = functions.https.onRequest(async (req, res) => {
    try {
        if (req.method !== 'POST')
            return res.status(405).send('Only POST');
        checkKey(req);
        const { path, base64, contentType = 'application/pdf' } = req.body || {};
        if (!path || !base64)
            return res.status(400).send('path/base64 required');
        const file = bucket.file(path);
        await file.save(Buffer.from(base64, 'base64'), {
            contentType,
            resumable: false
        });
        const expires = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000);
        const [url] = await file.getSignedUrl({ action: 'read', expires });
        return res.status(200).json({ ok: true, url });
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ ok: false, error: e.message || String(e) });
    }
});
// 카카오 리포트 발송 (스텁)
exports.sendKakaoReport = functions.https.onRequest(async (req, res) => {
    try {
        if (req.method !== 'POST')
            return res.status(405).send('Only POST');
        checkKey(req);
        const { guardianPhone, studentName, month, url } = req.body || {};
        if (!guardianPhone || !url)
            return res.status(400).send('guardianPhone/url required');
        // TODO: 대행사 API 연동 (알림톡 템플릿 승인 필요)
        console.log('[KAKAO:STUB] to=%s student=%s month=%s url=%s', guardianPhone, studentName, month, url);
        // 로그 보관
        await db.collection('reportLogs').add({
            guardianPhone,
            studentName,
            month,
            url,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return res.status(200).json({ ok: true });
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ ok: false, error: e.message || String(e) });
    }
});
// 월간 리포트 목록 조회 (n8n에서 호출)
exports.listMonthlyReports = functions.https.onRequest(async (req, res) => {
    try {
        const k = (req.headers['x-internal-key'] || req.headers['X-Internal-Key']);
        if (!k || k !== INTERNAL_KEY)
            return res.status(401).send('unauthorized');
        const month = req.query.month ||
            new Date().toISOString().slice(0, 7).replace('-', ''); // YYYYMM
        const metricsCol = db.collection('academyMetrics').doc(month).collection('students');
        const mSnap = await metricsCol.get();
        const out = [];
        for (const m of mSnap.docs) {
            const studentId = m.id;
            const sSnap = await db.collection('academyStudents').doc(studentId).get();
            if (!sSnap.exists)
                continue;
            out.push({
                student: { id: studentId, ...sSnap.data() },
                metrics: m.data()
            });
        }
        return res.json({ month, data: out });
    }
    catch (e) {
        console.error(e);
        return res.status(500).json({ ok: false, error: e.message || String(e) });
    }
});
