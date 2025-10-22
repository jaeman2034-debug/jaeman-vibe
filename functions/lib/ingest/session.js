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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ingestSessionEvent = void 0;
require("../_admin");
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const v2_1 = require("firebase-functions/v2");
const node_fetch_1 = __importDefault(require("node-fetch"));
const ALLOWED_ORIGIN = (0, params_1.defineSecret)('ALLOWED_ORIGIN');
const N8N_WEBHOOK_SESSION_EVENT = (0, params_1.defineSecret)('N8N_WEBHOOK_SESSION_EVENT');
exports.ingestSessionEvent = (0, https_1.onRequest)({
    secrets: [ALLOWED_ORIGIN, N8N_WEBHOOK_SESSION_EVENT]
}, async (req, res) => {
    const origin = ALLOWED_ORIGIN.value();
    // CORS 설정
    res.set('Access-Control-Allow-Origin', origin || '*');
    res.set('Access-Control-Allow-Headers', 'authorization, content-type');
    res.set('Vary', 'Origin');
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    try {
        // Firebase ID 토큰 검증 (가능 시)
        let uid = 'anon';
        const authz = req.get('authorization');
        if (authz?.startsWith('Bearer ')) {
            const idToken = authz.slice('Bearer '.length);
            try {
                const decoded = await admin.auth().verifyIdToken(idToken);
                uid = decoded.uid;
            }
            catch (tokenError) {
                v2_1.logger.warn('Invalid ID token, proceeding as anonymous:', tokenError);
            }
        }
        const { type, ts, meta } = req.body || {};
        if (!type) {
            return res.status(400).json({ error: 'type required' });
        }
        const event = {
            type,
            ts: typeof ts === 'number' ? ts : Date.now(),
            uid,
            meta: meta || {},
            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            ua: req.get('user-agent') || '',
            url: req.body?.url || '',
        };
        // 서버→n8n 포워드 (서버-사이드 보안)
        const n8nUrl = N8N_WEBHOOK_SESSION_EVENT.value();
        if (n8nUrl) {
            try {
                await (0, node_fetch_1.default)(n8nUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-internal-key': process.env.N8N_TOKEN || 'n8n_default_token_please_change'
                    },
                    body: JSON.stringify(event),
                });
                v2_1.logger.info(`Session event forwarded to n8n: ${type} from ${uid}`);
            }
            catch (n8nError) {
                v2_1.logger.error('Failed to forward to n8n:', n8nError);
                // n8n 전송 실패해도 클라이언트에는 성공 응답
            }
        }
        return res.json({ ok: true });
    }
    catch (e) {
        v2_1.logger.error('Session event ingest error:', e);
        return res.status(500).json({ error: e?.message || 'ingest failed' });
    }
});
