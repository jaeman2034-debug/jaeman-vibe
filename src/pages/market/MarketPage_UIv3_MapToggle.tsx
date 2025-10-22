import React, { useEffect, useMemo, useRef, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase";
  query,
  orderBy,
  type Firestore,
  type DocumentData,
} from "firebase/firestore";

/** =========================
 *  ?îß ?òÍ≤ΩÎ≥Ä?? *  - .env:  VITE_KAKAO_MAP_APP_KEY=Ïπ¥Ïπ¥?§Îßµ?±ÌÇ§
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
  // Í∏∞Ì? ?ÑÎìú ?êÏú†Î°?≤å ?ïÏû• Í∞Ä??};

declare global {
  interface Window {
    kakao?: any;
  }
}

/** -----------------------------------------------------------
 *  Kakao SDK Î°úÎçî (autoload=false)
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

/** Í±∞Î¶¨ Í≥ÑÏÇ∞ (?òÎ≤Ñ?¨Ïù∏) - km */
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

/** Í∞ÄÍ≤??¨Îß∑ */
const money = (n?: number) =>
  typeof n === "number" ? n.toLocaleString("ko-KR") + "?? : "Í∞ÄÍ≤©Î¨∏??;

/** ?ÅÌÉú Î∞∞Ï? ?âÏÉÅ */
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

/** Î©îÏù∏ Ïª¥Ìè¨?åÌä∏ */
const MarketPage_UIv3_MapToggle: React.FC = () => {
  // ?îå Firebase
  // ?ìç ?¨Ïö©???ÑÏπò
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null);
  const [geoErr, setGeoErr] = useState<string | null>(null);
  // ?ó∫Ô∏?Ïπ¥Ïπ¥?§Îßµ
  const [showMap, setShowMap] = useState<boolean>(false);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoRef = useRef<any | null>(null);

  // ?ì¶ ?∞Ïù¥??  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ?îé ?ÑÌÑ∞
  const [radiusKm, setRadiusKm] = useState<number>(10); // Í∏∞Î≥∏ 10km
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "reserved" | "sold">("all");
  const [textQuery, setTextQuery] = useState("");

  // ??Firestore ?§ÏãúÍ∞?Íµ¨ÎèÖ
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

  // ?ß≠ ?¨Ïö©???ÑÏû¨ ?ÑÏπò Í∞Ä?∏Ïò§Í∏?  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoErr("??Î∏åÎùº?∞Ï????ÑÏπò ?ïÎ≥¥Í∞Ä ÏßÄ?êÎêòÏßÄ ?äÏäµ?àÎã§.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoErr(null);
      },
      (err) => {
        console.warn("Geolocation error", err);
        setGeoErr("?ÑÏπò Í∂åÌïú??Í±∞Î??òÏóàÍ±∞ÎÇò ?ÑÏπòÎ•?Í∞Ä?∏Ïò¨ ???ÜÏäµ?àÎã§.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // ?îÅ ?ÑÌÑ∞??Î™©Î°ù
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

  // ?ó∫Ô∏?Îß?Ï¥àÍ∏∞??& ÎßàÏª§ Í∑∏Î¶¨Í∏?  useEffect(() => {
    if (!showMap) return;
    const appkey = import.meta.env.VITE_KAKAO_MAP_APP_KEY as string;
    if (!appkey) {
      console.warn("?†Ô∏è VITE_KAKAO_MAP_APP_KEYÍ∞Ä ?ÜÏäµ?àÎã§.");
      return;
    }
    let canceled = false;

    (async () => {
      try {
        const kakao = await loadKakaoSdk(appkey);
        if (canceled) return;

        // Map ?ùÏÑ±
        if (!mapRef.current && mapDivRef.current) {
          const center = myPos ?? { lat: 37.5665, lng: 126.9780 }; // ?úÏö∏ ?úÏ≤≠ fallback
          mapRef.current = new kakao.maps.Map(mapDivRef.current, {
            center: new kakao.maps.LatLng(center.lat, center.lng),
            level: 6,
          });
          infoRef.current = new kakao.maps.InfoWindow({ zIndex: 3 });
        }

        // Í∏∞Ï°¥ ÎßàÏª§ ?úÍ±∞
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

        // ?ÅÏó≠ ÎßûÏ∂§
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

  // ?ìç Ïπ¥Îìú ?¥Î¶≠ ??Îß??¨Ïª§??  const focusOnItem = async (it: MarketItem) => {
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
      {/* ?§Îçî */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-extrabold">Ï§ëÍ≥†Í±∞Îûò ÎßàÏºì</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowMap((s) => !s)}
            className="rounded-2xl px-4 py-2 text-sm font-semibold shadow-sm border hover:bg-slate-50"
          >
            {showMap ? "?ì¶ Î™©Î°ùÎß?Î≥¥Í∏∞" : "?ó∫Ô∏?Ïπ¥Ïπ¥?§Îßµ Î≥¥Í∏∞"}
          </button>

          <div className="flex items-center gap-2 rounded-2xl border px-3 py-2">
            <span className="text-xs text-slate-500">Î∞òÍ≤Ω</span>
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
            <option value="all">?ÑÏ≤¥ ?ÅÌÉú</option>
            <option value="open">?êÎß§Ï§?/option>
            <option value="reserved">?àÏïΩÏ§?/option>
            <option value="sold">Í±∞Îûò?ÑÎ£å</option>
          </select>
        </div>
      </div>

      {/* Í≤Ä??*/}
      <div className="mt-3">
        <input
          placeholder="?ÅÌíàÎ™ÖÏúºÎ°?Í≤Ä?â‚Ä?
          value={textQuery}
          onChange={(e) => setTextQuery(e.target.value)}
          className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      {/* ?ÑÏπò ?ÅÌÉú */}
      <div className="mt-2 text-xs text-slate-500">
        {myPos ? (
          <span>???ÑÏπò Í∏∞Ï? Î∞òÍ≤Ω {radiusKm}km</span>
        ) : geoErr ? (
          <span>?ÑÏπò ÎØ∏ÏÇ¨?? {geoErr}</span>
        ) : (
          <span>???ÑÏπò ?ïÏù∏ Ï§ë‚Ä?/span>
        )}
      </div>

      {/* Îß??†Í? ?ÅÏó≠ */}
      {showMap && (
        <div className="mt-4 overflow-hidden rounded-2xl border">
          <div ref={mapDivRef} style={{ width: "100%", height: 360 }} />
        </div>
      )}

      {/* Î™©Î°ù */}
      <div className="mt-6">
        {loading ? (
          <div className="rounded-2xl border p-6 text-sm text-slate-500">Î∂àÎü¨?§Îäî Ï§ë‚Ä?/div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border p-6 text-sm text-slate-500">Ï°∞Í±¥??ÎßûÎäî ?ÅÌíà???ÜÏäµ?àÎã§.</div>
        ) : (
          <ul className="flex flex-col gap-3">
            {filtered.map((it) => (
              <li
                key={it.id}
                className="rounded-2xl border p-3 hover:shadow-sm transition"
                onClick={() => focusOnItem(it)}
              >
                {/* 1Í∞úÏùò Í∑∏Î¶¨???àÏóê Ï¢åÏ∏° ?¥Î?ÏßÄ / ?∞Ï∏° ?çÏä§??*/}
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
                        <h3 className="line-clamp-1 text-base font-semibold">{it.title || "?úÎ™© ?ÜÏùå"}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${statusBadgeColor(it.status)}`}>
                          {labelStatus(it.status)}
                        </span>
                      </div>
                      <div className="mt-1 text-sm font-bold">{money(it.price)}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {myPos && it.location
                          ? `???ÑÏπòÎ°úÎ?????${haversineKm(myPos, it.location).toFixed(1)}km`
                          : it.location?.address || "?ÑÏπò ?ïÎ≥¥ ?ÜÏùå"}
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
                        ÏßÄ?ÑÏóê??Î≥¥Í∏∞
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

/** ?†Ìã∏: ?ÅÌÉú ?ºÎ≤® */
function labelStatus(s?: string) {
  switch (s) {
    case "open":
      return "?êÎß§Ï§?;
    case "reserved":
      return "?àÏïΩÏ§?;
    case "sold":
      return "Í±∞Îûò?ÑÎ£å";
    default:
      return s || "Í∏∞Ì?";
  }
}

/** Í∞ÑÎã®??XSS Î∞©Ï? ?†Ìã∏ (InfoWindow Ïª®ÌÖêÏ∏? */
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
