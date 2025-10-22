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
exports.getExperimentUsers = exports.getFlags = exports.updateFlag = exports.revokeFeature = exports.grantFeature = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const audit_1 = require("../lib/audit");
/**
 * 사용자에게 실험 기능 부여 (관리자 전용)
 */
exports.grantFeature = (0, https_1.onCall)({ enforceAppCheck: true }, async (req) => {
    const role = req.auth?.token?.role;
    if (role !== 'admin') {
        throw new Error('PERMISSION_DENIED');
    }
    const { feature, uid } = req.data;
    if (!feature || !uid) {
        throw new Error('MISSING_PARAMETERS');
    }
    try {
        await admin.firestore().doc(`experiments/${feature}/allowlist/${uid}`).set({
            grantedAt: admin.firestore.FieldValue.serverTimestamp(),
            grantedBy: req.auth?.uid
        });
        await (0, audit_1.logAuditEvent)('experiment_granted', req.auth?.uid, {
            feature,
            targetUid: uid
        });
        return { ok: true, feature, uid };
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('experiment_grant_failed', req.auth?.uid, {
            feature,
            targetUid: uid,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
});
/**
 * 사용자 실험 기능 제거 (관리자 전용)
 */
exports.revokeFeature = (0, https_1.onCall)({ enforceAppCheck: true }, async (req) => {
    const role = req.auth?.token?.role;
    if (role !== 'admin') {
        throw new Error('PERMISSION_DENIED');
    }
    const { feature, uid } = req.data;
    if (!feature || !uid) {
        throw new Error('MISSING_PARAMETERS');
    }
    try {
        await admin.firestore().doc(`experiments/${feature}/allowlist/${uid}`).delete();
        await (0, audit_1.logAuditEvent)('experiment_revoked', req.auth?.uid, {
            feature,
            targetUid: uid
        });
        return { ok: true, feature, uid };
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('experiment_revoke_failed', req.auth?.uid, {
            feature,
            targetUid: uid,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
});
/**
 * 플래그 업데이트 (관리자 전용)
 */
exports.updateFlag = (0, https_1.onCall)({ enforceAppCheck: true }, async (req) => {
    const role = req.auth?.token?.role;
    if (role !== 'admin') {
        throw new Error('PERMISSION_DENIED');
    }
    const { key, value } = req.data;
    if (!key) {
        throw new Error('MISSING_KEY');
    }
    try {
        await admin.firestore().doc('config/runtime').set({
            [key]: value,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: req.auth?.uid
        }, { merge: true });
        await (0, audit_1.logAuditEvent)('flag_updated', req.auth?.uid, {
            key,
            value
        });
        return { ok: true, key, value };
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('flag_update_failed', req.auth?.uid, {
            key,
            value,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
});
/**
 * 모든 플래그 조회 (관리자 전용)
 */
exports.getFlags = (0, https_1.onCall)({ enforceAppCheck: true }, async (req) => {
    const role = req.auth?.token?.role;
    if (role !== 'admin') {
        throw new Error('PERMISSION_DENIED');
    }
    try {
        const doc = await admin.firestore().doc('config/runtime').get();
        const flags = doc.exists ? doc.data() : {};
        return { ok: true, flags };
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('flags_fetch_failed', req.auth?.uid, {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
});
/**
 * 실험 참가자 목록 조회 (관리자 전용)
 */
exports.getExperimentUsers = (0, https_1.onCall)({ enforceAppCheck: true }, async (req) => {
    const role = req.auth?.token?.role;
    if (role !== 'admin') {
        throw new Error('PERMISSION_DENIED');
    }
    const { feature } = req.data;
    if (!feature) {
        throw new Error('MISSING_FEATURE');
    }
    try {
        const snapshot = await admin.firestore()
            .collection(`experiments/${feature}/allowlist`)
            .get();
        const users = snapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
        }));
        return { ok: true, feature, users };
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('experiment_users_fetch_failed', req.auth?.uid, {
            feature,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
});
