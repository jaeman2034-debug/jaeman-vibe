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
exports.getFlags = getFlags;
exports.isEnabled = isEnabled;
exports.ensureEnabled = ensureEnabled;
exports.isUserEnabled = isUserEnabled;
exports.grantUserFeature = grantUserFeature;
exports.revokeUserFeature = revokeUserFeature;
exports.updateFlag = updateFlag;
const admin = __importStar(require("firebase-admin"));
let cache = { data: null, ts: 0 };
/**
 * Runtime Feature Flags 조회 (60초 캐시)
 */
async function getFlags() {
    const fresh = Date.now() - cache.ts < 60000;
    if (fresh && cache.data)
        return cache.data;
    try {
        const snap = await admin.firestore().doc('config/runtime').get();
        cache = { data: snap.data() || {}, ts: Date.now() };
        return cache.data;
    }
    catch (error) {
        console.error('Failed to fetch flags:', error);
        return cache.data || {};
    }
}
/**
 * 특정 기능이 활성화되어 있는지 확인
 */
async function isEnabled(key) {
    const flags = await getFlags();
    return !!flags[key];
}
/**
 * 기능이 비활성화되어 있으면 에러 발생
 */
async function ensureEnabled(key) {
    const enabled = await isEnabled(key);
    if (!enabled) {
        throw new Error(`FEATURE_DISABLED:${key}`);
    }
}
/**
 * 개인별 실험 기능 확인
 */
async function isUserEnabled(feature, uid) {
    try {
        const doc = await admin.firestore().doc(`experiments/${feature}/allowlist/${uid}`).get();
        return doc.exists;
    }
    catch (error) {
        console.error(`Failed to check user experiment ${feature} for ${uid}:`, error);
        return false;
    }
}
/**
 * 사용자별 기능 활성화 (관리자 전용)
 */
async function grantUserFeature(feature, uid, grantedBy) {
    await admin.firestore().doc(`experiments/${feature}/allowlist/${uid}`).set({
        grantedAt: admin.firestore.FieldValue.serverTimestamp(),
        grantedBy
    });
}
/**
 * 사용자별 기능 비활성화 (관리자 전용)
 */
async function revokeUserFeature(feature, uid) {
    await admin.firestore().doc(`experiments/${feature}/allowlist/${uid}`).delete();
}
/**
 * 플래그 업데이트 (관리자 전용)
 */
async function updateFlag(key, value, updatedBy) {
    await admin.firestore().doc('config/runtime').set({
        [key]: value,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy
    }, { merge: true });
    // 캐시 무효화
    cache = { data: null, ts: 0 };
}
