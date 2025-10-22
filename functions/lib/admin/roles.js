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
exports.getRoles = exports.getUserClaims = exports.revokeRole = exports.bootstrapAdmin = exports.grantRole = void 0;
require("../_admin");
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const v2_1 = require("firebase-functions/v2");
const INTERNAL_KEY = (0, params_1.defineSecret)('INTERNAL_KEY');
// (A) 운영용: 기존 admin만 호출 가능 (Callable)
exports.grantRole = (0, https_1.onCall)({ secrets: [INTERNAL_KEY] }, async (req) => {
    const { uid, role } = req.data || {};
    const caller = req.auth;
    if (!caller?.token?.roles?.admin) {
        throw new https_1.HttpsError('permission-denied', 'admin only');
    }
    if (!uid || !role) {
        throw new https_1.HttpsError('invalid-argument', 'uid, role required');
    }
    try {
        const user = await admin.auth().getUser(uid);
        const claims = user.customClaims || {};
        claims.roles = { ...(claims.roles || {}), [role]: true };
        await admin.auth().setCustomUserClaims(uid, claims);
        v2_1.logger.info(`Role ${role} granted to user ${uid} by ${caller.uid}`);
        return { ok: true, claims };
    }
    catch (error) {
        v2_1.logger.error('Error granting role:', error);
        throw new https_1.HttpsError('internal', 'Failed to grant role');
    }
});
// (B) 초기 부트스트랩: 내부키로 1회성 admin 부여 (HTTPS)
exports.bootstrapAdmin = (0, https_1.onRequest)({ secrets: [INTERNAL_KEY], cors: true }, async (req, res) => {
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Headers', '*');
        return res.status(204).end();
    }
    const key = INTERNAL_KEY.value();
    if (req.get('x-internal-key') !== key) {
        return res.status(401).json({ error: 'unauthorized' });
    }
    const { uid } = req.body || {};
    if (!uid) {
        return res.status(400).json({ error: 'uid required' });
    }
    try {
        const user = await admin.auth().getUser(uid);
        const claims = user.customClaims || {};
        claims.roles = { ...(claims.roles || {}), admin: true };
        await admin.auth().setCustomUserClaims(uid, claims);
        v2_1.logger.info(`Bootstrap admin role granted to user ${uid}`);
        return res.json({ ok: true, claims });
    }
    catch (error) {
        v2_1.logger.error('Error in bootstrap admin:', error);
        return res.status(500).json({ error: 'Failed to grant admin role' });
    }
});
// (C) 역할 회수 (Callable)
exports.revokeRole = (0, https_1.onCall)({ secrets: [INTERNAL_KEY] }, async (req) => {
    const { uid, role } = req.data || {};
    const caller = req.auth;
    if (!caller?.token?.roles?.admin) {
        throw new https_1.HttpsError('permission-denied', 'admin only');
    }
    if (!uid || !role) {
        throw new https_1.HttpsError('invalid-argument', 'uid, role required');
    }
    try {
        const user = await admin.auth().getUser(uid);
        const claims = user.customClaims || {};
        const roles = { ...(claims.roles || {}) };
        delete roles[role];
        claims.roles = roles;
        await admin.auth().setCustomUserClaims(uid, claims);
        v2_1.logger.info(`Role ${role} revoked from user ${uid} by ${caller.uid}`);
        return { ok: true, claims };
    }
    catch (error) {
        v2_1.logger.error('Error revoking role:', error);
        throw new https_1.HttpsError('internal', 'Failed to revoke role');
    }
});
// (D) 사용자 클레임 조회 (Callable)
exports.getUserClaims = (0, https_1.onCall)({ secrets: [INTERNAL_KEY] }, async (req) => {
    const { uid } = req.data || {};
    const caller = req.auth;
    if (!caller?.token?.roles?.admin) {
        throw new https_1.HttpsError('permission-denied', 'admin only');
    }
    if (!uid) {
        throw new https_1.HttpsError('invalid-argument', 'uid required');
    }
    try {
        const user = await admin.auth().getUser(uid);
        const claims = user.customClaims || {};
        return { ok: true, claims };
    }
    catch (error) {
        v2_1.logger.error('Error getting user claims:', error);
        throw new https_1.HttpsError('internal', 'Failed to get user claims');
    }
});
// (E) 현재 사용자 역할 조회 (Callable)
exports.getRoles = (0, https_1.onCall)(async (req) => {
    const caller = req.auth;
    if (!caller) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    try {
        const user = await admin.auth().getUser(caller.uid);
        const claims = user.customClaims || {};
        return { ok: true, roles: claims.roles || {} };
    }
    catch (error) {
        v2_1.logger.error('Error getting roles:', error);
        throw new https_1.HttpsError('internal', 'Failed to get roles');
    }
});
