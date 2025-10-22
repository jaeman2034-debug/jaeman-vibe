// ?—ºï¸?ì§€???„ì „ ?™ì‘ + Firestore + ë°˜ì‘??ë¦¬ìŠ¤??import React, { useEffect, useState, useRef } from "react";
import { db } from "../lib/firebase";
import { collection, getDocs, query, orderBy, onSnapshot } from "firebase/firestore";
import { MapPin, List, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { addDoc } from "firebase/firestore";
import haversine from "haversine-distance";

// êµ¬ê? ?€???ëŸ¬ ë°©ì???(?„ë¡œ?íŠ¸??@types/google.maps ë¯¸ì„¤ì¹???? ìš©)
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

  // ì§€??ì°¸ì¡°??ref ì¶”ê?
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [nearbyList, setNearbyList] = useState<any[]>([]);
  const [radius, setRadius] = useState(3000); // ê¸°ë³¸ 3km

  // ??Firestore ì»¬ë ‰??ì°¸ì¡°
  const marketCollection = collection(db, "market_items");

  // ?§­ ?˜ê²½ë³€???”ë²„ê·?ë¡œê·¸
  console.log("?§­ VITE_GOOGLE_MAPS_KEY =", import.meta.env.VITE_GOOGLE_MAPS_KEY);

  // Firestore ?í’ˆ ë¶ˆëŸ¬?¤ê¸°
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

  // ???„ì¹˜ ê°€?¸ì˜¤ê¸?  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn("?„ì¹˜ ?‘ê·¼ ?¤íŒ¨:", err.message);
        }
      );
    }
  }, []);

  // ?? ?„ì „??Google Maps ?¸í„°?™ì…˜ useEffect
  useEffect(() => {
    let cancelled = false;

    const initMap = () => {
      if (cancelled || !mapDivRef.current || mapRef.current) return;

      const center = position || { lat: 37.5665, lng: 126.9780 }; // ?„ì¬ ?„ì¹˜ ?ëŠ” ?œìš¸?œì²­

      // ?µì‹¬ ?µì…˜: ë§ˆìš°????ì¤??œë˜ê·?ì»¨íŠ¸ë¡??œì„±??      mapRef.current = new window.google.maps.Map(mapDivRef.current, {
        center,
        zoom: 13,
        gestureHandling: "greedy",   // ë§ˆìš°??? ë¡œ ë°”ë¡œ ?•ë?/ì¶•ì†Œ
        draggable: true,             // ë§ˆìš°???œë˜ê·??´ë™
        scrollwheel: true,           // ??ì¤??ˆìš©
        zoomControl: true,
        disableDoubleClickZoom: false,
        keyboardShortcuts: true,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      // ?”¹ 2) ê¸°ì¡´ Firestore ?°ì´??ë¶ˆëŸ¬?€ ë§ˆì»¤ ?œì‹œ
      getDocs(marketCollection).then((snap) => {
        snap.forEach((doc) => {
          const data = doc.data();
          if (data.location?.lat && data.location?.lng) {
            new window.google.maps.Marker({
              position: data.location,
              map: mapRef.current,
              title: data.address || "ê±°ë˜ ?„ì¹˜",
              icon: {
                url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png"
              }
            });
          }
        });
      });

      // ?„ì¬ ?„ì¹˜ ë§ˆì»¤ ì¶”ê?
      if (position) {
        new window.google.maps.Marker({
          position: position,
          map: mapRef.current,
          title: "?„ì¬ ?„ì¹˜",
          animation: window.google.maps.Animation.DROP,
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png"
          }
        });
      }

      // ?“ ì§€??ì¤‘ì•™???ë™ ?„ì¹˜ ë°˜ì˜ (ë¸Œë¼?°ì? Geolocation API)
      if (!position && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            const userCenter = { lat: latitude, lng: longitude };
            
            // ì§€??ì¤‘ì‹¬???¬ìš©???„ì¹˜ë¡??´ë™
            mapRef.current?.setCenter(userCenter);
            
            // ?¬ìš©???„ì¹˜ ë§ˆì»¤ ì¶”ê?
            new window.google.maps.Marker({
              position: userCenter,
              map: mapRef.current,
              title: "???„ì¹˜",
              animation: window.google.maps.Animation.DROP,
              icon: {
                url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
              }
            });
            
            console.log("?“ ?¬ìš©???„ì¹˜ë¡?ì§€??ì¤‘ì‹¬ ?´ë™:", userCenter);
          },
          (error) => {
            console.warn("?“ ?„ì¹˜ ê¶Œí•œ ê±°ë????ëŠ” ?„ì¹˜ ?•ë³´ ?†ìŒ:", error.message);
          }
        );
      }

      // ?”¹ 3) ?´ë¦­ ?´ë²¤???±ë¡
      mapRef.current.addListener("click", async (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        // ê¸°ì¡´ ë§ˆì»¤ ?œê±°
        if (marker) marker.setMap(null);

        // ??ë§ˆì»¤ ?ì„±
        const newMarker = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapRef.current,
          title: "? íƒ???„ì¹˜",
          animation: window.google.maps.Animation.DROP,
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
          }
        });
        setMarker(newMarker);

        // ?”¹ 4) ????¤ì½”??(?‰ì •?™ëª… êµ¬í•˜ê¸?
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, async (results: any, status: any) => {
          if (status === "OK" && results[0]) {
            const address = results[0].formatted_address;

            // Firestore???€??            try {
              await addDoc(marketCollection, {
                location: { lat, lng },
                address,
                createdAt: new Date(),
                type: "clicked_location"
              });

              console.log("?“ ?„ì¹˜ ?€???„ë£Œ:", address);

              // ?”¥ ?€?????¤ì‹œê°?ë°˜ê²½ ???„ì´??ì¶”ì²œ (onSnapshot?ì„œ ?ë™ ì²˜ë¦¬??
            } catch (error) {
              console.error("??Firestore ?€???¤íŒ¨:", error);
            }
          } else {
            console.warn("??ì£¼ì†Œ ë³€???¤íŒ¨:", status);
          }
        });
      });

      console.log("??Google Maps ?„ì „ ?¸í„°?™ì…˜ ì´ˆê¸°???„ë£Œ!");
    };

    // ?”¥ 3km ??ê±°ë˜ ?ë™ ì¶”ì²œ ?¨ìˆ˜
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
            // 3km ?´ë‚´
            nearbyItems.push({ id: doc.id, ...data, distance: Math.round(dist) });
          }
        }
      });

      // ê±°ë¦¬???•ë ¬ (ê°€ê¹Œìš´ ??
      nearbyItems.sort((a, b) => a.distance - b.distance);

      console.log("?”¥ 3km ??ê±°ë˜ ëª©ë¡:", nearbyItems);
      setNearbyList(nearbyItems);

      // ì§€?„ì— ?Œë? ë§ˆì»¤ë¡??œì‹œ
      nearbyItems.forEach((item) => {
        new window.google.maps.Marker({
          position: item.location,
          map: mapRef.current,
          title: `${item.address || "ì£¼ë? ê±°ë˜"} (${item.distance}m)`,
          icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          },
        });
      });
    };

    const ensureScript = () => {
      // ?´ë? ë¡œë“œ??      if (window.google?.maps) {
        initMap();
        return;
      }

      const id = "google-maps-js";
      const existing = document.getElementById(id) as HTMLScriptElement | null;

      // ?¤í¬ë¦½íŠ¸ ìµœì´ˆ ì£¼ì…
      if (!existing) {
        const s = document.createElement("script");
        s.id = id;
        s.async = true;
        s.defer = true;
        s.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&libraries=places`;
        s.onload = initMap;
        document.head.appendChild(s);
      } else {
        // ?´ë? ì£¼ì…?˜ì—ˆì§€ë§??„ì§ ë¡œë”© ì¤‘ì¸ ê²½ìš°
        existing.addEventListener("load", initMap, { once: true });
      }
    };

    // ì§€??ëª¨ë“œ???Œë§Œ ì´ˆê¸°??    if (mode === "map") {
      ensureScript();
    }

    // ë·°í¬??ë³€ê²???ë§?ë¦¬í”„?ˆì‹œ
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
  }, [mode, position]); // mode?€ position ë³€ê²????¬ì´ˆê¸°í™”

  // ??Firestore ?¤ì‹œê°?ë°˜ê²½ ?„í„° ë¡œì§
  useEffect(() => {
    const unsub = onSnapshot(marketCollection, (snapshot) => {
      const allItems: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.location?.lat && data.location?.lng) {
          allItems.push({ id: doc.id, ...data });
        }
      });

      // ?„ì¬ ë§ˆì»¤ ?„ì¹˜ê°€ ?ˆëŠ” ê²½ìš° ê±°ë¦¬ ê³„ì‚°
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

        // ì§€?„ì— ë§ˆì»¤ ?œì‹œ (ê¸°ì¡´ ë§ˆì»¤???œê±° ???ˆë¡œ ?ì„±)
        // ê¸°ì¡´ ?Œë???ë§ˆì»¤???œê±°??ë³µì¡?˜ë?ë¡?ê°„ë‹¨??ì²˜ë¦¬
        filtered.forEach((item) => {
          new window.google.maps.Marker({
            position: item.location,
            map: mapRef.current,
            title: `${item.address || "ì£¼ë? ê±°ë˜"} (${item.distance}m)`,
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
      {/* ?ë‹¨ ?¤ë” */}
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              ?›ï¸?YAGO VIBE ë§ˆì¼“
            </h1>
            <p className="text-sm text-gray-500">?¤í¬ì¸??©í’ˆ ê±°ë˜</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMode(mode === "list" ? "map" : "list")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium transition-colors"
            >
              {mode === "list" ? <MapPin className="w-4 h-4" /> : <List className="w-4 h-4" />}
              {mode === "list" ? "ì§€??ë³´ê¸°" : "ë¦¬ìŠ¤??ë³´ê¸°"}
            </button>
            <button
              onClick={() => navigate("/chatlist")}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              ì±„íŒ… ëª©ë¡
            </button>
            <button
              onClick={() => navigate("/upload-ai")}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm px-4 py-2 rounded-lg shadow-sm transition-colors font-semibold"
            >
              ?§  AI ?±ë¡
            </button>
            <button
              onClick={() => navigate("/market/search-ai")}
              className="bg-gradient-to-r from-green-600 to-teal-600 text-white text-sm px-4 py-2 rounded-lg shadow-sm transition-colors font-semibold"
            >
              ?” AI ê²€??            </button>
            <button
              onClick={() => navigate("/market/nearby-ai")}
              className="bg-gradient-to-r from-orange-600 to-red-600 text-white text-sm px-4 py-2 rounded-lg shadow-sm transition-colors font-semibold"
            >
              ?“ ì£¼ë? ì¶”ì²œ
            </button>
            <button
              onClick={() => navigate("/market/map-ai")}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm px-4 py-2 rounded-lg shadow-sm transition-colors font-semibold"
            >
              ?—ºï¸?AI ì§€??            </button>
            <button
              onClick={() => navigate("/market/voice-ai")}
              className="bg-gradient-to-r from-pink-600 to-rose-600 text-white text-sm px-4 py-2 rounded-lg shadow-sm transition-colors font-semibold"
            >
              ?™ï¸??Œì„± ëª…ë ¹
            </button>
                   <button
                     onClick={() => navigate("/market/assistant-ai")}
                     className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm px-4 py-2 rounded-lg shadow-sm transition-colors font-semibold"
                   >
                     ?¤– AI ?´ì‹œ?¤í„´??                   </button>
                   <button
                     onClick={() => navigate("/yago-assistant")}
                     className="bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm px-4 py-2 rounded-lg shadow-sm transition-colors font-semibold animate-pulse"
                   >
                     ?™ï¸??¼ê³  ë¹„ì„œ
                   </button>
                   <button
                     onClick={() => navigate("/navigate")}
                     className="bg-gradient-to-r from-amber-600 to-orange-600 text-white text-sm px-4 py-2 rounded-lg shadow-sm transition-colors font-semibold"
                   >
                     ?§­ ?¼ê³  ?´ë¹„
                   </button>
                   <button
                     onClick={() => navigate("/route")}
                     className="bg-gradient-to-r from-teal-600 to-green-600 text-white text-sm px-4 py-2 rounded-lg shadow-sm transition-colors font-semibold"
                   >
                     ?š— ?¤ì‹œê°??„ë¡œ ?ˆë‚´
                   </button>
            <button
              onClick={() => navigate("/upload")}
              className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg shadow-sm transition-colors"
            >
              + ?¼ë°˜ ?±ë¡
            </button>
          </div>
        </div>
      </header>

      {/* ì½˜í…ì¸??ì—­ */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-6 flex items-center gap-2">
          ?† ?¤í¬ì¸??©í’ˆ ê±°ë˜
          {loading && <span className="text-sm text-gray-400">(ë¶ˆëŸ¬?¤ëŠ” ì¤?..)</span>}
        </h2>

        {/* ë¦¬ìŠ¤??ëª¨ë“œ */}
        {mode === "list" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-500">?í’ˆ??ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
              </div>
            ) : items.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">?±ë¡???í’ˆ???†ìŠµ?ˆë‹¤.</p>
                <button
                  onClick={() => navigate("/upload")}
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  ì²?ë²ˆì§¸ ?í’ˆ ?±ë¡?˜ê¸°
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/market/${item.id}`)}
                  className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                >
                  {/* ???´ë?ì§€ ë¹„ìœ¨ ê³ ì • */}
                  <div className="aspect-[4/3] overflow-hidden">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400 text-sm">
                        ?´ë?ì§€ ?†ìŒ
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
                        {item.locationName || "?„ì¹˜ ?•ë³´ ?†ìŒ"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ì§€??ëª¨ë“œ */}
        {mode === "map" && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {/* ê±°ë¦¬ ?µì…˜ ë²„íŠ¼ UI */}
            <div className="flex justify-center gap-2 mb-3 p-4 bg-gray-50">
              <span className="text-sm text-gray-600 flex items-center">ê²€??ë°˜ê²½:</span>
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

        {/* ??ì§€???„ë˜ 3km ??ê±°ë˜ ë¦¬ìŠ¤??(ì¹´ë“œ??UI) */}
        <div className="mt-5 bg-white rounded-2xl shadow-lg p-5 border border-gray-100">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="text-blue-600 text-2xl">?›ï¸?/span>
            ???„ì¹˜ ë°˜ê²½ {radius < 1000 ? `${radius}m` : `${radius / 1000}km`} ??ê±°ë˜ ?í’ˆ
          </h2>

          {nearbyList.length === 0 ? (
            <p className="text-gray-500 text-sm">
              ì£¼ë? {radius < 1000 ? `${radius}m` : `${radius / 1000}km`} ??ê±°ë˜ê°€ ?„ì§ ?†ìŠµ?ˆë‹¤. ì§€?„ë? ?´ë¦­??ê±°ë˜ ?„ì¹˜ë¥??±ë¡?´ë³´?¸ìš”.
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
                    {/* ?¸ë„¤??*/}
                    <div className="relative h-40 bg-gray-200">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title || "?í’ˆ ?´ë?ì§€"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                          ?“· ?´ë?ì§€ ?†ìŒ
                        </div>
                      )}
                      <span className="absolute top-2 right-2 bg-white text-gray-700 text-xs px-2 py-1 rounded-md shadow">
                        {item.distance < 1000
                          ? `${item.distance}m`
                          : `${(item.distance / 1000).toFixed(1)}km`}
                      </span>
                    </div>

                    {/* ?í’ˆ ?•ë³´ */}
                    <div className="p-3">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {item.title || "?í’ˆ ?œëª© ?†ìŒ"}
                      </h3>
                      {item.price && (
                        <p className="text-blue-600 font-bold mt-1">
                          {item.price.toLocaleString()}??                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {item.address || "ì£¼ì†Œ ë¯¸ë“±ë¡?}
                      </p>

                      <div className="flex justify-between items-center mt-3">
                        <button
                          className="text-sm px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                          onClick={() => {
                            mapRef.current?.panTo(item.location);
                            mapRef.current?.setZoom(15);
                          }}
                        >
                          ì§€?„ì—??ë³´ê¸°
                        </button>
                        <button
                          className="text-sm px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                          onClick={() => alert(`'${item.title || "?í’ˆ"}' ?ë§¤?ì—ê²??°ë½?©ë‹ˆ??`)}
                        >
                          ?ë§¤?ì—ê²??°ë½
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* ?„ì¹˜ ?íƒœ */}
        {position && (
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              ?“ ?„ì¬ ?„ì¹˜: {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
