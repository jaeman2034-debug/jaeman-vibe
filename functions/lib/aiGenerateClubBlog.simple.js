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
exports.aiGenerateClubBlogSimple = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
if (!admin.apps.length)
    admin.initializeApp();
const db = admin.firestore();
exports.aiGenerateClubBlogSimple = (0, https_1.onCall)(async (req) => {
    const uid = req.auth?.uid;
    if (!uid)
        throw new Error("UNAUTHENTICATED");
    const { clubId, memo } = req.data || {};
    if (!clubId || !memo)
        throw new Error("INVALID_ARGUMENT");
    // 서버 측: 클럽 오너/관리자 권한 체크
    const clubSnap = await db.doc(`clubs/${clubId}`).get();
    if (!clubSnap.exists)
        throw new Error("NOT_FOUND");
    const club = clubSnap.data();
    const isAdmin = club.ownerUid === uid || (Array.isArray(club.admins) && club.admins.includes(uid));
    if (!isAdmin)
        throw new Error("PERMISSION_DENIED");
    // 간단한 AI 응답 (실제로는 OpenAI API 호출)
    const data = {
        title: `[AI 생성] ${memo}`,
        summary: `${memo}에 대한 공지사항입니다.`,
        tags: ["공지", "모집", "클럽"],
        content_markdown: `# ${memo}\n\n안녕하세요! ${memo}에 대해 알려드립니다.\n\n## 📅 일정\n- 날짜: 추후 공지\n- 시간: 추후 공지\n- 장소: 추후 공지\n\n## 📝 참가 방법\n1. 클럽에 가입\n2. 참가 신청\n3. 확인 대기\n\n## 📞 문의\n클럽 관리자에게 문의해주세요.\n\n감사합니다!`
    };
    return data;
});
