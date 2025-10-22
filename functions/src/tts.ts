import * as functions from "firebase-functions";
import fetch from "node-fetch";
import { Storage } from "@google-cloud/storage";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const BUCKET = process.env.TTS_BUCKET || process.env.GCLOUD_STORAGE_BUCKET || "";

const storage = new Storage();
const bucket = storage.bucket(BUCKET);

// POST /makeTTS  { text: string; filename?: string; voice?: string }
export const makeTTS = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") return res.status(405).send("Only POST");
    const { text, filename = `yago_report_${Date.now()}.mp3`, voice = "alloy" } = req.body || {};
    if (!text) return res.status(400).json({ error: "text required" });

    console.log("?럺截?TTS ?붿껌 ?쒖옉:", { text: text.substring(0, 100) + "...", filename, voice });

    // 1) OpenAI TTS ?몄텧 (mp3 諛붿씠?덈━)
    const r = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: { "Authorization": `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "tts-1", input: text, voice, format: "mp3" })
    });
    if (!r.ok) {
      const e = await r.text();
      console.error("??OpenAI TTS ?ㅽ뙣:", e);
      return res.status(500).json({ error: "openai_failed", detail: e });
    }
    const buffer = Buffer.from(await r.arrayBuffer());

    console.log("??OpenAI TTS ?깃났, ?뚯씪 ?ш린:", buffer.length, "bytes");

    // 2) GCS ?낅줈??    const file = bucket.file(`reports/${filename}`);
    await file.save(buffer, {
      metadata: { contentType: "audio/mpeg", cacheControl: "public, max-age=3600" },
      resumable: false,
      public: true, // 怨듦컻濡??쒓났 (沅뚰븳 ?뺤콉??留욊쾶 議곗젙 媛??
    });
    const publicUrl = `https://storage.googleapis.com/${BUCKET}/reports/${encodeURIComponent(filename)}`;

    console.log("??GCS ?낅줈???꾨즺:", publicUrl);

    return res.json({ ok: true, url: publicUrl, filename, size: buffer.length });
  } catch (err: any) {
    console.error("??makeTTS error:", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
});
