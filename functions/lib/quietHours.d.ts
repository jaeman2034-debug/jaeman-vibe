import * as admin from 'firebase-admin';
interface QuietHoursConfig {
    userId: string;
    teamId: string;
    timezone: string;
    startTime: string;
    endTime: string;
    enabled: boolean;
    weekdays: number[];
    weekends: number[];
    createdAt: admin.firestore.Timestamp;
    updatedAt: admin.firestore.Timestamp;
}
export declare class QuietHoursManager {
    private static cache;
    private static CACHE_TTL;
    static getQuietHours(userId: string, teamId: string): Promise<QuietHoursConfig | null>;
    static setQuietHours(config: Omit<QuietHoursConfig, 'createdAt' | 'updatedAt'>): Promise<void>;
    static isQuietHours(config: QuietHoursConfig): boolean;
    private static parseTime;
    static scheduleMessage(teamId: string, userId: string, channel: string, text: string, blocks?: any[], delayMinutes?: number): Promise<string>;
    static sendOrSchedule(teamId: string, userId: string, channel: string, text: string, blocks?: any[]): Promise<{
        sent: boolean;
        scheduledId?: string;
        message: string;
    }>;
    private static getNextAvailableTime;
    static updateScheduledMessage(scheduledId: string, status: 'sent' | 'failed' | 'cancelled'): Promise<void>;
    static listQuietHours(teamId: string): Promise<QuietHoursConfig[]>;
    static getQuietHoursStats(teamId: string): Promise<{
        totalUsers: number;
        enabledUsers: number;
        scheduledMessages: number;
        timezones: Record<string, number>;
    }>;
}
declare const _default: {
    QuietHoursManager: typeof QuietHoursManager;
};
export default _default;
//# sourceMappingURL=quietHours.d.ts.map
