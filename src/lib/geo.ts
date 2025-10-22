// 거리(km) 계산: Haversine
export function distanceKm(a: {lat:number,lng:number}, b:{lat:number,lng:number}) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s1 = Math.sin(dLat/2) ** 2;
  const s2 = Math.cos((a.lat*Math.PI)/180) * Math.cos((b.lat*Math.PI)/180) * Math.sin(dLng/2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s1 + s2));
}

export type Place = {
  name: string;         // 예: "송산2동"
  region?: string;      // 예: "KR"
  lat: number;
  lng: number;
};

export function fmtDistance(km?: number) {
  if (km == null || isNaN(km)) return "";
  if (km < 1) return `${Math.round(km*1000)}m`;
  return `${km.toFixed(1)}km`;
}