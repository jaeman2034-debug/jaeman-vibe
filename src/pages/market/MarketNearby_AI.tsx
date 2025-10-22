/**
 * ??AI + GPS ê¸°ë°˜ ì£¼ë? ?í’ˆ ì¶”ì²œ
 * ê¸°ëŠ¥:
 *  - ?¬ìš©?ì˜ ?„ì¬ ?„ì¹˜ë¥??•ì¸
 *  - Firestore?ì„œ autoTags + location ê¸°ë°˜ ê·¼ê±°ë¦??í’ˆ ê²€?? *  - ê±°ë¦¬ ê³„ì‚°?¼ë¡œ ?ë™ ?•ë ¬
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

  // === ê±°ë¦¬ ê³„ì‚° (Haversine ê³µì‹) ===
  const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // ì§€êµ?ë°˜ì?ë¦?(km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  // === ?„ì¹˜ ?”ì²­ ===
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setMsg("?“ GPSë¥??¬ìš©?????†ìŠµ?ˆë‹¤. ë¸Œë¼?°ì??ì„œ ?„ì¹˜ ?œë¹„?¤ë? ?ˆìš©?´ì£¼?¸ìš”.");
      return;
    }

    setMsg("?“ ?„ì¬ ?„ì¹˜ë¥??•ì¸?˜ëŠ” ì¤?..");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setMsg("???„ì¹˜ ?•ì¸ ?„ë£Œ! ì£¼ë? ?í’ˆ??ê²€?‰í•©?ˆë‹¤.");
      },
      (err) => {
        console.error("?„ì¹˜ ?¤ë¥˜:", err);
        setMsg("???„ì¹˜ ?•ë³´ë¥?ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤. ?„ì¹˜ ê¶Œí•œ???ˆìš©?´ì£¼?¸ìš”.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }, []);

  // === ì£¼ë? ?í’ˆ ê²€??===
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

        console.log(`?” ?„ì²´ ?í’ˆ ${all.length}ê°?ì¤??„ì¹˜ ê¸°ë°˜ ?„í„°ë§?ì¤?..`);

        // ?„ì¹˜ + ê±°ë¦¬ ?„í„°
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
          .filter((i) => i.distance && i.distance < radius) // ?¤ì •??ë°˜ê²½ ??          .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

        // ?œê·¸ ?„í„° ?ìš©
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
            setMsg(`?“ ë°˜ê²½ ${radius}km ?´ì—??"${tagFilter}" ê´€???í’ˆ???†ìŠµ?ˆë‹¤.`);
          } else {
            setMsg(`?“ ë°˜ê²½ ${radius}km ?´ì— ?í’ˆ???†ìŠµ?ˆë‹¤. ë°˜ê²½???˜ë ¤ë³´ì„¸??`);
          }
        } else {
          setMsg(`??${filtered.length}ê°œì˜ ì£¼ë? ?í’ˆ??ì°¾ì•˜?µë‹ˆ??`);
        }
      } catch (err) {
        console.error("ê²€???¤ë¥˜:", err);
        setMsg("??ê²€??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
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
      <h1 className="text-3xl font-bold mb-2">?“ AI + ?„ì¹˜ ê¸°ë°˜ ì£¼ë? ?í’ˆ ì¶”ì²œ</h1>
      <p className="text-gray-600 mb-6">
        ?„ì¬ ?„ì¹˜ë¥?ê¸°ë°˜?¼ë¡œ ì£¼ë???ê´€???í’ˆ???ë™?¼ë¡œ ì°¾ì•„?œë¦½?ˆë‹¤!
      </p>

      {/* ?„ì¹˜ ?•ë³´ */}
      {userLocation && (
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-blue-800 font-medium">
            ?“ ?„ì¬ ?„ì¹˜: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          </p>
        </div>
      )}

      {/* ?„í„° ì»¨íŠ¸ë¡?*/}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-64">
          <input
            type="text"
            placeholder="?œê·¸ ?„í„° (?? ì¶•êµ¬, ?˜ì´?? ?´ë™??"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-200 p-3 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">ë°˜ê²½:</label>
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

      {/* ?íƒœ ë©”ì‹œì§€ */}
      {loading && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">?”</div>
          <p className="text-gray-600">ì£¼ë? ?í’ˆ??ê²€?‰í•˜??ì¤?..</p>
        </div>
      )}

      {msg && !loading && (
        <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-200">
          <p className="text-gray-700 font-medium">{msg}</p>
        </div>
      )}

      {/* ê²°ê³¼ ?œì‹œ */}
      {results.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">
            ?“¦ ì£¼ë? ?í’ˆ ({results.length}ê°?
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
                    {item.autoDescription || item.description || "?¤ëª… ?†ìŒ"}
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-green-600">
                      ??Number(item.price || 0).toLocaleString()}
                    </span>
                    <span className="text-sm text-blue-600 font-medium">
                      ?“ {item.distance?.toFixed(1)}km
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
                          +{item.autoTags.length - 4}ê°?                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ?„ì¹˜ ê¶Œí•œ ?ˆë‚´ */}
      {!userLocation && !loading && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">?“</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            ?„ì¹˜ ?•ë³´ê°€ ?„ìš”?©ë‹ˆ??          </h3>
          <p className="text-gray-500 mb-4">
            ì£¼ë? ?í’ˆ??ì°¾ê¸° ?„í•´ ?„ì¬ ?„ì¹˜ë¥??•ì¸?´ì£¼?¸ìš”.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition"
          >
            ?”„ ?¤ì‹œ ?œë„
          </button>
        </div>
      )}
    </div>
  );
}
