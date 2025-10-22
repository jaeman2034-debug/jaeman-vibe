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
exports.tossWebhook = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const db = admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();
function verifySignature(raw, headerSig) {
    const secret = (functions.config().toss?.webhook_secret || process.env.TOSS_WEBHOOK_SECRET || '').trim();
    if (!secret || !headerSig)
        return false;
    const mac = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    // 헤더 이름/형식이 환경마다 다를 수 있어 느슨히 비교
    const norm = headerSig.toLowerCase().replace(/^sha256=/, '');
    return crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(norm));
}
function parseEventOrderId(orderId) {
    // 우리 생성규칙: ev_<eventId>_<ts>
    const m = orderId?.split('_');
    if (m?.length >= 3 && m[0] === 'ev')
        return m[1];
    return null;
}
exports.tossWebhook = functions.https.onRequest(async (req, res) => {
    if (req.method !== 'POST')
        return res.status(405).send('method not allowed');
    const raw = req.rawBody;
    const sig = req.get('toss-signature') || req.get('x-toss-signature') || req.get('x-signature');
    if (!verifySignature(raw, sig))
        return res.status(401).send('bad signature');
    let body = {};
    try {
        body = JSON.parse(raw.toString('utf8'));
    }
    catch {
        return res.status(400).send('bad json');
    }
    // 멱등 처리: 이벤트 ID가 있으면 그걸, 없으면 body 해시
    const eventId = body?.eventId || crypto.createHash('sha256').update(raw).digest('hex');
    const idemRef = db.doc(`_webhooks/toss/${eventId}`);
    const idem = await idemRef.get();
    if (idem.exists)
        return res.status(200).send('ok'); // 이미 처리됨
    await idemRef.set({ at: now() });
    // 대표 필드 예시: eventType, status, orderId, paymentKey, cancels...
    const orderId = body?.orderId || body?.data?.orderId;
    const paymentKey = body?.paymentKey || body?.data?.paymentKey;
    const status = (body?.status || body?.data?.status || '').toLowerCase();
    const evId = parseEventOrderId(orderId);
    if (!evId)
        return res.status(200).send('skipped');
    const payRef = db.doc(`events/${evId}/payments/${orderId}`);
    const paySnap = await payRef.get();
    const uid = (paySnap.exists ? paySnap.data().uid : null) || 'unknown';
    // 상태 머지(멱등): 이미 paid면 무해
    const patch = { updatedAt: now(), lastWebhook: body };
    if (paymentKey)
        patch.paymentKey = paymentKey;
    if (status.includes('done') || status.includes('approved') || status === 'paid') {
        patch.status = 'paid';
        patch.approvedAt = now();
    }
    else if (status.includes('cancel') || status === 'canceled' || status === 'failed') {
        patch.status = status.includes('failed') ? 'failed' : 'canceled';
        patch.canceledAt = now();
    }
    else {
        // 알 수 없는 상태는 기록만
    }
    await payRef.set(patch, { merge: true });
    // 감사 로그
    await db.collection(`events/${evId}/logs`).add({
        action: 'payment.webhook',
        actorId: 'toss',
        at: now(),
        meta: { orderId, status: patch.status }
    });
    return res.status(200).send('ok');
});
