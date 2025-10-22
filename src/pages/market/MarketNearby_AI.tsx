/**
 * ??AI + GPS 기반 주�? ?�품 추천
 * 기능:
 *  - ?�용?�의 ?�재 ?�치�??�인
 *  - Firestore?�서 autoTags + location 기반 근거�??�품 검?? *  - 거리 계산?�로 ?�동 ?�렬
 */

import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

type MarketItem = {
  id: string;
  title: string;
  price?: number;
  category?: string;
  autoTags?: string[];
  autoDescription?: string;
  description?: string;
  location?: { latitude: number; longitude: number };
  imageUrls?: string[];
  distance?: number;
};

export default function MarketNearby_AI() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [results, setResults] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [radius, setRadius] = useState<number>(20); // km

  // === 거리 계산 (Haversine 공식) ===
  const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // 지�?반�?�?(km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  // === ?�치 ?�청 ===
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setMsg("?�� GPS�??�용?????�습?�다. 브라?��??�서 ?�치 ?�비?��? ?�용?�주?�요.");
      return;
    }

    setMsg("?�� ?�재 ?�치�??�인?�는 �?..");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setMsg("???�치 ?�인 ?�료! 주�? ?�품??검?�합?�다.");
      },
      (err) => {
        console.error("?�치 ?�류:", err);
        setMsg("???�치 ?�보�?불러?????�습?�다. ?�치 권한???�용?�주?�요.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }, []);

  // === 주�? ?�품 검??===
  useEffect(() => {
    const fetchNearby = async () => {
      if (!userLocation) return;
      setLoading(true);

      try {
        const ref = collection(db, "marketItems");
        const snap = await getDocs(ref);
        const all = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as MarketItem)
        );

        console.log(`?�� ?�체 ?�품 ${all.length}�?�??�치 기반 ?�터�?�?..`);

        // ?�치 + 거리 ?�터
        const nearby = all
          .filter((i) => i.location && i.location.latitude && i.location.longitude)
          .map((i) => ({
            ...i,
            distance: distanceKm(
              userLocation.lat,
              userLocation.lng,
              i.location!.latitude,
              i.location!.longitude
            ),
          }))
          .filter((i) => i.distance && i.distance < radius) // ?�정??반경 ??          .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

        // ?�그 ?�터 ?�용
        let filtered = nearby;
        if (tagFilter.trim()) {
          const searchTags = tagFilter.toLowerCase().split(/\s+/);
          filtered = nearby.filter(item => 
            item.autoTags?.some(tag => 
              searchTags.some(searchTag => 
                tag.toLowerCase().includes(searchTag)
              )
            )
          );
        }

        setResults(filtered);
        
        if (filtered.length === 0) {
          if (tagFilter.trim()) {
            setMsg(`?�� 반경 ${radius}km ?�에??"${tagFilter}" 관???�품???�습?�다.`);
          } else {
            setMsg(`?�� 반경 ${radius}km ?�에 ?�품???�습?�다. 반경???�려보세??`);
          }
        } else {
          setMsg(`??${filtered.length}개의 주�? ?�품??찾았?�니??`);
        }
      } catch (err) {
        console.error("검???�류:", err);
        setMsg("??검??�??�류가 발생?�습?�다.");
      } finally {
        setLoading(false);
      }
    };

    if (userLocation) {
      fetchNearby();
    }
  }, [userLocation, tagFilter, radius]);

  return (
    <div className="mx-auto max-w-6xl p-4">
      <h1 className="text-3xl font-bold mb-2">?�� AI + ?�치 기반 주�? ?�품 추천</h1>
      <p className="text-gray-600 mb-6">
        ?�재 ?�치�?기반?�로 주�???관???�품???�동?�로 찾아?�립?�다!
      </p>

      {/* ?�치 ?�보 */}
      {userLocation && (
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-blue-800 font-medium">
            ?�� ?�재 ?�치: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          </p>
        </div>
      )}

      {/* ?�터 컨트�?*/}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="?�그 ?�터 (?? 축구, ?�이?? ?�동??"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">반경:</label>
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="rounded-lg border p-2"
          >
            <option value={5}>5km</option>
            <option value={10}>10km</option>
            <option value={20}>20km</option>
            <option value={50}>50km</option>
          </select>
        </div>
      </div>

      {/* ?�태 메시지 */}
      {loading && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">?��</div>
          <p className="text-gray-600">주�? ?�품??검?�하??�?..</p>
        </div>
      )}

      {msg && !loading && (
        <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
          <p className="text-gray-700 font-medium">{msg}</p>
        </div>
      )}

      {/* 결과 ?�시 */}
      {results.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            ?�� 주�? ?�품 ({results.length}�?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map((item) => (
              <div
                key={item.id}
                className="border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 bg-white"
              >
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  <img
                    src={item.imageUrls?.[0] || "/no-image.png"}
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/no-image.png";
                    }}
                  />
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {item.autoDescription || item.description || "?�명 ?�음"}
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-green-600">
                      ??Number(item.price || 0).toLocaleString()}
                    </span>
                    <span className="text-sm text-blue-600 font-medium">
                      ?�� {item.distance?.toFixed(1)}km
                    </span>
                  </div>

                  {item.autoTags && item.autoTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.autoTags.slice(0, 4).map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-1"
                        >
                          #{tag}
                        </span>
                      ))}
                      {item.autoTags.length > 4 && (
                        <span className="text-xs text-gray-500">
                          +{item.autoTags.length - 4}�?                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ?�치 권한 ?�내 */}
      {!userLocation && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">?��</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            ?�치 ?�보가 ?�요?�니??          </h3>
          <p className="text-gray-500 mb-4">
            주�? ?�품??찾기 ?�해 ?�재 ?�치�??�인?�주?�요.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition"
          >
            ?�� ?�시 ?�도
          </button>
        </div>
      )}
    </div>
  );
}
