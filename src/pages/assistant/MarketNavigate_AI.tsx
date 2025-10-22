/**
 * ??MarketNavigate_AI.tsx
 * 기능:
 *  - ?�성/?�스?�로 목적지 ?�력 (?? "?�흘 체육공원까�? ?�내?�줘")
 *  - Kakao Places�?목적지 좌표 검????지??마커/직선 경로 ?�시
 *  - ???�치 추적(geolocation watch)?�로 ?��? 거리/방위 ?�시�?갱신
 *  - TTS(?�성)�??�내 멘트
 *  - 모바?? 카카?�내�??�링?? ?? 카카?�맵 길찾�?링크 ?�공
 *
 * ?�️ 준�?
 *  - index.html??Kakao Maps SDK 추�?:
 *    <script src="//dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_KAKAO_APP_KEY&libraries=services"></script>
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

export default function MarketNavigate_AI() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("?�� 목적지�?말하거나 ?�력?�세??");
  const [listening, setListening] = useState(false);
  const [userPos, setUserPos] = useState<LatLng | null>(null);
  const [dest, setDest] = useState<{ name: string; pos: LatLng } | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [isNavigating, setIsNavigating] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const userMarker = useRef<any>(null);
  const destMarker = useRef<any>(null);
  const line = useRef<any>(null);
  const watchId = useRef<number | null>(null);

  // === ?�션 초기??===
  useEffect(() => {
    (async () => {
      const id = await ensureSession();
      setSessionId(id);
    })();
  }, []);

  // =========== ?�틸 ===========
  const speak = async (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    u.rate = 1.06; // [[memory:5313820]]???�라 최적 ?�도 ?�정
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

  const toRad = (d: number) => (d * Math.PI) / 180;
  const distanceKm = (a: LatLng, b: LatLng) => {
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) *
        Math.cos(toRad(b.lat)) *
        Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)));
  };
  const bearingDeg = (a: LatLng, b: LatLng) => {
    const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
    const x =
      Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
      Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
    const brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360; // 0~360
  };
  const bearingToText = (deg: number) => {
    const dirs = [
      "북쪽","북동","?�쪽","?�동","?�쪽","?�서","?�쪽","북서","북쪽"
    ];
    const idx = Math.round(deg / 45);
    return dirs[idx];
  };

  // =========== 지??초기??===========
  useEffect(() => {
    const { kakao } = window;
    if (!mapRef.current || !kakao) return;
    
    map.current = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(37.5665, 126.9780),
      level: 6,
    });

    // GPS ?�작
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserPos(p);
          map.current.setCenter(new kakao.maps.LatLng(p.lat, p.lng));
          
          // ?�용???�치 마커
          userMarker.current = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(p.lat, p.lng),
            title: "???�치",
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
          userMarker.current.setMap(map.current);

          // ?�치 ?�보 로깅
          if (sessionId) {
            await logVoice(sessionId, { 
              type: "start", 
              geo: p, 
              meta: { center: "gps", accuracy: pos.coords.accuracy } 
            });
          }

          // ?�시�?추적 ?�작
          watchId.current = navigator.geolocation.watchPosition(
            async (pp) => {
              const np = { lat: pp.coords.latitude, lng: pp.coords.longitude };
              setUserPos(np);
              
              if (userMarker.current) {
                userMarker.current.setPosition(new kakao.maps.LatLng(np.lat, np.lng));
              }
              
              if (dest?.pos) {
                await updateLineAndHUD(np, dest.pos);
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
    } else {
      setStatus("?�️ ??브라?��???GPS�?지?�하지 ?�습?�다.");
    }

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // =========== 경로(직선) & HUD ===========
  const updateLineAndHUD = async (from: LatLng, to: LatLng) => {
    const { kakao } = window;
    
    // 직선 경로 갱신
    const path = [
      new kakao.maps.LatLng(from.lat, from.lng),
      new kakao.maps.LatLng(to.lat, to.lng),
    ];
    
    if (!line.current) {
      line.current = new kakao.maps.Polyline({
        path,
        strokeWeight: 5,
        strokeOpacity: 0.8,
        strokeStyle: "solid",
        strokeColor: "#FF0000",
      });
      line.current.setMap(map.current);
    } else {
      line.current.setPath(path);
    }

    // 거리 & 방위 계산
    const km = distanceKm(from, to);
    const m = Math.round(km * 1000);
    const br = bearingDeg(from, to);
    const direction = bearingToText(br);
    
    setStatus(`?�️ ?��? 거리: ${m.toLocaleString()}m · 방향: ${direction} (${br.toFixed(0)}°)`);

    // ?�비게이??로깅
    if (sessionId && dest) {
      await logVoice(sessionId, { 
        type: "map", 
        text: "navigation_update", 
        meta: { 
          destination: dest.name,
          distance: m,
          bearing: br,
          direction 
        } 
      });
    }

    // ?�착 ?�내
    if (m <= 25) {
      setIsNavigating(false);
      await speak("목적지???�착?�습?�다!");
      setStatus("?�� 목적지???�착?�습?�다!");
      
      if (sessionId) {
        await logVoice(sessionId, { 
          type: "tts", 
          text: "목적지 ?�착", 
          meta: { destination: dest?.name } 
        });
      }
    } else if (m <= 100 && isNavigating) {
      // 100m ?�내?�서 ?�내
      await speak(`${m}미터 ?�았?�니?? ${direction} 방향?�니??`);
    }
  };

  // =========== 목적지 검??===========
  const searchDestination = async (text: string) => {
    if (!text.trim()) return;
    
    setStatus("?�� 목적지�?검??�?..");
    
    const { kakao } = window;
    const places = new kakao.maps.services.Places();
    
    places.keywordSearch(text, async (data: any[], status: string) => {
      if (status !== kakao.maps.services.Status.OK || data.length === 0) {
        setStatus("??결과 ?�음");
        await speak("관???�소�?찾�? 못했?�니??");
        
        if (sessionId) {
          await logVoice(sessionId, { 
            type: "error", 
            text: "목적지 검???�패", 
            meta: { query: text } 
          });
        }
        return;
      }
      
      const top = data[0]; // 최상??결과 ?�용
      const pos: LatLng = { lat: parseFloat(top.y), lng: parseFloat(top.x) };
      setDest({ name: top.place_name, pos });
      setIsNavigating(true);

      // 목적지 마커
      if (!destMarker.current) {
        destMarker.current = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(pos.lat, pos.lng),
          title: top.place_name,
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
      } else {
        destMarker.current.setPosition(new kakao.maps.LatLng(pos.lat, pos.lng));
      }

      // ?�포?�도??      const infowindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:10px;text-align:center;">
                    <strong>${top.place_name}</strong><br/>
                    <small>${top.road_address_name || top.address_name}</small>
                  </div>`
      });
      infowindow.open(map.current, destMarker.current);

      // ?�면 범위 조정
      const bounds = new kakao.maps.LatLngBounds();
      if (userPos) bounds.extend(new kakao.maps.LatLng(userPos.lat, userPos.lng));
      bounds.extend(new kakao.maps.LatLng(pos.lat, pos.lng));
      map.current.setBounds(bounds);

      // HUD/경로 갱신 + ?�성
      if (userPos) {
        await updateLineAndHUD(userPos, pos);
      }
      await speak(`목적지 ${top.place_name}�??�내�??�작?�니??`);
      
      // 검??결과 로깅
      if (sessionId) {
        await logVoice(sessionId, { 
          type: "results", 
          resultCount: data.length,
          meta: { 
            destination: top.place_name,
            address: top.road_address_name || top.address_name,
            position: pos
          } 
        });
      }
    });
  };

  // =========== ?�성 ?�력 ===========
  const startListening = async () => {
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
      setQuery(transcript);
      
      // STT 결과 로깅
      if (sessionId) {
        await logVoice(sessionId, { type: "stt", text: transcript });
      }
      
      // "~까�? ?�내?�줘/가??길찾�? 같�? ?�큰 ?�거
      const cleaned = transcript
        .replace(/까�?|�??�로|?�내?�줘|길찾�?가??가�?찾아�?gi, "")
        .trim();
      
      await searchDestination(cleaned);
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

  // =========== 링크(카카?�내�?카카?�맵) ===========
  const makeKakaoMapLink = () => {
    if (!dest) return "#";
    // 카카?�맵 링크: 목적지�?길찾�???
    return `https://map.kakao.com/link/to/${encodeURIComponent(dest.name)},${dest.pos.lat},${dest.pos.lng}`;
  };
  
  const makeKakaoNaviLink = () => {
    if (!dest) return "#";
    // 카카?�내�??�링??모바???�용, 미설�????�토???�동)
    return `kakaonavi://navigate?name=${encodeURIComponent(dest.name)}&x=${dest.pos.lng}&y=${dest.pos.lat}`;
  };

  // =========== ?�출 ===========
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const cleaned = query.replace(/까�?|�??�로|?�내?�줘|길찾�?가??가�?찾아�?gi, "").trim();
    await searchDestination(cleaned);
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* ?�더 */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">?�� ?�고 ?�비</h1>
          <p className="text-sm text-gray-600">?�시�??�성 ?�내 ?�비게이??/p>
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
          {userPos && (
            <div className="absolute top-4 left-4 bg-white rounded-lg p-2 shadow-md text-sm">
              ?�� ???�치: {userPos.lat.toFixed(4)}, {userPos.lng.toFixed(4)}
            </div>
          )}
        </div>

        {/* ?���?컨트�??�널 */}
        <div className="w-96 border-l bg-white flex flex-col">
          <div className="p-4 space-y-4">
            {/* ?�력 ??*/}
            <form onSubmit={onSubmit} className="flex gap-2">
              <button
                type="button"
                onClick={startListening}
                disabled={listening}
                className={`rounded-full w-10 h-10 flex items-center justify-center text-white text-xl transition-colors ${
                  listening ? "bg-red-500 animate-pulse" : "bg-black hover:bg-gray-800"
                }`}
                title="?�성 ?�력"
              >
                ?��
              </button>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="?? ?�흘 체육공원까�? ?�내?�줘"
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={listening}
              />
              <button 
                type="submit"
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                disabled={!query.trim() || listening}
              >
                길찾�?              </button>
            </form>

            {/* ?�태 ?�시 */}
            <div className="text-sm p-3 bg-gray-50 rounded-lg min-h-[60px] flex items-center">
              {status}
            </div>

            {/* 목적지 ?�보 */}
            {dest && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-semibold text-blue-800 mb-1">?�� 목적지</div>
                  <div className="text-sm">
                    <strong>{dest.name}</strong><br />
                    ?�도 {dest.pos.lat.toFixed(6)}, 경도 {dest.pos.lng.toFixed(6)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-700">?�� ?��? ?�으�??�기</div>
                  <div className="flex flex-col gap-2">
                    <a
                      href={makeKakaoMapLink()}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded bg-gray-900 text-white text-sm text-center hover:bg-gray-800 transition-colors"
                    >
                      ?�� 카카?�맵 길찾�?(??
                    </a>
                    <a
                      href={makeKakaoNaviLink()}
                      className="px-3 py-2 rounded bg-blue-600 text-white text-sm text-center hover:bg-blue-700 transition-colors"
                    >
                      ?�� 카카?�내비로 ?�기 (모바??
                    </a>
                  </div>
                </div>
                
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-xs text-yellow-800">
                    ?�� <strong>?�내 방식:</strong><br/>
                    ??지????경로??<strong>직선</strong> ?�내?�니??br/>
                    ???�제 ?�로 경로????버튼?�로 카카??길찾�??�용<br/>
                    ???�시�?거리/방향?� ?�성?�로 ?�내?�니??                  </div>
                </div>
              </div>
            )}

            {/* ?�용�??�내 */}
            {!dest && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm font-semibold text-green-800 mb-2">?�� ?�용�?/div>
                <div className="text-xs text-green-700 space-y-1">
                  <div>???�� 버튼???�러 ?�성?�로 목적지 말하�?/div>
                  <div>???�스?�로 직접 ?�력 ??길찾�?버튼</div>
                  <div>???�비게이??�??�시�??�성 ?�내</div>
                  <div>??25m ?�내 ?�착 ???�동 ?�림</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
