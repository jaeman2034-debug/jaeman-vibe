// Quiet Hours + 예약 DM 관리 모듈
import * as admin from 'firebase-admin';
import { WorkspaceManager, slackApiW } from './workspace';

const db = admin.firestore();

interface QuietHoursConfig {
  userId: string;
  teamId: string;
  timezone: string;
  startTime: string; // "22:00"
  endTime: string;   // "09:00"
  enabled: boolean;
  weekdays: number[]; // [1,2,3,4,5] (월-금)
  weekends: number[]; // [6,0] (토-일)
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

interface ScheduledMessage {
  docId: string;
  teamId: string;
  userId: string;
  channel: string;
  text: string;
  blocks?: any[];
  scheduledFor: admin.firestore.Timestamp;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  createdAt: admin.firestore.Timestamp;
}

export class QuietHoursManager {
  private static cache = new Map<string, QuietHoursConfig>();
  private static CACHE_TTL = 10 * 60 * 1000; // 10분

  // 조용시간 설정 조회
  static async getQuietHours(userId: string, teamId: string): Promise<QuietHoursConfig | null> {
    const cacheKey = `${teamId}:${userId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const doc = await db.collection('quiet_hours').doc(`${teamId}:${userId}`).get();
    
    if (!doc.exists) {
      return null;
    }

    const config = doc.data() as QuietHoursConfig;
    this.cache.set(cacheKey, config);
    
    // 캐시 만료 설정
    setTimeout(() => {
      this.cache.delete(cacheKey);
    }, this.CACHE_TTL);

    return config;
  }

  // 조용시간 설정 저장
  static async setQuietHours(config: Omit<QuietHoursConfig, 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = admin.firestore.FieldValue.serverTimestamp();
    
    await db.collection('quiet_hours').doc(`${config.teamId}:${config.userId}`).set({
      ...config,
      createdAt: now,
      updatedAt: now
    }, { merge: true });

    // 캐시 업데이트
    const cacheKey = `${config.teamId}:${config.userId}`;
    this.cache.set(cacheKey, {
      ...config,
      createdAt: now as admin.firestore.Timestamp,
      updatedAt: now as admin.firestore.Timestamp
    });
  }

  // 조용시간 확인
  static isQuietHours(config: QuietHoursConfig): boolean {
    if (!config.enabled) return false;

    const now = new Date();
    const userTimezone = config.timezone || 'Asia/Seoul';
    
    // 사용자 시간대로 변환
    const userTime = new Date(now.toLocaleString("en-US", { timeZone: userTimezone }));
    const currentHour = userTime.getHours();
    const currentMinute = userTime.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;
    
    const dayOfWeek = userTime.getDay();
    const isWeekday = config.weekdays.includes(dayOfWeek);
    const isWeekend = config.weekends.includes(dayOfWeek);
    
    if (!isWeekday && !isWeekend) return false;

    const startTime = this.parseTime(config.startTime);
    const endTime = this.parseTime(config.endTime);

    if (startTime <= endTime) {
      // 같은 날 (예: 09:00 - 17:00)
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // 다음날까지 (예: 22:00 - 09:00)
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  private static parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // 예약 메시지 전송
  static async scheduleMessage(
    teamId: string,
    userId: string,
    channel: string,
    text: string,
    blocks?: any[],
    delayMinutes: number = 0
  ): Promise<string> {
    const workspace = await WorkspaceManager.getWorkspace(teamId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${teamId}`);
    }

    const scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000);
    
    // Slack API로 예약 메시지 전송
    const response = await slackApiW(teamId, 'chat.scheduleMessage', {
      channel,
      text,
      blocks,
      post_at: Math.floor(scheduledFor.getTime() / 1000)
    });

    if (!response.ok) {
      throw new Error(`Failed to schedule message: ${response.error}`);
    }

    // Firestore에 예약 메시지 기록
    const docRef = await db.collection('scheduled_messages').add({
      docId: response.scheduled_message_id,
      teamId,
      userId,
      channel,
      text,
      blocks: blocks || null,
      scheduledFor: admin.firestore.Timestamp.fromDate(scheduledFor),
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return docRef.id;
  }

  // 즉시 전송 또는 예약 전송
  static async sendOrSchedule(
    teamId: string,
    userId: string,
    channel: string,
    text: string,
    blocks?: any[]
  ): Promise<{ sent: boolean; scheduledId?: string; message: string }> {
    const quietHours = await this.getQuietHours(userId, teamId);
    
    if (!quietHours || !this.isQuietHours(quietHours)) {
      // 조용시간이 아니면 즉시 전송
      try {
        await slackApiW(teamId, 'chat.postMessage', {
          channel,
          text,
          blocks
        });
        return { sent: true, message: '즉시 전송됨' };
      } catch (error) {
        return { sent: false, message: `전송 실패: ${error}` };
      }
    }

    // 조용시간이면 다음 가능한 시간까지 예약
    const nextAvailableTime = this.getNextAvailableTime(quietHours);
    const delayMinutes = Math.ceil((nextAvailableTime.getTime() - Date.now()) / (1000 * 60));
    
    try {
      const scheduledId = await this.scheduleMessage(
        teamId,
        userId,
        channel,
        text,
        blocks,
        delayMinutes
      );
      
      return {
        sent: false,
        scheduledId,
        message: `조용시간으로 인해 ${nextAvailableTime.toLocaleString()}에 예약됨`
      };
    } catch (error) {
      return { sent: false, message: `예약 실패: ${error}` };
    }
  }

  private static getNextAvailableTime(config: QuietHoursConfig): Date {
    const now = new Date();
    const userTimezone = config.timezone || 'Asia/Seoul';
    const userTime = new Date(now.toLocaleString("en-US", { timeZone: userTimezone }));
    
    const endTime = this.parseTime(config.endTime);
    const [endHours, endMinutes] = config.endTime.split(':').map(Number);
    
    const nextAvailable = new Date(userTime);
    nextAvailable.setHours(endHours, endMinutes, 0, 0);
    
    // 만약 오늘의 종료 시간이 이미 지났다면 내일로
    if (nextAvailable <= userTime) {
      nextAvailable.setDate(nextAvailable.getDate() + 1);
    }
    
    return nextAvailable;
  }

  // 예약 메시지 상태 업데이트
  static async updateScheduledMessage(
    scheduledId: string,
    status: 'sent' | 'failed' | 'cancelled'
  ): Promise<void> {
    await db.collection('scheduled_messages').doc(scheduledId).update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }

  // 사용자별 조용시간 설정 조회 (Admin API)
  static async listQuietHours(teamId: string): Promise<QuietHoursConfig[]> {
    const snap = await db.collection('quiet_hours')
      .where('teamId', '==', teamId)
      .get();
    
    return snap.docs.map(doc => doc.data() as QuietHoursConfig);
  }

  // 조용시간 통계
  static async getQuietHoursStats(teamId: string): Promise<{
    totalUsers: number;
    enabledUsers: number;
    scheduledMessages: number;
    timezones: Record<string, number>;
  }> {
    const [quietHoursSnap, scheduledSnap] = await Promise.all([
      db.collection('quiet_hours').where('teamId', '==', teamId).get(),
      db.collection('scheduled_messages').where('teamId', '==', teamId).get()
    ]);

    const quietHours = quietHoursSnap.docs.map(doc => doc.data() as QuietHoursConfig);
    const timezones: Record<string, number> = {};
    
    quietHours.forEach(config => {
      timezones[config.timezone] = (timezones[config.timezone] || 0) + 1;
    });

    return {
      totalUsers: quietHours.length,
      enabledUsers: quietHours.filter(c => c.enabled).length,
      scheduledMessages: scheduledSnap.size,
      timezones
    };
  }
}

export default {
  QuietHoursManager
};
