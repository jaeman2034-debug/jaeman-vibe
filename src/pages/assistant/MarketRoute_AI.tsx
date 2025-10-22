/**
 * ??MarketRoute_AI.tsx
 * ?�제 ?�로 경로 기반 ?�내 (Kakao Mobility Directions + ?�성)
 * - 출발/?�착 좌표�?Firebase Functions ?�록???�출
 * - ?�제 ?�로�??�라 Polyline ?�시
 * - instruction 목록(TTS)�??�내
 * - ?�시�??�치 추적?�로 ?�음 ?�내�??�동
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
  const [status, setStatus] = useState("?�� 출발지�??�정 �?..");
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

  // === ?�션 초기??===
  useEffect(() => {
    (async () => {
      const id = await ensureSession();
      setSessionId(id);
    })();
  }, []);

  // === ?�성 출력 ===
  const speak = async (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    u.rate = 1.05; // [[memory:5313820]]???�라 최적 ?�도 ?�정
    u.pitch = 1.0;
    u.volume = 0.8;
    
    u.onend = async () => {
      // TTS 로깅
      if (sessionId) {
        await logVoice(sessionId, { type: "tts", text });
      }
    };
    
    u.onerror = async () => {
      if (sessionId) {
        await logVoice(sessionId, { type: "error", text: "TTS ?�류" });
      }
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  // === 지??초기??===
  useEffect(() => {
    const { kakao } = window;
    if (!mapRef.current || !kakao) return;
    
    map.current = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(37.5665, 126.978),
      level: 6,
    });

    // 출발지 (???�치) ?�정
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setOrigin(p);
          map.current.setCenter(new kakao.maps.LatLng(p.lat, p.lng));
          
          // 출발지 마커
          originMarker.current = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(p.lat, p.lng),
            title: "출발지",
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

          setStatus("?�� 목적지�??�력?�세??");
          
          // ?�치 ?�보 로깅
          if (sessionId) {
            await logVoice(sessionId, { 
              type: "start", 
              geo: p, 
              meta: { center: "gps", accuracy: pos.coords.accuracy } 
            });
          }
        },
        async (error) => {
          setStatus("?�️ ?�치 권한???�용??주세??");
          if (sessionId) {
            await logVoice(sessionId, { 
              type: "error", 
              text: "?�치 권한 거�?", 
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

  // === Kakao Places�?목적지 검??===
  const searchDestination = async (query: string): Promise<LatLng | null> => {
    return new Promise((resolve) => {
      const { kakao } = window;
      const places = new kakao.maps.services.Places();
      
      places.keywordSearch(query, async (data: any[], status: string) => {
        if (status !== kakao.maps.services.Status.OK || data.length === 0) {
          setStatus("??목적지�?찾을 ???�습?�다.");
          await speak("목적지�?찾을 ???�습?�다.");
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

  // === Kakao Directions API ?�출 ===
  const fetchDirections = async (dest: LatLng) => {
    if (!origin || !dest) return;

    setStatus("?���?경로 계산 �?..");
    
    try {
      // Firebase Function ?�록???�출
      const proxyUrl = `https://asia-northeast3-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/getKakaoDirections`;
      const url = `${proxyUrl}?origin=${origin.lng},${origin.lat}&destination=${dest.lng},${dest.lat}`;
      
      console.log("?���?Directions API ?�출:", url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API ?�류: ${response.status}`);
      }
      
      const json = await response.json();
      
      if (!json.routes || !json.routes.length) {
        setStatus("??경로�?찾을 ???�습?�다.");
        await speak("경로�?찾을 ???�습?�다.");
        return;
      }

      const route = json.routes[0];
      setRouteSummary(route.summary);

      // 경로 좌표 추출
      const coords: any[] = [];
      route.sections.forEach((section: any) => {
        section.roads.forEach((road: any) => {
          for (let i = 0; i < road.vertexes.length; i += 2) {
            coords.push(new kakao.maps.LatLng(road.vertexes[i + 1], road.vertexes[i]));
          }
        });
      });

      // 기존 Polyline ?�거
      if (polyRef.current) {
        polyRef.current.setMap(null);
      }

      // ?�로??Polyline ?�성 (?�제 ?�로 경로)
      polyRef.current = new kakao.maps.Polyline({
        path: coords,
        strokeWeight: 6,
        strokeColor: "#2E7D32",
        strokeOpacity: 0.8,
        strokeStyle: "solid",
      });
      polyRef.current.setMap(map.current);

      // 목적지 마커
      if (destMarker.current) {
        destMarker.current.setMap(null);
      }
      
      destMarker.current = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(dest.lat, dest.lng),
        title: destination?.name || "목적지",
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

      // 지??범위 조정
      const bounds = new kakao.maps.LatLngBounds();
      coords.forEach(coord => bounds.extend(coord));
      map.current.setBounds(bounds);

      // ?�내 문장 추출
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

      // 경로 ?�보 ?�성 ?�내
      const distance = Math.round(route.summary.distance / 1000);
      const duration = Math.round(route.summary.duration / 60);
      const message = `목적지까�? ${distance}?�로미터, ?�상 ?�간 ${duration}분입?�다. ?�내�??�작?�니??`;
      await speak(message);
      
      setStatus("?�� ?�시�??�내 ?�작");
      setIsNavigating(true);

      // 검??결과 로깅
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

      // ?�시�??�치 추적 ?�작
      startLocationTracking();

    } catch (error) {
      console.error("??경로 검???�류:", error);
      setStatus("??경로 검??�??�류가 발생?�습?�다.");
      await speak("경로 검??�??�류가 발생?�습?�다.");
      
      if (sessionId) {
        await logVoice(sessionId, { 
          type: "error", 
          text: "경로 검???�류", 
          meta: { error: (error as Error).message } 
        });
      }
    }
  };

  // === ?�시�??�치 추적 �??�내 ===
  const startLocationTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
    }

    watchId.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        
        // 출발지 마커 ?�데?�트
        if (originMarker.current) {
          originMarker.current.setPosition(new kakao.maps.LatLng(currentPos.lat, currentPos.lng));
        }

        // ?�재 ?�내?�??거리 계산
        const currentInstr = instructions[instrIndex.current];
        if (!currentInstr) return;

        const distanceToInstruction = currentInstr.distance;
        
        // ?�내 조건: 100m ?�내?�거???�전???�내?��? ?��? 경우
        if (distanceToInstruction <= 100 && distanceToInstruction !== lastSpokenDistance.current) {
          await speak(currentInstr.instruction);
          lastSpokenDistance.current = distanceToInstruction;
          
          // ?�음 ?�내�??�동
          if (instrIndex.current < instructions.length - 1) {
            instrIndex.current++;
            setCurrentInstruction(instructions[instrIndex.current]);
          }

          // ?�비게이??로깅
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

        // 목적지 ?�착 ?�인 (50m ?�내)
        if (destination && distanceToInstruction <= 50) {
          setIsNavigating(false);
          await speak("목적지???�착?�습?�다!");
          setStatus("?�� 목적지???�착?�습?�다!");
          
          if (watchId.current !== null) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
          }

          if (sessionId) {
            await logVoice(sessionId, { 
              type: "tts", 
              text: "목적지 ?�착", 
              meta: { destination: destination.name } 
            });
          }
        }
      },
      async (error) => {
        console.warn("?�치 추적 ?�류:", error);
        if (sessionId) {
          await logVoice(sessionId, { 
            type: "error", 
            text: "?�치 추적 ?�류", 
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

  // === ?�성 명령?�로 목적지 ?�력 ===
  const startVoice = async () => {
    const SR = (window as any).SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setStatus("?�️ 브라?��?가 ?�성 ?�식??지?�하지 ?�습?�다.");
      return;
    }

    const rec = new SR();
    rec.lang = "ko-KR";
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    setListening(true);
    setStatus("?�� ?�는 �?..");
    
    // STT ?�작 로깅
    if (sessionId) {
      await logVoice(sessionId, { type: "stt", text: "start" });
    }

    rec.start();

    rec.onresult = async (e: any) => {
      const transcript = e.results[0][0].transcript;
      
      // STT 결과 로깅
      if (sessionId) {
        await logVoice(sessionId, { type: "stt", text: transcript });
      }
      
      const cleaned = transcript.replace(/까�?|�??�내?�줘|길찾�?가??가�?찾아�?gi, "").trim();
      
      setStatus("?�� 목적지 검??�?..");
      const dest = await searchDestination(cleaned);
      
      if (dest) {
        await fetchDirections(dest);
      }
      
      setListening(false);
    };

    rec.onerror = async (e: any) => {
      setListening(false);
      setStatus("?�️ ?�성 ?�식 ?�류");
      
      if (sessionId) {
        await logVoice(sessionId, { 
          type: "error", 
          text: "STT ?�류", 
          meta: { error: e.error } 
        });
      }
    };

    rec.onend = () => {
      setListening(false);
    };
  };

  // === ?�스???�력?�로 목적지 검??===
  const handleTextSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const query = formData.get("query") as string;
    
    if (!query.trim()) return;
    
    setStatus("?�� 목적지 검??�?..");
    const dest = await searchDestination(query);
    
    if (dest) {
      await fetchDirections(dest);
    }
  };

  // === 컴포?�트 ?�리 ===
  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* ?�더 */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">?�� ?�시�??�로 ?�내</h1>
          <p className="text-sm text-gray-600">Kakao Mobility Directions API 기반</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className={`w-2 h-2 rounded-full ${isNavigating ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></span>
          {isNavigating ? '?�비게이??�?..' : '?��?�?..'}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ?���?지???�역 */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />
          {origin && (
            <div className="absolute top-4 left-4 bg-white rounded-lg p-2 shadow-md text-sm">
              ?�� 출발지: {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}
            </div>
          )}
        </div>

        {/* ?���?컨트�??�널 */}
        <div className="w-96 border-l bg-white flex flex-col">
          <div className="p-4 space-y-4">
            {/* ?�성 ?�력 */}
            <button
              onClick={startVoice}
              disabled={listening || !origin}
              className={`w-full bg-black text-white px-4 py-3 rounded-lg text-lg transition-colors ${
                listening ? "bg-red-500 animate-pulse" : !origin ? "bg-gray-400" : "hover:bg-gray-800"
              }`}
            >
              {listening ? "?�� ?�는 �?.." : "?�� 목적지 말하�?}
            </button>

            {/* ?�스???�력 */}
            <form onSubmit={handleTextSearch} className="space-y-2">
              <input
                name="query"
                placeholder="?? ?�흘 체육공원"
                className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!origin}
              />
              <button 
                type="submit"
                className="w-full bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                disabled={!origin}
              >
                ?���?길찾�??�작
              </button>
            </form>

            {/* ?�태 ?�시 */}
            <div className="bg-gray-100 rounded-lg p-3 text-sm min-h-[60px] flex items-center">
              {status}
            </div>

            {/* 경로 ?�보 */}
            {routeSummary && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm font-semibold text-blue-800 mb-2">?�� 경로 ?�보</div>
                <div className="text-sm space-y-1">
                  <div>거리: {Math.round(routeSummary.distance / 1000)}km</div>
                  <div>?�상 ?�간: {Math.round(routeSummary.duration / 60)}�?/div>
                  {routeSummary.toll_fare > 0 && (
                    <div>?�행�? {routeSummary.toll_fare.toLocaleString()}??/div>
                  )}
                </div>
              </div>
            )}

            {/* ?�재 ?�내 */}
            {currentInstruction && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <div className="text-sm font-semibold text-yellow-800 mb-2">?�� ?�재 ?�내</div>
                <div className="text-sm">
                  <div className="font-medium">{currentInstruction.instruction}</div>
                  <div className="text-gray-600 mt-1">
                    {currentInstruction.distance}m ??                  </div>
                </div>
              </div>
            )}

            {/* 목적지 ?�보 */}
            {destination && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm font-semibold text-green-800 mb-2">?�� 목적지</div>
                <div className="text-sm">
                  <strong>{destination.name}</strong><br />
                  {destination.pos.lat.toFixed(6)}, {destination.pos.lng.toFixed(6)}
                </div>
              </div>
            )}

            {/* ?�용�??�내 */}
            {!destination && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-semibold text-gray-800 mb-2">?�� ?�용�?/div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>???�� 버튼???�러 ?�성?�로 목적지 말하�?/div>
                  <div>???�스?�로 직접 ?�력 ??길찾�??�작</div>
                  <div>???�제 ?�로 경로�??�내?�니??/div>
                  <div>??100m ?�내?�서 ?�성 ?�내</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
