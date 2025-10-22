"use strict";
/**
 * 간단한 인메모리 레이트 리미터
 * 단일 인스턴스 기준으로 동작
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tryHit = tryHit;
exports.getRateLimitStatus = getRateLimitStatus;
exports.cleanupCache = cleanupCache;
exports.resetKey = resetKey;
exports.clearCache = clearCache;
const CACHE = new Map();
/**
 * 레이트 리미트 체크 및 히트
 * @param key 고유 키 (예: "report:userId:targetType:targetId")
 * @param maxHits 최대 허용 횟수
 * @param windowMs 시간 윈도우 (밀리초)
 * @returns true if allowed, false if rate limited
 */
function tryHit(key, maxHits = 10, windowMs = 60000) {
    const now = Date.now();
    const entry = CACHE.get(key);
    if (!entry || now > entry.resetTime) {
        // 새 엔트리 생성 또는 윈도우 리셋
        CACHE.set(key, {
            count: 1,
            resetTime: now + windowMs
        });
        return true;
    }
    if (entry.count >= maxHits) {
        return false; // 레이트 리미트 초과
    }
    // 카운트 증가
    entry.count++;
    return true;
}
/**
 * 특정 키의 레이트 리미트 상태 조회
 */
function getRateLimitStatus(key) {
    const entry = CACHE.get(key);
    if (!entry)
        return null;
    const now = Date.now();
    if (now > entry.resetTime) {
        CACHE.delete(key);
        return null;
    }
    return {
        count: entry.count,
        resetTime: entry.resetTime,
        remaining: Math.max(0, 10 - entry.count) // 기본 maxHits = 10
    };
}
/**
 * 캐시 정리 (만료된 엔트리 제거)
 */
function cleanupCache() {
    const now = Date.now();
    for (const [key, entry] of CACHE.entries()) {
        if (now > entry.resetTime) {
            CACHE.delete(key);
        }
    }
}
/**
 * 특정 키 강제 리셋
 */
function resetKey(key) {
    CACHE.delete(key);
}
/**
 * 전체 캐시 초기화
 */
function clearCache() {
    CACHE.clear();
}
// 5분마다 캐시 정리
setInterval(cleanupCache, 5 * 60 * 1000);
