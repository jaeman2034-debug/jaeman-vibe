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
exports.UserCacheManager = void 0;
// Slack 사용자 캐시 관리 모듈
const admin = __importStar(require("firebase-admin"));
const workspace_1 = require("./workspace");
const db = admin.firestore();
class UserCacheManager {
    // 이메일로 사용자 ID 조회
    static async getUserIdByEmail(email, teamId) {
        const cacheKey = `${teamId}:${email}`;
        // 캐시 확인
        if (this.emailToIdCache.has(cacheKey)) {
            return this.emailToIdCache.get(cacheKey);
        }
        // Firestore에서 조회
        const userSnap = await db.collection('slack_users')
            .where('email', '==', email)
            .where('teamId', '==', teamId)
            .limit(1)
            .get();
        if (!userSnap.empty) {
            const user = userSnap.docs[0].data();
            this.emailToIdCache.set(cacheKey, user.id);
            return user.id;
        }
        // Slack API로 조회
        try {
            const response = await (0, workspace_1.slackApiW)(teamId, 'users.lookupByEmail', {
                email
            });
            if (response.ok && response.user) {
                const user = this.mapSlackUser(response.user, teamId);
                await this.cacheUser(user);
                this.emailToIdCache.set(cacheKey, user.id);
                return user.id;
            }
        }
        catch (error) {
            console.error('Failed to lookup user by email:', error);
        }
        return null;
    }
    // 사용자 ID로 사용자 정보 조회
    static async getUserById(userId, teamId) {
        const cacheKey = `${teamId}:${userId}`;
        // 캐시 확인
        if (this.cache.has(cacheKey)) {
            const user = this.cache.get(cacheKey);
            if (this.isCacheValid(user.cachedAt)) {
                return user;
            }
        }
        // Firestore에서 조회
        const userDoc = await db.collection('slack_users').doc(`${teamId}:${userId}`).get();
        if (userDoc.exists) {
            const user = userDoc.data();
            if (this.isCacheValid(user.cachedAt)) {
                this.cache.set(cacheKey, user);
                return user;
            }
        }
        // Slack API로 조회
        try {
            const response = await (0, workspace_1.slackApiW)(teamId, 'users.info', {
                user: userId
            });
            if (response.ok && response.user) {
                const user = this.mapSlackUser(response.user, teamId);
                await this.cacheUser(user);
                this.cache.set(cacheKey, user);
                return user;
            }
        }
        catch (error) {
            console.error('Failed to get user info:', error);
        }
        return null;
    }
    // 사용자 정보 캐시
    static async cacheUser(user) {
        const docId = `${user.teamId}:${user.id}`;
        await db.collection('slack_users').doc(docId).set({
            ...user,
            cachedAt: admin.firestore.FieldValue.serverTimestamp(),
            lastSeen: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        // 메모리 캐시에 저장
        const cacheKey = `${user.teamId}:${user.id}`;
        this.cache.set(cacheKey, user);
        this.emailToIdCache.set(`${user.teamId}:${user.email}`, user.id);
    }
    // Slack API 응답을 SlackUser 객체로 변환
    static mapSlackUser(slackUser, teamId) {
        return {
            id: slackUser.id,
            email: slackUser.profile?.email || '',
            name: slackUser.name || '',
            displayName: slackUser.profile?.display_name || slackUser.real_name || '',
            realName: slackUser.real_name || '',
            teamId,
            isBot: slackUser.is_bot || false,
            isDeleted: slackUser.deleted || false,
            profile: {
                image_24: slackUser.profile?.image_24,
                image_32: slackUser.profile?.image_32,
                image_48: slackUser.profile?.image_48,
                image_72: slackUser.profile?.image_72,
                image_192: slackUser.profile?.image_192,
                image_512: slackUser.profile?.image_512
            },
            cachedAt: admin.firestore.FieldValue.serverTimestamp()
        };
    }
    // 캐시 유효성 확인
    static isCacheValid(cachedAt) {
        const now = Date.now();
        const cacheTime = cachedAt.toMillis();
        return (now - cacheTime) < this.CACHE_TTL;
    }
    // 팀의 모든 사용자 조회
    static async getTeamUsers(teamId) {
        const snap = await db.collection('slack_users')
            .where('teamId', '==', teamId)
            .where('isDeleted', '==', false)
            .get();
        return snap.docs.map(doc => doc.data());
    }
    // 사용자 검색
    static async searchUsers(teamId, query, limit = 20) {
        const snap = await db.collection('slack_users')
            .where('teamId', '==', teamId)
            .where('isDeleted', '==', false)
            .limit(limit)
            .get();
        const users = snap.docs.map(doc => doc.data());
        // 클라이언트 사이드 필터링 (Firestore의 제한으로 인해)
        return users.filter(user => user.name.toLowerCase().includes(query.toLowerCase()) ||
            user.displayName.toLowerCase().includes(query.toLowerCase()) ||
            user.realName.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase()));
    }
    // 사용자 온라인 상태 업데이트
    static async updateUserPresence(userId, teamId, presence) {
        const docId = `${teamId}:${userId}`;
        await db.collection('slack_users').doc(docId).update({
            presence,
            lastSeen: admin.firestore.FieldValue.serverTimestamp()
        });
        // 캐시 업데이트
        const cacheKey = `${teamId}:${userId}`;
        if (this.cache.has(cacheKey)) {
            const user = this.cache.get(cacheKey);
            user.lastSeen = admin.firestore.FieldValue.serverTimestamp();
            this.cache.set(cacheKey, user);
        }
    }
    // 사용자 정보 일괄 동기화
    static async syncTeamUsers(teamId) {
        let synced = 0;
        const errors = [];
        try {
            const response = await (0, workspace_1.slackApiW)(teamId, 'users.list', {
                limit: 1000
            });
            if (response.ok && response.members) {
                for (const member of response.members) {
                    try {
                        const user = this.mapSlackUser(member, teamId);
                        await this.cacheUser(user);
                        synced++;
                    }
                    catch (error) {
                        errors.push(`Failed to sync user ${member.id}: ${error}`);
                    }
                }
            }
        }
        catch (error) {
            errors.push(`Failed to fetch team users: ${error}`);
        }
        return { synced, errors };
    }
    // 캐시 통계
    static getCacheStats() {
        return {
            memoryCacheSize: this.cache.size,
            emailCacheSize: this.emailToIdCache.size,
            totalUsers: this.cache.size
        };
    }
    // 캐시 클리어
    static clearCache() {
        this.cache.clear();
        this.emailToIdCache.clear();
    }
    // 오래된 캐시 정리
    static async cleanupOldCache() {
        const cutoffTime = admin.firestore.Timestamp.fromMillis(Date.now() - (7 * 24 * 60 * 60 * 1000) // 7일
        );
        const snap = await db.collection('slack_users')
            .where('cachedAt', '<', cutoffTime)
            .get();
        const batch = db.batch();
        let deleted = 0;
        snap.docs.forEach(doc => {
            batch.delete(doc.ref);
            deleted++;
        });
        if (deleted > 0) {
            await batch.commit();
        }
        return deleted;
    }
    // 사용자 아바타 URL 생성
    static getUserAvatarUrl(user, size = 48) {
        const sizeKey = `image_${size}`;
        return user.profile?.[sizeKey] || user.profile?.image_48 || '';
    }
    // 사용자 표시 이름 생성
    static getUserDisplayName(user) {
        return user.displayName || user.realName || user.name || 'Unknown User';
    }
}
exports.UserCacheManager = UserCacheManager;
UserCacheManager.cache = new Map();
UserCacheManager.emailToIdCache = new Map();
UserCacheManager.CACHE_TTL = 30 * 60 * 1000; // 30분
exports.default = {
    UserCacheManager
};
