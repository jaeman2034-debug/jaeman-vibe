/**
 * ??MarketRoute_AI.tsx
 * ?¤ì œ ?„ë¡œ ê²½ë¡œ ê¸°ë°˜ ?ˆë‚´ (Kakao Mobility Directions + ?Œì„±)
 * - ì¶œë°œ/?„ì°© ì¢Œí‘œë¡?Firebase Functions ?„ë¡???¸ì¶œ
 * - ?¤ì œ ?„ë¡œë¥??°ë¼ Polyline ?œì‹œ
 * - instruction ëª©ë¡(TTS)ë¡??ˆë‚´
 * - ?¤ì‹œê°??„ì¹˜ ì¶”ì ?¼ë¡œ ?¤ìŒ ?ˆë‚´ë¡??´ë™
 */

import React, { useEffect, useRef, useState } from "react";
import { ensureSession, logVoice } from "@/lib/voiceLogger";

declare global {
  interface Window {
    kakao: any;
    webkitSpeechRecognition: any;
  }
}

type LatLng = { lat: number; lng: number };

type Instruction = {
  distance: number;
  instruction: string;
  turn: number;
  type: string;
  duration: number;
};

type RouteSummary = {
  distance: number;
  duration: number;
  toll_fare: number;
  fuel_price: number;
};

export default function MarketRoute_AI() {
  const [sessionId, setSessionId] = useState<string>("");
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<{ name: string; pos: LatLng } | null>(null);
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [currentInstruction, setCurrentInstruction] = useState<Instruction | null>(null);
  const [status, setStatus] = useState("?š¦ ì¶œë°œì§€ë¥??¤ì • ì¤?..");
  const [listening, setListening] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);

  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const polyRef = useRef<any>(null);
  const originMarker = useRef<any>(null);
  const destMarker = useRef<any>(null);
  const instrIndex = useRef(0);
  const watchId = useRef<number | null>(null);
  const lastSpokenDistance = useRef<number>(0);

  // === ?¸ì…˜ ì´ˆê¸°??===
  useEffect(() => {
    (async () => {
      const id = await ensureSession();
      setSessionId(id);
    })();
  }, []);

  // === ?Œì„± ì¶œë ¥ ===
  const speak = async (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    u.rate = 1.05; // [[memory:5313820]]???°ë¼ ìµœì  ?ë„ ?¤ì •
    u.pitch = 1.0;
    u.volume = 0.8;
    
    u.onend = async () => {
      // TTS ë¡œê¹…
      if (sessionId) {
        await logVoice(sessionId, { type: "tts", text });
      }
    };
    
    u.onerror = async () => {
      if (sessionId) {
        await logVoice(sessionId, { type: "error", text: "TTS ?¤ë¥˜" });
      }
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  // === ì§€??ì´ˆê¸°??===
  useEffect(() => {
    const { kakao } = window;
    if (!mapRef.current || !kakao) return;
    
    map.current = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(37.5665, 126.978),
      level: 6,
    });

    // ì¶œë°œì§€ (???„ì¹˜) ?¤ì •
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setOrigin(p);
          map.current.setCenter(new kakao.maps.LatLng(p.lat, p.lng));
          
          // ì¶œë°œì§€ ë§ˆì»¤
          originMarker.current = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(p.lat, p.lng),
            title: "ì¶œë°œì§€",
            image: new kakao.maps.MarkerImage(
              `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="white" stroke-width="2"/>
                  <circle cx="12" cy="12" r="4" fill="white"/>
                </svg>
              `)}`,
              new kakao.maps.Size(24, 24)
            )
          });
          originMarker.current.setMap(map.current);

          setStatus("?¯ ëª©ì ì§€ë¥??…ë ¥?˜ì„¸??");
          
          // ?„ì¹˜ ?•ë³´ ë¡œê¹…
          if (sessionId) {
            await logVoice(sessionId, { 
              type: "start", 
              geo: p, 
              meta: { center: "gps", accuracy: pos.coords.accuracy } 
            });
          }
        },
        async (error) => {
          setStatus("? ï¸ ?„ì¹˜ ê¶Œí•œ???ˆìš©??ì£¼ì„¸??");
          if (sessionId) {
            await logVoice(sessionId, { 
              type: "error", 
              text: "?„ì¹˜ ê¶Œí•œ ê±°ë?", 
              meta: { error: error.message } 
            });
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    }
  }, [sessionId]);

  // === Kakao Placesë¡?ëª©ì ì§€ ê²€??===
  const searchDestination = async (query: string): Promise<LatLng | null> => {
    return new Promise((resolve) => {
      const { kakao } = window;
      const places = new kakao.maps.services.Places();
      
      places.keywordSearch(query, async (data: any[], status: string) => {
        if (status !== kakao.maps.services.Status.OK || data.length === 0) {
          setStatus("??ëª©ì ì§€ë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤.");
          await speak("ëª©ì ì§€ë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤.");
          resolve(null);
          return;
        }
        
        const dest = {
          name: data[0].place_name,
          pos: { lat: parseFloat(data[0].y), lng: parseFloat(data[0].x) }
        };
        
        setDestination(dest);
        resolve(dest.pos);
      });
    });
  };

  // === Kakao Directions API ?¸ì¶œ ===
  const fetchDirections = async (dest: LatLng) => {
    if (!origin || !dest) return;

    setStatus("?›£ï¸?ê²½ë¡œ ê³„ì‚° ì¤?..");
    
    try {
      // Firebase Function ?„ë¡???¸ì¶œ
      const proxyUrl = `https://asia-northeast3-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/getKakaoDirections`;
      const url = `${proxyUrl}?origin=${origin.lng},${origin.lat}&destination=${dest.lng},${dest.lat}`;
      
      console.log("?—ºï¸?Directions API ?¸ì¶œ:", url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API ?¤ë¥˜: ${response.status}`);
      }
      
      const json = await response.json();
      
      if (!json.routes || !json.routes.length) {
        setStatus("??ê²½ë¡œë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤.");
        await speak("ê²½ë¡œë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤.");
        return;
      }

      const route = json.routes[0];
      setRouteSummary(route.summary);

      // ê²½ë¡œ ì¢Œí‘œ ì¶”ì¶œ
      const coords: any[] = [];
      route.sections.forEach((section: any) => {
        section.roads.forEach((road: any) => {
          for (let i = 0; i < road.vertexes.length; i += 2) {
            coords.push(new kakao.maps.LatLng(road.vertexes[i + 1], road.vertexes[i]));
          }
        });
      });

      // ê¸°ì¡´ Polyline ?œê±°
      if (polyRef.current) {
        polyRef.current.setMap(null);
      }

      // ?ˆë¡œ??Polyline ?ì„± (?¤ì œ ?„ë¡œ ê²½ë¡œ)
      polyRef.current = new kakao.maps.Polyline({
        path: coords,
        strokeWeight: 6,
        strokeColor: "#2E7D32",
        strokeOpacity: 0.8,
        strokeStyle: "solid",
      });
      polyRef.current.setMap(map.current);

      // ëª©ì ì§€ ë§ˆì»¤
      if (destMarker.current) {
        destMarker.current.setMap(null);
      }
      
      destMarker.current = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(dest.lat, dest.lng),
        title: destination?.name || "ëª©ì ì§€",
        image: new kakao.maps.MarkerImage(
          `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#FF0000"/>
            </svg>
          `)}`,
          new kakao.maps.Size(32, 32)
        )
      });
      destMarker.current.setMap(map.current);

      // ì§€??ë²”ìœ„ ì¡°ì •
      const bounds = new kakao.maps.LatLngBounds();
      coords.forEach(coord => bounds.extend(coord));
      map.current.setBounds(bounds);

      // ?ˆë‚´ ë¬¸ì¥ ì¶”ì¶œ
      const instr: Instruction[] = [];
      route.sections.forEach((section: any) => {
        section.guides.forEach((guide: any) => {
          instr.push({
            distance: guide.distance,
            instruction: guide.guidance,
            turn: guide.turn_type || 0,
            type: guide.type || "STRAIGHT",
            duration: guide.duration || 0
          });
        });
      });

      setInstructions(instr);
      setCurrentInstruction(instr[0] || null);
      instrIndex.current = 0;
      lastSpokenDistance.current = 0;

      // ê²½ë¡œ ?•ë³´ ?Œì„± ?ˆë‚´
      const distance = Math.round(route.summary.distance / 1000);
      const duration = Math.round(route.summary.duration / 60);
      const message = `ëª©ì ì§€ê¹Œì? ${distance}?¬ë¡œë¯¸í„°, ?ˆìƒ ?œê°„ ${duration}ë¶„ì…?ˆë‹¤. ?ˆë‚´ë¥??œì‘?©ë‹ˆ??`;
      await speak(message);
      
      setStatus("?“¢ ?¤ì‹œê°??ˆë‚´ ?œì‘");
      setIsNavigating(true);

      // ê²€??ê²°ê³¼ ë¡œê¹…
      if (sessionId) {
        await logVoice(sessionId, { 
          type: "results", 
          resultCount: 1,
          meta: { 
            destination: destination?.name,
            distance: route.summary.distance,
            duration: route.summary.duration,
            instructions: instr.length
          } 
        });
      }

      // ?¤ì‹œê°??„ì¹˜ ì¶”ì  ?œì‘
      startLocationTracking();

    } catch (error) {
      console.error("??ê²½ë¡œ ê²€???¤ë¥˜:", error);
      setStatus("??ê²½ë¡œ ê²€??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
      await speak("ê²½ë¡œ ê²€??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
      
      if (sessionId) {
        await logVoice(sessionId, { 
          type: "error", 
          text: "ê²½ë¡œ ê²€???¤ë¥˜", 
          meta: { error: (error as Error).message } 
        });
      }
    }
  };

  // === ?¤ì‹œê°??„ì¹˜ ì¶”ì  ë°??ˆë‚´ ===
  const startLocationTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
    }

    watchId.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        
        // ì¶œë°œì§€ ë§ˆì»¤ ?…ë°?´íŠ¸
        if (originMarker.current) {
          originMarker.current.setPosition(new kakao.maps.LatLng(currentPos.lat, currentPos.lng));
        }

        // ?„ì¬ ?ˆë‚´?€??ê±°ë¦¬ ê³„ì‚°
        const currentInstr = instructions[instrIndex.current];
        if (!currentInstr) return;

        const distanceToInstruction = currentInstr.distance;
        
        // ?ˆë‚´ ì¡°ê±´: 100m ?´ë‚´?´ê±°???´ì „???ˆë‚´?˜ì? ?Šì? ê²½ìš°
        if (distanceToInstruction <= 100 && distanceToInstruction !== lastSpokenDistance.current) {
          await speak(currentInstr.instruction);
          lastSpokenDistance.current = distanceToInstruction;
          
          // ?¤ìŒ ?ˆë‚´ë¡??´ë™
          if (instrIndex.current < instructions.length - 1) {
            instrIndex.current++;
            setCurrentInstruction(instructions[instrIndex.current]);
          }

          // ?´ë¹„ê²Œì´??ë¡œê¹…
          if (sessionId) {
            await logVoice(sessionId, { 
              type: "map", 
              text: "navigation_instruction", 
              meta: { 
                instruction: currentInstr.instruction,
                distance: distanceToInstruction,
                index: instrIndex.current
              } 
            });
          }
        }

        // ëª©ì ì§€ ?„ì°© ?•ì¸ (50m ?´ë‚´)
        if (destination && distanceToInstruction <= 50) {
          setIsNavigating(false);
          await speak("ëª©ì ì§€???„ì°©?ˆìŠµ?ˆë‹¤!");
          setStatus("?‰ ëª©ì ì§€???„ì°©?ˆìŠµ?ˆë‹¤!");
          
          if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
          }

          if (sessionId) {
            await logVoice(sessionId, { 
              type: "tts", 
              text: "ëª©ì ì§€ ?„ì°©", 
              meta: { destination: destination.name } 
            });
          }
        }
      },
      async (error) => {
        console.warn("?„ì¹˜ ì¶”ì  ?¤ë¥˜:", error);
        if (sessionId) {
          await logVoice(sessionId, { 
            type: "error", 
            text: "?„ì¹˜ ì¶”ì  ?¤ë¥˜", 
            meta: { error: error.message } 
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );
  };

  // === ?Œì„± ëª…ë ¹?¼ë¡œ ëª©ì ì§€ ?…ë ¥ ===
  const startVoice = async () => {
    const SR = (window as any).SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setStatus("? ï¸ ë¸Œë¼?°ì?ê°€ ?Œì„± ?¸ì‹??ì§€?í•˜ì§€ ?ŠìŠµ?ˆë‹¤.");
      return;
    }

    const rec = new SR();
    rec.lang = "ko-KR";
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    setListening(true);
    setStatus("?§ ?£ëŠ” ì¤?..");
    
    // STT ?œì‘ ë¡œê¹…
    if (sessionId) {
      await logVoice(sessionId, { type: "stt", text: "start" });
    }

    rec.start();

    rec.onresult = async (e: any) => {
      const transcript = e.results[0][0].transcript;
      
      // STT ê²°ê³¼ ë¡œê¹…
      if (sessionId) {
        await logVoice(sessionId, { type: "stt", text: transcript });
      }
      
      const cleaned = transcript.replace(/ê¹Œì?|ë¡??ˆë‚´?´ì¤˜|ê¸¸ì°¾ê¸?ê°€??ê°€ì¤?ì°¾ì•„ì¤?gi, "").trim();
      
      setStatus("?” ëª©ì ì§€ ê²€??ì¤?..");
      const dest = await searchDestination(cleaned);
      
      if (dest) {
        await fetchDirections(dest);
      }
      
      setListening(false);
    };

    rec.onerror = async (e: any) => {
      setListening(false);
      setStatus("? ï¸ ?Œì„± ?¸ì‹ ?¤ë¥˜");
      
      if (sessionId) {
        await logVoice(sessionId, { 
          type: "error", 
          text: "STT ?¤ë¥˜", 
          meta: { error: e.error } 
        });
      }
    };

    rec.onend = () => {
      setListening(false);
    };
  };

  // === ?ìŠ¤???…ë ¥?¼ë¡œ ëª©ì ì§€ ê²€??===
  const handleTextSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const query = formData.get("query") as string;
    
    if (!query.trim()) return;
    
    setStatus("?” ëª©ì ì§€ ê²€??ì¤?..");
    const dest = await searchDestination(query);
    
    if (dest) {
      await fetchDirections(dest);
    }
  };

  // === ì»´í¬?ŒíŠ¸ ?•ë¦¬ ===
  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* ?¤ë” */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">?š— ?¤ì‹œê°??„ë¡œ ?ˆë‚´</h1>
          <p className="text-sm text-gray-600">Kakao Mobility Directions API ê¸°ë°˜</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className={`w-2 h-2 rounded-full ${isNavigating ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></span>
          {isNavigating ? '?´ë¹„ê²Œì´??ì¤?..' : '?€ê¸?ì¤?..'}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ?—ºï¸?ì§€???ì—­ */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />
          {origin && (
            <div className="absolute top-4 left-4 bg-white rounded-lg p-2 shadow-md text-sm">
              ?“ ì¶œë°œì§€: {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}
            </div>
          )}
        </div>

        {/* ?›ï¸?ì»¨íŠ¸ë¡??¨ë„ */}
        <div className="w-96 border-l bg-white flex flex-col">
          <div className="p-4 space-y-4">
            {/* ?Œì„± ?…ë ¥ */}
            <button
              onClick={startVoice}
              disabled={listening || !origin}
              className={`w-full bg-black text-white px-4 py-3 rounded-lg text-lg transition-colors ${
                listening ? "bg-red-500 animate-pulse" : !origin ? "bg-gray-400" : "hover:bg-gray-800"
              }`}
            >
              {listening ? "?§ ?£ëŠ” ì¤?.." : "?¤ ëª©ì ì§€ ë§í•˜ê¸?}
            </button>

            {/* ?ìŠ¤???…ë ¥ */}
            <form onSubmit={handleTextSearch} className="space-y-2">
              <input
                name="query"
                placeholder="?? ?Œí˜ ì²´ìœ¡ê³µì›"
                className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!origin}
              />
              <button 
                type="submit"
                className="w-full bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                disabled={!origin}
              >
                ?›£ï¸?ê¸¸ì°¾ê¸??œì‘
              </button>
            </form>

            {/* ?íƒœ ?œì‹œ */}
            <div className="bg-gray-100 rounded-lg p-3 text-sm min-h-[60px] flex items-center">
              {status}
            </div>

            {/* ê²½ë¡œ ?•ë³´ */}
            {routeSummary && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-semibold text-blue-800 mb-2">?“Š ê²½ë¡œ ?•ë³´</div>
                <div className="text-sm space-y-1">
                  <div>ê±°ë¦¬: {Math.round(routeSummary.distance / 1000)}km</div>
                  <div>?ˆìƒ ?œê°„: {Math.round(routeSummary.duration / 60)}ë¶?/div>
                  {routeSummary.toll_fare > 0 && (
                    <div>?µí–‰ë£? {routeSummary.toll_fare.toLocaleString()}??/div>
                  )}
                </div>
              </div>
            )}

            {/* ?„ì¬ ?ˆë‚´ */}
            {currentInstruction && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="text-sm font-semibold text-yellow-800 mb-2">?“¢ ?„ì¬ ?ˆë‚´</div>
                <div className="text-sm">
                  <div className="font-medium">{currentInstruction.instruction}</div>
                  <div className="text-gray-600 mt-1">
                    {currentInstruction.distance}m ??                  </div>
                </div>
              </div>
            )}

            {/* ëª©ì ì§€ ?•ë³´ */}
            {destination && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm font-semibold text-green-800 mb-2">?¯ ëª©ì ì§€</div>
                <div className="text-sm">
                  <strong>{destination.name}</strong><br />
                  {destination.pos.lat.toFixed(6)}, {destination.pos.lng.toFixed(6)}
                </div>
              </div>
            )}

            {/* ?¬ìš©ë²??ˆë‚´ */}
            {!destination && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-semibold text-gray-800 mb-2">?“– ?¬ìš©ë²?/div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>???¤ ë²„íŠ¼???ŒëŸ¬ ?Œì„±?¼ë¡œ ëª©ì ì§€ ë§í•˜ê¸?/div>
                  <div>???ìŠ¤?¸ë¡œ ì§ì ‘ ?…ë ¥ ??ê¸¸ì°¾ê¸??œì‘</div>
                  <div>???¤ì œ ?„ë¡œ ê²½ë¡œë¡??ˆë‚´?©ë‹ˆ??/div>
                  <div>??100m ?´ë‚´?ì„œ ?Œì„± ?ˆë‚´</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
