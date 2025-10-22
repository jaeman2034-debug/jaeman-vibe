import React, { useEffect, useMemo, useRef, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase";
  query,
  orderBy,
  updateDoc,
  doc,
  type Firestore,
  type DocumentData,
} from "firebase/firestore";

// =========================
// ?�� ?�경변???�정 ?�요
// =========================
// VITE_KAKAO_MAP_APP_KEY=카카?�앱??// VITE_FIREBASE_API_KEY=...
// VITE_FIREBASE_AUTH_DOMAIN=...
// VITE_FIREBASE_PROJECT_ID=...
// VITE_FIREBASE_STORAGE_BUCKET=...
// VITE_FIREBASE_MESSAGING_SENDER_ID=...
// VITE_FIREBASE_APP_ID=...

type MarketItem = {
  id: string;
  title: string;
  price?: number;
  imageUrl?: string;
  status?: "open" | "reserved" | "sold" | string;
  createdAt?: any;
  location?: { lat: number; lng: number; address?: string } | null;
  desc?: string;
};

declare global {
  interface Window {
    kakao?: any;
  }
}

function loadKakaoSdk(appkey: string): Promise<typeof window.kakao> {
  if (window.kakao && window.kakao.maps) return Promise.resolve(window.kakao);
  return new Promise((resolve, reject) => {
    const existing = document.getElementById("kakao-map-sdk");
    if (existing) {
      window.kakao.maps.load(() => resolve(window.kakao!));
      return;
    }
    const script = document.createElement("script");
    script.id = "kakao-map-sdk";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&libraries=services&autoload=false`;
    script.onload = () => window.kakao.maps.load(() => resolve(window.kakao!));
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

const MarketPage_UIv4_DetailModal: React.FC = () => {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [selected, setSelected] = useState<MarketItem | null>(null);
  const [showMap, setShowMap] = useState(false);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const q = query(collection(db, "marketItems"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr: MarketItem[] = [];
      snap.forEach((doc) => {
        arr.push({ id: doc.id, ...doc.data() } as MarketItem);
      });
      setItems(arr);
    });
    return () => unsub();
  }, [db]);

  // 카카?�맵 초기??  useEffect(() => {
    if (!showMap) return;
    (async () => {
      const kakao = await loadKakaoSdk(import.meta.env.VITE_KAKAO_MAP_APP_KEY);
      if (!mapDivRef.current) return;
      mapRef.current = new kakao.maps.Map(mapDivRef.current, {
        center: new kakao.maps.LatLng(37.5665, 126.9780),
        level: 6,
      });
      items.forEach((it) => {
        if (!it.location) return;
        const marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(it.location.lat, it.location.lng),
        });
        marker.setMap(mapRef.current);
      });
    })();
  }, [showMap, items]);

  // ?�� ?�태 변�?  const updateStatus = async (item: MarketItem, newStatus: string) => {
    await updateDoc(doc(db, "marketItems", item.id), { status: newStatus });
  };

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">중고거래 마켓</h1>
        <button
          onClick={() => setShowMap((s) => !s)}
          className="border rounded-2xl px-4 py-2 text-sm hover:bg-slate-50"
        >
          {showMap ? "목록 보기" : "지??보기"}
        </button>
      </div>

      {showMap ? (
        <div className="rounded-2xl border overflow-hidden">
          <div ref={mapDivRef} style={{ width: "100%", height: 400 }} />
        </div>
      ) : (
        <ul className="grid gap-3">
          {items.map((it) => (
            <li
              key={it.id}
              onClick={() => setSelected(it)}
              className="flex gap-3 rounded-2xl border p-3 hover:shadow-sm cursor-pointer"
            >
              <img
                src={it.imageUrl || "https://via.placeholder.com/150"}
                alt=""
                className="w-[120px] h-[100px] rounded-xl object-cover"
              />
              <div className="flex flex-col justify-between flex-1">
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{it.title}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        it.status === "open"
                          ? "bg-green-100 text-green-700"
                          : it.status === "reserved"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {labelStatus(it.status)}
                    </span>
                  </div>
                  <div className="text-sm font-bold mt-1">
                    {it.price ? `${it.price.toLocaleString()}?? : "가격문??}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ?�세보기 모달 */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-5 w-[90%] max-w-md relative">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 text-slate-500 hover:text-slate-700"
            >
              ??            </button>
            <img
              src={selected.imageUrl || "https://via.placeholder.com/400x300"}
              alt=""
              className="rounded-xl w-full h-[200px] object-cover mb-3"
            />
            <h2 className="text-lg font-bold mb-1">{selected.title}</h2>
            <p className="text-sm text-slate-600 mb-3">{selected.desc || "?�명 ?�음"}</p>
            <div className="text-base font-bold mb-3">
              ?�� {selected.price ? `${selected.price.toLocaleString()}?? : "가격문??}
            </div>

            <div className="flex flex-wrap gap-2">
              {["open", "reserved", "sold"].map((st) => (
                <button
                  key={st}
                  onClick={() => updateStatus(selected, st)}
                  className={`px-3 py-1 rounded-xl border text-sm ${
                    selected.status === st ? "bg-slate-800 text-white" : "hover:bg-slate-100"
                  }`}
                >
                  {labelStatus(st)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketPage_UIv4_DetailModal;

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
