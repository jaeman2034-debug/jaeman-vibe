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
exports.onUserCreate = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const admin = __importStar(require("firebase-admin"));
const v2_1 = require("firebase-functions/v2");
const n8n_1 = require("./lib/n8n");
// Firebase Admin 초기화 (이미 초기화되어 있을 수 있음)
if (!admin.apps.length) {
    admin.initializeApp();
}
const users = () => admin.firestore().collection("users");
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
    try {
        const { uid, displayName, email, photoURL } = user;
        // Firestore에 사용자 문서 생성
        await users().doc(uid).set({
            displayName: displayName || null,
            email: email || null,
            photoURL: photoURL || null,
            role: "user",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
            marketingAccepted: false,
        });
        v2_1.logger.info("User created in Firestore", { uid, displayName, email });
        // n8n에 사용자 생성 이벤트 전송
        const webhookUrl = process.env.N8N_WEBHOOK_USER_CREATED;
        if (webhookUrl) {
            const success = await (0, n8n_1.postToN8N)(webhookUrl, {
                type: "user.created",
                uid,
                displayName,
                email,
                photoURL,
                createdAt: new Date().toISOString(),
            });
            if (success) {
                v2_1.logger.info("User creation event sent to n8n", { uid });
            }
            else {
                v2_1.logger.warn("Failed to send user creation event to n8n", { uid });
            }
        }
        else {
            v2_1.logger.warn("N8N_WEBHOOK_USER_CREATED not configured");
        }
    }
    catch (error) {
        v2_1.logger.error("Error in onUserCreate", {
            error: error.message,
            uid: user.uid
        });
    }
});
