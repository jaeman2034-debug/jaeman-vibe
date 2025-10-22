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
  const [region, setRegion] = useState<string>("?�치�??�택?�세??);
  const [loading, setLoading] = useState(false);

  // ??지??로드
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

      // ?�릭 ??좌표 ?�시 + 마커 ?�동 + 주소 변??      window.kakao.maps.event.addListener(kakaoMap, "click", (mouseEvent: any) => {
        const latlng = mouseEvent.latLng;
        setLat(latlng.getLat());
        setLng(latlng.getLng());

        marker.setPosition(latlng);
        marker.setMap(kakaoMap);

        // ?�정??주소 변??        geocoder.coord2RegionCode(latlng.getLng(), latlng.getLat(), (result: any, status: any) => {
          if (status === window.kakao.maps.services.Status.OK) {
            const regionName = result[0].region_3depth_name || result[0].region_2depth_name;
            setRegion(regionName);
          }
        });
      });
    };

    initMap();
  }, []);

  // ??Firestore ?�로??  const handleSubmit = async () => {
    if (!title || !price || !lat || !lng) {
      alert("?�품�? 가�? ?�치�?모두 ?�력?�주?�요!");
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
      alert("?�품???�록?�었?�니????);
      
      // ??초기??      setTitle("");
      setPrice("");
      setDesc("");
      setRegion("?�치�??�택?�세??);
      setLat(null);
      setLng(null);
    } catch (err) {
      console.error("?�� Firestore ?�록 ?�패:", err);
      alert("?�록 �??�류가 발생?�습?�다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">?�� ?�품 ?�록</h2>

      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <div className="space-y-4">
          <input
            type="text"
            placeholder="?�품�?(?? ?�이??축구??"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 text-sm"
          />

          <input
            type="number"
            placeholder="가�?(??"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 text-sm"
          />

          <textarea
            placeholder="?�품 ?�명"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full border rounded-xl px-3 py-2 text-sm h-20 resize-none"
          />

          {/* ?�택???�치 ?�보 */}
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
              ?�� 거래 ?�망 ?�치
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
                좌표: {lat.toFixed(6)}, {lng.toFixed(6)}
              </div>
            )}
          </div>

          {/* 지??*/}
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
            {loading ? "?�록 �?.." : "?�� ?�품 ?�록?�기"}
          </button>
        </div>
      </div>
    </div>
  );
}
