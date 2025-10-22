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
exports.adminUpdateDoc = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const v2_1 = require("firebase-functions/v2");
// Firebase Admin 초기화 (이미 초기화되어 있을 수 있음)
if (!admin.apps.length) {
    admin.initializeApp();
}
exports.adminUpdateDoc = (0, https_1.onRequest)(async (req, res) => {
    // CORS 헤더 설정
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, x-internal-key");
    if (req.method === "OPTIONS") {
        res.status(204).send("");
        return;
    }
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }
    // 내부 키 인증
    const internalKey = req.headers["x-internal-key"];
    const expectedKey = process.env.INTERNAL_KEY || "internal_default_key_please_change";
    if (internalKey !== expectedKey) {
        v2_1.logger.warn("Unauthorized internal API access attempt", {
            ip: req.ip,
            userAgent: req.get("User-Agent")
        });
        res.status(401).json({ error: "Unauthorized" });
        return;
    }
    try {
        const { path, update } = req.body;
        if (!path || !update) {
            res.status(400).json({ error: "Missing path or update data" });
            return;
        }
        // Firestore 문서 업데이트
        await admin.firestore().doc(path).update(update);
        v2_1.logger.info("Document updated via internal API", { path, update });
        res.json({ ok: true, path, updatedAt: new Date().toISOString() });
    }
    catch (error) {
        v2_1.logger.error("Internal API error", { error: error.message, path: req.body?.path });
        res.status(500).json({ error: "Internal server error" });
    }
});
