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
exports.aiGenerateClubMedia = void 0;
require("./_admin");
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const openai_1 = __importDefault(require("openai"));
const os_1 = require("os");
const path_1 = require("path");
const promises_1 = require("fs/promises");
const child_process_1 = require("child_process");
const ffmpeg_1 = __importDefault(require("@ffmpeg-installer/ffmpeg"));
const db = admin.firestore();
const bucket = admin.storage().bucket();
const OPENAI_API_KEY = (0, params_1.defineSecret)("OPENAI_API_KEY");
async function genImage(client, prompt, size) {
    const r = await client.images.generate({
        model: "dall-e-3",
        prompt,
        size: size === "1200x675" ? "1792x1024" : "1024x1024",
        response_format: "b64_json"
    });
    const b64 = r.data[0].b64_json;
    return Buffer.from(b64, "base64");
}
async function execFfmpeg(args) {
    return new Promise((resolve, reject) => {
        const p = (0, child_process_1.spawn)(ffmpeg_1.default.path, args, { windowsHide: true });
        let err = "";
        p.stderr.on("data", (d) => (err += d.toString()));
        p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(err || `ffmpeg exit ${code}`))));
    });
}
exports.aiGenerateClubMedia = (0, https_1.onCall)({ secrets: [OPENAI_API_KEY] }, async (req) => {
    const { clubId, memo, sport = "soccer", makeVideo = true } = req.data || {};
    if (!req.auth?.uid)
        throw new https_1.HttpsError("unauthenticated", "LOGIN_REQUIRED");
    if (!clubId || !memo)
        throw new https_1.HttpsError("invalid-argument", "MISSING_ARGUMENTS");
    try {
        const client = new openai_1.default({ apiKey: OPENAI_API_KEY.value() });
        const base = `스포츠 종목: ${sport}. 지역 아마추어 클럽 홍보용 사진. ` +
            `현장감 있는 사실적 사진풍, 한국어 텍스트 없음, 긍정/안전. 메모: ${memo}`;
        // 1) 이미지 3장 생성
        const [heroBuf, t1Buf, t2Buf] = await Promise.all([
            genImage(client, base + " / 16:9 배너", "1200x675"),
            genImage(client, base + " / 1:1 썸네일 A", "800x800"),
            genImage(client, base + " / 1:1 썸네일 B", "800x800"),
        ]);
        // 2) Storage 업로드
        const ts = Date.now();
        const heroFile = bucket.file(`blogs/${clubId}/hero_${ts}.jpg`);
        const thumb1File = bucket.file(`blogs/${clubId}/thumb1_${ts}.jpg`);
        const thumb2File = bucket.file(`blogs/${clubId}/thumb2_${ts}.jpg`);
        await Promise.all([
            heroFile.save(heroBuf, { contentType: "image/jpeg" }),
            thumb1File.save(t1Buf, { contentType: "image/jpeg" }),
            thumb2File.save(t2Buf, { contentType: "image/jpeg" }),
        ]);
        const [heroUrl, t1Url, t2Url] = await Promise.all([heroFile, thumb1File, thumb2File].map(f => f.getSignedUrl({ action: "read", expires: Date.now() + 1000 * 60 * 60 * 24 * 365 }).then(([u]) => u)));
        // 3) (옵션) 15초 비디오 합성
        let videoUrl = null;
        if (makeVideo) {
            const tmpH = (0, path_1.join)((0, os_1.tmpdir)(), `h_${ts}.jpg`);
            const tmpA = (0, path_1.join)((0, os_1.tmpdir)(), `a_${ts}.jpg`);
            const tmpB = (0, path_1.join)((0, os_1.tmpdir)(), `b_${ts}.jpg`);
            const out = (0, path_1.join)((0, os_1.tmpdir)(), `out_${ts}.mp4`);
            await Promise.all([
                (0, promises_1.writeFile)(tmpH, heroBuf),
                (0, promises_1.writeFile)(tmpA, t1Buf),
                (0, promises_1.writeFile)(tmpB, t2Buf),
            ]);
            // 5초+5초+5초 슬라이드, 1280x720, H264, yuv420p, +faststart
            const args = [
                "-y",
                "-loop", "1", "-t", "5", "-i", tmpH,
                "-loop", "1", "-t", "5", "-i", tmpA,
                "-loop", "1", "-t", "5", "-i", tmpB,
                "-filter_complex",
                "[0:v]scale=1280:720,setsar=1[v0];" +
                    "[1:v]scale=1280:720,setsar=1[v1];" +
                    "[2:v]scale=1280:720,setsar=1[v2];" +
                    "[v0][v1][v2]concat=n=3:v=1:a=0,format=yuv420p,fps=30[v]",
                "-map", "[v]",
                "-c:v", "libx264",
                "-movflags", "+faststart",
                out
            ];
            await execFfmpeg(args);
            const vFile = bucket.file(`blogs/${clubId}/reel_${ts}.mp4`);
            await vFile.save(await (await Promise.resolve().then(() => __importStar(require("fs/promises")))).readFile(out), { contentType: "video/mp4" });
            videoUrl = (await vFile.getSignedUrl({ action: "read", expires: Date.now() + 1000 * 60 * 60 * 24 * 365 }))[0];
            // tmp 정리
            await Promise.allSettled([(0, promises_1.rm)(tmpH).catch(() => { }), (0, promises_1.rm)(tmpA).catch(() => { }), (0, promises_1.rm)(tmpB).catch(() => { }), (0, promises_1.rm)(out).catch(() => { })]);
        }
        // 4) 본문에 붙일 블록
        const html = `## 🖼 AI 생성 이미지
<p><img src="${heroUrl}" alt="클럽 이미지" style="width:100%;max-width:800px;border-radius:8px;"></p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:20px 0;">
  <img src="${t1Url}" alt="썸네일1" style="width:100%;border-radius:8px;">
  <img src="${t2Url}" alt="썸네일2" style="width:100%;border-radius:8px;">
</div>
${videoUrl ? `\n## 🎞 하이라이트\n<video controls style="width:100%;max-width:800px;border-radius:8px;" src="${videoUrl}"></video>\n` : ""}`;
        return { heroUrl, thumbUrls: [t1Url, t2Url], videoUrl, html };
    }
    catch (e) {
        console.error("[MEDIA]", e);
        throw new https_1.HttpsError("failed-precondition", e?.message || "MEDIA_GENERATION_FAILED");
    }
});
