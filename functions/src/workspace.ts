// 멀티워크스페이스 관리 모듈
import * as admin from 'firebase-admin';
import { t } from './i18n';

interface WorkspaceConfig {
  teamId: string;
  botToken: string;
  defaultChannel: string;
  locale: string;
  enabled: boolean;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

const db = admin.firestore();

export class WorkspaceManager {
  private static cache = new Map<string, WorkspaceConfig>();
  private static cacheExpiry = new Map<string, number>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5분

  static async getWorkspace(teamId: string): Promise<WorkspaceConfig | null> {
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

    const config = doc.data() as WorkspaceConfig;
    
    // 캐시에 저장
    this.cache.set(teamId, config);
    this.cacheExpiry.set(teamId, Date.now() + this.CACHE_TTL);
    
    return config;
  }

  static async setWorkspace(config: Omit<WorkspaceConfig, 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = admin.firestore.FieldValue.serverTimestamp();
    
    await db.collection('workspaces').doc(config.teamId).set({
      ...config,
      createdAt: now,
      updatedAt: now
    }, { merge: true });

    // 캐시 업데이트
    this.cache.set(config.teamId, {
      ...config,
      createdAt: now as admin.firestore.Timestamp,
      updatedAt: now as admin.firestore.Timestamp
    });
    this.cacheExpiry.set(config.teamId, Date.now() + this.CACHE_TTL);
  }

  static async deleteWorkspace(teamId: string): Promise<void> {
    await db.collection('workspaces').doc(teamId).delete();
    
    // 캐시에서 제거
    this.cache.delete(teamId);
    this.cacheExpiry.delete(teamId);
  }

  static async listWorkspaces(): Promise<WorkspaceConfig[]> {
    const snap = await db.collection('workspaces').get();
    return snap.docs.map(doc => doc.data() as WorkspaceConfig);
  }

  static clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

// Slack API 래퍼 (팀별 토큰 사용)
export async function slackApiW(teamId: string, method: string, body: any): Promise<any> {
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
export function buildBlocksI18n(data: any, teamId: string): any[] {
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
        text: `*${t('approval.request', teamId)}:* <${url}|${t('approval.request', teamId)}>`
      }
    });
  }

  // 승인 진행 상황
  if (required && required > 1) {
    const progress = approvers ? approvers.length : 0;
    const progressText = status === 'approved' 
      ? t('approval.completed', teamId)
      : status === 'partially_approved'
      ? t('approval.in_progress', teamId)
      : t('approval.waiting', teamId);
    
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
    const approverList = approvers.map((a: any) => `<@${a.userId}>`).join(', ');
    blocks.push({
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: `${t('approval.approvers', teamId)}: ${approverList}`
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
        text: `${t('approval.expires', teamId)}: <!date^${expireTime}^{date_num} {time_secs}|${expireTime}>`
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
        text: `✅ ${t('approval.approve', teamId)}`
      },
      style: 'primary',
      action_id: 'approve',
      value: docId
    });
    
    actions.push({
      type: 'button',
      text: {
        type: 'plain_text',
        text: `✋ ${t('approval.reject', teamId)}`
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
export function rejectModalViewI18n(docId: string, teamId: string): any {
  return {
    type: 'modal',
    callback_id: 'reject_reason',
    private_metadata: docId,
    title: {
      type: 'plain_text',
      text: t('approval.reject_modal_title', teamId)
    },
    submit: {
      type: 'plain_text',
      text: t('approval.reject_modal_submit', teamId)
    },
    close: {
      type: 'plain_text',
      text: t('approval.reject_modal_cancel', teamId)
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
            text: t('approval.reject_modal_placeholder', teamId)
          }
        },
        label: {
          type: 'plain_text',
          text: t('approval.reject_modal_label', teamId)
        }
      }
    ]
  };
}

export default {
  WorkspaceManager,
  slackApiW,
  buildBlocksI18n,
  rejectModalViewI18n
};
