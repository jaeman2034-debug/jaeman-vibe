import * as admin from 'firebase-admin';
interface SlackUser {
    id: string;
    email: string;
    name: string;
    displayName: string;
    realName: string;
    teamId: string;
    isBot: boolean;
    isDeleted: boolean;
    profile?: {
        image_24?: string;
        image_32?: string;
        image_48?: string;
        image_72?: string;
        image_192?: string;
        image_512?: string;
    };
    cachedAt: admin.firestore.Timestamp;
    lastSeen?: admin.firestore.Timestamp;
}
export declare class UserCacheManager {
    private static cache;
    private static emailToIdCache;
    private static CACHE_TTL;
    static getUserIdByEmail(email: string, teamId: string): Promise<string | null>;
    static getUserById(userId: string, teamId: string): Promise<SlackUser | null>;
    static cacheUser(user: SlackUser): Promise<void>;
    private static mapSlackUser;
    private static isCacheValid;
    static getTeamUsers(teamId: string): Promise<SlackUser[]>;
    static searchUsers(teamId: string, query: string, limit?: number): Promise<SlackUser[]>;
    static updateUserPresence(userId: string, teamId: string, presence: 'active' | 'away'): Promise<void>;
    static syncTeamUsers(teamId: string): Promise<{
        synced: number;
        errors: string[];
    }>;
    static getCacheStats(): {
        memoryCacheSize: number;
        emailCacheSize: number;
        totalUsers: number;
    };
    static clearCache(): void;
    static cleanupOldCache(): Promise<number>;
    static getUserAvatarUrl(user: SlackUser, size?: 24 | 32 | 48 | 72 | 192 | 512): string;
    static getUserDisplayName(user: SlackUser): string;
}
declare const _default: {
    UserCacheManager: typeof UserCacheManager;
};
export default _default;
//# sourceMappingURL=userCache.d.ts.map
