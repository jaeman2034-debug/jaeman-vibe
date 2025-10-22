import "./_admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import { tmpdir } from "os";
import { join } from "path";
import { writeFile, rm } from "fs/promises";
import { spawn } from "child_process";
import ffmpeg from "@ffmpeg-installer/ffmpeg";
const db = admin.firestore();
const bucket = admin.storage().bucket();
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

async function genImage(client: OpenAI, prompt: string, size: "1200x675"|"800x800") {
  const r = await client.images.generate({ 
    model: "dall-e-3", 
    prompt, 
    size: size === "1200x675" ? "1792x1024" : "1024x1024", 
    response_format: "b64_json" 
  });
  const b64 = r.data[0].b64_json!;
  return Buffer.from(b64, "base64");
}

async function execFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const p = spawn(ffmpeg.path, args, { windowsHide: true });
    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(err || `ffmpeg exit ${code}`))));
  });
}

export const aiGenerateClubMedia = onCall({ secrets: [OPENAI_API_KEY] }, async (req) => {
  const { clubId, memo, sport = "soccer", makeVideo = true } = req.data || {};
  if (!req.auth?.uid) throw new HttpsError("unauthenticated", "LOGIN_REQUIRED");
  if (!clubId || !memo) throw new HttpsError("invalid-argument", "MISSING_ARGUMENTS");

  try {
    const client = new OpenAI({ apiKey: OPENAI_API_KEY.value() });
    const base =
      `스포츠 종목: ${sport}. 지역 아마추어 클럽 홍보용 사진. ` +
      `현장감 있는 사실적 사진풍, 한국어 텍스트 없음, 긍정/안전. 메모: ${memo}`;

    // 1) 이미지 3장 생성
    const [heroBuf, t1Buf, t2Buf] = await Promise.all([
      genImage(client, base + " / 16:9 배너", "1200x675"),
      genImage(client, base + " / 1:1 썸네일 A", "800x800"),
      genImage(client, base + " / 1:1 썸네일 B", "800x800"),
    ]);

    // 2) Storage 업로드
    const ts = Date.now();
    const heroFile   = bucket.file(`blogs/${clubId}/hero_${ts}.jpg`);
    const thumb1File = bucket.file(`blogs/${clubId}/thumb1_${ts}.jpg`);
    const thumb2File = bucket.file(`blogs/${clubId}/thumb2_${ts}.jpg`);
    await Promise.all([
      heroFile.save(heroBuf,   { contentType: "image/jpeg" }),
      thumb1File.save(t1Buf,   { contentType: "image/jpeg" }),
      thumb2File.save(t2Buf,   { contentType: "image/jpeg" }),
    ]);
    const [heroUrl, t1Url, t2Url] = await Promise.all(
      [heroFile, thumb1File, thumb2File].map(f =>
        f.getSignedUrl({ action: "read", expires: Date.now() + 1000 * 60 * 60 * 24 * 365 }).then(([u]) => u)
      )
    );

    // 3) (옵션) 15초 비디오 합성
    let videoUrl: string | null = null;
    if (makeVideo) {
      const tmpH = join(tmpdir(), `h_${ts}.jpg`);
      const tmpA = join(tmpdir(), `a_${ts}.jpg`);
      const tmpB = join(tmpdir(), `b_${ts}.jpg`);
      const out  = join(tmpdir(), `out_${ts}.mp4`);
      await Promise.all([
        writeFile(tmpH, heroBuf),
        writeFile(tmpA, t1Buf),
        writeFile(tmpB, t2Buf),
      ]);

      // 5초+5초+5초 슬라이드, 1280x720, H264, yuv420p, +faststart
      const args = [
        "-y",
        "-loop","1","-t","5","-i", tmpH,
        "-loop","1","-t","5","-i", tmpA,
        "-loop","1","-t","5","-i", tmpB,
        "-filter_complex",
          "[0:v]scale=1280:720,setsar=1[v0];" +
          "[1:v]scale=1280:720,setsar=1[v1];" +
          "[2:v]scale=1280:720,setsar=1[v2];" +
          "[v0][v1][v2]concat=n=3:v=1:a=0,format=yuv420p,fps=30[v]",
        "-map","[v]",
        "-c:v","libx264",
        "-movflags","+faststart",
        out
      ];
      await execFfmpeg(args);
      const vFile = bucket.file(`blogs/${clubId}/reel_${ts}.mp4`);
      await vFile.save(await (await import("fs/promises")).readFile(out), { contentType: "video/mp4" });
      videoUrl = (await vFile.getSignedUrl({ action:"read", expires: Date.now()+1000*60*60*24*365 }))[0];

      // tmp 정리
      await Promise.allSettled([rm(tmpH).catch(()=>{}), rm(tmpA).catch(()=>{}), rm(tmpB).catch(()=>{}), rm(out).catch(()=>{})]);
    }

    // 4) 본문에 붙일 블록
    const html =
`## 🖼 AI 생성 이미지
<p><img src="${heroUrl}" alt="클럽 이미지" style="width:100%;max-width:800px;border-radius:8px;"></p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:20px 0;">
  <img src="${t1Url}" alt="썸네일1" style="width:100%;border-radius:8px;">
  <img src="${t2Url}" alt="썸네일2" style="width:100%;border-radius:8px;">
</div>
${videoUrl ? `\n## 🎞 하이라이트\n<video controls style="width:100%;max-width:800px;border-radius:8px;" src="${videoUrl}"></video>\n` : ""}`;

    return { heroUrl, thumbUrls: [t1Url, t2Url], videoUrl, html };
  } catch (e:any) {
    console.error("[MEDIA]", e);
    throw new HttpsError("failed-precondition", e?.message || "MEDIA_GENERATION_FAILED");
  }
});
