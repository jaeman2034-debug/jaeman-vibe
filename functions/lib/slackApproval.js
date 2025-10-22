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
exports.slack = exports.opsAlertWorker = exports.dailyStatsWorker = exports.generateSecurityRules = exports.autoResubmitWorker = exports.metricsUpdateWorker = exports.approvalExpiryWorker = exports.webhookRetryWorker = exports.slackUpdateWorker = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express = __importStar(require("express"));
const crypto = __importStar(require("crypto"));
// Sentry 설정
const SENTRY_DSN = cfg?.sentry?.dsn || process.env.SENTRY_DSN;
const SENTRY_SAMPLE_ERRORS = Number(cfg?.sentry?.sample_errors || process.env.SENTRY_SAMPLE_ERRORS || 1.0);
const SENTRY_SAMPLE_TRACES = Number(cfg?.sentry?.sample_traces || process.env.SENTRY_SAMPLE_TRACES || 0.1);
if (SENTRY_DSN) {
    const Sentry = require('@sentry/node');
    Sentry.init({
        dsn: SENTRY_DSN,
        sampleRate: SENTRY_SAMPLE_ERRORS,
        tracesSampleRate: SENTRY_SAMPLE_TRACES,
        environment: process.env.NODE_ENV || 'production'
    });
}
function logInfo(message, context = {}) {
    console.log(JSON.stringify({
        level: 'info',
        message,
        timestamp: new Date().toISOString(),
        ...context
    }));
}
function logError(message, error, context = {}) {
    console.error(JSON.stringify({
        level: 'error',
        message,
        error: {
            message: error?.message || String(error),
            stack: error?.stack,
            code: error?.code,
            details: error?.details
        },
        timestamp: new Date().toISOString(),
        ...context
    }));
    // Sentry에 에러 전송
    if (SENTRY_DSN) {
        const Sentry = require('@sentry/node');
        Sentry.captureException(error, {
            tags: context,
            extra: { message, ...context }
        });
    }
}
function logWarn(message, context = {}) {
    console.warn(JSON.stringify({
        level: 'warn',
        message,
        timestamp: new Date().toISOString(),
        ...context
    }));
}
const app = express();
app.use(express.json());
// 환경변수 설정
const cfg = functions.config();
const SLACK_BOT_TOKEN = cfg?.slack?.bot_token || process.env.SLACK_BOT_TOKEN;
const SLACK_SIGNING_SECRET = cfg?.slack?.signing_secret || process.env.SLACK_SIGNING_SECRET;
const SLACK_APPROVER_CHANNEL = cfg?.slack?.approver_channel || process.env.SLACK_APPROVER_CHANNEL;
const INTERNAL_KEY = cfg?.internal?.key || process.env.INTERNAL_KEY;
const N8N_WEBHOOK_APPROVED = cfg?.n8n?.approved_webhook || process.env.N8N_WEBHOOK_APPROVED;
const N8N_WEBHOOK_APPROVED_FO = cfg?.n8n?.approved_webhook_fo || process.env.N8N_WEBHOOK_APPROVED_FO;
const RETRY_MAX_ATTEMPTS = Number(cfg?.retry?.max_attempts || process.env.RETRY_MAX_ATTEMPTS || 6);
// 레이트리밋 설정
const RATE_CAPACITY = Number(cfg?.rate?.capacity || process.env.RATE_CAPACITY || 5);
const RATE_REFILL_PER_SEC = Number(cfg?.rate?.refill_per_sec || process.env.RATE_REFILL_PER_SEC || 1);
// 다중 결재 설정
const APPROVAL_DEFAULT_REQUIRED = Number(cfg?.approval?.default_required || process.env.APPROVAL_DEFAULT_REQUIRED || 1);
const APPROVAL_TTL_MINUTES = Number(cfg?.approval?.ttl_minutes || process.env.APPROVAL_TTL_MINUTES || 1440);
const APPROVAL_EXPIRY_WARN_MINUTES = Number(cfg?.approval?.expiry_warn_minutes || process.env.APPROVAL_EXPIRY_WARN_MINUTES || 10);
// 역할 기반 다단계 결재 설정
const APPROVAL_STAGE_DEFAULT_REQUIRED = Number(cfg?.approval?.stage_default_required || process.env.APPROVAL_STAGE_DEFAULT_REQUIRED || 1);
const APPROVAL_MAX_RESUBMITS = Number(cfg?.approval?.max_resubmits || process.env.APPROVAL_MAX_RESUBMITS || 2);
const APPROVAL_RESUBMIT_COOLDOWN_MINUTES = Number(cfg?.approval?.resubmit_cooldown_minutes || process.env.APPROVAL_RESUBMIT_COOLDOWN_MINUTES || 30);
// BigQuery 설정
const BIGQUERY_DATASET = cfg?.bigquery?.dataset || process.env.BIGQUERY_DATASET || 'vibe';
const BIGQUERY_TABLE_APPROVALS = cfg?.bigquery?.table_approvals || process.env.BIGQUERY_TABLE_APPROVALS || 'approvals';
const BIGQUERY_TABLE_METRICS = cfg?.bigquery?.table_metrics || process.env.BIGQUERY_TABLE_METRICS || 'metrics';
// 운영 대시보드 설정
const ADMIN_ORIGIN = cfg?.admin?.origin || process.env.ADMIN_ORIGIN || 'https://admin.yagovibe.com';
const db = admin.firestore();
// CORS 헤더 설정 (운영 대시보드 지원)
app.use((req, res, next) => {
    const origin = req.get('Origin') || '';
    const allowedOrigins = [ADMIN_ORIGIN, 'http://localhost:3000', 'http://localhost:5173'];
    if (allowedOrigins.includes(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
    }
    else {
        res.set('Access-Control-Allow-Origin', '*');
    }
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, x-internal-key, Authorization');
    res.set('Access-Control-Allow-Credentials', 'true');
    res.set('Access-Control-Max-Age', '86400');
    // 보안 헤더
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');
    res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    next();
});
// Slack 서명 검증 (이중 시크릿 지원)
function verifySlack(req, res, next) {
    const signature = req.get('x-slack-signature');
    const timestamp = req.get('x-slack-request-timestamp');
    const body = req.rawBody || JSON.stringify(req.body);
    if (!signature || !timestamp) {
        return res.status(401).send('Unauthorized');
    }
    // 현재 시크릿과 이전 시크릿 모두 확인
    const currentSecret = SLACK_SIGNING_SECRET;
    const oldSecret = cfg?.slack?.signing_secret_old || process.env.SLACK_SIGNING_SECRET_OLD;
    if (!currentSecret && !oldSecret) {
        return res.status(401).send('Unauthorized');
    }
    // 현재 시크릿으로 검증
    if (currentSecret) {
        const hmac = crypto.createHmac('sha256', currentSecret);
        hmac.update(`v0:${timestamp}:${body}`);
        const expected = `v0=${hmac.digest('hex')}`;
        if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
            return next();
        }
    }
    // 이전 시크릿으로 검증 (로테이션 중)
    if (oldSecret) {
        const hmac = crypto.createHmac('sha256', oldSecret);
        hmac.update(`v0:${timestamp}:${body}`);
        const expected = `v0=${hmac.digest('hex')}`;
        if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
            console.log('Slack signature verified with old secret (rotation in progress)');
            return next();
        }
    }
    return res.status(401).send('Unauthorized');
}
// HMAC 서명 검증
function verifyHMAC(req, res, next) {
    const signature = req.get('x-hmac-signature');
    const timestamp = req.get('x-timestamp');
    const body = req.rawBody || JSON.stringify(req.body);
    if (!signature || !timestamp) {
        return res.status(401).json({ error: 'Missing HMAC signature or timestamp' });
    }
    // 타임스탬프 검증 (5분 이내)
    const now = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp);
    if (Math.abs(now - requestTime) > 300) {
        return res.status(401).json({ error: 'Request timestamp too old' });
    }
    // HMAC 검증
    const hmacSecret = cfg?.internal?.hmac || process.env.INTERNAL_HMAC_SECRET;
    if (!hmacSecret) {
        return res.status(401).json({ error: 'HMAC secret not configured' });
    }
    const expectedSignature = crypto
        .createHmac('sha256', hmacSecret)
        .update(`${timestamp}:${body}`)
        .digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return res.status(401).json({ error: 'Invalid HMAC signature' });
    }
    next();
}
// IP 허용 목록 검증
function verifyIPAllowlist(req, res, next) {
    const allowlist = cfg?.internal?.ip_allowlist || process.env.INTERNAL_IP_ALLOWLIST;
    if (!allowlist) {
        return next(); // IP 제한 없음
    }
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    const allowedIPs = allowlist.split(',').map((ip) => ip.trim());
    if (!allowedIPs.includes(clientIP)) {
        return res.status(403).json({ error: 'IP not allowed' });
    }
    next();
}
// 내부 키 검증 (기본)
function requireInternalKey(req, res, next) {
    const key = req.get('x-internal-key');
    if (!key || key !== INTERNAL_KEY) {
        return res.status(401).send('Unauthorized');
    }
    next();
}
// 강화된 내부 키 검증 (HMAC + IP + 타임스탬프)
function requireInternalKeySecure(req, res, next) {
    // 1. 기본 키 검증
    const key = req.get('x-internal-key');
    if (!key || key !== INTERNAL_KEY) {
        return res.status(401).json({ error: 'Invalid internal key' });
    }
    // 2. HMAC 서명 검증
    verifyHMAC(req, res, (err) => {
        if (err)
            return;
        // 3. IP 허용 목록 검증
        verifyIPAllowlist(req, res, next);
    });
}
// 토큰 버킷 레이트리밋 (채널별 오버라이드 지원)
async function acquireToken(channel) {
    const ref = db.collection('throttle').doc(channel);
    const cfgRef = db.collection('throttle_config').doc(channel);
    const now = Date.now();
    let availableInSec = 0;
    await db.runTransaction(async (tx) => {
        const [snap, cfgSnap] = await Promise.all([tx.get(ref), tx.get(cfgRef)]);
        const cap = cfgSnap.exists && typeof cfgSnap.data().capacity === 'number'
            ? cfgSnap.data().capacity : RATE_CAPACITY;
        const refill = cfgSnap.exists && typeof cfgSnap.data().refillPerSec === 'number'
            ? cfgSnap.data().refillPerSec : RATE_REFILL_PER_SEC;
        let tokens = cap;
        let updatedAt = now;
        if (snap.exists) {
            const d = snap.data();
            tokens = typeof d.tokens === 'number' ? d.tokens : cap;
            updatedAt = typeof d.updatedAt === 'number' ? d.updatedAt : now;
            const elapsed = Math.max(0, (now - updatedAt) / 1000);
            tokens = Math.min(cap, tokens + elapsed * refill);
        }
        if (tokens < 1) {
            availableInSec = Math.ceil((1 - tokens) / refill);
            throw new Error('rate_limited');
        }
        tokens -= 1;
        tx.set(ref, {
            tokens,
            updatedAt: now,
            capacity: cap,
            refillPerSec: refill
        }, { merge: true });
    });
    return { ok: true, availableInSec };
}
// 승인 권한 확인
function canApprove(userId, doc) {
    if (doc?.approverAllowlist && Array.isArray(doc.approverAllowlist)) {
        return doc.approverAllowlist.includes(userId);
    }
    return true; // 기본 허용
}
// 역할 기반 다단계 결재 지원
function canApproveStage(userId, doc, stage) {
    const stages = doc?.stages || [];
    const currentStage = stages[stage] || {};
    // 현재 스테이지의 승인자 목록 확인
    if (currentStage.approverAllowlist && Array.isArray(currentStage.approverAllowlist)) {
        return currentStage.approverAllowlist.includes(userId);
    }
    // 전체 승인자 목록 확인
    if (doc?.approverAllowlist && Array.isArray(doc.approverAllowlist)) {
        return doc.approverAllowlist.includes(userId);
    }
    return true; // 기본 허용
}
// 승인 규칙 로딩 함수
async function loadApprovalRules(type, priority) {
    try {
        // 기본 규칙 로드
        const defaultRules = require('../../approval_rules/default.json');
        let rules = defaultRules;
        // 타입별 규칙 적용
        if (type && defaultRules.typeRules[type]) {
            rules = {
                ...defaultRules,
                ...defaultRules.typeRules[type],
                stages: defaultRules.typeRules[type].stages || defaultRules.stages
            };
        }
        // 우선순위별 규칙 적용
        if (priority && defaultRules.priorityRules[priority]) {
            const priorityRule = defaultRules.priorityRules[priority];
            rules = {
                ...rules,
                defaultRequired: priorityRule.defaultRequired,
                defaultTtlMinutes: priorityRule.defaultTtlMinutes,
                defaultExpiryWarnMinutes: priorityRule.defaultExpiryWarnMinutes,
                stages: priorityRule.stages || rules.stages
            };
        }
        return rules;
    }
    catch (error) {
        console.error('Approval rules loading error:', error);
        // 기본값 반환
        return {
            defaultRequired: APPROVAL_DEFAULT_REQUIRED,
            defaultTtlMinutes: APPROVAL_TTL_MINUTES,
            defaultExpiryWarnMinutes: APPROVAL_EXPIRY_WARN_MINUTES,
            stages: [{
                    name: '1차 검토',
                    required: APPROVAL_STAGE_DEFAULT_REQUIRED,
                    approverAllowlist: null
                }]
        };
    }
}
// BigQuery 스트리밍 함수
async function streamToBigQuery(table, data) {
    try {
        const { BigQuery } = require('@google-cloud/bigquery');
        const bigquery = new BigQuery();
        const dataset = bigquery.dataset(BIGQUERY_DATASET);
        const tableRef = dataset.table(table);
        await tableRef.insert([{
                ...data,
                timestamp: new Date().toISOString(),
                _inserted_at: admin.firestore.FieldValue.serverTimestamp()
            }]);
    }
    catch (error) {
        console.error('BigQuery streaming error:', error);
        // BigQuery 실패해도 메인 로직은 계속 진행
    }
}
// 메트릭 기록
async function recordMetric(ok, method, extra) {
    const ref = db.collection('metrics').doc('slack');
    const last = {
        at: admin.firestore.FieldValue.serverTimestamp(),
        ok,
        method,
        extra: extra || null
    };
    await ref.set({
        okCount: admin.firestore.FieldValue.increment(ok ? 1 : 0),
        errCount: admin.firestore.FieldValue.increment(ok ? 0 : 1),
        last,
    }, { merge: true });
}
// DM 알림 설정
const NOTIFY_DM = cfg?.notify?.dm || process.env.NOTIFY_DM === 'true';
const NOTIFY_DM_PREFIX = cfg?.notify?.dm_prefix || process.env.NOTIFY_DM_PREFIX || '[승인요청]';
const OPS_ALERT_CHANNEL = cfg?.notify?.ops_alert_channel || process.env.OPS_ALERT_CHANNEL;
// 승인자 DM 알림
async function notifyApprovers(docId, title, approvers, stage) {
    if (!NOTIFY_DM || !approvers.length)
        return;
    const message = stage
        ? `${NOTIFY_DM_PREFIX} ${title}\n\n새로운 승인 단계가 시작되었습니다: ${stage}\n승인이 필요합니다.`
        : `${NOTIFY_DM_PREFIX} ${title}\n\n새로운 승인 요청이 있습니다.\n승인이 필요합니다.`;
    const blocks = [
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: message
            }
        },
        {
            type: 'actions',
            elements: [
                {
                    type: 'button',
                    text: {
                        type: 'plain_text',
                        text: '승인하기'
                    },
                    style: 'primary',
                    action_id: 'approve',
                    value: docId
                },
                {
                    type: 'button',
                    text: {
                        type: 'plain_text',
                        text: '반려하기'
                    },
                    style: 'danger',
                    action_id: 'reject',
                    value: docId
                }
            ]
        }
    ];
    // 각 승인자에게 DM 전송
    for (const userId of approvers) {
        try {
            await slackApi('chat.postMessage', {
                channel: userId,
                text: message,
                blocks
            });
        }
        catch (error) {
            console.error(`Failed to send DM to ${userId}:`, error);
        }
    }
}
// Slack API 래퍼 (429 처리 포함)
async function slackApi(method, body) {
    const url = `https://slack.com/api/${method}`;
    const r = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
        },
        body: JSON.stringify(body),
    });
    if (r.status === 429) {
        const retry = Number(r.headers.get('retry-after') || 1);
        await recordMetric(false, method, { code: 429, retry });
        return { ok: false, error: 'rate_limited', retry_after: retry };
    }
    const j = await r.json();
    await recordMetric(!!j.ok, method, j.ok ? undefined : { error: j.error });
    return j;
}
// Block Kit 카드 생성 (다단계 결재 + 자동 재상신 지원)
function buildBlocks(data) {
    const { title, summary, url, image, type, refId, docId, required, approvers, status, expireAt, stages, currentStage, resubmitCount, maxResubmits } = data;
    const progress = required ? `${approvers?.length || 0}/${required}` : '1/1';
    const statusText = status === 'partially_approved' ? '진행중' :
        status === 'approved' ? '승인됨' :
            status === 'rejected' ? '반려됨' :
                status === 'expired' ? '만료됨' :
                    status === 'resubmitted' ? '재상신됨' : '대기중';
    const approverList = approvers?.map((a) => `<@${a.userId}>`).join(', ') || '-';
    // 다단계 결재 진행 상황 표시
    const stageProgress = stages ? stages.map((stage, index) => {
        const isCurrent = index === currentStage;
        const isCompleted = index < currentStage;
        const stageStatus = isCompleted ? '✅' : isCurrent ? '🔄' : '⏳';
        return `${stageStatus} ${stage.name || `Stage ${index + 1}`}`;
    }).join(' → ') : '';
    // 자동 재상신 정보
    const resubmitInfo = resubmitCount > 0 ? ` (재상신 ${resubmitCount}/${maxResubmits})` : '';
    return [
        {
            type: 'header',
            text: { type: 'plain_text', text: `📋 ${type?.toUpperCase() || 'ITEM'} 승인 요청${resubmitInfo}` }
        },
        {
            type: 'section',
            text: { type: 'mrkdwn', text: `*${title}*` },
            accessory: image ? {
                type: 'image',
                image_url: image,
                alt_text: title
            } : undefined
        },
        ...(summary ? [{
                type: 'section',
                text: { type: 'mrkdwn', text: summary }
            }] : []),
        ...(url ? [{
                type: 'section',
                text: { type: 'mrkdwn', text: `🔗 <${url}|상세보기>` }
            }] : []),
        ...(stageProgress ? [{
                type: 'section',
                text: { type: 'mrkdwn', text: `*다단계 진행:* ${stageProgress}` }
            }] : []),
        {
            type: 'context',
            elements: [
                { type: 'mrkdwn', text: `ID: \`${docId}\`` },
                ...(refId ? [{ type: 'mrkdwn', text: `Ref: \`${refId}\`` }] : []),
                { type: 'mrkdwn', text: `진행: ${progress}` }
            ]
        },
        {
            type: 'context',
            elements: [
                { type: 'mrkdwn', text: `상태: ${statusText}` },
                { type: 'mrkdwn', text: `승인자: ${approverList}` }
            ]
        },
        ...(status === 'pending' || status === 'partially_approved' ? [{
                type: 'actions',
                elements: [
                    {
                        type: 'button',
                        text: { type: 'plain_text', text: '✅ 승인' },
                        style: 'primary',
                        action_id: 'approve',
                        value: docId
                    },
                    {
                        type: 'button',
                        text: { type: 'plain_text', text: '✋ 반려' },
                        style: 'danger',
                        action_id: 'reject',
                        value: docId
                    }
                ]
            }] : [])
    ];
}
// 반려 사유 모달
function rejectModalView(docId) {
    return {
        type: 'modal',
        callback_id: 'reject_reason',
        private_metadata: docId,
        title: { type: 'plain_text', text: '반려 사유' },
        submit: { type: 'plain_text', text: '반려하기' },
        close: { type: 'plain_text', text: '취소' },
        blocks: [
            {
                type: 'section',
                text: { type: 'mrkdwn', text: '반려 사유를 입력해주세요.' }
            },
            {
                type: 'input',
                block_id: 'reason_block',
                element: {
                    type: 'plain_text_input',
                    action_id: 'reason',
                    multiline: true,
                    placeholder: { type: 'plain_text', text: '반려 사유를 입력하세요...' }
                },
                label: { type: 'plain_text', text: '사유' }
            }
        ]
    };
}
// n8n 웹훅 페일오버
async function postWithFailover(url1, url2, body) {
    const opts = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {})
    };
    if (url1) {
        try {
            const r = await fetch(url1, opts);
            if (r.ok)
                return { ok: true, target: 'primary' };
        }
        catch { }
    }
    if (url2) {
        try {
            const r2 = await fetch(url2, opts);
            if (r2.ok)
                return { ok: true, target: 'fallback' };
        }
        catch { }
    }
    return { ok: false };
}
function classifyWebhookFailure(error, statusCode) {
    // 429 Rate Limited
    if (statusCode === 429) {
        return {
            shouldRetry: true,
            maxAttempts: 10,
            baseDelayMs: 60000, // 1분
            maxDelayMs: 3600000, // 1시간
            backoffMultiplier: 1.5
        };
    }
    // 5xx Server Errors
    if (statusCode && statusCode >= 500) {
        return {
            shouldRetry: true,
            maxAttempts: 8,
            baseDelayMs: 30000, // 30초
            maxDelayMs: 1800000, // 30분
            backoffMultiplier: 2.0
        };
    }
    // 4xx Client Errors (일부는 재시도)
    if (statusCode && statusCode >= 400 && statusCode < 500) {
        // 408 Timeout, 429 Rate Limited는 재시도
        if (statusCode === 408 || statusCode === 429) {
            return {
                shouldRetry: true,
                maxAttempts: 5,
                baseDelayMs: 15000, // 15초
                maxDelayMs: 300000, // 5분
                backoffMultiplier: 1.5
            };
        }
        // 다른 4xx는 재시도 안함
        return {
            shouldRetry: false,
            maxAttempts: 0,
            baseDelayMs: 0,
            maxDelayMs: 0,
            backoffMultiplier: 1.0
        };
    }
    // 네트워크 에러 (연결 실패, 타임아웃 등)
    if (error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT' ||
        error?.message?.includes('timeout') || error?.message?.includes('network')) {
        return {
            shouldRetry: true,
            maxAttempts: 12,
            baseDelayMs: 10000, // 10초
            maxDelayMs: 1800000, // 30분
            backoffMultiplier: 1.8
        };
    }
    // 기타 에러 (기본 정책)
    return {
        shouldRetry: true,
        maxAttempts: 6,
        baseDelayMs: 30000, // 30초
        maxDelayMs: 1800000, // 30분
        backoffMultiplier: 2.0
    };
}
// 재시도 큐에 적재 (TTL 설정 + 실패 분류)
async function enqueueWebhook(item, error, statusCode) {
    const policy = classifyWebhookFailure(error, statusCode);
    await db.collection('webhook_retry').add({
        status: 'pending',
        type: 'n8n',
        attempts: 0,
        maxAttempts: policy.maxAttempts,
        nextAttemptAt: admin.firestore.Timestamp.fromMillis(Date.now()),
        payload: item,
        failurePolicy: policy,
        lastError: error?.message || String(error),
        lastStatusCode: statusCode,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        // 7일 후 자동 삭제
        ttlAt: admin.firestore.Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    logInfo('Webhook enqueued for retry', {
        docId: item.docId,
        type: item.type,
        refId: item.refId,
        statusCode,
        error: error?.message,
        policy: policy.shouldRetry ? 'retry' : 'no_retry',
        maxAttempts: policy.maxAttempts
    });
}
// Slack 업데이트 큐에 적재 (TTL 설정)
async function enqueueSlackUpdate(job) {
    await db.collection('slack_update').add({
        status: 'pending',
        attempts: 0,
        nextAttemptAt: admin.firestore.Timestamp.fromMillis(Date.now()),
        job,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        // 3일 후 자동 삭제
        ttlAt: admin.firestore.Timestamp.fromMillis(Date.now() + 3 * 24 * 60 * 60 * 1000)
    });
}
// 헬스체크
app.get('/slack/health', async (req, res) => {
    const channel = req.query.channel || null;
    const metrics = (await db.collection('metrics').doc('slack').get()).data() || {};
    const [retryPending, retryFailed, updatePending] = await Promise.all([
        db.collection('webhook_retry').where('status', '==', 'pending').count().get().then(s => s.data().count).catch(() => 0),
        db.collection('webhook_retry').where('status', '==', 'failed').count().get().then(s => s.data().count).catch(() => 0),
        db.collection('slack_update').where('status', '==', 'pending').count().get().then(s => s.data().count).catch(() => 0),
    ]);
    let throttle = null, availableInSec = null;
    if (channel) {
        const snap = await db.collection('throttle').doc(channel).get();
        if (snap.exists) {
            throttle = snap.data();
            const now = Date.now();
            const tokens = typeof throttle.tokens === 'number' ? throttle.tokens : RATE_CAPACITY;
            const updatedAt = typeof throttle.updatedAt === 'number' ? throttle.updatedAt : now;
            const elapsed = Math.max(0, (now - updatedAt) / 1000);
            const refill = throttle.refillPerSec || RATE_REFILL_PER_SEC;
            const cap = throttle.capacity || RATE_CAPACITY;
            const refilled = Math.min(cap, tokens + elapsed * refill);
            availableInSec = refilled >= 1 ? 0 : Math.ceil((1 - refilled) / refill);
        }
    }
    return res.status(200).json({
        ok: true,
        region: 'asia-northeast3',
        slack: !!SLACK_BOT_TOKEN,
        signing: !!SLACK_SIGNING_SECRET,
        rate: { capacity: RATE_CAPACITY, refillPerSec: RATE_REFILL_PER_SEC },
        metrics,
        queues: {
            webhook_retry: { pending: retryPending, failed: retryFailed },
            slack_update: { pending: updatePending }
        },
        channel,
        throttle,
        availableInSec,
    });
});
// 내부 시스템 → 슬랙 카드 생성 (다단계 결재 + 자동 재상신 지원)
app.post('/slack/internal/approval/notify', requireInternalKey, async (req, res) => {
    try {
        const { channel = SLACK_APPROVER_CHANNEL, type, refId, title, summary, url, image, payload, required, ttlMinutes, approverAllowlist, stages, maxResubmits } = req.body || {};
        if (!channel || !title)
            return res.status(400).send('channel & title required');
        // 채널별 레이트리밋
        try {
            await acquireToken(channel);
        }
        catch (e) {
            const throttleDoc = (await db.collection('throttle').doc(channel).get()).data() || {};
            const tokens = typeof throttleDoc?.tokens === 'number' ? throttleDoc.tokens : 0;
            const waitSec = Math.max(1, Math.ceil((1 - tokens) / RATE_REFILL_PER_SEC));
            return res.status(429).json({
                ok: false,
                rate_limited: true,
                retry_after_seconds: waitSec
            });
        }
        // Idempotency: 동일 type/refId로 pending 존재 시 재사용
        if (type && refId) {
            const dup = await db.collection('approvals')
                .where('type', '==', type)
                .where('refId', '==', refId)
                .where('status', 'in', ['pending', 'partially_approved'])
                .limit(1)
                .get();
            if (!dup.empty) {
                const doc = dup.docs[0];
                const d = doc.data();
                return res.status(200).json({
                    ok: true,
                    reused: true,
                    docId: doc.id,
                    channel: d.channel || channel,
                    ts: d.ts || null
                });
            }
        }
        // 승인 규칙 로딩
        const rules = await loadApprovalRules(type, req.body.priority);
        // 다단계 결재 설정
        const need = Number(required || rules.defaultRequired);
        const ttl = Number(ttlMinutes || rules.defaultTtlMinutes);
        const expireAt = admin.firestore.Timestamp.fromMillis(Date.now() + ttl * 60 * 1000);
        const resubmitMax = Number(maxResubmits || APPROVAL_MAX_RESUBMITS);
        // 다단계 결재 스테이지 설정
        const approvalStages = stages || rules.stages.map((stage) => ({
            name: stage.name,
            required: stage.required,
            approverAllowlist: stage.approverAllowlist || approverAllowlist || null
        }));
        const docRef = await db.collection('approvals').add({
            status: 'pending',
            type: type || null,
            refId: refId || null,
            title,
            summary: summary || null,
            url: url || null,
            image: image || null,
            payload: payload || null,
            required: need,
            approvers: [],
            approverAllowlist: approverAllowlist || null,
            stages: approvalStages,
            currentStage: 0,
            resubmitCount: 0,
            maxResubmits: resubmitMax,
            expireAt,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        const docId = docRef.id;
        // BigQuery 스트리밍
        await streamToBigQuery(BIGQUERY_TABLE_APPROVALS, {
            docId,
            type,
            refId,
            title,
            status: 'pending',
            action: 'created'
        });
        const blocks = buildBlocks({
            title,
            summary,
            url,
            image,
            type,
            refId,
            docId,
            required: need,
            approvers: [],
            status: 'pending',
            stages: approvalStages,
            currentStage: 0,
            resubmitCount: 0,
            maxResubmits: resubmitMax
        });
        const post = await slackApi('chat.postMessage', { channel, text: title, blocks });
        if (!post?.ok) {
            await docRef.update({
                channel: channel,
                ts: null,
                postError: post?.error || 'unknown'
            });
            return res.status(202).json({
                ok: false,
                queued: false,
                error: post?.error || 'slack_post_failed'
            });
        }
        await docRef.update({ channel: post.channel, ts: post.ts });
        return res.status(200).json({
            ok: true,
            docId,
            channel: post.channel,
            ts: post.ts
        });
    }
    catch (e) {
        console.error('/notify error', e);
        return res.status(500).send(e?.message || 'error');
    }
});
// 버튼 인터랙션 (다중 결재 + 트랜잭션 지원)
app.post('/slack/interactive', verifySlack, async (req, res) => {
    try {
        const payload = JSON.parse(req.body.payload);
        // 1) 블록 액션 (버튼)
        if (payload?.type === 'block_actions') {
            const action = payload?.actions?.[0];
            const userId = payload?.user?.id;
            const userName = payload?.user?.username || payload?.user?.name || userId;
            const channel = payload?.channel?.id || payload?.container?.channel_id;
            const ts = payload?.message?.ts || payload?.container?.message_ts;
            const docId = action?.value;
            if (!docId)
                return res.status(200).send('문서 없음');
            const docRef = db.collection('approvals').doc(docId);
            if (action.action_id === 'approve') {
                // 트랜잭션으로 다중 결재 처리
                const result = await db.runTransaction(async (tx) => {
                    const snap = await tx.get(docRef);
                    if (!snap.exists)
                        return { done: false, reason: 'not_found' };
                    const d = snap.data();
                    if (!['pending', 'partially_approved'].includes(d.status))
                        return { done: false, reason: 'finalized' };
                    if (!canApprove(userId, d))
                        return { done: false, reason: 'forbidden' };
                    const already = (d.approvers || []).some((a) => a.userId === userId);
                    if (already)
                        return { done: false, reason: 'duplicate' };
                    const approvers = [...(d.approvers || []), { userId, userName, at: admin.firestore.FieldValue.serverTimestamp() }];
                    const required = Number(d.required || 1);
                    const reached = approvers.length >= required;
                    const newStatus = reached ? 'approved' : 'partially_approved';
                    const patch = { approvers, status: newStatus };
                    if (reached)
                        patch.approvedAt = admin.firestore.FieldValue.serverTimestamp();
                    tx.update(docRef, patch);
                    return { done: true, reached, approvers, required, d };
                });
                if (!result.done) {
                    if (result.reason === 'forbidden')
                        return res.status(200).send('승인 권한이 없습니다');
                    return res.status(200).send('이미 처리되었거나 중복 승인입니다');
                }
                const d = result.d;
                const progress = result.reached
                    ? `✅ 승인 완료 • ${result.approvers.length}/${result.required}`
                    : `진행중 • ${result.approvers.length}/${result.required} (by @${userName})`;
                const baseBlocks = buildBlocks({
                    title: d.title,
                    summary: d.summary,
                    url: d.url,
                    image: d.image,
                    type: d.type,
                    refId: d.refId,
                    docId,
                    required: result.required,
                    approvers: result.approvers,
                    status: result.reached ? 'approved' : 'partially_approved'
                });
                const approverList = (result.approvers || []).map((a) => `<@${a.userId}>`).join(', ');
                const extra = [
                    { type: 'context', elements: [{ type: 'mrkdwn', text: progress }] },
                    { type: 'context', elements: [{ type: 'mrkdwn', text: `승인자: ${approverList || '-'}` }] },
                ];
                await enqueueSlackUpdate({
                    channel,
                    ts,
                    text: `${d.title} (${result.reached ? '승인됨' : '진행중'})`,
                    blocks: [...baseBlocks, ...extra]
                });
                // 완전 승인 시 n8n 웹훅 호출
                if (result.reached) {
                    const body = { docId, type: d.type, refId: d.refId, payload: d.payload };
                    const sent = await postWithFailover(N8N_WEBHOOK_APPROVED, N8N_WEBHOOK_APPROVED_FO, body);
                    if (!sent.ok)
                        await enqueueWebhook(body);
                }
                return res.status(200).send('승인 처리 완료');
            }
            if (action.action_id === 'reject') {
                // 모달 열기
                const trigger_id = payload?.trigger_id;
                await slackApi('views.open', { trigger_id, view: rejectModalView(docId) });
                return res.status(200).send('');
            }
            return res.status(200).send('unknown action');
        }
        // 2) 모달 제출
        if (payload?.type === 'view_submission' && payload?.view?.callback_id === 'reject_reason') {
            const user = payload?.user?.username || payload?.user?.name || payload?.user?.id;
            const docId = payload?.view?.private_metadata;
            const values = payload?.view?.state?.values || {};
            const reason = values?.reason_block?.reason?.value || '';
            const docRef = db.collection('approvals').doc(docId);
            const snap = await docRef.get();
            if (snap.exists) {
                const data = snap.data();
                await docRef.update({
                    status: 'rejected',
                    rejectedBy: user,
                    rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
                    rejectedReason: reason
                });
                if (data.channel && data.ts) {
                    const blocks = [
                        ...buildBlocks({
                            title: data.title,
                            summary: data.summary,
                            url: data.url,
                            image: data.image,
                            type: data.type,
                            refId: data.refId,
                            docId,
                            required: data.required,
                            approvers: data.approvers,
                            status: 'rejected'
                        }),
                        {
                            type: 'section',
                            text: {
                                type: 'mrkdwn',
                                text: `*반려 사유*\n>${reason || '사유 없음'}`
                            }
                        },
                        {
                            type: 'context',
                            elements: [{
                                    type: 'mrkdwn',
                                    text: `🚫 *반려됨* by @${user} • <!date^${Math.floor(Date.now() / 1000)}^{date_num} {time_secs}|now>`
                                }]
                        }
                    ];
                    await enqueueSlackUpdate({
                        channel: data.channel,
                        ts: data.ts,
                        text: `${data.title} (반려됨)`,
                        blocks
                    });
                }
            }
            // 모달 닫기
            return res.status(200).json({ response_action: 'clear' });
        }
        return res.status(200).send('noop');
    }
    catch (e) {
        console.error('/interactive error', e);
        return res.status(200).send('처리 중 오류');
    }
});
// Slack 업데이트 워커
exports.slackUpdateWorker = functions
    .region('asia-northeast3')
    .pubsub.schedule('every 1 minutes')
    .timeZone('Asia/Seoul')
    .onRun(async () => {
    const now = Date.now();
    const q = await db.collection('slack_update')
        .where('status', '==', 'pending')
        .where('nextAttemptAt', '<=', admin.firestore.Timestamp.fromMillis(now))
        .orderBy('nextAttemptAt', 'asc')
        .limit(100)
        .get();
    for (const doc of q.docs) {
        const id = doc.id;
        const d = doc.data();
        const { channel, ts, text, blocks } = d.job || {};
        try {
            // 채널 스로틀링
            try {
                await acquireToken(channel);
            }
            catch (e) {
                const throttleDoc = (await db.collection('throttle').doc(channel).get()).data() || {};
                const tokens = typeof throttleDoc?.tokens === 'number' ? throttleDoc.tokens : 0;
                const refill = typeof throttleDoc?.refillPerSec === 'number' ? throttleDoc.refillPerSec : RATE_REFILL_PER_SEC;
                const waitSec = Math.max(1, Math.ceil((1 - tokens) / refill));
                await doc.ref.update({
                    nextAttemptAt: admin.firestore.Timestamp.fromMillis(Date.now() + waitSec * 1000)
                });
                continue;
            }
            await doc.ref.update({ status: 'sending' });
            const resp = await slackApi('chat.update', { channel, ts, text, blocks });
            if (resp?.ok) {
                await doc.ref.update({
                    status: 'sent',
                    sentAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
            else {
                const attempts = (d.attempts || 0) + 1;
                const retryHdr = Number(resp?.retry_after || 0);
                const baseDelay = retryHdr > 0 ? retryHdr : Math.pow(2, attempts) * 10; // 10s,20s,40s...
                const delaySec = Math.min(600, baseDelay); // 최대 10분
                const maxAttempts = Number(cfg?.update?.retry_max_attempts || process.env.UPDATE_RETRY_MAX_ATTEMPTS || 8);
                if (attempts >= maxAttempts) {
                    await doc.ref.update({
                        status: 'failed',
                        attempts,
                        lastError: resp?.error || 'update_failed'
                    });
                }
                else {
                    await doc.ref.update({
                        status: 'pending',
                        attempts,
                        nextAttemptAt: admin.firestore.Timestamp.fromMillis(Date.now() + delaySec * 1000)
                    });
                }
            }
        }
        catch (e) {
            await doc.ref.update({ status: 'failed', lastError: String(e) });
        }
    }
    return null;
});
// 웹훅 재시도 워커 (미국 리전 백업)
exports.webhookRetryWorker = functions
    .region('us-central1')
    .pubsub.schedule('every 1 minutes')
    .timeZone('Asia/Seoul')
    .onRun(async () => {
    const now = Date.now();
    const q = await db.collection('webhook_retry')
        .where('status', '==', 'pending')
        .where('nextAttemptAt', '<=', admin.firestore.Timestamp.fromMillis(now))
        .orderBy('nextAttemptAt', 'asc')
        .limit(50)
        .get();
    for (const doc of q.docs) {
        const id = doc.id;
        const d = doc.data();
        try {
            await doc.ref.update({ status: 'sending' });
            const sent = await postWithFailover(N8N_WEBHOOK_APPROVED, N8N_WEBHOOK_APPROVED_FO, d.payload);
            if (sent.ok) {
                await doc.ref.update({
                    status: 'sent',
                    sentAt: admin.firestore.FieldValue.serverTimestamp(),
                    target: sent.target
                });
            }
            else {
                const attempts = (d.attempts || 0) + 1;
                if (attempts >= RETRY_MAX_ATTEMPTS) {
                    await doc.ref.update({
                        status: 'failed',
                        attempts,
                        lastError: 'deliver_failed'
                    });
                }
                else {
                    const delaySec = Math.min(3600, Math.pow(2, attempts) * 60); // 1m,2m,4m,...,max 1h
                    await doc.ref.update({
                        status: 'pending',
                        attempts,
                        nextAttemptAt: admin.firestore.Timestamp.fromMillis(Date.now() + delaySec * 1000)
                    });
                }
            }
        }
        catch (e) {
            await doc.ref.update({ status: 'failed', lastError: String(e) });
        }
    }
    return null;
});
// 만료 타이머 워커
exports.approvalExpiryWorker = functions
    .region('asia-northeast3')
    .pubsub.schedule('every 5 minutes')
    .timeZone('Asia/Seoul')
    .onRun(async () => {
    const now = Date.now();
    const warnThreshold = now + (APPROVAL_EXPIRY_WARN_MINUTES * 60 * 1000);
    // 만료 임박 경고
    const warnQuery = await db.collection('approvals')
        .where('status', 'in', ['pending', 'partially_approved'])
        .where('expireAt', '<=', admin.firestore.Timestamp.fromMillis(warnThreshold))
        .where('expireAt', '>', admin.firestore.Timestamp.fromMillis(now))
        .limit(50)
        .get();
    for (const doc of warnQuery.docs) {
        const data = doc.data();
        if (data.channel && data.ts) {
            const blocks = [
                ...buildBlocks({
                    title: data.title,
                    summary: data.summary,
                    url: data.url,
                    image: data.image,
                    type: data.type,
                    refId: data.refId,
                    docId: doc.id,
                    required: data.required,
                    approvers: data.approvers,
                    status: data.status
                }),
                {
                    type: 'context',
                    elements: [{
                            type: 'mrkdwn',
                            text: `⏳ *만료 임박* • <!date^${Math.floor(data.expireAt.toMillis() / 1000)}^{time_secs}|expires soon>`
                        }]
                }
            ];
            await enqueueSlackUpdate({
                channel: data.channel,
                ts: data.ts,
                text: `${data.title} (만료 임박)`,
                blocks
            });
        }
    }
    // 만료된 항목 처리
    const expiredQuery = await db.collection('approvals')
        .where('status', 'in', ['pending', 'partially_approved'])
        .where('expireAt', '<=', admin.firestore.Timestamp.fromMillis(now))
        .limit(50)
        .get();
    for (const doc of expiredQuery.docs) {
        const data = doc.data();
        await doc.ref.update({
            status: 'expired',
            expiredAt: admin.firestore.FieldValue.serverTimestamp()
        });
        if (data.channel && data.ts) {
            const blocks = [
                ...buildBlocks({
                    title: data.title,
                    summary: data.summary,
                    url: data.url,
                    image: data.image,
                    type: data.type,
                    refId: data.refId,
                    docId: doc.id,
                    required: data.required,
                    approvers: data.approvers,
                    status: 'expired'
                }),
                {
                    type: 'context',
                    elements: [{
                            type: 'mrkdwn',
                            text: `⏰ *만료됨* • <!date^${Math.floor(Date.now() / 1000)}^{date_num} {time_secs}|now>`
                        }]
                }
            ];
            await enqueueSlackUpdate({
                channel: data.channel,
                ts: data.ts,
                text: `${data.title} (만료됨)`,
                blocks
            });
        }
    }
    return null;
});
// 실적 카드 자동 갱신 워커
exports.metricsUpdateWorker = functions
    .region('asia-northeast3')
    .pubsub.schedule('every 2 minutes')
    .timeZone('Asia/Seoul')
    .onRun(async () => {
    // metrics/{type}/{refId} 컬렉션 감시
    const metricsQuery = await db.collectionGroup('metrics')
        .where('updatedAt', '>', admin.firestore.Timestamp.fromMillis(Date.now() - 5 * 60 * 1000)) // 최근 5분
        .limit(100)
        .get();
    for (const doc of metricsQuery.docs) {
        const data = doc.data();
        const type = doc.ref.parent.parent?.id;
        const refId = doc.ref.parent.id;
        if (!type || !refId)
            continue;
        // 해당 승인 항목 찾기
        const approvalQuery = await db.collection('approvals')
            .where('type', '==', type)
            .where('refId', '==', refId)
            .where('status', 'in', ['pending', 'partially_approved'])
            .limit(1)
            .get();
        if (approvalQuery.empty)
            continue;
        const approvalDoc = approvalQuery.docs[0];
        const approvalData = approvalDoc.data();
        if (approvalData.channel && approvalData.ts) {
            // 실적 정보로 카드 업데이트
            const blocks = [
                ...buildBlocks({
                    title: approvalData.title,
                    summary: approvalData.summary,
                    url: approvalData.url,
                    image: approvalData.image,
                    type: approvalData.type,
                    refId: approvalData.refId,
                    docId: approvalDoc.id,
                    required: approvalData.required,
                    approvers: approvalData.approvers,
                    status: approvalData.status
                }),
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `📊 *실적 업데이트*\n조회수: ${data.views || 0} • 좋아요: ${data.likes || 0} • 댓글: ${data.comments || 0}`
                    }
                }
            ];
            await enqueueSlackUpdate({
                channel: approvalData.channel,
                ts: approvalData.ts,
                text: `${approvalData.title} (실적 업데이트)`,
                blocks
            });
        }
    }
    return null;
});
// 자동 재상신 워커
exports.autoResubmitWorker = functions
    .region('asia-northeast3')
    .pubsub.schedule('every 10 minutes')
    .timeZone('Asia/Seoul')
    .onRun(async () => {
    const now = Date.now();
    const cooldownMs = APPROVAL_RESUBMIT_COOLDOWN_MINUTES * 60 * 1000;
    // 만료된 항목 중 재상신 가능한 것들 찾기
    const expiredQuery = await db.collection('approvals')
        .where('status', '==', 'expired')
        .where('resubmitCount', '<', APPROVAL_MAX_RESUBMITS)
        .where('expiredAt', '<=', admin.firestore.Timestamp.fromMillis(now - cooldownMs))
        .limit(50)
        .get();
    for (const doc of expiredQuery.docs) {
        const data = doc.data();
        const resubmitCount = (data.resubmitCount || 0) + 1;
        // 재상신 처리
        await doc.ref.update({
            status: 'resubmitted',
            resubmitCount,
            resubmittedAt: admin.firestore.FieldValue.serverTimestamp(),
            // 새로운 만료 시간 설정
            expireAt: admin.firestore.Timestamp.fromMillis(Date.now() + (data.ttlMinutes || APPROVAL_TTL_MINUTES) * 60 * 1000)
        });
        // BigQuery 스트리밍
        await streamToBigQuery(BIGQUERY_TABLE_APPROVALS, {
            docId: doc.id,
            type: data.type,
            refId: data.refId,
            title: data.title,
            status: 'resubmitted',
            action: 'auto_resubmit',
            resubmitCount
        });
        // Slack 카드 업데이트
        if (data.channel && data.ts) {
            const blocks = buildBlocks({
                title: data.title,
                summary: data.summary,
                url: data.url,
                image: data.image,
                type: data.type,
                refId: data.refId,
                docId: doc.id,
                required: data.required,
                approvers: data.approvers,
                status: 'resubmitted',
                stages: data.stages,
                currentStage: data.currentStage,
                resubmitCount,
                maxResubmits: data.maxResubmits
            });
            await enqueueSlackUpdate({
                channel: data.channel,
                ts: data.ts,
                text: `${data.title} (자동 재상신)`,
                blocks
            });
        }
    }
    return null;
});
// 보안 규칙 생성 함수
exports.generateSecurityRules = functions
    .region('asia-northeast3')
    .https.onCall(async (data, context) => {
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }
    const rules = {
        rules: [
            {
                match: '/approvals/{docId}',
                allow: 'if false;' // 클라이언트에서 직접 접근 차단
            },
            {
                match: '/throttle/{channel}',
                allow: 'if false;' // 클라이언트에서 직접 접근 차단
            },
            {
                match: '/throttle_config/{channel}',
                allow: 'if false;' // 클라이언트에서 직접 접근 차단
            },
            {
                match: '/webhook_retry/{docId}',
                allow: 'if false;' // 클라이언트에서 직접 접근 차단
            },
            {
                match: '/slack_update/{docId}',
                allow: 'if false;' // 클라이언트에서 직접 접근 차단
            },
            {
                match: '/metrics/{docId}',
                allow: 'if false;' // 클라이언트에서 직접 접근 차단
            }
        ]
    };
    return rules;
});
// 운영 대시보드 API
app.get('/slack/admin/dashboard', requireInternalKey, async (req, res) => {
    try {
        const [approvals, metrics, throttleStats, queueStats] = await Promise.all([
            // 최근 승인 현황
            db.collection('approvals')
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get()
                .then(snap => snap.docs.map(d => ({ id: d.id, ...d.data() }))),
            // 메트릭
            db.collection('metrics').doc('slack').get().then(snap => snap.data() || {}),
            // 채널별 스로틀링 상태
            db.collection('throttle').get().then(snap => snap.docs.map(d => ({ channel: d.id, ...d.data() }))),
            // 큐 상태
            Promise.all([
                db.collection('webhook_retry').where('status', '==', 'pending').count().get(),
                db.collection('webhook_retry').where('status', '==', 'failed').count().get(),
                db.collection('slack_update').where('status', '==', 'pending').count().get(),
                db.collection('slack_update').where('status', '==', 'failed').count().get()
            ]).then(([retryPending, retryFailed, updatePending, updateFailed]) => ({
                webhook_retry: { pending: retryPending.data().count, failed: retryFailed.data().count },
                slack_update: { pending: updatePending.data().count, failed: updateFailed.data().count }
            }))
        ]);
        res.json({
            ok: true,
            data: {
                approvals,
                metrics,
                throttleStats,
                queueStats,
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Dashboard API error:', error);
        res.status(500).json({ ok: false, error: String(error) });
    }
});
// 채널별 스로틀링 설정 업데이트
app.post('/slack/admin/throttle/:channel', requireInternalKey, async (req, res) => {
    try {
        const { channel } = req.params;
        const { capacity, refillPerSec } = req.body;
        if (!capacity || !refillPerSec) {
            return res.status(400).json({ ok: false, error: 'capacity and refillPerSec required' });
        }
        await db.collection('throttle_config').doc(channel).set({
            capacity: Number(capacity),
            refillPerSec: Number(refillPerSec),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({ ok: true, message: 'Throttle config updated' });
    }
    catch (error) {
        console.error('Throttle config error:', error);
        res.status(500).json({ ok: false, error: String(error) });
    }
});
// 큐 재시도 강제 실행
app.post('/slack/admin/retry/:queue', requireInternalKey, async (req, res) => {
    try {
        const { queue } = req.params;
        const { limit = 10 } = req.body;
        if (!['webhook_retry', 'slack_update'].includes(queue)) {
            return res.status(400).json({ ok: false, error: 'Invalid queue name' });
        }
        const now = Date.now();
        const q = await db.collection(queue)
            .where('status', '==', 'pending')
            .where('nextAttemptAt', '<=', admin.firestore.Timestamp.fromMillis(now))
            .orderBy('nextAttemptAt', 'asc')
            .limit(Number(limit))
            .get();
        let processed = 0;
        for (const doc of q.docs) {
            try {
                await doc.ref.update({
                    status: 'pending',
                    nextAttemptAt: admin.firestore.Timestamp.fromMillis(Date.now())
                });
                processed++;
            }
            catch (e) {
                console.error('Retry error:', e);
            }
        }
        res.json({ ok: true, processed, total: q.size });
    }
    catch (error) {
        console.error('Retry error:', error);
        res.status(500).json({ ok: false, error: String(error) });
    }
});
// 단건 조회
app.get('/slack/admin/approval/:docId', requireInternalKey, async (req, res) => {
    try {
        const { docId } = req.params;
        const docRef = db.collection('approvals').doc(docId);
        const snap = await docRef.get();
        if (!snap.exists) {
            return res.status(404).json({ ok: false, error: 'Document not found' });
        }
        const data = snap.data();
        res.json({ ok: true, data: { id: docId, ...data } });
    }
    catch (error) {
        console.error('Get approval error:', error);
        res.status(500).json({ ok: false, error: String(error) });
    }
});
// 수동 승인
app.post('/slack/admin/approve/:docId', requireInternalKey, async (req, res) => {
    try {
        const { docId } = req.params;
        const { userId, userName } = req.body;
        if (!userId) {
            return res.status(400).json({ ok: false, error: 'userId required' });
        }
        const docRef = db.collection('approvals').doc(docId);
        const snap = await docRef.get();
        if (!snap.exists) {
            return res.status(404).json({ ok: false, error: 'Document not found' });
        }
        const data = snap.data();
        if (!['pending', 'partially_approved'].includes(data.status)) {
            return res.status(400).json({ ok: false, error: 'Can only approve pending or partially approved items' });
        }
        // 트랜잭션으로 승인 처리
        const result = await db.runTransaction(async (tx) => {
            const snap = await tx.get(docRef);
            if (!snap.exists)
                return { done: false, reason: 'not_found' };
            const d = snap.data();
            if (!['pending', 'partially_approved'].includes(d.status))
                return { done: false, reason: 'finalized' };
            if (!canApprove(userId, d))
                return { done: false, reason: 'forbidden' };
            const already = (d.approvers || []).some((a) => a.userId === userId);
            if (already)
                return { done: false, reason: 'duplicate' };
            const approvers = [...(d.approvers || []), { userId, userName: userName || userId, at: admin.firestore.FieldValue.serverTimestamp() }];
            const required = Number(d.required || 1);
            const reached = approvers.length >= required;
            const newStatus = reached ? 'approved' : 'partially_approved';
            const patch = { approvers, status: newStatus };
            if (reached)
                patch.approvedAt = admin.firestore.FieldValue.serverTimestamp();
            tx.update(docRef, patch);
            return { done: true, reached, approvers, required, d };
        });
        if (!result.done) {
            return res.status(400).json({ ok: false, error: result.reason });
        }
        // n8n 웹훅 호출 (승인 완료 시)
        if (result.reached) {
            const body = { docId, type: data.type, refId: data.refId, payload: data.payload };
            const sent = await postWithFailover(N8N_WEBHOOK_APPROVED, N8N_WEBHOOK_APPROVED_FO, body);
            if (!sent.ok)
                await enqueueWebhook(body);
        }
        // Slack 카드 업데이트
        if (data.channel && data.ts) {
            const progress = result.reached
                ? `✅ 승인 완료 • ${result.approvers.length}/${result.required}`
                : `진행중 • ${result.approvers.length}/${result.required} (by @${userName || userId})`;
            const approverList = (result.approvers || []).map(a => `<@${a.userId}>`).join(', ');
            const blocks = [
                ...buildBlocks({
                    title: data.title,
                    summary: data.summary,
                    url: data.url,
                    image: data.image,
                    type: data.type,
                    refId: data.refId,
                    docId,
                    required: data.required,
                    approvers: result.approvers,
                    status: result.reached ? 'approved' : 'partially_approved'
                }),
                { type: 'context', elements: [{ type: 'mrkdwn', text: progress }] },
                { type: 'context', elements: [{ type: 'mrkdwn', text: `승인자: ${approverList || '-'}` }] }
            ];
            await enqueueSlackUpdate({
                channel: data.channel,
                ts: data.ts,
                text: `${data.title} (${result.reached ? '승인됨' : '진행중'})`,
                blocks
            });
        }
        res.json({ ok: true, message: 'Approval processed successfully', reached: result.reached });
    }
    catch (error) {
        console.error('Manual approve error:', error);
        res.status(500).json({ ok: false, error: String(error) });
    }
});
// 수동 반려
app.post('/slack/admin/reject/:docId', requireInternalKey, async (req, res) => {
    try {
        const { docId } = req.params;
        const { userId, userName, reason } = req.body;
        if (!userId) {
            return res.status(400).json({ ok: false, error: 'userId required' });
        }
        const docRef = db.collection('approvals').doc(docId);
        const snap = await docRef.get();
        if (!snap.exists) {
            return res.status(404).json({ ok: false, error: 'Document not found' });
        }
        const data = snap.data();
        if (!['pending', 'partially_approved'].includes(data.status)) {
            return res.status(400).json({ ok: false, error: 'Can only reject pending or partially approved items' });
        }
        await docRef.update({
            status: 'rejected',
            rejectedBy: userId,
            rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
            rejectedReason: reason || 'Manual rejection via admin API'
        });
        // Slack 카드 업데이트
        if (data.channel && data.ts) {
            const blocks = [
                ...buildBlocks({
                    title: data.title,
                    summary: data.summary,
                    url: data.url,
                    image: data.image,
                    type: data.type,
                    refId: data.refId,
                    docId,
                    required: data.required,
                    approvers: data.approvers || [],
                    status: 'rejected'
                }),
                { type: 'section', text: { type: 'mrkdwn', text: `*반려 사유*\n>${reason || '사유 없음'}` } },
                { type: 'context', elements: [{ type: 'mrkdwn', text: `🚫 *반려됨* by @${userName || userId} • <!date^${Math.floor(Date.now() / 1000)}^{date_num} {time_secs}|now>` }] }
            ];
            await enqueueSlackUpdate({
                channel: data.channel,
                ts: data.ts,
                text: `${data.title} (반려됨)`,
                blocks
            });
        }
        res.json({ ok: true, message: 'Rejection processed successfully' });
    }
    catch (error) {
        console.error('Manual reject error:', error);
        res.status(500).json({ ok: false, error: String(error) });
    }
});
// 즉시 재상신
app.post('/slack/admin/resubmit/:docId', requireInternalKey, async (req, res) => {
    try {
        const { docId } = req.params;
        const docRef = db.collection('approvals').doc(docId);
        const snap = await docRef.get();
        if (!snap.exists) {
            return res.status(404).json({ ok: false, error: 'Document not found' });
        }
        const data = snap.data();
        if (!['rejected', 'expired'].includes(data.status)) {
            return res.status(400).json({ ok: false, error: 'Can only resubmit rejected or expired items' });
        }
        // 재상신 처리
        await docRef.update({
            status: 'pending',
            approvers: [],
            rejectedBy: admin.firestore.FieldValue.delete(),
            rejectedAt: admin.firestore.FieldValue.delete(),
            rejectedReason: admin.firestore.FieldValue.delete(),
            expiredAt: admin.firestore.FieldValue.delete(),
            resubmitCount: admin.firestore.FieldValue.increment(1),
            resubmittedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Slack 카드 업데이트
        if (data.channel && data.ts) {
            const blocks = buildBlocks({
                title: data.title,
                summary: data.summary,
                url: data.url,
                image: data.image,
                type: data.type,
                refId: data.refId,
                docId,
                required: data.required,
                approvers: [],
                status: 'pending'
            });
            await enqueueSlackUpdate({
                channel: data.channel,
                ts: data.ts,
                text: `${data.title} (재상신됨)`,
                blocks
            });
        }
        res.json({ ok: true, message: 'Resubmission processed successfully' });
    }
    catch (error) {
        console.error('Manual resubmit error:', error);
        res.status(500).json({ ok: false, error: String(error) });
    }
});
// 승인 항목 재오픈
app.post('/slack/admin/reopen/:docId', requireInternalKey, async (req, res) => {
    try {
        const { docId } = req.params;
        const docRef = db.collection('approvals').doc(docId);
        const snap = await docRef.get();
        if (!snap.exists) {
            return res.status(404).json({ ok: false, error: 'Document not found' });
        }
        const data = snap.data();
        if (!['rejected', 'expired'].includes(data.status)) {
            return res.status(400).json({ ok: false, error: 'Can only reopen rejected or expired items' });
        }
        await docRef.update({
            status: 'pending',
            approvers: [],
            rejectedBy: admin.firestore.FieldValue.delete(),
            rejectedAt: admin.firestore.FieldValue.delete(),
            rejectedReason: admin.firestore.FieldValue.delete(),
            expiredAt: admin.firestore.FieldValue.delete(),
            reopenedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        // Slack 카드 업데이트
        if (data.channel && data.ts) {
            const blocks = buildBlocks({
                title: data.title,
                summary: data.summary,
                url: data.url,
                image: data.image,
                type: data.type,
                refId: data.refId,
                docId,
                required: data.required,
                approvers: [],
                status: 'pending'
            });
            await enqueueSlackUpdate({
                channel: data.channel,
                ts: data.ts,
                text: `${data.title} (재오픈됨)`,
                blocks
            });
        }
        res.json({ ok: true, message: 'Item reopened successfully' });
    }
    catch (error) {
        console.error('Reopen error:', error);
        res.status(500).json({ ok: false, error: String(error) });
    }
});
// Slack App Home 탭 - 내 승인 인박스
app.post('/slack/app-home', verifySlack, async (req, res) => {
    try {
        const { user } = req.body;
        const userId = user?.id;
        if (!userId) {
            return res.status(400).send('User ID required');
        }
        // 사용자와 관련된 승인 항목들 조회
        const [myApprovals, pendingApprovals] = await Promise.all([
            // 내가 승인한 항목들
            db.collection('approvals')
                .where('approvers', 'array-contains-any', [{ userId }])
                .orderBy('createdAt', 'desc')
                .limit(20)
                .get()
                .then(snap => snap.docs.map(d => ({ id: d.id, ...d.data() }))),
            // 내가 승인할 수 있는 대기 중인 항목들
            db.collection('approvals')
                .where('status', 'in', ['pending', 'partially_approved'])
                .orderBy('createdAt', 'desc')
                .limit(20)
                .get()
                .then(snap => snap.docs.map(d => ({ id: d.id, ...d.data() })))
        ]);
        // App Home 뷰 생성
        const view = {
            type: 'home',
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: '📋 내 승인 인박스'
                    }
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `안녕하세요! <@${userId}>님의 승인 현황입니다.`
                    }
                },
                {
                    type: 'divider'
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*🔄 대기 중인 승인 (${pendingApprovals.length}건)*`
                    }
                }
            ]
        };
        // 대기 중인 승인 항목들 추가
        if (pendingApprovals.length > 0) {
            pendingApprovals.forEach((item) => {
                const progress = `${item.approvers?.length || 0}/${item.required || 1}`;
                view.blocks.push({
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*${item.title}*\n${item.summary || ''}\n진행: ${progress} • <!date^${Math.floor((item.createdAt?.toDate?.() || new Date()).getTime() / 1000)}^{date_num} {time_secs}|${item.createdAt?.toDate?.() || new Date()}>`
                    },
                    accessory: {
                        type: 'button',
                        text: {
                            type: 'plain_text',
                            text: '승인하기'
                        },
                        style: 'primary',
                        action_id: 'approve_from_home',
                        value: item.id
                    }
                });
            });
        }
        else {
            view.blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: '대기 중인 승인이 없습니다. ✅'
                }
            });
        }
        view.blocks.push({ type: 'divider' }, {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*✅ 내가 승인한 항목 (${myApprovals.length}건)*`
            }
        });
        // 내가 승인한 항목들 추가
        if (myApprovals.length > 0) {
            myApprovals.slice(0, 10).forEach((item) => {
                const status = item.status === 'approved' ? '✅ 승인됨' :
                    item.status === 'rejected' ? '❌ 반려됨' :
                        item.status === 'expired' ? '⏰ 만료됨' : '🔄 진행중';
                view.blocks.push({
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*${item.title}*\n${status} • <!date^${Math.floor((item.createdAt?.toDate?.() || new Date()).getTime() / 1000)}^{date_num} {time_secs}|${item.createdAt?.toDate?.() || new Date()}>`
                    }
                });
            });
        }
        else {
            view.blocks.push({
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text: '아직 승인한 항목이 없습니다.'
                }
            });
        }
        // App Home 업데이트
        await slackApi('views.publish', {
            user_id: userId,
            view
        });
        res.status(200).send('App Home updated');
    }
    catch (error) {
        console.error('App Home error:', error);
        res.status(500).send('Error updating App Home');
    }
});
// App Home에서 승인 처리
app.post('/slack/app-home-action', verifySlack, async (req, res) => {
    try {
        const payload = JSON.parse(req.body.payload);
        const { action, user } = payload;
        if (action?.action_id === 'approve_from_home') {
            const docId = action.value;
            const userId = user.id;
            const userName = user.username || user.name || userId;
            const docRef = db.collection('approvals').doc(docId);
            const snap = await docRef.get();
            if (!snap.exists) {
                return res.status(200).send('이미 처리되었거나 존재하지 않습니다');
            }
            const data = snap.data();
            // 승인 처리 (기존 로직과 동일)
            const result = await db.runTransaction(async (tx) => {
                const snap = await tx.get(docRef);
                if (!snap.exists)
                    return { done: false, reason: 'not_found' };
                const d = snap.data();
                if (!['pending', 'partially_approved'].includes(d.status))
                    return { done: false, reason: 'finalized' };
                if (!canApprove(userId, d))
                    return { done: false, reason: 'forbidden' };
                const already = (d.approvers || []).some((a) => a.userId === userId);
                if (already)
                    return { done: false, reason: 'duplicate' };
                const approvers = [...(d.approvers || []), { userId, userName, at: admin.firestore.FieldValue.serverTimestamp() }];
                const required = Number(d.required || 1);
                const reached = approvers.length >= required;
                const newStatus = reached ? 'approved' : 'partially_approved';
                const patch = { approvers, status: newStatus };
                if (reached)
                    patch.approvedAt = admin.firestore.FieldValue.serverTimestamp();
                tx.update(docRef, patch);
                return { done: true, reached, approvers, required, d };
            });
            if (!result.done) {
                return res.status(200).send('승인 처리 실패');
            }
            // n8n 웹훅 호출 (승인 완료 시)
            if (result.reached) {
                const body = { docId, type: data.type, refId: data.refId, payload: data.payload };
                const sent = await postWithFailover(N8N_WEBHOOK_APPROVED, N8N_WEBHOOK_APPROVED_FO, body);
                if (!sent.ok)
                    await enqueueWebhook(body);
            }
            // App Home 새로고침
            await slackApi('views.publish', {
                user_id: userId,
                view: {
                    type: 'home',
                    blocks: [
                        {
                            type: 'section',
                            text: {
                                type: 'mrkdwn',
                                text: `✅ 승인 처리 완료!\n*${data.title}*`
                            }
                        }
                    ]
                }
            });
            return res.status(200).send('승인 처리 완료');
        }
        res.status(200).send('Unknown action');
    }
    catch (error) {
        console.error('App Home action error:', error);
        res.status(500).send('Error processing action');
    }
});
// 일일 집계 워커
exports.dailyStatsWorker = functions
    .region('asia-northeast3')
    .pubsub.schedule('every day at 01:00')
    .timeZone('Asia/Seoul')
    .onRun(async () => {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startTime = admin.firestore.Timestamp.fromDate(yesterday);
        const endTime = admin.firestore.Timestamp.fromDate(today);
        // 승인 통계 수집
        const approvals = await db.collection('approvals')
            .where('createdAt', '>=', startTime)
            .where('createdAt', '<', endTime)
            .get();
        const stats = {
            date: yesterday.toISOString().split('T')[0],
            total: approvals.size,
            pending: 0,
            approved: 0,
            rejected: 0,
            expired: 0,
            partially_approved: 0,
            byType: {},
            byStatus: {},
            avgApprovalTime: 0,
            resubmitCount: 0
        };
        let totalApprovalTime = 0;
        let completedCount = 0;
        approvals.forEach(doc => {
            const data = doc.data();
            const status = data.status || 'pending';
            // 상태별 카운트
            stats[status] = (stats[status] || 0) + 1;
            // 타입별 카운트
            const type = data.type || 'unknown';
            stats.byType[type] = (stats.byType[type] || 0) + 1;
            // 재상신 카운트
            if (data.resubmitCount) {
                stats.resubmitCount += data.resubmitCount;
            }
            // 승인 시간 계산
            if (data.approvedAt && data.createdAt) {
                const created = data.createdAt.toDate();
                const approved = data.approvedAt.toDate();
                const diffMs = approved.getTime() - created.getTime();
                totalApprovalTime += diffMs;
                completedCount++;
            }
        });
        if (completedCount > 0) {
            stats.avgApprovalTime = Math.round(totalApprovalTime / completedCount / 1000); // 초 단위
        }
        // 메트릭 통계 수집
        const metrics = await db.collection('metrics').doc('slack').get();
        const metricsData = metrics.data() || {};
        stats.metrics = {
            okCount: metricsData.okCount || 0,
            errCount: metricsData.errCount || 0,
            successRate: metricsData.okCount && metricsData.errCount
                ? Math.round((metricsData.okCount / (metricsData.okCount + metricsData.errCount)) * 100)
                : 100
        };
        // 큐 통계 수집
        const [webhookRetry, slackUpdate] = await Promise.all([
            db.collection('webhook_retry').where('createdAt', '>=', startTime).where('createdAt', '<', endTime).get(),
            db.collection('slack_update').where('createdAt', '>=', startTime).where('createdAt', '<', endTime).get()
        ]);
        stats.queues = {
            webhook_retry: {
                total: webhookRetry.size,
                pending: webhookRetry.docs.filter(d => d.data().status === 'pending').length,
                failed: webhookRetry.docs.filter(d => d.data().status === 'failed').length,
                sent: webhookRetry.docs.filter(d => d.data().status === 'sent').length
            },
            slack_update: {
                total: slackUpdate.size,
                pending: slackUpdate.docs.filter(d => d.data().status === 'pending').length,
                failed: slackUpdate.docs.filter(d => d.data().status === 'failed').length,
                sent: slackUpdate.docs.filter(d => d.data().status === 'sent').length
            }
        };
        // 일일 통계 저장
        await db.collection('ops_stats').doc('daily').collection('stats').doc(stats.date).set({
            ...stats,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            processedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Daily stats processed for ${stats.date}:`, stats);
        // BigQuery 스트리밍
        await streamToBigQuery('daily_stats', stats);
    }
    catch (error) {
        console.error('Daily stats worker error:', error);
    }
});
// 일일 통계 조회 API
app.get('/slack/admin/stats/daily', requireInternalKey, async (req, res) => {
    try {
        const { startDate, endDate, limit = 30 } = req.query;
        let query = db.collection('ops_stats').doc('daily').collection('stats').orderBy('date', 'desc');
        if (startDate) {
            query = query.where('date', '>=', startDate);
        }
        if (endDate) {
            query = query.where('date', '<=', endDate);
        }
        const snap = await query.limit(Number(limit)).get();
        const stats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json({ ok: true, data: stats });
    }
    catch (error) {
        console.error('Daily stats API error:', error);
        res.status(500).json({ ok: false, error: String(error) });
    }
});
// 실시간 통계 조회 API
app.get('/slack/admin/stats/realtime', requireInternalKey, async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startTime = admin.firestore.Timestamp.fromDate(today);
        // 오늘 승인 통계
        const approvals = await db.collection('approvals')
            .where('createdAt', '>=', startTime)
            .get();
        const stats = {
            today: {
                total: approvals.size,
                pending: 0,
                approved: 0,
                rejected: 0,
                expired: 0,
                partially_approved: 0
            },
            byType: {},
            byHour: {}
        };
        approvals.forEach(doc => {
            const data = doc.data();
            const status = data.status || 'pending';
            const type = data.type || 'unknown';
            const hour = data.createdAt?.toDate()?.getHours() || 0;
            stats.today[status] = (stats.today[status] || 0) + 1;
            stats.byType[type] = (stats.byType[type] || 0) + 1;
            stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
        });
        // 큐 상태
        const [webhookRetry, slackUpdate] = await Promise.all([
            db.collection('webhook_retry').where('status', '==', 'pending').count().get(),
            db.collection('slack_update').where('status', '==', 'pending').count().get()
        ]);
        stats.queues = {
            webhook_retry: { pending: webhookRetry.data().count },
            slack_update: { pending: slackUpdate.data().count }
        };
        res.json({ ok: true, data: stats });
    }
    catch (error) {
        console.error('Realtime stats API error:', error);
        res.status(500).json({ ok: false, error: String(error) });
    }
});
// 규칙 시뮬레이터 API
app.post('/slack/admin/rules/simulate', requireInternalKeySecure, async (req, res) => {
    try {
        const { type, priority, testData } = req.body || {};
        // 규칙 로드
        const rules = await loadApprovalRules(type, priority);
        // 시뮬레이션 데이터 생성
        const simulation = {
            type: type || 'default',
            priority: priority || 'normal',
            rules: {
                required: rules.defaultRequired,
                ttlMinutes: rules.defaultTtlMinutes,
                stages: rules.stages || [],
                approverAllowlist: rules.typeRules?.[type]?.approverAllowlist || null,
                maxResubmits: rules.typeRules?.[type]?.maxResubmits || rules.defaultMaxResubmits || 3,
                resubmitCooldownMinutes: rules.typeRules?.[type]?.resubmitCooldownMinutes || rules.defaultResubmitCooldownMinutes || 60
            },
            testScenario: {
                title: testData?.title || '테스트 승인 요청',
                summary: testData?.summary || '시뮬레이션용 승인 요청입니다',
                type: type || 'test',
                refId: testData?.refId || `test-${Date.now()}`,
                approvers: rules.stages?.map((stage, index) => ({
                    stage: index + 1,
                    name: stage.name,
                    required: stage.required,
                    approvers: stage.approvers || [],
                    dmTargets: stage.dmTargets || []
                })) || []
            },
            preview: {
                slackMessage: buildBlocks({
                    title: testData?.title || '테스트 승인 요청',
                    summary: testData?.summary || '시뮬레이션용 승인 요청입니다',
                    type: type || 'test',
                    refId: testData?.refId || `test-${Date.now()}`,
                    required: rules.defaultRequired,
                    stages: rules.stages
                }),
                dmMessages: rules.stages?.map((stage, index) => ({
                    stage: index + 1,
                    name: stage.name,
                    message: `${NOTIFY_DM_PREFIX} ${testData?.title || '테스트 승인 요청'}\n\n새로운 승인 단계가 시작되었습니다: ${stage.name}\n승인이 필요합니다.`,
                    targets: stage.dmTargets || []
                })) || []
            }
        };
        res.json({ ok: true, simulation });
    }
    catch (error) {
        console.error('Rules simulation error:', error);
        res.status(500).json({ ok: false, error: String(error) });
    }
});
// 규칙 테스트 실행 API
app.post('/slack/admin/rules/test', requireInternalKeySecure, async (req, res) => {
    try {
        const { type, priority, testData, dryRun = true } = req.body || {};
        if (!dryRun) {
            // 실제 테스트 실행 (DM 전송 없이)
            const rules = await loadApprovalRules(type, priority);
            const testChannel = process.env.SLACK_TEST_CHANNEL || SLACK_APPROVER_CHANNEL;
            const testDoc = {
                status: 'pending',
                type: type || 'test',
                refId: testData?.refId || `test-${Date.now()}`,
                title: testData?.title || '규칙 테스트',
                summary: testData?.summary || '시뮬레이션용 승인 요청입니다',
                required: rules.defaultRequired,
                stages: rules.stages,
                approverAllowlist: rules.typeRules?.[type]?.approverAllowlist || null,
                maxResubmits: rules.typeRules?.[type]?.maxResubmits || rules.defaultMaxResubmits || 3,
                resubmitCooldownMinutes: rules.typeRules?.[type]?.resubmitCooldownMinutes || rules.defaultResubmitCooldownMinutes || 60,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };
            // 테스트 문서 생성
            const docRef = await db.collection('approvals').add(testDoc);
            // Slack 메시지 전송
            const blocks = buildBlocks({
                ...testDoc,
                docId: docRef.id
            });
            const post = await slackApi('chat.postMessage', {
                channel: testChannel,
                text: testDoc.title,
                blocks
            });
            if (post?.ok) {
                await docRef.update({
                    channel: post.channel,
                    ts: post.ts,
                    testMode: true
                });
            }
            res.json({
                ok: true,
                testDocId: docRef.id,
                channel: post.channel,
                ts: post.ts,
                message: '테스트 승인 요청이 생성되었습니다'
            });
        }
        else {
            // 드라이런 모드 - 시뮬레이션만
            const rules = await loadApprovalRules(type, priority);
            const simulation = {
                type: type || 'default',
                priority: priority || 'normal',
                rules: {
                    required: rules.defaultRequired,
                    ttlMinutes: rules.defaultTtlMinutes,
                    stages: rules.stages || [],
                    approverAllowlist: rules.typeRules?.[type]?.approverAllowlist || null
                }
            };
            res.json({
                ok: true,
                simulation,
                message: '드라이런 모드: 실제 전송 없이 시뮬레이션만 실행됨'
            });
        }
    }
    catch (error) {
        console.error('Rules test error:', error);
        res.status(500).json({ ok: false, error: String(error) });
    }
});
// 워크스페이스 등록 API
app.post('/slack/admin/workspaces/set', requireInternalKeySecure, async (req, res) => {
    try {
        const { teamId, botToken, defaultChannel, locale = 'ko', enabled = true } = req.body || {};
        if (!teamId || !botToken || !defaultChannel) {
            return res.status(400).json({ ok: false, error: 'teamId, botToken, defaultChannel are required' });
        }
        const { WorkspaceManager } = await Promise.resolve().then(() => __importStar(require('./workspace')));
        await WorkspaceManager.setWorkspace({
            teamId,
            botToken,
            defaultChannel,
            locale,
            enabled
        });
        res.json({
            ok: true,
            message: '워크스페이스가 등록되었습니다',
            teamId,
            locale,
            enabled
        });
    }
    catch (error) {
        console.error('Workspace registration error:', error);
        res.status(500).json({ ok: false, error: String(error) });
    }
});
// 워크스페이스 목록 조회 API
app.get('/slack/admin/workspaces', requireInternalKeySecure, async (req, res) => {
    try {
        const { WorkspaceManager } = await Promise.resolve().then(() => __importStar(require('./workspace')));
        const workspaces = await WorkspaceManager.listWorkspaces();
        res.json({
            ok: true,
            workspaces: workspaces.map(w => ({
                teamId: w.teamId,
                defaultChannel: w.defaultChannel,
                locale: w.locale,
                enabled: w.enabled,
                createdAt: w.createdAt,
                updatedAt: w.updatedAt
            }))
        });
    }
    catch (error) {
        console.error('Workspace list error:', error);
        res.status(500).json({ ok: false, error: String(error) });
    }
});
// 실험 집계 API
app.get('/slack/admin/experiments/:experimentId/stats', requireInternalKeySecure, async (req, res) => {
    try {
        const { experimentId } = req.params;
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const { AnalyticsManager } = await Promise.resolve().then(() => __importStar(require('./analytics')));
        const stats = await AnalyticsManager.getExperimentStats(experimentId, start, end);
        res.json({ ok: true, stats });
    }
    catch (error) {
        console.error('Experiment stats error:', error);
        res.status(500).json({ ok: false, error: String(error) });
    }
});
// CTR 통계 API
app.get('/slack/admin/analytics/ctr', requireInternalKeySecure, async (req, res) => {
    try {
        const { teamId, startDate, endDate } = req.query;
        if (!teamId) {
            return res.status(400).json({ ok: false, error: 'teamId is required' });
        }
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        const { AnalyticsManager } = await Promise.resolve().then(() => __importStar(require('./analytics')));
        const ctr = await AnalyticsManager.calculateCTR(teamId, start, end);
        res.json({ ok: true, ctr });
    }
    catch (error) {
        console.error('CTR stats error:', error);
        res.status(500).json({ ok: false, error: String(error) });
    }
});
// Ops 경보 워커
exports.opsAlertWorker = functions
    .region('asia-northeast3')
    .pubsub.schedule('every 5 minutes')
    .timeZone('Asia/Seoul')
    .onRun(async () => {
    try {
        if (!OPS_ALERT_CHANNEL) {
            logWarn('Ops alert channel not configured');
            return;
        }
        const now = Date.now();
        const fiveMinutesAgo = now - 5 * 60 * 1000;
        // 큐 상태 확인
        const [webhookRetry, slackUpdate, recentErrors] = await Promise.all([
            db.collection('webhook_retry').where('status', '==', 'pending').count().get(),
            db.collection('slack_update').where('status', '==', 'pending').count().get(),
            db.collection('webhook_retry')
                .where('status', '==', 'failed')
                .where('createdAt', '>=', admin.firestore.Timestamp.fromMillis(fiveMinutesAgo))
                .count().get()
        ]);
        const webhookPending = webhookRetry.data().count;
        const slackPending = slackUpdate.data().count;
        const recentFailures = recentErrors.data().count;
        // 경보 조건 확인
        const alerts = [];
        // 웹훅 큐 적체 (100개 이상)
        if (webhookPending > 100) {
            alerts.push({
                type: 'warning',
                title: '웹훅 큐 적체',
                message: `웹훅 재시도 큐에 ${webhookPending}개 항목이 대기 중입니다.`,
                severity: webhookPending > 500 ? 'critical' : 'warning'
            });
        }
        // Slack 업데이트 큐 적체 (200개 이상)
        if (slackPending > 200) {
            alerts.push({
                type: 'warning',
                title: 'Slack 업데이트 큐 적체',
                message: `Slack 업데이트 큐에 ${slackPending}개 항목이 대기 중입니다.`,
                severity: slackPending > 1000 ? 'critical' : 'warning'
            });
        }
        // 최근 실패 급증 (5분 내 10개 이상)
        if (recentFailures > 10) {
            alerts.push({
                type: 'error',
                title: '웹훅 실패 급증',
                message: `최근 5분 내 ${recentFailures}개의 웹훅이 실패했습니다.`,
                severity: recentFailures > 50 ? 'critical' : 'error'
            });
        }
        // 경보 전송
        for (const alert of alerts) {
            const color = alert.severity === 'critical' ? 'danger' :
                alert.severity === 'error' ? 'danger' : 'warning';
            const blocks = [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: `🚨 ${alert.title}`
                    }
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: alert.message
                    }
                },
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: `*시간:* <!date^${Math.floor(now / 1000)}^{date_num} {time_secs}|now>\n*심각도:* ${alert.severity.toUpperCase()}`
                        }
                    ]
                }
            ];
            await slackApi('chat.postMessage', {
                channel: OPS_ALERT_CHANNEL,
                text: `${alert.title}: ${alert.message}`,
                blocks,
                username: 'Ops Alert Bot',
                icon_emoji: ':warning:'
            });
            logWarn('Ops alert sent', {
                type: alert.type,
                severity: alert.severity,
                title: alert.title,
                webhookPending,
                slackPending,
                recentFailures
            });
        }
        // 정상 상태 로그 (경보가 없을 때)
        if (alerts.length === 0) {
            logInfo('Ops health check passed', {
                webhookPending,
                slackPending,
                recentFailures
            });
        }
    }
    catch (error) {
        logError('Ops alert worker failed', error, {
            worker: 'opsAlertWorker'
        });
    }
});
exports.slack = functions.region('asia-northeast3').https.onRequest(app);
