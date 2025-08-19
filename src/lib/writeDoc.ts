import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

export type BaseDoc = {
  title: string;
  imageUrl?: string;
  price?: number;
  location?: string;
  category?: string;
  tags?: string[];
};

export async function createDoc(
  collectionName: "products" | "meetings" | "jobs",
  data: BaseDoc,
  ownerId: string
) {
  const db = getFirestore();
  const doc = {
    ...data,
    ownerId,
    createdAt: serverTimestamp(),     // 🔒 rules에서 request.time 요구
    keywords: buildKeywords(data),    // 🔎 자동완성 정확도 향상
  };
  return addDoc(collection(db, collectionName), doc);
}

function buildKeywords(d: BaseDoc): string[] {
  const parts = [
    d.title,
    d.category,
    d.location,
    ...(d.tags ?? []),
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());

  // 간단 n-gram prefix
  const tokens = new Set<string>();
  for (const p of parts) {
    const words = p.split(/[^a-z0-9가-힣]+/i).filter(Boolean);
    for (const w of words) {
      tokens.add(w);
      for (let i = 1; i <= Math.min(w.length, 10); i++) {
        tokens.add(w.slice(0, i));
      }
    }
  }
  return Array.from(tokens).slice(0, 200);
} 