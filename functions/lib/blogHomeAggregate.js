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
exports.rebuildBlogHome = void 0;
require("./_admin");
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
exports.rebuildBlogHome = (0, firestore_1.onDocumentWritten)("clubs/{clubId}/blog/{postId}", async (e) => {
    const clubId = e.params.clubId;
    // 최신 12개 공개글
    const postsSnap = await db.collection(`clubs/${clubId}/blog`)
        .where("published", "==", true)
        .orderBy("createdAt", "desc")
        .limit(12)
        .get();
    const items = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    // 대표 이미지: heroUrl 또는 본문 첫 <img>
    const heroUrl = items.find(p => p.heroUrl)?.heroUrl ||
        extractFirstImageUrl(items[0]?.content || items[0]?.contentHtml) || null;
    // 태그 집계
    const tagCount = {};
    for (const p of items) {
        (p.tags || []).forEach((t) => { tagCount[t] = (tagCount[t] || 0) + 1; });
    }
    const tags = Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([name, count]) => ({ name, count }));
    // ✅ 올바른 문서 경로 (4개 세그먼트): clubs/{clubId}/pages/blogHome
    await db.doc(`clubs/${clubId}/pages/blogHome`).set({
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        heroUrl,
        latest: items.map(p => ({
            id: p.id, title: p.title, summary: p.summary || "", createdAt: p.createdAt || null,
            heroUrl: p.heroUrl || extractFirstImageUrl(p.content || p.contentHtml) || null,
            tags: p.tags || []
        })),
        tags
    }, { merge: true });
});
function extractFirstImageUrl(html) {
    if (!html)
        return null;
    const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    return m ? m[1] : null;
}
