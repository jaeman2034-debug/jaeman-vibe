import "./firebaseAdmin";
import "./globalOptions";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const N8N_WEBHOOK = defineSecret("N8N_WEBHOOK_TEAM_BLOG_SYNC");
const INTERNAL_KEY = defineSecret("INTERNAL_KEY");

function stripBlog(pub: any) {
  if (!pub) return {};
  const { blog, ...rest } = pub;
  return rest;
}
function buildPayload(teamId: string, pub: any) {
  return {
    teamId,
    name: pub?.name ?? "",
    sportType: pub?.sportType ?? "soccer",
    region: pub?.region ?? "KR",
    logoUrl: pub?.logoUrl ?? "",
    coverUrl: pub?.coverUrl ?? "",
    tagline: pub?.tagline ?? "",
    description: pub?.description ?? "",
    schedule: pub?.schedule ?? {},
    contact: pub?.contact ?? {},
    dues: pub?.dues ?? {},
    gallery: pub?.gallery ?? [],
    achievements: pub?.achievements ?? [],
    provider: pub?.blog?.provider ?? "gh_pages",
  };
}

// 공개 정보 변경 → n8n 호출 → blog.url 저장
export const onTeamPublicWrite = onDocumentWritten(
  { document: "teams/{teamId}", secrets: [N8N_WEBHOOK, INTERNAL_KEY] },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    if (!after) return; // 삭제 등

    // blog 필드 변경만이면 스킵 (무한루프 방지)
    if (JSON.stringify(stripBlog(before?.public)) === JSON.stringify(stripBlog(after.public))) return;

    const teamId = event.params.teamId;
    const payload = buildPayload(teamId, after.public || {});
    try {
      const res = await fetch(N8N_WEBHOOK.value(), {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-internal-key": INTERNAL_KEY.value() 
        },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      const { blogUrl, provider, providerId } = resData || {};
      if (blogUrl) {
        const db = getFirestore();
        await db.doc(`teams/${teamId}`).set(
          {
            public: {
              ...after.public,
              blog: {
                ...(after.public?.blog || {}),
                url: blogUrl,
                provider: provider || payload.provider,
                providerId: providerId || null,
                updatedAt: FieldValue.serverTimestamp(),
              },
            },
          },
          { merge: true }
        );
      }
      console.log("n8n sync ok", { teamId, blogUrl });
    } catch (e: any) {
      console.error("n8n sync error", e?.message || e);
    }
  }
);

// 수동 갱신 버튼용 Callable (프론트엔드 호환)
export const syncTeamBlog = onCall(
  { secrets: [N8N_WEBHOOK, INTERNAL_KEY] },
  async (req) => {
    if (!req.auth) throw new HttpsError("unauthenticated", "need auth");
    const teamId = String((req.data as any)?.teamId || "");
    if (!teamId) throw new HttpsError("invalid-argument", "teamId required");

    const db = getFirestore();
    const teamRef = db.doc(`teams/${teamId}`);
    const teamSnap = await teamRef.get();
    if (!teamSnap.exists) throw new HttpsError("not-found", "team not found");

    // 권한(오너/어드민) 체크
    const memSnap = await db.doc(`teams/${teamId}/members/${req.auth.uid}`).get();
    const roles = (memSnap.data()?.roles || []) as string[];
    if (!roles.includes("owner") && !roles.includes("admin")) {
      throw new HttpsError("permission-denied", "need admin");
    }

    const pub = (teamSnap.data() as any)?.public || {};
    const payload = buildPayload(teamId, pub);
    const res = await fetch(N8N_WEBHOOK.value(), {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-internal-key": INTERNAL_KEY.value() 
      },
      body: JSON.stringify(payload)
    });
    const resData = await res.json();
    const { blogUrl, provider, providerId } = resData || {};
    if (blogUrl) {
      await teamRef.set(
        {
          public: {
            ...pub,
            blog: {
              ...(pub.blog || {}),
              url: blogUrl,
              provider: provider || payload.provider,
              providerId: providerId || null,
              updatedAt: FieldValue.serverTimestamp(),
            },
          },
        },
        { merge: true }
      );
    }
    return { blogUrl, provider, providerId };
  }
);

// HTTP 엔드포인트 버전 (GET/OPTIONS 흡수용)
export const syncTeamBlogHttp = onRequest(
  { secrets: [N8N_WEBHOOK, INTERNAL_KEY] },
  async (req, res) => {
    if (req.method === "GET") return res.status(200).send("ok");     // 헬스체크 무시
    if (req.method === "OPTIONS") return res.status(204).send("");   // CORS 프리플라이트 무시
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const teamId = String(body?.teamId || "");
      if (!teamId) {
        return res.status(400).json({ error: "teamId required" });
      }

      const db = getFirestore();
      const teamRef = db.doc(`teams/${teamId}`);
      const teamSnap = await teamRef.get();
      if (!teamSnap.exists) {
        return res.status(404).json({ error: "team not found" });
      }

      const pub = (teamSnap.data() as any)?.public || {};
      const payload = buildPayload(teamId, pub);
      
      const fetchRes = await fetch(N8N_WEBHOOK.value(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": INTERNAL_KEY.value(),
        },
        body: JSON.stringify(payload)
      });
      
      const resData = await fetchRes.json();
      const { blogUrl, provider, providerId } = resData || {};
      if (blogUrl) {
        await teamRef.set(
          {
            public: {
              ...pub,
              blog: {
                ...(pub.blog || {}),
                url: blogUrl,
                provider: provider || payload.provider,
                providerId: providerId || null,
                updatedAt: FieldValue.serverTimestamp(),
              },
            },
          },
          { merge: true }
        );
      }
      
      res.status(200).json({ blogUrl, provider, providerId });
    } catch (error: any) {
      console.error("syncTeamBlogHttp error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);