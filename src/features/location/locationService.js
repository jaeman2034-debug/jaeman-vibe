import { GeoPoint } from "firebase/firestore";
export function getCurrentLocation(timeoutMs = 8000) { return new Promise((resolve, reject) => { if (!navigator.geolocation)
    return reject(new Error("geolocation-unsupported")); navigator.geolocation.getCurrentPosition((pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }), (err) => reject(err), { enableHighAccuracy: true, maximumAge: 30000, timeout: timeoutMs }); }); }
export function toGeoPoint({ lat, lng }) { return new GeoPoint(lat, lng); } /** ?�버 ?�록??/api/kakao/coord2region?x=lng&y=lat) ?�용. ?�으�?null */
export async function reverseGeocode({ lat, lng }) { try {
    const r = await fetch(`/api/kakao/coord2region?x=${lng}&y=${lat}`);
    if (!r.ok)
        throw new Error(String(r.status));
    const j = await r.json();
    const d = j?.documents?.[0];
    if (!d)
        return null;
    return { si: d.region_1depth_name, gu: d.region_2depth_name, dong: d.region_3depth_name ?? d.region_3depth_h_name, full: [d.region_1depth_name, d.region_2depth_name, d.region_3depth_name ?? d.region_3depth_h_name].filter(Boolean).join(" "), provider: "kakao", };
}
catch {
    return null;
} }
export function kakaoMapLink(title, p) { return `https://map.kakao.com/link/map/${encodeURIComponent(title)},${p.lat},${p.lng}`; }
export function googleMapLink(p) { return `https://www.google.com/maps?q=${p.lat},${p.lng}`; }
