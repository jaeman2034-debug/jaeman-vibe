import { getFirestore, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";

export type LatLng = { lat: number; lng: number };

function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371; // km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 = Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1 + s2));
}

export async function fetchWithinRadius(collectionName: string, center: LatLng, radiusKm: number) {
  // Firestore는 다중 필드 범위 쿼리가 제한적이므로 lat 범위로 1차, lng는 클라이언트 필터
  const latDelta = (radiusKm / 111); // 위도 1도 ≈ 111km
  const minLat = center.lat - latDelta;
  const maxLat = center.lat + latDelta;

  const db = getFirestore();
  const ref = collection(db, collectionName);
  const q1 = query(ref, where("lat", ">=", minLat), where("lat", "<=", maxLat), limit(500));
  const snap = await getDocs(q1);

  const results: Array<{ id: string; title: string; lat: number; lng: number; distanceKm: number }> = [];
  snap.forEach((d) => {
    const v = d.data() as any;
    if (typeof v.lat !== "number" || typeof v.lng !== "number") return;
    const dist = haversineKm(center, { lat: v.lat, lng: v.lng });
    if (dist <= radiusKm) {
      results.push({ id: d.id, title: v.title || v.name || "Untitled", lat: v.lat, lng: v.lng, distanceKm: dist });
    }
  });

  results.sort((a, b) => a.distanceKm - b.distanceKm);
  return results.slice(0, 50);
} 