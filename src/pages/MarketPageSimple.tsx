// ?�� YAGO VIBE MarketPage (간단 버전 - 지??+ Firestore ?�동)
import React, { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { MapPin, List } from "lucide-react";
import { useNavigate } from "react-router-dom";

declare global {
  interface Window {
    kakao: any;
  }
}

type MarketItem = {
  id: string;
  title: string;
  price: number;
  desc?: string;
  description?: string;
  imageUrl?: string;
  fileUrl?: string;
  location?: {
    lat: number;
    lng: number;
    region?: string;
  };
  createdAt?: any;
};

export default function MarketPageSimple() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MarketItem[]>([]);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [mode, setMode] = useState<"list" | "map">("list");
  const [loading, setLoading] = useState(true);

  // Kakao 지??SDK 로드
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=***REMOVED***&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        console.log("??Kakao Map SDK Loaded");
      });
    };
  }, []);

  // Firestore ?�품 불러?�기
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("?�� Firestore ?�품 조회 ?�작...");
        const q = query(collection(db, "marketItems"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as MarketItem[];
        
        console.log(`??${data.length}�??�품 로드 ?�료`);
        setItems(data);
      } catch (err) {
        console.error("??Firestore Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ?�재 ?�치 가?�오�?  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          console.log("?�� ?�치 권한 ?�용??", pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn("?�️ ?�치 ?�근 ?�패:", err.message);
          // 기본 ?�치 (?�울)
          setPosition({ lat: 37.5665, lng: 126.9780 });
        }
      );
    } else {
      console.warn("?�️ Geolocation 미�???);
      setPosition({ lat: 37.5665, lng: 126.9780 });
    }
  }, []);

  // 지???�더�?  useEffect(() => {
    if (!position || !window.kakao?.maps || mode !== "map") return;

    const container = document.getElementById("market-map");
    if (!container) return;

    const options = {
      center: new window.kakao.maps.LatLng(position.lat, position.lng),
      level: 4,
    };
    const map = new window.kakao.maps.Map(container, options);

    // ???�치 마커
    new window.kakao.maps.Marker({
      map,
      position: new window.kakao.maps.LatLng(position.lat, position.lng),
      title: "???�치",
    });

    // ?�품 마커??    items.forEach((item) => {
      const lat = item.location?.lat || item.lat;
      const lng = item.location?.lng || item.lng;
      
      if (!lat || !lng) return;
      
      new window.kakao.maps.Marker({
        map,
        position: new window.kakao.maps.LatLng(lat, lng),
        title: item.title,
      });
    });
  }, [position, mode, items]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* ?�더 */}
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">?���?YAGO VIBE 마켓</h1>
            <p className="text-sm text-gray-500">?�포�??�품 거래</p>
          </div>
          <button
            onClick={() => setMode(mode === "list" ? "map" : "list")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow hover:shadow-md transition-all"
          >
            {mode === "list" ? <MapPin className="w-4 h-4" /> : <List className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {mode === "list" ? "지??보기" : "리스??보기"}
            </span>
          </button>
        </div>

        {/* 리스??�?*/}
        {mode === "list" && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">?�품??불러?�는 �?..</p>
              </div>
            ) : items.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-md p-12 text-center">
                <div className="text-6xl mb-4">?��</div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  ?�록???�품???�습?�다
                </h2>
                <p className="text-gray-500 mb-6">
                  �?번째 ?�품???�록?�보?�요!
                </p>
                <button
                  onClick={() => navigate("/market/create")}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  ?�품 ?�록?�기
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/product/${item.id}`)}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden cursor-pointer group"
                  >
                    {/* ?��?지 */}
                    <div className="aspect-video bg-gray-200 flex items-center justify-center">
                      {item.imageUrl || item.fileUrl ? (
                        <img
                          src={item.imageUrl || item.fileUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-6xl">?��</div>
                      )}
                    </div>

                    {/* ?�보 */}
                    <div className="p-4">
                      <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h2>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {item.desc || item.description || "?�명 ?�음"}
                      </p>

                      <div className="flex items-center justify-between">
                        <p className="text-xl font-bold text-green-600">
                          {item.price.toLocaleString()}??                        </p>

                        {item.location?.region && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span>{item.location.region}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 지??�?*/}
        {mode === "map" && (
          <div className="bg-white rounded-2xl shadow-md p-4">
            <div id="market-map" className="w-full h-[600px] rounded-xl"></div>
          </div>
        )}

        {/* ?�치 ?�보 */}
        {position ? (
          <p className="text-xs text-center text-gray-500">
            ?�� ?�재 ?�치: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
          </p>
        ) : (
          <p className="text-xs text-center text-gray-500">
            ?�� ???�치�?가?�오??�?..
          </p>
        )}
      </div>
    </div>
  );
}

