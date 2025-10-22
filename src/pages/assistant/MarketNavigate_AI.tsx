/**
 * ??MarketNavigate_AI.tsx
 * ê¸°ëŠ¥:
 *  - ?Œì„±/?ìŠ¤?¸ë¡œ ëª©ì ì§€ ?…ë ¥ (?? "?Œí˜ ì²´ìœ¡ê³µì›ê¹Œì? ?ˆë‚´?´ì¤˜")
 *  - Kakao Placesë¡?ëª©ì ì§€ ì¢Œí‘œ ê²€????ì§€??ë§ˆì»¤/ì§ì„  ê²½ë¡œ ?œì‹œ
 *  - ???„ì¹˜ ì¶”ì (geolocation watch)?¼ë¡œ ?¨ì? ê±°ë¦¬/ë°©ìœ„ ?¤ì‹œê°?ê°±ì‹ 
 *  - TTS(?Œì„±)ë¡??ˆë‚´ ë©˜íŠ¸
 *  - ëª¨ë°”?? ì¹´ì¹´?¤ë‚´ë¹??¥ë§?? ?? ì¹´ì¹´?¤ë§µ ê¸¸ì°¾ê¸?ë§í¬ ?œê³µ
 *
 * ?™ï¸ ì¤€ë¹?
 *  - index.html??Kakao Maps SDK ì¶”ê?:
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
  const [status, setStatus] = useState("?š¦ ëª©ì ì§€ë¥?ë§í•˜ê±°ë‚˜ ?…ë ¥?˜ì„¸??");
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

  // === ?¸ì…˜ ì´ˆê¸°??===
  useEffect(() => {
    (async () => {
      const id = await ensureSession();
      setSessionId(id);
    })();
  }, []);

  // =========== ? í‹¸ ===========
  const speak = async (text: string) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    u.rate = 1.06; // [[memory:5313820]]???°ë¼ ìµœì  ?ë„ ?¤ì •
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
      "ë¶ìª½","ë¶ë™","?™ìª½","?¨ë™","?¨ìª½","?¨ì„œ","?œìª½","ë¶ì„œ","ë¶ìª½"
    ];
    const idx = Math.round(deg / 45);
    return dirs[idx];
  };

  // =========== ì§€??ì´ˆê¸°??===========
  useEffect(() => {
    const { kakao } = window;
    if (!mapRef.current || !kakao) return;
    
    map.current = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(37.5665, 126.9780),
      level: 6,
    });

    // GPS ?œì‘
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserPos(p);
          map.current.setCenter(new kakao.maps.LatLng(p.lat, p.lng));
          
          // ?¬ìš©???„ì¹˜ ë§ˆì»¤
          userMarker.current = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(p.lat, p.lng),
            title: "???„ì¹˜",
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

          // ?„ì¹˜ ?•ë³´ ë¡œê¹…
          if (sessionId) {
            await logVoice(sessionId, { 
              type: "start", 
              geo: p, 
              meta: { center: "gps", accuracy: pos.coords.accuracy } 
            });
          }

          // ?¤ì‹œê°?ì¶”ì  ?œì‘
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
    } else {
      setStatus("? ï¸ ??ë¸Œë¼?°ì???GPSë¥?ì§€?í•˜ì§€ ?ŠìŠµ?ˆë‹¤.");
    }

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // =========== ê²½ë¡œ(ì§ì„ ) & HUD ===========
  const updateLineAndHUD = async (from: LatLng, to: LatLng) => {
    const { kakao } = window;
    
    // ì§ì„  ê²½ë¡œ ê°±ì‹ 
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

    // ê±°ë¦¬ & ë°©ìœ„ ê³„ì‚°
    const km = distanceKm(from, to);
    const m = Math.round(km * 1000);
    const br = bearingDeg(from, to);
    const direction = bearingToText(br);
    
    setStatus(`?¡ï¸ ?¨ì? ê±°ë¦¬: ${m.toLocaleString()}m Â· ë°©í–¥: ${direction} (${br.toFixed(0)}Â°)`);

    // ?´ë¹„ê²Œì´??ë¡œê¹…
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

    // ?„ì°© ?ˆë‚´
    if (m <= 25) {
      setIsNavigating(false);
      await speak("ëª©ì ì§€???„ì°©?ˆìŠµ?ˆë‹¤!");
      setStatus("?‰ ëª©ì ì§€???„ì°©?ˆìŠµ?ˆë‹¤!");
      
      if (sessionId) {
        await logVoice(sessionId, { 
          type: "tts", 
          text: "ëª©ì ì§€ ?„ì°©", 
          meta: { destination: dest?.name } 
        });
      }
    } else if (m <= 100 && isNavigating) {
      // 100m ?´ë‚´?ì„œ ?ˆë‚´
      await speak(`${m}ë¯¸í„° ?¨ì•˜?µë‹ˆ?? ${direction} ë°©í–¥?…ë‹ˆ??`);
    }
  };

  // =========== ëª©ì ì§€ ê²€??===========
  const searchDestination = async (text: string) => {
    if (!text.trim()) return;
    
    setStatus("?” ëª©ì ì§€ë¥?ê²€??ì¤?..");
    
    const { kakao } = window;
    const places = new kakao.maps.services.Places();
    
    places.keywordSearch(text, async (data: any[], status: string) => {
      if (status !== kakao.maps.services.Status.OK || data.length === 0) {
        setStatus("??ê²°ê³¼ ?†ìŒ");
        await speak("ê´€???¥ì†Œë¥?ì°¾ì? ëª»í–ˆ?µë‹ˆ??");
        
        if (sessionId) {
          await logVoice(sessionId, { 
            type: "error", 
            text: "ëª©ì ì§€ ê²€???¤íŒ¨", 
            meta: { query: text } 
          });
        }
        return;
      }
      
      const top = data[0]; // ìµœìƒ??ê²°ê³¼ ?¬ìš©
      const pos: LatLng = { lat: parseFloat(top.y), lng: parseFloat(top.x) };
      setDest({ name: top.place_name, pos });
      setIsNavigating(true);

      // ëª©ì ì§€ ë§ˆì»¤
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

      // ?¸í¬?ˆë„??      const infowindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:10px;text-align:center;">
                    <strong>${top.place_name}</strong><br/>
                    <small>${top.road_address_name || top.address_name}</small>
                  </div>`
      });
      infowindow.open(map.current, destMarker.current);

      // ?”ë©´ ë²”ìœ„ ì¡°ì •
      const bounds = new kakao.maps.LatLngBounds();
      if (userPos) bounds.extend(new kakao.maps.LatLng(userPos.lat, userPos.lng));
      bounds.extend(new kakao.maps.LatLng(pos.lat, pos.lng));
      map.current.setBounds(bounds);

      // HUD/ê²½ë¡œ ê°±ì‹  + ?Œì„±
      if (userPos) {
        await updateLineAndHUD(userPos, pos);
      }
      await speak(`ëª©ì ì§€ ${top.place_name}ë¡??ˆë‚´ë¥??œì‘?©ë‹ˆ??`);
      
      // ê²€??ê²°ê³¼ ë¡œê¹…
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

  // =========== ?Œì„± ?…ë ¥ ===========
  const startListening = async () => {
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
      setQuery(transcript);
      
      // STT ê²°ê³¼ ë¡œê¹…
      if (sessionId) {
        await logVoice(sessionId, { type: "stt", text: transcript });
      }
      
      // "~ê¹Œì? ?ˆë‚´?´ì¤˜/ê°€??ê¸¸ì°¾ê¸? ê°™ì? ? í° ?œê±°
      const cleaned = transcript
        .replace(/ê¹Œì?|ë¡??¼ë¡œ|?ˆë‚´?´ì¤˜|ê¸¸ì°¾ê¸?ê°€??ê°€ì¤?ì°¾ì•„ì¤?gi, "")
        .trim();
      
      await searchDestination(cleaned);
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

  // =========== ë§í¬(ì¹´ì¹´?¤ë‚´ë¹?ì¹´ì¹´?¤ë§µ) ===========
  const makeKakaoMapLink = () => {
    if (!dest) return "#";
    // ì¹´ì¹´?¤ë§µ ë§í¬: ëª©ì ì§€ë¡?ê¸¸ì°¾ê¸???
    return `https://map.kakao.com/link/to/${encodeURIComponent(dest.name)},${dest.pos.lat},${dest.pos.lng}`;
  };
  
  const makeKakaoNaviLink = () => {
    if (!dest) return "#";
    // ì¹´ì¹´?¤ë‚´ë¹??¥ë§??ëª¨ë°”???„ìš©, ë¯¸ì„¤ì¹????¤í† ???´ë™)
    return `kakaonavi://navigate?name=${encodeURIComponent(dest.name)}&x=${dest.pos.lng}&y=${dest.pos.lat}`;
  };

  // =========== ?œì¶œ ===========
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    const cleaned = query.replace(/ê¹Œì?|ë¡??¼ë¡œ|?ˆë‚´?´ì¤˜|ê¸¸ì°¾ê¸?ê°€??ê°€ì¤?ì°¾ì•„ì¤?gi, "").trim();
    await searchDestination(cleaned);
  };

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* ?¤ë” */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">?§­ ?¼ê³  ?´ë¹„</h1>
          <p className="text-sm text-gray-600">?¤ì‹œê°??Œì„± ?ˆë‚´ ?´ë¹„ê²Œì´??/p>
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
          {userPos && (
            <div className="absolute top-4 left-4 bg-white rounded-lg p-2 shadow-md text-sm">
              ?“ ???„ì¹˜: {userPos.lat.toFixed(4)}, {userPos.lng.toFixed(4)}
            </div>
          )}
        </div>

        {/* ?›ï¸?ì»¨íŠ¸ë¡??¨ë„ */}
        <div className="w-96 border-l bg-white flex flex-col">
          <div className="p-4 space-y-4">
            {/* ?…ë ¥ ??*/}
            <form onSubmit={onSubmit} className="flex gap-2">
              <button
                type="button"
                onClick={startListening}
                disabled={listening}
                className={`rounded-full w-10 h-10 flex items-center justify-center text-white text-xl transition-colors ${
                  listening ? "bg-red-500 animate-pulse" : "bg-black hover:bg-gray-800"
                }`}
                title="?Œì„± ?…ë ¥"
              >
                ?¤
              </button>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="?? ?Œí˜ ì²´ìœ¡ê³µì›ê¹Œì? ?ˆë‚´?´ì¤˜"
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={listening}
              />
              <button 
                type="submit"
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                disabled={!query.trim() || listening}
              >
                ê¸¸ì°¾ê¸?              </button>
            </form>

            {/* ?íƒœ ?œì‹œ */}
            <div className="text-sm p-3 bg-gray-50 rounded-lg min-h-[60px] flex items-center">
              {status}
            </div>

            {/* ëª©ì ì§€ ?•ë³´ */}
            {dest && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-semibold text-blue-800 mb-1">?¯ ëª©ì ì§€</div>
                  <div className="text-sm">
                    <strong>{dest.name}</strong><br />
                    ?„ë„ {dest.pos.lat.toFixed(6)}, ê²½ë„ {dest.pos.lng.toFixed(6)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-700">?“± ?¸ë? ?±ìœ¼ë¡??´ê¸°</div>
                  <div className="flex flex-col gap-2">
                    <a
                      href={makeKakaoMapLink()}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded bg-gray-900 text-white text-sm text-center hover:bg-gray-800 transition-colors"
                    >
                      ?Œ ì¹´ì¹´?¤ë§µ ê¸¸ì°¾ê¸?(??
                    </a>
                    <a
                      href={makeKakaoNaviLink()}
                      className="px-3 py-2 rounded bg-blue-600 text-white text-sm text-center hover:bg-blue-700 transition-colors"
                    >
                      ?“± ì¹´ì¹´?¤ë‚´ë¹„ë¡œ ?´ê¸° (ëª¨ë°”??
                    </a>
                  </div>
                </div>
                
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-xs text-yellow-800">
                    ?’¡ <strong>?ˆë‚´ ë°©ì‹:</strong><br/>
                    ??ì§€????ê²½ë¡œ??<strong>ì§ì„ </strong> ?ˆë‚´?…ë‹ˆ??br/>
                    ???¤ì œ ?„ë¡œ ê²½ë¡œ????ë²„íŠ¼?¼ë¡œ ì¹´ì¹´??ê¸¸ì°¾ê¸??´ìš©<br/>
                    ???¤ì‹œê°?ê±°ë¦¬/ë°©í–¥?€ ?Œì„±?¼ë¡œ ?ˆë‚´?©ë‹ˆ??                  </div>
                </div>
              </div>
            )}

            {/* ?¬ìš©ë²??ˆë‚´ */}
            {!dest && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-sm font-semibold text-green-800 mb-2">?“– ?¬ìš©ë²?/div>
                <div className="text-xs text-green-700 space-y-1">
                  <div>???¤ ë²„íŠ¼???ŒëŸ¬ ?Œì„±?¼ë¡œ ëª©ì ì§€ ë§í•˜ê¸?/div>
                  <div>???ìŠ¤?¸ë¡œ ì§ì ‘ ?…ë ¥ ??ê¸¸ì°¾ê¸?ë²„íŠ¼</div>
                  <div>???´ë¹„ê²Œì´??ì¤??¤ì‹œê°??Œì„± ?ˆë‚´</div>
                  <div>??25m ?´ë‚´ ?„ì°© ???ë™ ?Œë¦¼</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
