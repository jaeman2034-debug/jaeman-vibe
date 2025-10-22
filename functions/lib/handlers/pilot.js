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
exports.pilotStatus = exports.pilotList = exports.pilotRemove = exports.pilotInvite = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const audit_1 = require("../lib/audit");
/**
 * 파일럿 참가자 초대 (관리자 전용)
 */
exports.pilotInvite = (0, https_1.onCall)({ enforceAppCheck: true }, async (req) => {
    const role = req.auth?.token?.role;
    if (role !== 'admin') {
        throw new Error('PERMISSION_DENIED');
    }
    const { uid, email, name } = req.data;
    if (!uid) {
        throw new Error('MISSING_UID');
    }
    try {
        // 파일럿 Allowlist에 추가
        await admin.firestore().doc(`pilot_allowlist/${uid}`).set({
            addedAt: admin.firestore.FieldValue.serverTimestamp(),
            addedBy: req.auth?.uid,
            email: email || null,
            name: name || null
        });
        // 감사 로그
        await (0, audit_1.logAuditEvent)('pilot_user_invited', req.auth?.uid, {
            targetUid: uid,
            email,
            name
        });
        return { ok: true, uid };
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('pilot_invite_failed', req.auth?.uid, {
            targetUid: uid,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
});
/**
 * 파일럿 참가자 제거 (관리자 전용)
 */
exports.pilotRemove = (0, https_1.onCall)({ enforceAppCheck: true }, async (req) => {
    const role = req.auth?.token?.role;
    if (role !== 'admin') {
        throw new Error('PERMISSION_DENIED');
    }
    const { uid } = req.data;
    if (!uid) {
        throw new Error('MISSING_UID');
    }
    try {
        // 파일럿 Allowlist에서 제거
        await admin.firestore().doc(`pilot_allowlist/${uid}`).delete();
        // 감사 로그
        await (0, audit_1.logAuditEvent)('pilot_user_removed', req.auth?.uid, {
            targetUid: uid
        });
        return { ok: true, uid };
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('pilot_remove_failed', req.auth?.uid, {
            targetUid: uid,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
});
/**
 * 파일럿 참가자 목록 조회 (관리자 전용)
 */
exports.pilotList = (0, https_1.onCall)({ enforceAppCheck: true }, async (req) => {
    const role = req.auth?.token?.role;
    if (role !== 'admin') {
        throw new Error('PERMISSION_DENIED');
    }
    try {
        const snapshot = await admin.firestore().collection('pilot_allowlist').get();
        const participants = snapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
        }));
        return { ok: true, participants };
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('pilot_list_failed', req.auth?.uid, {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
});
/**
 * 파일럿 상태 확인 (사용자 본인)
 */
exports.pilotStatus = (0, https_1.onCall)({ enforceAppCheck: true }, async (req) => {
    const uid = req.auth?.uid;
    if (!uid) {
        throw new Error('UNAUTHENTICATED');
    }
    try {
        const doc = await admin.firestore().doc(`pilot_allowlist/${uid}`).get();
        const isParticipant = doc.exists;
        return {
            ok: true,
            isParticipant,
            participantData: isParticipant ? doc.data() : null
        };
    }
    catch (error) {
        await (0, audit_1.logAuditEvent)('pilot_status_failed', uid, {
            error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
    }
});
