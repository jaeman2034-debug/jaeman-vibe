import "./_admin";
import { onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import OpenAI from "openai";
const db = admin.firestore();
const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

// 간단한 금칙어
const BAD = ["욕설", "비속어", "성인", "도박", "혐오"]; // 필요시 확장

// 종목별 템플릿(확장 가능)
const SPORT_TEMPLATES: Record<string, string> = {
  soccer: "풋볼/축구",
  futsal: "풋살",
  basketball: "농구",
  baseball: "야구",
  tennis: "테니스",
  badminton: "배드민턴",
  tabletennis: "탁구",
  running: "러닝",
};

function isAdminOfClub(club: any, uid: string) {
  return club?.ownerUid === uid || (Array.isArray(club?.admins) && club.admins.includes(uid));
}

export const aiGenerateClubBlog = onCall({ secrets: [OPENAI_API_KEY] }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new Error("UNAUTHENTICATED");
  const { clubId, memo, sport = "soccer", style = "모집 공지", tone = "친근한", length = "중간", autopublish = false } = req.data || {};
  if (!clubId || !memo) throw new Error("INVALID_ARGUMENT");

  // rate limit (유저당 15초 쿨다운)
  const rlRef = db.doc(`rateLimits/${uid}`);
  const rlSnap = await rlRef.get();
  const last = rlSnap.exists ? rlSnap.data()?.lastCallAt?.toMillis?.() ?? rlSnap.data()?.lastCallAt : 0;
  const now = Date.now();
  if (last && now - Number(last) < 15_000) throw new Error("RATE_LIMIT");
  await rlRef.set({ lastCallAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

  // 클럽 권한/존재 확인
  const clubSnap = await db.doc(`clubs/${clubId}`).get();
  if (!clubSnap.exists) throw new Error("CLUB_NOT_FOUND");
  const club = clubSnap.data()!;
  const adminOK = isAdminOfClub(club, uid);

  // 간단 금칙어 필터
  if (BAD.some((w) => memo.includes(w))) throw new Error("BLOCKED_CONTENT");

  const client = new OpenAI({ apiKey: OPENAI_API_KEY.value() });
  const sportKo = SPORT_TEMPLATES[sport] || sport;

  const sys = [
    "당신은 한국어 스포츠 커뮤니티 블로그의 카피라이터입니다.",
    "아래 메모를 바탕으로 독자 친화적인 게시글을 작성하세요.",
    "반드시 JSON으로만 답하세요: {title, summary, tags, content_markdown, slug}",
    "title: 12~28자, summary: 1~2문장, tags: 3~6개(한글, 해시태그 없이),",
    "content_markdown: Markdown(H2/H3, 목록, 강조, 표)로 구성,",
    "slug: URL용 짧은 영문/숫자/하이픈(예: doosan-tryout-2025-03).",
    `종목: ${sportKo}, 문체: ${tone}, 글 길이: ${length}, 용도: ${style}.`,
    "모집/장소/시간/참가비/연락/주의/준비물/혜택 등을 자연스럽게 포함.",
  ].join("\n");

  const r = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.7,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: `메모:\n${memo}` },
    ],
  });

  const data = JSON.parse(r.choices[0].message.content || "{}");
  if (!data?.title || !data?.content_markdown) throw new Error("GEN_FAIL");

  if (autopublish && adminOK) {
    // 바로 발행(관리자만)
    const ref = await db.collection(`clubs/${clubId}/blog`).add({
      clubId,
      title: data.title,
      summary: data.summary || "",
      tags: Array.isArray(data.tags) ? data.tags.slice(0, 8) : [],
      content: data.content_markdown,
      slug: data.slug || null,
      authorUid: uid,
      published: true,
      pinned: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      generatedByAI: true,
      sport,
    });
    return { id: ref.id, ...data, published: true };
  } else {
    // 대기열(일반 유저도 가능 → 관리자가 승인)
    const ref = await db.collection(`clubs/${clubId}/blogPending`).add({
      clubId,
      title: data.title,
      summary: data.summary || "",
      tags: Array.isArray(data.tags) ? data.tags.slice(0, 8) : [],
      content: data.content_markdown,
      slug: data.slug || null,
      authorUid: uid,
      published: false,
      pinned: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      generatedByAI: true,
      sport,
      status: "pending",
    });
    return { id: ref.id, ...data, published: false, pending: true };
  }
});

// 대기열 승인/거절 (관리자만)
export const approvePendingBlog = onCall({ secrets: [OPENAI_API_KEY] }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new Error("UNAUTHENTICATED");
  const { clubId, pendingId, approve } = req.data || {};
  if (!clubId || !pendingId) throw new Error("INVALID_ARGUMENT");

  const clubSnap = await db.doc(`clubs/${clubId}`).get();
  if (!clubSnap.exists) throw new Error("CLUB_NOT_FOUND");
  if (!isAdminOfClub(clubSnap.data(), uid)) throw new Error("PERMISSION_DENIED");

  const pRef = db.doc(`clubs/${clubId}/blogPending/${pendingId}`);
  const pSnap = await pRef.get();
  if (!pSnap.exists) throw new Error("NOT_FOUND");
  const post = pSnap.data()!;

  if (!approve) {
    await pRef.update({ status: "rejected" });
    return { ok: true, rejected: true };
  }

  const bRef = await db.collection(`clubs/${clubId}/blog`).add({
    ...post,
    published: true,
    status: "published",
    approvedBy: uid,
    approvedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await pRef.update({ status: "approved", publishedId: bRef.id });
  return { ok: true, publishedId: bRef.id };
});
