import "./_admin";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
const db = admin.firestore();

export const rebuildBlogHome = onDocumentWritten("clubs/{clubId}/blog/{postId}", async (e) => {
  const clubId = e.params.clubId as string;

  // 최신 12개 공개글
  const postsSnap = await db.collection(`clubs/${clubId}/blog`)
    .where("published","==", true)
    .orderBy("createdAt","desc")
    .limit(12)
    .get();

  const items = postsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
  // 대표 이미지: heroUrl 또는 본문 첫 <img>
  const heroUrl =
    items.find(p => p.heroUrl)?.heroUrl ||
    extractFirstImageUrl(items[0]?.content || items[0]?.contentHtml) || null;

  // 태그 집계
  const tagCount: Record<string, number> = {};
  for (const p of items) {
    (p.tags || []).forEach((t: string) => { tagCount[t] = (tagCount[t] || 0) + 1; });
  }
  const tags = Object.entries(tagCount)
    .sort((a,b) => b[1]-a[1])
    .slice(0, 20)
    .map(([name,count]) => ({ name, count }));

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

function extractFirstImageUrl(html?: string): string | null {
  if (!html) return null;
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}
