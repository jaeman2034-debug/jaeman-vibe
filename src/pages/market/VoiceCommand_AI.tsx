/**
 * ??VoiceCommand_AI.tsx
 * ê¸°ëŠ¥:
 *  - ë§ˆì´?¬ë¡œ ?Œì„± ?…ë ¥ ë°›ê¸° (Web Speech API)
 *  - NLUë¡??œê·¸ ì¶”ì¶œ ("ì¶•êµ¬?? ??["ì¶•êµ¬??, "?´ë™??])
 *  - Firestore?ì„œ ê´€???í’ˆ ê²€?? *  - Kakao ì§€?„ì— ?ë™ ?œì‹œ
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
  const [message, setMessage] = useState("?™ï¸??Œì„± ëª…ë ¹??ë§í•´ë³´ì„¸??);
  const [map, setMap] = useState<any>(null);
  const [results, setResults] = useState<MarketItem[]>([]);
  const [listening, setListening] = useState(false);
  const [recognizer, setRecognizer] = useState<any>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);

  // === ê±°ë¦¬ ê³„ì‚° ===
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

  // === ?¬ìš©???„ì¹˜ ?˜ì§‘ ===
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
          console.warn("?„ì¹˜ ?•ë³´ ?˜ì§‘ ?¤íŒ¨:", err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    }
  }, []);

  // === Kakao ì§€??ì´ˆê¸°??===
  useEffect(() => {
    if (!window.kakao || !userPos) return;

    const { kakao } = window;
    const container = document.getElementById("voice-map");
    if (!container) return;

    const mapObj = new kakao.maps.Map(container, {
      center: new kakao.maps.LatLng(userPos.lat, userPos.lng),
      level: 8,
    });

    // ?¬ìš©???„ì¹˜ ë§ˆì»¤
    const userMarker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(userPos.lat, userPos.lng),
      title: "???„ì¹˜",
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
    setMessage("?—ºï¸?ì§€?„ê? ì¤€ë¹„ë˜?ˆìŠµ?ˆë‹¤. ?Œì„± ëª…ë ¹??ë§í•´ë³´ì„¸??");
  }, [userPos]);

  // === ?Œì„± ?¸ì‹ ì´ˆê¸°??===
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessage("? ï¸ ë¸Œë¼?°ì?ê°€ ?Œì„± ?¸ì‹??ì§€?í•˜ì§€ ?ŠìŠµ?ˆë‹¤. Chrome???¬ìš©?´ì£¼?¸ìš”.");
      return;
    }
    
    const rec = new SpeechRecognition();
    rec.lang = "ko-KR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    setRecognizer(rec);
  }, []);

  // === NLU: ?ì—°??ì²˜ë¦¬ ë°??œê·¸ ì¶”ì¶œ ===
  function extractTags(text: string): string[] {
    console.log("?¤ ?Œì„± ?¸ì‹ ê²°ê³¼:", text);
    
    // ê¸°ë³¸ ?„ì²˜ë¦?    const cleanText = text
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .trim()
      .toLowerCase();

    // ë¶ˆìš©???œê±°
    const stopWords = [
      "ê·¼ì²˜", "ì£¼ë?", "ë³´ì—¬ì¤?, "ì°¾ì•„ì¤?, "??, "??, "?¬ê¸°", "??, "ê·?, "?€", 
      "ë¥?, "??, "ê°€", "??, "??, "?€", "??, "?ì„œ", "ë¡?, "?¼ë¡œ", "?€", "ê³?,
      "?ˆì–´", "?ˆë‚˜", "?´ì¤˜", "?´ì£¼?¸ìš”", "?Œë ¤ì¤?, "?Œë ¤ì£¼ì„¸??
    ];

    // ?¨ì–´ ë¶„ë¦¬ ë°??„í„°ë§?    const words = cleanText
      .split(/\s+/)
      .filter((w) => w.length > 1 && !stopWords.includes(w));

    console.log("?·ï¸?ì¶”ì¶œ???œê·¸:", words);
    return words;
  }

  // === ê¸°ì¡´ ë§ˆì»¤ ?œê±° ===
  const clearMarkers = () => {
    markers.forEach(marker => {
      marker.setMap(null);
    });
    setMarkers([]);
  };

  // === Firestore ê²€??+ ì§€???œì‹œ ===
  async function searchAndDisplay(tags: string[]) {
    if (!map || tags.length === 0) return;

    setMessage(`?” "${tags.join(", ")}" ê´€???í’ˆ??ê²€??ì¤?..`);
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
      
      // ?„ì¹˜ ?•ë³´ê°€ ?ˆëŠ” ?í’ˆë§??„í„°ë§?      const itemsWithLocation = data.filter(item => 
        item.location && item.location.latitude && item.location.longitude
      );

      setResults(itemsWithLocation);

      if (itemsWithLocation.length === 0) {
        setMessage(`??"${tags.join(", ")}" ê´€???í’ˆ??ì°¾ì? ëª»í–ˆ?µë‹ˆ??`);
        return;
      }

      const { kakao } = window;
      const bounds = new kakao.maps.LatLngBounds();
      const newMarkers: any[] = [];

      // ?¬ìš©???„ì¹˜ ?¬í•¨
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

        // ê±°ë¦¬ ê³„ì‚°
        const distance = userPos ? distanceKm(
          userPos.lat, userPos.lng,
          item.location.latitude, item.location.longitude
        ) : 0;

        // ?í’ˆ ë§ˆì»¤ ?ì„±
        const marker = new kakao.maps.Marker({
          position: pos,
          title: item.title,
          image: new kakao.maps.MarkerImage(
            'data:image/svg+xml;base64,' + btoa(`
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="#FFFFFF" stroke-width="2"/>
                <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">?“¦</text>
              </svg>
            `),
            new kakao.maps.Size(32, 32)
          )
        });
        marker.setMap(map);
        newMarkers.push(marker);

        // ?¸í¬?ˆë„???ì„±
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
                  ${item.autoDescription || item.description || "?¤ëª… ?†ìŒ"}
                </p>
                <div style="margin:0 0 8px 0;">
                  <span style="font-size:16px; font-weight:bold; color:#059669;">??{(item.price || 0).toLocaleString()}</span>
                  ${distance > 0 ? `<span style="margin-left:10px; font-size:11px; color:#3B82F6;">?“ ${distance.toFixed(1)}km</span>` : ''}
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

      // ì§€??ë²”ìœ„ ì¡°ì •
      if (itemsWithLocation.length > 0) {
        map.setBounds(bounds);
      }

      setMessage(`??${itemsWithLocation.length}ê°œì˜ ê´€???í’ˆ??ì°¾ì•˜?µë‹ˆ??`);
    } catch (error) {
      console.error("ê²€???¤ë¥˜:", error);
      setMessage("??ê²€??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    }
  }

  // === ?Œì„± ?¸ì‹ ?œì‘ ===
  const startListening = () => {
    if (!recognizer) {
      setMessage("? ï¸ ?Œì„± ?¸ì‹??ì´ˆê¸°?”ë˜ì§€ ?Šì•˜?µë‹ˆ??");
      return;
    }

    setMessage("?§ ?£ëŠ” ì¤?.. ë§ì??´ì£¼?¸ìš”!");
    setListening(true);

    recognizer.start();

    recognizer.onresult = async (e: any) => {
      const transcript = e.results[0][0].transcript;
      setMessage(`?—£ï¸?"${transcript}"`);
      
      const tags = extractTags(transcript);
      if (tags.length > 0) {
        await searchAndDisplay(tags);
      } else {
        setMessage("???¸ì‹???¨ì–´?ì„œ ê²€?‰ì–´ë¥?ì°¾ì? ëª»í–ˆ?µë‹ˆ?? ?¤ì‹œ ë§í•´ì£¼ì„¸??");
      }
      setListening(false);
    };

    recognizer.onerror = (e: any) => {
      console.error("?Œì„± ?¸ì‹ ?¤ë¥˜:", e);
      setMessage("? ï¸ ?Œì„± ?¸ì‹ ?¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤. ?¤ì‹œ ?œë„?´ì£¼?¸ìš”.");
      setListening(false);
    };

    recognizer.onend = () => {
      setListening(false);
      if (message.includes("?£ëŠ” ì¤?)) {
        setMessage("?™ï¸??Œì„± ?¸ì‹??ì¢…ë£Œ?˜ì—ˆ?µë‹ˆ?? ?¤ì‹œ ë§í•´ì£¼ì„¸??");
      }
    };
  };

  return (
    <div className="w-full h-screen relative flex flex-col">
      {/* ?ë‹¨ ?•ë³´ */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
          <h1 className="text-lg font-bold text-gray-800 mb-2">?™ï¸??Œì„± ëª…ë ¹ ê¸°ë°˜ ì§€??ê²€??/h1>
          <p className="text-sm text-gray-600">
            "ê·¼ì²˜ ì¶•êµ¬??ë³´ì—¬ì¤?, "??ì£¼ë? ?´ë™??ì°¾ì•„ì¤? ?±ìœ¼ë¡?ë§í•´ë³´ì„¸??
          </p>
        </div>
      </div>

      {/* ì§€??*/}
      <div id="voice-map" className="flex-1 w-full" />

      {/* ?˜ë‹¨ ì»¨íŠ¸ë¡?*/}
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
          {listening ? "?™ï¸??£ëŠ” ì¤?.." : "?¤ ë§í•˜ê¸??œì‘"}
        </button>
        
        <div className="mt-4 bg-white/90 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg max-w-md">
          <p className="text-sm font-medium text-gray-700">{message}</p>
        </div>

        {/* ê²°ê³¼ ?”ì•½ */}
        {results.length > 0 && (
          <div className="mt-3 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 shadow-lg">
            <p className="text-xs text-gray-600">
              ?“¦ {results.length}ê°??í’ˆ ë°œê²¬ | ?—ºï¸?ì§€?„ì—??ë§ˆì»¤ë¥??´ë¦­?˜ë©´ ?ì„¸ ?•ë³´ë¥?ë³????ˆìŠµ?ˆë‹¤
            </p>
          </div>
        )}
      </div>

      {/* ?„ì¹˜ ?•ë³´ */}
      {userPos && (
        <div className="absolute top-20 left-4 z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg">
            <p className="text-xs text-gray-600">
              ?“ ???„ì¹˜: {userPos.lat.toFixed(4)}, {userPos.lng.toFixed(4)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
