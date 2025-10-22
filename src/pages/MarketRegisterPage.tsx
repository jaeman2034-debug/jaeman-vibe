import React, { useEffect, useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getFirestore, getApp, initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApp() || initializeApp(firebaseConfig);
const db = getFirestore(app);

declare global {
  interface Window {
    kakao: any;
  }
}

export default function MarketRegisterPage() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [map, setMap] = useState<any>(null);
  const [region, setRegion] = useState<string>("?„ì¹˜ë¥?? íƒ?˜ì„¸??);
  const [loading, setLoading] = useState(false);

  // ??ì§€??ë¡œë“œ
  useEffect(() => {
    const initMap = () => {
      if (!window.kakao || !window.kakao.maps) {
        setTimeout(initMap, 100);
        return;
      }

      const container = document.getElementById("map");
      if (!container) return;

      const options = {
        center: new window.kakao.maps.LatLng(37.5665, 126.978),
        level: 5,
      };

      const kakaoMap = new window.kakao.maps.Map(container, options);
      setMap(kakaoMap);

      const marker = new window.kakao.maps.Marker();
      const geocoder = new window.kakao.maps.services.Geocoder();

      // ?´ë¦­ ??ì¢Œí‘œ ?œì‹œ + ë§ˆì»¤ ?´ë™ + ì£¼ì†Œ ë³€??      window.kakao.maps.event.addListener(kakaoMap, "click", (mouseEvent: any) => {
        const latlng = mouseEvent.latLng;
        setLat(latlng.getLat());
        setLng(latlng.getLng());

        marker.setPosition(latlng);
        marker.setMap(kakaoMap);

        // ?‰ì •??ì£¼ì†Œ ë³€??        geocoder.coord2RegionCode(latlng.getLng(), latlng.getLat(), (result: any, status: any) => {
          if (status === window.kakao.maps.services.Status.OK) {
            const regionName = result[0].region_3depth_name || result[0].region_2depth_name;
            setRegion(regionName);
          }
        });
      });
    };

    initMap();
  }, []);

  // ??Firestore ?…ë¡œ??  const handleSubmit = async () => {
    if (!title || !price || !lat || !lng) {
      alert("?í’ˆëª? ê°€ê²? ?„ì¹˜ë¥?ëª¨ë‘ ?…ë ¥?´ì£¼?¸ìš”!");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "marketItems"), {
        title,
        price: Number(price),
        desc,
        location: {
          lat,
          lng,
          region
        },
        createdAt: serverTimestamp(),
      });
      alert("?í’ˆ???±ë¡?˜ì—ˆ?µë‹ˆ????);
      
      // ??ì´ˆê¸°??      setTitle("");
      setPrice("");
      setDesc("");
      setRegion("?„ì¹˜ë¥?? íƒ?˜ì„¸??);
      setLat(null);
      setLng(null);
    } catch (err) {
      console.error("?”¥ Firestore ?±ë¡ ?¤íŒ¨:", err);
      alert("?±ë¡ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">?“¦ ?í’ˆ ?±ë¡</h2>

      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <div className="space-y-4">
          <input
            type="text"
            placeholder="?í’ˆëª?(?? ?˜ì´??ì¶•êµ¬??"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 text-sm"
          />

          <input
            type="number"
            placeholder="ê°€ê²?(??"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 text-sm"
          />

          <textarea
            placeholder="?í’ˆ ?¤ëª…"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 text-sm h-20 resize-none"
          />

          {/* ? íƒ???„ì¹˜ ?•ë³´ */}
          <div style={{ 
            padding: "12px", 
            backgroundColor: lat && lng ? "#f0f8ff" : "#f8f9fa", 
            borderRadius: "8px",
            border: `1px solid ${lat && lng ? "#4A90E2" : "#e9ecef"}`
          }}>
            <div style={{ 
              fontSize: "14px", 
              fontWeight: "600", 
              color: "#333",
              marginBottom: "4px"
            }}>
              ?“ ê±°ë˜ ?¬ë§ ?„ì¹˜
            </div>
            <div style={{ 
              fontSize: "16px", 
              fontWeight: "700", 
              color: lat && lng ? "#4A90E2" : "#666"
            }}>
              {region}
            </div>
            {lat && lng && (
              <div style={{ 
                fontSize: "12px", 
                color: "#666",
                marginTop: "4px"
              }}>
                ì¢Œí‘œ: {lat.toFixed(6)}, {lng.toFixed(6)}
              </div>
            )}
          </div>

          {/* ì§€??*/}
          <div
            id="map"
            style={{
              width: "100%",
              height: "400px",
              borderRadius: "12px",
              border: "2px solid #ddd",
              marginBottom: "10px",
            }}
          ></div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "?±ë¡ ì¤?.." : "?“¦ ?í’ˆ ?±ë¡?˜ê¸°"}
          </button>
        </div>
      </div>
    </div>
  );
}
