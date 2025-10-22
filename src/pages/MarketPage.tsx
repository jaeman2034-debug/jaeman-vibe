// ?���?지???�전 ?�작 + Firestore + 반응??리스??import React, { useEffect, useState, useRef } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, query, orderBy, onSnapshot } from "firebase/firestore";
import { MapPin, List, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { addDoc } from "firebase/firestore";
import haversine from "haversine-distance";

// 구�? ?�???�러 방�???(?�로?�트??@types/google.maps 미설�????�용)
declare global {
  interface Window {
    google: any;
  }
}

type MarketItem = {
  id: string;
  title: string;
  price: number;
  desc?: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  locationName?: string;
  createdAt?: any;
};

export default function MarketPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<MarketItem[]>([]);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [mode, setMode] = useState<"list" | "map">("list");
  const [loading, setLoading] = useState(true);

  // 지??참조??ref 추�?
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [nearbyList, setNearbyList] = useState<any[]>([]);
  const [radius, setRadius] = useState(3000); // 기본 3km

  // ??Firestore 컬렉??참조
  const marketCollection = collection(db, "market_items");

  // ?�� ?�경변???�버�?로그
  console.log("?�� VITE_GOOGLE_MAPS_KEY =", import.meta.env.VITE_GOOGLE_MAPS_KEY);

  // Firestore ?�품 불러?�기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const q = query(collection(db, "marketItems"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as MarketItem[];
        setItems(data);
      } catch (err) {
        console.error("??Firestore Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ???�치 가?�오�?  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn("?�치 ?�근 ?�패:", err.message);
        }
      );
    }
  }, []);

  // ?? ?�전??Google Maps ?�터?�션 useEffect
  useEffect(() => {
    let cancelled = false;

    const initMap = () => {
      if (cancelled || !mapDivRef.current || mapRef.current) return;

      const center = position || { lat: 37.5665, lng: 126.9780 }; // ?�재 ?�치 ?�는 ?�울?�청

      // ?�심 ?�션: 마우????�??�래�?컨트�??�성??      mapRef.current = new window.google.maps.Map(mapDivRef.current, {
        center,
        zoom: 13,
        gestureHandling: "greedy",   // 마우???�로 바로 ?��?/축소
        draggable: true,             // 마우???�래�??�동
        scrollwheel: true,           // ??�??�용
        zoomControl: true,
        disableDoubleClickZoom: false,
        keyboardShortcuts: true,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      // ?�� 2) 기존 Firestore ?�이??불러?� 마커 ?�시
      getDocs(marketCollection).then((snap) => {
        snap.forEach((doc) => {
          const data = doc.data();
          if (data.location?.lat && data.location?.lng) {
            new window.google.maps.Marker({
              position: data.location,
              map: mapRef.current,
              title: data.address || "거래 ?�치",
              icon: {
                url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
              }
            });
          }
        });
      });

      // ?�재 ?�치 마커 추�?
      if (position) {
        new window.google.maps.Marker({
          position: position,
          map: mapRef.current,
          title: "?�재 ?�치",
          animation: window.google.maps.Animation.DROP,
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
          }
        });
      }

      // ?�� 지??중앙???�동 ?�치 반영 (브라?��? Geolocation API)
      if (!position && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            const userCenter = { lat: latitude, lng: longitude };
            
            // 지??중심???�용???�치�??�동
            mapRef.current?.setCenter(userCenter);
            
            // ?�용???�치 마커 추�?
            new window.google.maps.Marker({
              position: userCenter,
              map: mapRef.current,
              title: "???�치",
              animation: window.google.maps.Animation.DROP,
              icon: {
                url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
              }
            });
            
            console.log("?�� ?�용???�치�?지??중심 ?�동:", userCenter);
          },
          (error) => {
            console.warn("?�� ?�치 권한 거�????�는 ?�치 ?�보 ?�음:", error.message);
          }
        );
      }

      // ?�� 3) ?�릭 ?�벤???�록
      mapRef.current.addListener("click", async (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        // 기존 마커 ?�거
        if (marker) marker.setMap(null);

        // ??마커 ?�성
        const newMarker = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapRef.current,
          title: "?�택???�치",
          animation: window.google.maps.Animation.DROP,
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
          }
        });
        setMarker(newMarker);

        // ?�� 4) ????�코??(?�정?�명 구하�?
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, async (results: any, status: any) => {
          if (status === "OK" && results[0]) {
            const address = results[0].formatted_address;

            // Firestore???�??            try {
              await addDoc(marketCollection, {
                location: { lat, lng },
                address,
                createdAt: new Date(),
                type: "clicked_location"
              });

              console.log("?�� ?�치 ?�???�료:", address);

              // ?�� ?�?????�시�?반경 ???�이??추천 (onSnapshot?�서 ?�동 처리??
            } catch (error) {
              console.error("??Firestore ?�???�패:", error);
            }
          } else {
            console.warn("??주소 변???�패:", status);
          }
        });
      });

      console.log("??Google Maps ?�전 ?�터?�션 초기???�료!");
    };

    // ?�� 3km ??거래 ?�동 추천 ?�수
    const fetchNearbyItems = async (lat: number, lng: number) => {
      const snap = await getDocs(marketCollection);
      const nearbyItems: any[] = [];

      snap.forEach((doc) => {
        const data = doc.data();
        if (data.location?.lat && data.location?.lng) {
          const dist = haversine(
            { lat, lng },
            { lat: data.location.lat, lng: data.location.lng }
          );
          if (dist <= 3000) {
            // 3km ?�내
            nearbyItems.push({ id: doc.id, ...data, distance: Math.round(dist) });
          }
        }
      });

      // 거리???�렬 (가까운 ??
      nearbyItems.sort((a, b) => a.distance - b.distance);

      console.log("?�� 3km ??거래 목록:", nearbyItems);
      setNearbyList(nearbyItems);

      // 지?�에 ?��? 마커�??�시
      nearbyItems.forEach((item) => {
        new window.google.maps.Marker({
          position: item.location,
          map: mapRef.current,
          title: `${item.address || "주�? 거래"} (${item.distance}m)`,
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          },
        });
      });
    };

    const ensureScript = () => {
      // ?��? 로드??      if (window.google?.maps) {
        initMap();
        return;
      }

      const id = "google-maps-js";
      const existing = document.getElementById(id) as HTMLScriptElement | null;

      // ?�크립트 최초 주입
      if (!existing) {
        const s = document.createElement("script");
        s.id = id;
        s.async = true;
        s.defer = true;
        s.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&libraries=places`;
        s.onload = initMap;
        document.head.appendChild(s);
      } else {
        // ?��? 주입?�었지�??�직 로딩 중인 경우
        existing.addEventListener("load", initMap, { once: true });
      }
    };

    // 지??모드???�만 초기??    if (mode === "map") {
      ensureScript();
    }

    // 뷰포??변�???�?리프?�시
    const onResize = () => {
      if (mapRef.current) {
        const c = mapRef.current.getCenter?.();
        window.setTimeout(() => {
          mapRef.current?.setCenter?.(c);
        }, 0);
      }
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
    };
  }, [mode, position]); // mode?� position 변�????�초기화

  // ??Firestore ?�시�?반경 ?�터 로직
  useEffect(() => {
    const unsub = onSnapshot(marketCollection, (snapshot) => {
      const allItems: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.location?.lat && data.location?.lng) {
          allItems.push({ id: doc.id, ...data });
        }
      });

      // ?�재 마커 ?�치가 ?�는 경우 거리 계산
      if (marker) {
        const { lat, lng } = marker.getPosition().toJSON();
        const filtered = allItems
          .map((item) => {
            const dist = haversine(
              { lat, lng },
              { lat: item.location.lat, lng: item.location.lng }
            );
            return { ...item, distance: Math.round(dist) };
          })
          .filter((item) => item.distance <= radius)
          .sort((a, b) => a.distance - b.distance);

        setNearbyList(filtered);

        // 지?�에 마커 ?�시 (기존 마커???�거 ???�로 ?�성)
        // 기존 ?��???마커???�거??복잡?��?�?간단??처리
        filtered.forEach((item) => {
          new window.google.maps.Marker({
            position: item.location,
            map: mapRef.current,
            title: `${item.address || "주�? 거래"} (${item.distance}m)`,
            icon: {
              url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            },
          });
        });
      }
    });

    return () => unsub();
  }, [marker, radius]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ?�단 ?�더 */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              ?���?YAGO VIBE 마켓
            </h1>
            <p className="text-sm text-gray-500">?�포�??�품 거래</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMode(mode === "list" ? "map" : "list")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium transition-colors"
            >
              {mode === "list" ? <MapPin className="w-4 h-4" /> : <List className="w-4 h-4" />}
              {mode === "list" ? "지??보기" : "리스??보기"}
            </button>
            <button
              onClick={() => navigate("/chatlist")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              채팅 목록
            </button>
            <button
              onClick={() => navigate("/upload-ai")}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm px-4 py-2 rounded-lg shadow-sm transition-colors font-semibold"
            >
              ?�� AI ?�록
            </button>
            <button
              onClick={() => navigate("/market/search-ai")}
              className="bg-gradient-to-r from-green-600 to-teal-600 text-white text-sm px-4 py-2 rounded-lg shadow-sm transition-colors font-semibold"
            >
              ?�� AI 검??            </button>
            <button
              onClick={() => navigate("/market/nearby-ai")}
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white text-sm px-4 py-2 rounded-lg shadow-sm transition-colors font-semibold"
            >
              ?�� 주�? 추천
            </button>
            <button
              onClick={() => navigate("/market/map-ai")}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm px-4 py-2 rounded-lg shadow-sm transition-colors font-semibold"
            >
              ?���?AI 지??            </button>
            <button
              onClick={() => navigate("/market/voice-ai")}
              className="bg-gradient-to-r from-pink-600 to-rose-600 text-white text-sm px-4 py-2 rounded-lg shadow-sm transition-colors font-semibold"
            >
              ?���??�성 명령
            </button>
                   <button
                     onClick={() => navigate("/market/assistant-ai")}
                     className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm px-4 py-2 rounded-lg shadow-sm transition-colors font-semibold"
                   >
                     ?�� AI ?�시?�턴??                   </button>
                   <button
                     onClick={() => navigate("/yago-assistant")}
                     className="bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm px-4 py-2 rounded-lg shadow-sm transition-colors font-semibold animate-pulse"
                   >
                     ?���??�고 비서
                   </button>
                   <button
                     onClick={() => navigate("/navigate")}
                     className="bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm px-4 py-2 rounded-lg shadow-sm transition-colors font-semibold"
                   >
                     ?�� ?�고 ?�비
                   </button>
                   <button
                     onClick={() => navigate("/route")}
                     className="bg-gradient-to-r from-teal-600 to-green-600 text-white text-sm px-4 py-2 rounded-lg shadow-sm transition-colors font-semibold"
                   >
                     ?�� ?�시�??�로 ?�내
                   </button>
            <button
              onClick={() => navigate("/upload")}
              className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg shadow-sm transition-colors"
            >
              + ?�반 ?�록
            </button>
          </div>
        </div>
      </header>

      {/* 콘텐�??�역 */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-6 flex items-center gap-2">
          ?�� ?�포�??�품 거래
          {loading && <span className="text-sm text-gray-400">(불러?�는 �?..)</span>}
        </h2>

        {/* 리스??모드 */}
        {mode === "list" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-500">?�품??불러?�는 �?..</p>
              </div>
            ) : items.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">?�록???�품???�습?�다.</p>
                <button
                  onClick={() => navigate("/upload")}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  �?번째 ?�품 ?�록?�기
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/market/${item.id}`)}
                  className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                >
                  {/* ???��?지 비율 고정 */}
                  <div className="aspect-[4/3] overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400 text-sm">
                        ?��?지 ?�음
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <h3 className="text-base font-bold text-gray-800 truncate">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {item.desc}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-green-600 font-bold text-lg">
                        {item.price.toLocaleString()}??                      </span>
                      <span className="text-xs text-gray-400">
                        {item.locationName || "?�치 ?�보 ?�음"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 지??모드 */}
        {mode === "map" && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {/* 거리 ?�션 버튼 UI */}
            <div className="flex justify-center gap-2 mb-3 p-4 bg-gray-50">
              <span className="text-sm text-gray-600 flex items-center">검??반경:</span>
              {[1000, 3000, 5000].map((r) => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={`px-4 py-1 rounded-full text-sm font-medium border transition ${
                    radius === r
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {r < 1000 ? `${r}m` : `${r / 1000}km`}
                </button>
              ))}
            </div>
            <div
              ref={mapDivRef}
              className="w-full min-h-[480px] rounded-xl border"
              style={{ height: "520px" }}
            />
          </div>
        )}

        {/* ??지???�래 3km ??거래 리스??(카드??UI) */}
        <div className="mt-5 bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="text-blue-600 text-2xl">?���?/span>
            ???�치 반경 {radius < 1000 ? `${radius}m` : `${radius / 1000}km`} ??거래 ?�품
          </h2>

          {nearbyList.length === 0 ? (
            <p className="text-gray-500 text-sm">
              주�? {radius < 1000 ? `${radius}m` : `${radius / 1000}km`} ??거래가 ?�직 ?�습?�다. 지?��? ?�릭??거래 ?�치�??�록?�보?�요.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {nearbyList
                .sort((a, b) => a.distance - b.distance)
                .map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-md transition transform hover:-translate-y-1"
                  >
                    {/* ?�네??*/}
                    <div className="relative h-40 bg-gray-200">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title || "?�품 ?��?지"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                          ?�� ?��?지 ?�음
                        </div>
                      )}
                      <span className="absolute top-2 right-2 bg-white text-gray-700 text-xs px-2 py-1 rounded-md shadow">
                        {item.distance < 1000
                          ? `${item.distance}m`
                          : `${(item.distance / 1000).toFixed(1)}km`}
                      </span>
                    </div>

                    {/* ?�품 ?�보 */}
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {item.title || "?�품 ?�목 ?�음"}
                      </h3>
                      {item.price && (
                        <p className="text-blue-600 font-bold mt-1">
                          {item.price.toLocaleString()}??                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {item.address || "주소 미등�?}
                      </p>

                      <div className="flex justify-between items-center mt-3">
                        <button
                          className="text-sm px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                          onClick={() => {
                            mapRef.current?.panTo(item.location);
                            mapRef.current?.setZoom(15);
                          }}
                        >
                          지?�에??보기
                        </button>
                        <button
                          className="text-sm px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                          onClick={() => alert(`'${item.title || "?�품"}' ?�매?�에�??�락?�니??`)}
                        >
                          ?�매?�에�??�락
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* ?�치 ?�태 */}
        {position && (
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              ?�� ?�재 ?�치: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
