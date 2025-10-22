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
exports.QuietHoursManager = void 0;
// Quiet Hours + 예약 DM 관리 모듈
const admin = __importStar(require("firebase-admin"));
const workspace_1 = require("./workspace");
const db = admin.firestore();
class QuietHoursManager {
    // 조용시간 설정 조회
    static async getQuietHours(userId, teamId) {
        const cacheKey = `${teamId}:${userId}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const doc = await db.collection('quiet_hours').doc(`${teamId}:${userId}`).get();
        if (!doc.exists) {
            return null;
        }
        const config = doc.data();
        this.cache.set(cacheKey, config);
        // 캐시 만료 설정
        setTimeout(() => {
            this.cache.delete(cacheKey);
        }, this.CACHE_TTL);
        return config;
    }
    // 조용시간 설정 저장
    static async setQuietHours(config) {
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
            createdAt: now,
            updatedAt: now
        });
    }
    // 조용시간 확인
    static isQuietHours(config) {
        if (!config.enabled)
            return false;
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
        if (!isWeekday && !isWeekend)
            return false;
        const startTime = this.parseTime(config.startTime);
        const endTime = this.parseTime(config.endTime);
        if (startTime <= endTime) {
            // 같은 날 (예: 09:00 - 17:00)
            return currentTime >= startTime && currentTime < endTime;
        }
        else {
            // 다음날까지 (예: 22:00 - 09:00)
            return currentTime >= startTime || currentTime < endTime;
        }
    }
    static parseTime(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }
    // 예약 메시지 전송
    static async scheduleMessage(teamId, userId, channel, text, blocks, delayMinutes = 0) {
        const workspace = await workspace_1.WorkspaceManager.getWorkspace(teamId);
        if (!workspace) {
            throw new Error(`Workspace not found: ${teamId}`);
        }
        const scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000);
        // Slack API로 예약 메시지 전송
        const response = await (0, workspace_1.slackApiW)(teamId, 'chat.scheduleMessage', {
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
    static async sendOrSchedule(teamId, userId, channel, text, blocks) {
        const quietHours = await this.getQuietHours(userId, teamId);
        if (!quietHours || !this.isQuietHours(quietHours)) {
            // 조용시간이 아니면 즉시 전송
            try {
                await (0, workspace_1.slackApiW)(teamId, 'chat.postMessage', {
                    channel,
                    text,
                    blocks
                });
                return { sent: true, message: '즉시 전송됨' };
            }
            catch (error) {
                return { sent: false, message: `전송 실패: ${error}` };
            }
        }
        // 조용시간이면 다음 가능한 시간까지 예약
        const nextAvailableTime = this.getNextAvailableTime(quietHours);
        const delayMinutes = Math.ceil((nextAvailableTime.getTime() - Date.now()) / (1000 * 60));
        try {
            const scheduledId = await this.scheduleMessage(teamId, userId, channel, text, blocks, delayMinutes);
            return {
                sent: false,
                scheduledId,
                message: `조용시간으로 인해 ${nextAvailableTime.toLocaleString()}에 예약됨`
            };
        }
        catch (error) {
            return { sent: false, message: `예약 실패: ${error}` };
        }
    }
    static getNextAvailableTime(config) {
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
    static async updateScheduledMessage(scheduledId, status) {
        await db.collection('scheduled_messages').doc(scheduledId).update({
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    // 사용자별 조용시간 설정 조회 (Admin API)
    static async listQuietHours(teamId) {
        const snap = await db.collection('quiet_hours')
            .where('teamId', '==', teamId)
            .get();
        return snap.docs.map(doc => doc.data());
    }
    // 조용시간 통계
    static async getQuietHoursStats(teamId) {
        const [quietHoursSnap, scheduledSnap] = await Promise.all([
            db.collection('quiet_hours').where('teamId', '==', teamId).get(),
            db.collection('scheduled_messages').where('teamId', '==', teamId).get()
        ]);
        const quietHours = quietHoursSnap.docs.map(doc => doc.data());
        const timezones = {};
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
exports.QuietHoursManager = QuietHoursManager;
QuietHoursManager.cache = new Map();
QuietHoursManager.CACHE_TTL = 10 * 60 * 1000; // 10분
exports.default = {
    QuietHoursManager
};
