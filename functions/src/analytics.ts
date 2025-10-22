// CTR 측정 및 실험 로그 모듈
import * as admin from 'firebase-admin';
import { WorkspaceManager } from './workspace';

const db = admin.firestore();

interface ClickEvent {
  docId: string;
  teamId: string;
  userId: string;
  timestamp: admin.firestore.Timestamp;
  userAgent: string;
  ip: string;
  variant?: string;
  experimentId?: string;
}

interface ExperimentLog {
  docId: string;
  teamId: string;
  variant: string;
  experimentId: string;
  event: 'posted' | 'clicked' | 'approved' | 'rejected';
  timestamp: admin.firestore.Timestamp;
  metadata?: Record<string, any>;
}

export class AnalyticsManager {
  // 클릭 이벤트 기록
  static async recordClick(docId: string, teamId: string, userId: string, userAgent: string, ip: string, variant?: string, experimentId?: string): Promise<void> {
    const clickEvent: ClickEvent = {
      docId,
      teamId,
      userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp,
      userAgent,
      ip,
      variant,
      experimentId
    };

    await db.collection('click_events').add(clickEvent);
  }

  // 실험 로그 기록
  static async recordExperiment(experimentLog: Omit<ExperimentLog, 'timestamp'>): Promise<void> {
    const log: ExperimentLog = {
      ...experimentLog,
      timestamp: admin.firestore.FieldValue.serverTimestamp() as admin.firestore.Timestamp
    };

    await db.collection('experiment_logs').add(log);
  }

  // CTR 계산
  static async calculateCTR(teamId: string, startDate: Date, endDate: Date): Promise<{
    totalPosted: number;
    totalClicks: number;
    ctr: number;
    byVariant: Record<string, { posted: number; clicks: number; ctr: number }>;
  }> {
    const start = admin.firestore.Timestamp.fromDate(startDate);
    const end = admin.firestore.Timestamp.fromDate(endDate);

    // 게시된 승인 요청 수
    const postedSnap = await db.collection('approvals')
      .where('teamId', '==', teamId)
      .where('createdAt', '>=', start)
      .where('createdAt', '<=', end)
      .get();

    const totalPosted = postedSnap.size;

    // 클릭 이벤트 수
    const clicksSnap = await db.collection('click_events')
      .where('teamId', '==', teamId)
      .where('timestamp', '>=', start)
      .where('timestamp', '<=', end)
      .get();

    const totalClicks = clicksSnap.size;

    // 변형별 통계
    const byVariant: Record<string, { posted: number; clicks: number; ctr: number }> = {};

    // 게시된 요청의 변형별 집계
    const variantStats = new Map<string, number>();
    postedSnap.docs.forEach(doc => {
      const data = doc.data();
      const variant = data.variant || 'default';
      variantStats.set(variant, (variantStats.get(variant) || 0) + 1);
    });

    // 클릭 이벤트의 변형별 집계
    const clickStats = new Map<string, number>();
    clicksSnap.docs.forEach(doc => {
      const data = doc.data();
      const variant = data.variant || 'default';
      clickStats.set(variant, (clickStats.get(variant) || 0) + 1);
    });

    // 변형별 CTR 계산
    variantStats.forEach((posted, variant) => {
      const clicks = clickStats.get(variant) || 0;
      byVariant[variant] = {
        posted,
        clicks,
        ctr: posted > 0 ? clicks / posted : 0
      };
    });

    return {
      totalPosted,
      totalClicks,
      ctr: totalPosted > 0 ? totalClicks / totalPosted : 0,
      byVariant
    };
  }

  // 실험 통계 조회
  static async getExperimentStats(experimentId: string, startDate: Date, endDate: Date): Promise<{
    experimentId: string;
    totalEvents: number;
    byVariant: Record<string, {
      posted: number;
      clicked: number;
      approved: number;
      rejected: number;
      ctr: number;
      approvalRate: number;
    }>;
  }> {
    const start = admin.firestore.Timestamp.fromDate(startDate);
    const end = admin.firestore.Timestamp.fromDate(endDate);

    const logsSnap = await db.collection('experiment_logs')
      .where('experimentId', '==', experimentId)
      .where('timestamp', '>=', start)
      .where('timestamp', '<=', end)
      .get();

    const byVariant: Record<string, {
      posted: number;
      clicked: number;
      approved: number;
      rejected: number;
      ctr: number;
      approvalRate: number;
    }> = {};

    logsSnap.docs.forEach(doc => {
      const data = doc.data() as ExperimentLog;
      const variant = data.variant;

      if (!byVariant[variant]) {
        byVariant[variant] = {
          posted: 0,
          clicked: 0,
          approved: 0,
          rejected: 0,
          ctr: 0,
          approvalRate: 0
        };
      }

      byVariant[variant][data.event]++;
    });

    // CTR 및 승인율 계산
    Object.keys(byVariant).forEach(variant => {
      const stats = byVariant[variant];
      stats.ctr = stats.posted > 0 ? stats.clicked / stats.posted : 0;
      stats.approvalRate = (stats.approved + stats.rejected) > 0 ? stats.approved / (stats.approved + stats.rejected) : 0;
    });

    return {
      experimentId,
      totalEvents: logsSnap.size,
      byVariant
    };
  }
}

// 리다이렉트 URL 생성
export function createRedirectUrl(docId: string, teamId: string, variant?: string, experimentId?: string): string {
  const baseUrl = process.env.PUBLIC_BASE_URL || 'https://your-domain.com';
  const params = new URLSearchParams({
    docId,
    teamId,
    ...(variant && { variant }),
    ...(experimentId && { experimentId })
  });
  
  return `${baseUrl}/slack/r?${params.toString()}`;
}

// 클릭 추적을 위한 URL 래핑
export function wrapWithTracking(originalUrl: string, docId: string, teamId: string, variant?: string, experimentId?: string): string {
  const redirectUrl = createRedirectUrl(docId, teamId, variant, experimentId);
  return redirectUrl;
}

export default {
  AnalyticsManager,
  createRedirectUrl,
  wrapWithTracking
};
