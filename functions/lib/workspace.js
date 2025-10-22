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
exports.WorkspaceManager = void 0;
exports.slackApiW = slackApiW;
exports.buildBlocksI18n = buildBlocksI18n;
exports.rejectModalViewI18n = rejectModalViewI18n;
// 멀티워크스페이스 관리 모듈
const admin = __importStar(require("firebase-admin"));
const i18n_1 = require("./i18n");
const db = admin.firestore();
class WorkspaceManager {
    static async getWorkspace(teamId) {
        // 캐시 확인
        const cached = this.cache.get(teamId);
        const expiry = this.cacheExpiry.get(teamId);
        if (cached && expiry && Date.now() < expiry) {
            return cached;
        }
        // Firestore에서 조회
        const doc = await db.collection('workspaces').doc(teamId).get();
        if (!doc.exists) {
            return null;
        }
        const config = doc.data();
        // 캐시에 저장
        this.cache.set(teamId, config);
        this.cacheExpiry.set(teamId, Date.now() + this.CACHE_TTL);
        return config;
    }
    static async setWorkspace(config) {
        const now = admin.firestore.FieldValue.serverTimestamp();
        await db.collection('workspaces').doc(config.teamId).set({
            ...config,
            createdAt: now,
            updatedAt: now
        }, { merge: true });
        // 캐시 업데이트
        this.cache.set(config.teamId, {
            ...config,
            createdAt: now,
            updatedAt: now
        });
        this.cacheExpiry.set(config.teamId, Date.now() + this.CACHE_TTL);
    }
    static async deleteWorkspace(teamId) {
        await db.collection('workspaces').doc(teamId).delete();
        // 캐시에서 제거
        this.cache.delete(teamId);
        this.cacheExpiry.delete(teamId);
    }
    static async listWorkspaces() {
        const snap = await db.collection('workspaces').get();
        return snap.docs.map(doc => doc.data());
    }
    static clearCache() {
        this.cache.clear();
        this.cacheExpiry.clear();
    }
}
exports.WorkspaceManager = WorkspaceManager;
WorkspaceManager.cache = new Map();
WorkspaceManager.cacheExpiry = new Map();
WorkspaceManager.CACHE_TTL = 5 * 60 * 1000; // 5분
// Slack API 래퍼 (팀별 토큰 사용)
async function slackApiW(teamId, method, body) {
    const workspace = await WorkspaceManager.getWorkspace(teamId);
    if (!workspace) {
        throw new Error(`Workspace not found: ${teamId}`);
    }
    if (!workspace.enabled) {
        throw new Error(`Workspace disabled: ${teamId}`);
    }
    const url = `https://slack.com/api/${method}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Authorization': `Bearer ${workspace.botToken}`,
        },
        body: JSON.stringify(body),
    });
    if (response.status === 429) {
        const retry = Number(response.headers.get('retry-after') || 1);
        return { ok: false, error: 'rate_limited', retry_after: retry };
    }
    const json = await response.json();
    return json;
}
// 다국어 지원 Block Kit 빌더
function buildBlocksI18n(data, teamId) {
    const { title, summary, url, image, type, refId, docId, required, approvers, status, expireAt, stages, currentStage, resubmitCount, maxResubmits } = data;
    const blocks = [
        {
            type: 'header',
            text: {
                type: 'plain_text',
                text: title
            }
        }
    ];
    if (summary) {
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: summary
            }
        });
    }
    if (image) {
        blocks.push({
            type: 'image',
            image_url: image,
            alt_text: title
        });
    }
    if (url) {
        blocks.push({
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `*${(0, i18n_1.t)('approval.request', teamId)}:* <${url}|${(0, i18n_1.t)('approval.request', teamId)}>`
            }
        });
    }
    // 승인 진행 상황
    if (required && required > 1) {
        const progress = approvers ? approvers.length : 0;
        const progressText = status === 'approved'
            ? (0, i18n_1.t)('approval.completed', teamId)
            : status === 'partially_approved'
                ? (0, i18n_1.t)('approval.in_progress', teamId)
                : (0, i18n_1.t)('approval.waiting', teamId);
        blocks.push({
            type: 'context',
            elements: [{
                    type: 'mrkdwn',
                    text: `${progressText} • ${progress}/${required}`
                }]
        });
    }
    // 승인자 목록
    if (approvers && approvers.length > 0) {
        const approverList = approvers.map((a) => `<@${a.userId}>`).join(', ');
        blocks.push({
            type: 'context',
            elements: [{
                    type: 'mrkdwn',
                    text: `${(0, i18n_1.t)('approval.approvers', teamId)}: ${approverList}`
                }]
        });
    }
    // 만료 시간
    if (expireAt) {
        const expireTime = Math.floor(expireAt.toMillis() / 1000);
        blocks.push({
            type: 'context',
            elements: [{
                    type: 'mrkdwn',
                    text: `${(0, i18n_1.t)('approval.expires', teamId)}: <!date^${expireTime}^{date_num} {time_secs}|${expireTime}>`
                }]
        });
    }
    // 액션 버튼
    const actions = [];
    if (status === 'pending' || status === 'partially_approved') {
        actions.push({
            type: 'button',
            text: {
                type: 'plain_text',
                text: `✅ ${(0, i18n_1.t)('approval.approve', teamId)}`
            },
            style: 'primary',
            action_id: 'approve',
            value: docId
        });
        actions.push({
            type: 'button',
            text: {
                type: 'plain_text',
                text: `✋ ${(0, i18n_1.t)('approval.reject', teamId)}`
            },
            style: 'danger',
            action_id: 'reject',
            value: docId
        });
    }
    if (actions.length > 0) {
        blocks.push({
            type: 'actions',
            elements: actions
        });
    }
    return blocks;
}
// 다국어 지원 모달 뷰
function rejectModalViewI18n(docId, teamId) {
    return {
        type: 'modal',
        callback_id: 'reject_reason',
        private_metadata: docId,
        title: {
            type: 'plain_text',
            text: (0, i18n_1.t)('approval.reject_modal_title', teamId)
        },
        submit: {
            type: 'plain_text',
            text: (0, i18n_1.t)('approval.reject_modal_submit', teamId)
        },
        close: {
            type: 'plain_text',
            text: (0, i18n_1.t)('approval.reject_modal_cancel', teamId)
        },
        blocks: [
            {
                type: 'input',
                block_id: 'reason_block',
                element: {
                    type: 'plain_text_input',
                    action_id: 'reason',
                    multiline: true,
                    placeholder: {
                        type: 'plain_text',
                        text: (0, i18n_1.t)('approval.reject_modal_placeholder', teamId)
                    }
                },
                label: {
                    type: 'plain_text',
                    text: (0, i18n_1.t)('approval.reject_modal_label', teamId)
                }
            }
        ]
    };
}
exports.default = {
    WorkspaceManager,
    slackApiW,
    buildBlocksI18n,
    rejectModalViewI18n
};
