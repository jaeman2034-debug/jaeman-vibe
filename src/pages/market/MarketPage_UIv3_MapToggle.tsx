import React, { useEffect, useMemo, useRef, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase";
  query,
  orderBy,
  type Firestore,
  type DocumentData,
} from "firebase/firestore";

/** =========================
 *  ?�� ?�경변?? *  - .env:  VITE_KAKAO_MAP_APP_KEY=카카?�맵?�키
 *           VITE_FIREBASE_API_KEY=...
 *           VITE_FIREBASE_AUTH_DOMAIN=...
 *           VITE_FIREBASE_PROJECT_ID=...
 *           VITE_FIREBASE_STORAGE_BUCKET=...
 *           VITE_FIREBASE_MESSAGING_SENDER_ID=...
 *           VITE_FIREBASE_APP_ID=...
 * ========================== */

type MarketItem = {
  id: string;
  title: string;
  price?: number;
  imageUrl?: string;
  status?: "open" | "reserved" | "sold" | "draft" | string;
  createdAt?: any;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  } | null;
  // 기�? ?�드 ?�유�?�� ?�장 가??};

declare global {
  interface Window {
    kakao?: any;
  }
}

/** -----------------------------------------------------------
 *  Kakao SDK 로더 (autoload=false)
 * ----------------------------------------------------------*/
async function loadKakaoSdk(appkey: string): Promise<typeof window.kakao> {
  if (window.kakao && window.kakao.maps) return window.kakao;
  await new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("kakao-map-sdk");
    if (existing) {
      (window as any).kakao?.maps?.load(() => resolve());
      return;
    }
    const script = document.createElement("script");
    script.id = "kakao-map-sdk";
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&libraries=services&autoload=false`;
    script.onload = () => {
      try {
        window.kakao.maps.load(() => resolve());
      } catch (e) {
        reject(e);
      }
    };
    script.onerror = () => reject(new Error("Failed to load Kakao Maps SDK"));
    document.head.appendChild(script);
  });
  return window.kakao!;
}

/** 거리 계산 (?�버?�인) - km */
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sin1 = Math.sin(dLat / 2);
  const sin2 = Math.sin(dLng / 2);
  const h = sin1 * sin1 + Math.cos(lat1) * Math.cos(lat2) * sin2 * sin2;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

/** 가�??�맷 */
const money = (n?: number) =>
  typeof n === "number" ? n.toLocaleString("ko-KR") + "?? : "가격문??;

/** ?�태 배�? ?�상 */
function statusBadgeColor(s?: string) {
  switch (s) {
    case "open":
      return "bg-emerald-100 text-emerald-700";
    case "reserved":
      return "bg-amber-100 text-amber-700";
    case "sold":
      return "bg-gray-200 text-gray-600";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

/** 메인 컴포?�트 */
const MarketPage_UIv3_MapToggle: React.FC = () => {
  // ?�� Firebase
  // ?�� ?�용???�치
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoErr, setGeoErr] = useState<string | null>(null);
  // ?���?카카?�맵
  const [showMap, setShowMap] = useState<boolean>(false);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoRef = useRef<any | null>(null);

  // ?�� ?�이??  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ?�� ?�터
  const [radiusKm, setRadiusKm] = useState<number>(10); // 기본 10km
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "reserved" | "sold">("all");
  const [textQuery, setTextQuery] = useState("");

  // ??Firestore ?�시�?구독
  useEffect(() => {
    setLoading(true);
    const col = collection(getFirestore(), "marketItems");
    const q = query(col, orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: MarketItem[] = [];
        snap.forEach((doc) => {
          const data = doc.data() as DocumentData;
          rows.push({
            id: doc.id,
            title: data.title ?? "",
            price: data.price ?? undefined,
            imageUrl: data.imageUrl ?? undefined,
            status: data.status ?? "open",
            createdAt: data.createdAt ?? null,
            location: data.location ?? null,
          });
        });
        setItems(rows);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore subscribe error:", err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [db]);

  // ?�� ?�용???�재 ?�치 가?�오�?  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoErr("??브라?��????�치 ?�보가 지?�되지 ?�습?�다.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoErr(null);
      },
      (err) => {
        console.warn("Geolocation error", err);
        setGeoErr("?�치 권한??거�??�었거나 ?�치�?가?�올 ???�습?�다.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // ?�� ?�터??목록
  const filtered = useMemo(() => {
    let list = items;
    if (statusFilter !== "all") list = list.filter((i) => i.status === statusFilter);
    if (textQuery.trim()) {
      const t = textQuery.trim().toLowerCase();
      list = list.filter((i) => i.title?.toLowerCase().includes(t));
    }
    if (myPos) {
      list = list.filter((i) =>
        i.location ? haversineKm(myPos, { lat: i.location.lat, lng: i.location.lng }) <= radiusKm : true
      );
    }
    return list;
  }, [items, statusFilter, textQuery, myPos, radiusKm]);

  // ?���?�?초기??& 마커 그리�?  useEffect(() => {
    if (!showMap) return;
    const appkey = import.meta.env.VITE_KAKAO_MAP_APP_KEY as string;
    if (!appkey) {
      console.warn("?�️ VITE_KAKAO_MAP_APP_KEY가 ?�습?�다.");
      return;
    }
    let canceled = false;

    (async () => {
      try {
        const kakao = await loadKakaoSdk(appkey);
        if (canceled) return;

        // Map ?�성
        if (!mapRef.current && mapDivRef.current) {
          const center = myPos ?? { lat: 37.5665, lng: 126.9780 }; // ?�울 ?�청 fallback
          mapRef.current = new kakao.maps.Map(mapDivRef.current, {
            center: new kakao.maps.LatLng(center.lat, center.lng),
            level: 6,
          });
          infoRef.current = new kakao.maps.InfoWindow({ zIndex: 3 });
        }

        // 기존 마커 ?�거
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        const map = mapRef.current;
        const bounds = new kakao.maps.LatLngBounds();

        filtered.forEach((it) => {
          if (!it.location) return;
          const pos = new kakao.maps.LatLng(it.location.lat, it.location.lng);
          const marker = new kakao.maps.Marker({ position: pos });
          marker.setMap(map);
          markersRef.current.push(marker);
          bounds.extend(pos);

          const html = `
            <div style="padding:8px 10px;">
              <div style="font-weight:600;margin-bottom:4px;">${escapeHtml(it.title || "")}</div>
              <div style="font-size:12px;margin-bottom:4px;">${money(it.price)}</div>
              ${
                it.imageUrl
                  ? `<img src="${escapeAttr(it.imageUrl)}" alt="" style="width:180px;height:120px;object-fit:cover;border-radius:8px;" />`
                  : ""
              }
            </div>
          `;
          window.kakao.maps.event.addListener(marker, "click", () => {
            infoRef.current?.setContent(html);
            infoRef.current?.open(map, marker);
          });
        });

        // ?�역 맞춤
        if (!bounds.isEmpty()) {
          map.setBounds(bounds, 20, 20, 20, 20);
        } else if (myPos) {
          map.setCenter(new kakao.maps.LatLng(myPos.lat, myPos.lng));
          map.setLevel(5);
        }
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      canceled = true;
    };
  }, [showMap, filtered, myPos]);

  // ?�� 카드 ?�릭 ??�??�커??  const focusOnItem = async (it: MarketItem) => {
    if (!it.location) return;
    if (!showMap) setShowMap(true);
    const kakao = await loadKakaoSdk(import.meta.env.VITE_KAKAO_MAP_APP_KEY as string);
    const map = mapRef.current;
    if (!map) return;
    const pos = new kakao.maps.LatLng(it.location.lat, it.location.lng);
    map.panTo(pos);
  };

  return (
    <div className="mx-auto max-w-4xl p-4">
      {/* ?�더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-extrabold">중고거래 마켓</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowMap((s) => !s)}
            className="rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm border hover:bg-slate-50"
          >
            {showMap ? "?�� 목록�?보기" : "?���?카카?�맵 보기"}
          </button>

          <div className="flex items-center gap-2 rounded-2xl border px-3 py-2">
            <span className="text-xs text-slate-500">반경</span>
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
            />
            <span className="text-xs font-medium">{radiusKm}km</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-2xl border px-3 py-2 text-sm"
          >
            <option value="all">?�체 ?�태</option>
            <option value="open">?�매�?/option>
            <option value="reserved">?�약�?/option>
            <option value="sold">거래?�료</option>
          </select>
        </div>
      </div>

      {/* 검??*/}
      <div className="mt-3">
        <input
          placeholder="?�품명으�?검?��?
          value={textQuery}
          onChange={(e) => setTextQuery(e.target.value)}
          className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      {/* ?�치 ?�태 */}
      <div className="mt-2 text-xs text-slate-500">
        {myPos ? (
          <span>???�치 기�? 반경 {radiusKm}km</span>
        ) : geoErr ? (
          <span>?�치 미사?? {geoErr}</span>
        ) : (
          <span>???�치 ?�인 중�?/span>
        )}
      </div>

      {/* �??��? ?�역 */}
      {showMap && (
        <div className="mt-4 overflow-hidden rounded-2xl border">
          <div ref={mapDivRef} style={{ width: "100%", height: 360 }} />
        </div>
      )}

      {/* 목록 */}
      <div className="mt-6">
        {loading ? (
          <div className="rounded-2xl border p-6 text-sm text-slate-500">불러?�는 중�?/div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border p-6 text-sm text-slate-500">조건??맞는 ?�품???�습?�다.</div>
        ) : (
          <ul className="flex flex-col gap-3">
            {filtered.map((it) => (
              <li
                key={it.id}
                className="rounded-2xl border p-3 hover:shadow-sm transition"
                onClick={() => focusOnItem(it)}
              >
                {/* 1개의 그리???�에 좌측 ?��?지 / ?�측 ?�스??*/}
                <div className="grid grid-cols-[120px_1fr] gap-3 sm:grid-cols-[160px_1fr]">
                  <div className="relative">
                    <img
                      src={it.imageUrl || "https://via.placeholder.com/300x200?text=No+Image"}
                      alt={it.title || ""}
                      className="h-[100px] w-[120px] sm:h-[120px] sm:w-[160px] rounded-xl object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="line-clamp-1 text-base font-semibold">{it.title || "?�목 ?�음"}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${statusBadgeColor(it.status)}`}>
                          {labelStatus(it.status)}
                        </span>
                      </div>
                      <div className="mt-1 text-sm font-bold">{money(it.price)}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {myPos && it.location
                          ? `???�치로�?????${haversineKm(myPos, it.location).toFixed(1)}km`
                          : it.location?.address || "?�치 ?�보 ?�음"}
                      </div>
                    </div>
                    {it.location && (
                      <button
                        className="mt-2 w-max rounded-xl border px-3 py-1 text-xs hover:bg-slate-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          focusOnItem(it);
                        }}
                      >
                        지?�에??보기
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MarketPage_UIv3_MapToggle;

/** ?�틸: ?�태 ?�벨 */
function labelStatus(s?: string) {
  switch (s) {
    case "open":
      return "?�매�?;
    case "reserved":
      return "?�약�?;
    case "sold":
      return "거래?�료";
    default:
      return s || "기�?";
  }
}

/** 간단??XSS 방�? ?�틸 (InfoWindow 컨텐�? */
function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
function escapeAttr(s: string) {
  return s.replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
