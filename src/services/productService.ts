import { addDoc, collection, serverTimestamp, GeoPoint } from "firebase/firestore";
import { db, auth } from "@/firebase";
import type { ProductDoc } from "@/types/product";

// Firebase Storage 사용 여부
const USE_STORAGE = false; // 강제로 false로 설정 (환경변수 문제 우회)
console.log("[ENV] USE_STORAGE raw/bool =>", "false", USE_STORAGE);

export type NewProductInput = {
  title: string;
  price: number;
  description?: string;
  images?: string[];
  sellerId: string;
  status: "active" | "sold";
  location?: GeoPoint;
  region?: {
    si?: string;
    gu?: string;
    dong?: string;
    full?: string;
    provider?: "kakao" | "none";
  };
};

export async function createProduct(data: {
  title: string; price: number | string; description?: string; images?: string[];
  lat?: number; lng?: number; regionText?: string;
}) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("로그인이 필요합니다.");

  let location: GeoPoint | undefined;
  if (typeof data.lat === "number" && !Number.isNaN(data.lat) && typeof data.lng === "number" && !Number.isNaN(data.lng)) {
    location = new GeoPoint(data.lat, data.lng);
  }

  const payload: ProductDoc = {
    title: data.title,
    price: Number(data.price),
    description: data.description ?? "",
    images: data.images ?? [],
    sellerId: uid,
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...(location ? { location } : {}),
    ...(data.regionText ? { region: { full: data.regionText, provider: "kakao" } } : {}),
  };

  const ref = await addDoc(collection(db, "products"), payload);
  return ref.id;
}

export async function createProductWithStorage(input: NewProductInput) {
  try {
    const doc = {
      title: input.title,
      price: input.price,
      description: input.description || "",
      images: input.images || [],
      sellerId: input.sellerId,
      status: input.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(input.location ? { location: input.location } : {}),
      ...(input.region ? { region: input.region } : {}),
    };

    const ref = await addDoc(collection(db, "products"), doc);
    return { id: ref.id, ...doc };
  } catch (error) {
    console.error("상품 생성 실패:", error);
    throw error;
  }
}

export async function createProductNoImage(input: {
  title: string;
  price: number;
  location?: { lat: number; lng: number; address?: string | null };
  ai?: any;
  category?: string | null;
  description?: string | null;
}) {
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");

  const doc = {
    title: input.title,
    price: input.price,
    category: input.category ?? null,
    description: input.description ?? null,
    images: [],              // 스토리지 없이 빈 배열
    sellerId: user.uid,
    status: "active",
    location: input.location ?? null, // {lat, lng, address}
    ai: input.ai ?? null,             // 분석 결과 JSON 저장
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, "products"), doc);
  return { id: ref.id, ...doc };
} 