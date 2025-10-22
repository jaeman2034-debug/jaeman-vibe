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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiGenerateClubBlog = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const openai_1 = __importDefault(require("openai"));
if (!admin.apps.length)
    admin.initializeApp();
const db = admin.firestore();
const OPENAI_API_KEY = (0, params_1.defineSecret)("OPENAI_API_KEY");
exports.aiGenerateClubBlog = (0, https_1.onCall)({ secrets: [OPENAI_API_KEY] }, async (req) => {
    const uid = req.auth?.uid;
    if (!uid)
        throw new Error("UNAUTHENTICATED");
    const { clubId, memo, style = "일반 공지", tone = "친근한", length = "중간", autopublish = false } = req.data || {};
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
    const client = new openai_1.default({ apiKey: OPENAI_API_KEY.value() });
    const prompt = [
        `당신은 한국어 스포츠 클럽의 블로그 카피라이터입니다.`,
        `입력 메모를 바탕으로 독자 친화적인 게시글을 만들어 주세요.`,
        `형식은 반드시 JSON으로 반환.`,
        `문체: ${tone}, 글 길이: ${length}, 용도: ${style}.`,
        `출력 스키마: { "title": string, "summary": string, "tags": string[], "content_markdown": string }`,
        `제목은 12~28자, 태그는 3~6개, 본문은 Markdown(H2/H3, 목록, 강조)로 구성.`,
        `클럽/모집/장소/시간/연락/주의사항 등 필요한 섹션을 자연스럽게 포함.`,
    ].join("\n");
    const r = await client.chat.completions.create({
        model: "gpt-4o-mini", // 경량/저비용 추천
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: prompt },
            { role: "user", content: `입력 메모:\n${memo}` },
        ],
        temperature: 0.7,
    });
    const data = JSON.parse(r.choices[0].message.content || "{}");
    // autopublish=true 면 서버에서 곧바로 문서 생성
    if (autopublish) {
        const ref = await db.collection(`clubs/${clubId}/blog`).add({
            clubId,
            title: data.title,
            summary: data.summary,
            tags: data.tags,
            content: data.content_markdown,
            authorUid: uid,
            published: true,
            pinned: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            generatedByAI: true,
        });
        return { id: ref.id, ...data };
    }
    // 아니면 프론트에 초안만 돌려줘서 사용자가 검토 후 발행
    return data;
});
