/**
 * ??VoiceCommand_AI.tsx
 * 기능:
 *  - 마이?�로 ?�성 ?�력 받기 (Web Speech API)
 *  - NLU�??�그 추출 ("축구?? ??["축구??, "?�동??])
 *  - Firestore?�서 관???�품 검?? *  - Kakao 지?�에 ?�동 ?�시
 */

import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

declare global {
  interface Window {
    kakao: any;
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

type MarketItem = {
  id: string;
  title: string;
  price?: number;
  category?: string;
  imageUrls?: string[];
  autoDescription?: string;
  description?: string;
  autoTags?: string[];
  location?: { latitude: number; longitude: number };
};

export default function VoiceCommand_AI() {
  const [message, setMessage] = useState("?���??�성 명령??말해보세??);
  const [map, setMap] = useState<any>(null);
  const [results, setResults] = useState<MarketItem[]>([]);
  const [listening, setListening] = useState(false);
  const [recognizer, setRecognizer] = useState<any>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);

  // === 거리 계산 ===
  const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  // === ?�용???�치 ?�집 ===
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPos({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => {
          console.warn("?�치 ?�보 ?�집 ?�패:", err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    }
  }, []);

  // === Kakao 지??초기??===
  useEffect(() => {
    if (!window.kakao || !userPos) return;

    const { kakao } = window;
    const container = document.getElementById("voice-map");
    if (!container) return;

    const mapObj = new kakao.maps.Map(container, {
      center: new kakao.maps.LatLng(userPos.lat, userPos.lng),
      level: 8,
    });

    // ?�용???�치 마커
    const userMarker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(userPos.lat, userPos.lng),
      title: "???�치",
      image: new kakao.maps.MarkerImage(
        'data:image/svg+xml;base64,' + btoa(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill="#FF0000" stroke="#FFFFFF" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" fill="#FFFFFF"/>
          </svg>
        `),
        new kakao.maps.Size(24, 24)
      )
    });
    userMarker.setMap(mapObj);

    setMap(mapObj);
    setMessage("?���?지?��? 준비되?�습?�다. ?�성 명령??말해보세??");
  }, [userPos]);

  // === ?�성 ?�식 초기??===
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessage("?�️ 브라?��?가 ?�성 ?�식??지?�하지 ?�습?�다. Chrome???�용?�주?�요.");
      return;
    }
    
    const rec = new SpeechRecognition();
    rec.lang = "ko-KR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    setRecognizer(rec);
  }, []);

  // === NLU: ?�연??처리 �??�그 추출 ===
  function extractTags(text: string): string[] {
    console.log("?�� ?�성 ?�식 결과:", text);
    
    // 기본 ?�처�?    const cleanText = text
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .trim()
      .toLowerCase();

    // 불용???�거
    const stopWords = [
      "근처", "주�?", "보여�?, "찾아�?, "??, "??, "?�기", "??, "�?, "?�", 
      "�?, "??, "가", "??, "??, "?�", "??, "?�서", "�?, "?�로", "?�", "�?,
      "?�어", "?�나", "?�줘", "?�주?�요", "?�려�?, "?�려주세??
    ];

    // ?�어 분리 �??�터�?    const words = cleanText
      .split(/\s+/)
      .filter((w) => w.length > 1 && !stopWords.includes(w));

    console.log("?���?추출???�그:", words);
    return words;
  }

  // === 기존 마커 ?�거 ===
  const clearMarkers = () => {
    markers.forEach(marker => {
      marker.setMap(null);
    });
    setMarkers([]);
  };

  // === Firestore 검??+ 지???�시 ===
  async function searchAndDisplay(tags: string[]) {
    if (!map || tags.length === 0) return;

    setMessage(`?�� "${tags.join(", ")}" 관???�품??검??�?..`);
    clearMarkers();

    try {
      const ref = collection(db, "marketItems");
      const q = query(
        ref, 
        where("autoTags", "array-contains-any", tags.slice(0, 10)),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as MarketItem[];
      
      // ?�치 ?�보가 ?�는 ?�품�??�터�?      const itemsWithLocation = data.filter(item => 
        item.location && item.location.latitude && item.location.longitude
      );

      setResults(itemsWithLocation);

      if (itemsWithLocation.length === 0) {
        setMessage(`??"${tags.join(", ")}" 관???�품??찾�? 못했?�니??`);
        return;
      }

      const { kakao } = window;
      const bounds = new kakao.maps.LatLngBounds();
      const newMarkers: any[] = [];

      // ?�용???�치 ?�함
      if (userPos) {
        bounds.extend(new kakao.maps.LatLng(userPos.lat, userPos.lng));
      }

      itemsWithLocation.forEach((item) => {
        if (!item.location) return;
        
        const pos = new kakao.maps.LatLng(
          item.location.latitude,
          item.location.longitude
        );
        bounds.extend(pos);

        // 거리 계산
        const distance = userPos ? distanceKm(
          userPos.lat, userPos.lng,
          item.location.latitude, item.location.longitude
        ) : 0;

        // ?�품 마커 ?�성
        const marker = new kakao.maps.Marker({
          position: pos,
          title: item.title,
          image: new kakao.maps.MarkerImage(
            'data:image/svg+xml;base64,' + btoa(`
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="#FFFFFF" stroke-width="2"/>
                <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">?��</text>
              </svg>
            `),
            new kakao.maps.Size(32, 32)
          )
        });
        marker.setMap(map);
        newMarkers.push(marker);

        // ?�포?�도???�성
        const iwContent = `
          <div style="padding:15px; min-width:250px; max-width:300px;">
            <div style="display:flex; gap:10px; align-items:flex-start;">
              <img 
                src="${item.imageUrls?.[0] || "/no-image.png"}" 
                style="width:80px; height:80px; object-fit:cover; border-radius:8px; border:1px solid #ddd;" 
                onerror="this.src='/no-image.png'"
              />
              <div style="flex:1;">
                <h3 style="margin:0 0 5px 0; font-size:14px; font-weight:bold; color:#333;">${item.title}</h3>
                <p style="margin:0 0 8px 0; font-size:12px; color:#666; line-height:1.4;">
                  ${item.autoDescription || item.description || "?�명 ?�음"}
                </p>
                <div style="margin:0 0 8px 0;">
                  <span style="font-size:16px; font-weight:bold; color:#059669;">??{(item.price || 0).toLocaleString()}</span>
                  ${distance > 0 ? `<span style="margin-left:10px; font-size:11px; color:#3B82F6;">?�� ${distance.toFixed(1)}km</span>` : ''}
                </div>
                ${item.autoTags && item.autoTags.length > 0 ? `
                  <div style="margin-top:8px;">
                    ${item.autoTags.slice(0, 3).map((tag: string) => 
                      `<span style="display:inline-block; background:#E3F2FD; color:#1976D2; font-size:10px; padding:2px 6px; border-radius:10px; margin-right:4px; margin-bottom:2px;">#${tag}</span>`
                    ).join('')}
                    ${item.autoTags.length > 3 ? `<span style="font-size:10px; color:#666;">+${item.autoTags.length - 3}</span>` : ''}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        `;
        
        const infowindow = new kakao.maps.InfoWindow({
          content: iwContent,
        });

        kakao.maps.event.addListener(marker, "click", () => {
          infowindow.open(map, marker);
        });
      });

      setMarkers(newMarkers);

      // 지??범위 조정
      if (itemsWithLocation.length > 0) {
        map.setBounds(bounds);
      }

      setMessage(`??${itemsWithLocation.length}개의 관???�품??찾았?�니??`);
    } catch (error) {
      console.error("검???�류:", error);
      setMessage("??검??�??�류가 발생?�습?�다.");
    }
  }

  // === ?�성 ?�식 ?�작 ===
  const startListening = () => {
    if (!recognizer) {
      setMessage("?�️ ?�성 ?�식??초기?�되지 ?�았?�니??");
      return;
    }

    setMessage("?�� ?�는 �?.. 말�??�주?�요!");
    setListening(true);

    recognizer.start();

    recognizer.onresult = async (e: any) => {
      const transcript = e.results[0][0].transcript;
      setMessage(`?���?"${transcript}"`);
      
      const tags = extractTags(transcript);
      if (tags.length > 0) {
        await searchAndDisplay(tags);
      } else {
        setMessage("???�식???�어?�서 검?�어�?찾�? 못했?�니?? ?�시 말해주세??");
      }
      setListening(false);
    };

    recognizer.onerror = (e: any) => {
      console.error("?�성 ?�식 ?�류:", e);
      setMessage("?�️ ?�성 ?�식 ?�류가 발생?�습?�다. ?�시 ?�도?�주?�요.");
      setListening(false);
    };

    recognizer.onend = () => {
      setListening(false);
      if (message.includes("?�는 �?)) {
        setMessage("?���??�성 ?�식??종료?�었?�니?? ?�시 말해주세??");
      }
    };
  };

  return (
    <div className="w-full h-screen relative flex flex-col">
      {/* ?�단 ?�보 */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
          <h1 className="text-lg font-bold text-gray-800 mb-2">?���??�성 명령 기반 지??검??/h1>
          <p className="text-sm text-gray-600">
            "근처 축구??보여�?, "??주�? ?�동??찾아�? ?�으�?말해보세??
          </p>
        </div>
      </div>

      {/* 지??*/}
      <div id="voice-map" className="flex-1 w-full" />

      {/* ?�단 컨트�?*/}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center z-10">
        <button
          onClick={startListening}
          disabled={listening}
          className={`rounded-full px-8 py-4 text-white text-lg font-bold shadow-lg transition-all duration-300 ${
            listening 
              ? "bg-red-500 hover:bg-red-600 animate-pulse" 
              : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          }`}
        >
          {listening ? "?���??�는 �?.." : "?�� 말하�??�작"}
        </button>
        
        <div className="mt-4 bg-white/90 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg max-w-md">
          <p className="text-sm font-medium text-gray-700">{message}</p>
        </div>

        {/* 결과 ?�약 */}
        {results.length > 0 && (
          <div className="mt-3 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
            <p className="text-xs text-gray-600">
              ?�� {results.length}�??�품 발견 | ?���?지?�에??마커�??�릭?�면 ?�세 ?�보�?�????�습?�다
            </p>
          </div>
        )}
      </div>

      {/* ?�치 ?�보 */}
      {userPos && (
        <div className="absolute top-20 left-4 z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
            <p className="text-xs text-gray-600">
              ?�� ???�치: {userPos.lat.toFixed(4)}, {userPos.lng.toFixed(4)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
