/**
 * ??YagoAssistant_AI.tsx
 * ?�전 ?�성·?�스???�합 ?�??콘솔
 *  - ?�성 ?�식(STT)
 *  - Firestore 검??지???�결
 *  - ?�성 ?�답(TTS)
 *  - 로그 ?�동 ?�?? *  - ?�시�??�???�각?? */

import React, { useEffect, useRef, useState } from "react";
import { collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ensureSession, logVoice } from "@/lib/voiceLogger";
import { seedMarketItems, seedProducts } from "@/utils/devSeed";

// ???�튼??검??로직 (?�님 ?�안)
async function searchProductsByTags(db: any, rawTags: string[]) {
  // 1) ?�그 ?�리
  const tags = (rawTags || [])
    .map(t => (t || "").toString().trim())
    .filter(Boolean)
    .slice(0, 10);

  console.log("?�� search tags:", tags);

  const ref = collection(db, "products");
  let snap;

  // 2) ?�그가 ?�으�??�선 'category in [...]' ?�도, ?�으�??�체 조회
  if (tags.length > 0) {
    try {
      const q1 = query(ref, where("category", "in", tags));
      snap = await getDocs(q1);
      console.log("1�?category in) 결과:", snap.size);
    } catch (e) {
      console.warn("1�?쿼리 ?�패 ???�체 조회�??�백", e);
    }
  }

  if (!snap || snap.empty) {
    // 3) 1�?결과가 ?�으�??�체 조회 ??2�??�스??매칭
    const all = await getDocs(ref);
    const allData = all.docs.map(d => ({ id: d.id, ...d.data() }));

    const lowered = new Set(tags.map(t => t.toLowerCase()));

    const fallback = tags.length === 0
      ? allData // ?�그 ?�으�??�체
      : allData.filter(item => {
          const cat = (item.category || "").toString().toLowerCase();
          const title = (item.title || item.name || "").toString().toLowerCase();
          const desc  = (item.description || "").toString().toLowerCase();

          // 카테고리 ?�치 ?�는 ?�목/?�명???�그 문자???�함
          return (
            lowered.has(cat) ||
            [...lowered].some(t => title.includes(t) || desc.includes(t))
          );
        });

    console.log("2�?fallback) 결과:", fallback.length);
    return fallback;
  }

  // 4) 1�?결과 ?�용
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // 5) ?�치 ?�보 ?�터(?�션) ???�요 ?�다�?주석 처리
  const withLoc = data.filter(item =>
    item.loc && typeof item.loc.latitude === "number" && typeof item.loc.longitude === "number"
  );

  console.log("withLoc:", withLoc.length, "total:", data.length);
  return withLoc.length ? withLoc : data;
}

declare global {
  interface Window {
    kakao: any;
    webkitSpeechRecognition: any;
    speechSynthesis: any;
  }
}

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: Date;
  tags?: string[];
  resultCount?: number;
};

export default function YagoAssistant_AI() {
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [map, setMap] = useState<any>(null);
  const [recognizer, setRecognizer] = useState<any>(null);
  const [listening, setListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);

  // === ?�션 초기??===
  useEffect(() => {
    (async () => {
      const id = await ensureSession();
      setSessionId(id);
      
      // ??개발???�드 ?�이???�성
      try {
        await seedProducts();
        await seedMarketItems();
        console.log("??products & marketItems ?�드 ?�이???�성 ?�료");
      } catch (error) {
        console.log("?�️ ?�드 ?�이???�성 건너?�기:", error);
      }
      
      // ?�영 메시지
      const welcomeMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        text: "?�녕?�세?? ?�고 비서?�니?? ?�성?�로 말하거나 ?�스?�로 ?�력?�주?�요. ?? '근처 축구??보여�?",
        timestamp: new Date()
      };
      setMessages([welcomeMsg]);
    })();
  }, []);

  // === Kakao 지??초기??===
  useEffect(() => {
    if (!window.kakao || !mapRef.current) return;

    const { kakao } = window;
    const mapObj = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(37.5665, 126.9780),
      level: 6,
    });
    setMap(mapObj);

    // ?�용???�치 가?�오�?    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const geo = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setUserLocation(geo);
          
          // 지??중심???�용???�치�??�동
          mapObj.setCenter(new kakao.maps.LatLng(geo.lat, geo.lng));
          
          // ?�용???�치 마커 추�?
          const userMarker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(geo.lat, geo.lng),
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
          userMarker.setMap(mapObj);

          // ?�치 ?�보 로깅
          if (sessionId) {
            await logVoice(sessionId, { 
              type: "start", 
              geo, 
              meta: { center: "gps", accuracy: pos.coords.accuracy } 
            });
          }
        },
        async (err) => {
          console.warn("?�치 ?�보 ?�집 ?�패:", err.message);
          if (sessionId) {
            await logVoice(sessionId, { 
              type: "error", 
              text: "?�치 ?�보 ?�집 ?�패", 
              meta: { error: err.message } 
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

  // === ?�성 ?�식 초기??===
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: "system",
        text: "?�️ 브라?��?가 ?�성 ?�식??지?�하지 ?�습?�다.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "ko-KR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    setRecognizer(rec);
  }, []);

  // === ?�성 출력 ===
  const speak = async (text: string) => {
    if (isSpeaking) return;
    
    setIsSpeaking(true);
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ko-KR";
    utter.rate = 1.05; // [[memory:5313820]]???�라 최적 ?�도 ?�정
    utter.pitch = 1.0;
    utter.volume = 0.8;
    
    utter.onend = async () => {
      setIsSpeaking(false);
      // TTS 로깅
      if (sessionId) {
        await logVoice(sessionId, { type: "tts", text });
      }
    };
    
    utter.onerror = async () => {
      setIsSpeaking(false);
      if (sessionId) {
        await logVoice(sessionId, { type: "error", text: "TTS ?�류" });
      }
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  // === NLU ?�그 추출�?(?�습 ?�이??참조) ===
  const extractTags = async (text: string): Promise<string[]> => {
    console.log("?�� ?�스??분석:", text);
    
    // 불용???�거
    const stopWords = [
      "?�고??, "근처", "주�?", "보여�?, "찾아�?, "??, "좀", "?�거", "?�님",
      "??, "�?, "??, "가", "?�", "??, "??, "?�서", "�?, "?�로", "?�", "�?,
      "?�어", "?�나", "?�줘", "?�주?�요", "?�려�?, "?�려주세??, "??, "??, "??,
      "�?, "?�", "??, "그것", "?�것", "?��?, "�?, "�?
    ];

    // 기본 ?�어 분리 �??�터�?    let words = text
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 1 && !stopWords.includes(w));

    // NLU ?�습 ?�전?�서 ?�확??매칭 찾기
    try {
      const dictRef = collection(db, "nluCorrections");
      const dictSnap = await getDocs(dictRef);
      
      for (const doc of dictSnap.docs) {
        const data = doc.data();
        const inputText = data.inputText?.toLowerCase() || "";
        const correctedTags = data.correctedTags || [];
        
        // ?�확??문장 매칭 ?�는 ?�사??기반 매칭
        if (inputText === text.toLowerCase() || 
            (inputText.length > 3 && text.toLowerCase().includes(inputText))) {
          console.log("?�� NLU ?�전?�서 매칭 발견:", inputText, "??, correctedTags);
          words = correctedTags;
          break;
        }
      }
    } catch (error) {
      console.log("NLU ?�전 참조 ?�류 (기본 ?�그 ?�용):", error);
    }

    console.log("?���?최종 추출???�그:", words);
    return words;
  };

  // === Firestore 검??�?지???�시 ===
  const searchAndShow = async (tags: string[]) => {
    if (!map || tags.length === 0) return;

    // 검??�?메시지
    const searchMsg: Message = {
      id: Date.now().toString(),
      role: "assistant",
      text: `?�� "${tags.join(", ")}" 관???�품??검??�?..`,
      timestamp: new Date(),
      tags
    };
    setMessages(prev => [...prev, searchMsg]);

    // NLU 로깅
    if (sessionId) {
      await logVoice(sessionId, { type: "nlu", tags });
    }

    // ???�버깅용 ?�역 ?�??(?�님 ?�안)
    (window as any).tags = tags;
    console.log("?�� ?�역 tags:", (window as any).tags);

    try {
      // ???�튼??검??로직 (?�님 ?�안)
      const searchResults = await searchProductsByTags(db, tags);
      
      // ?�치 ?�보가 ?�는 ?�품�??�터�?      const itemsWithLocation = searchResults.filter(item => 
        item.loc && typeof item.loc.latitude === "number" && typeof item.loc.longitude === "number"
      );

      // 검??결과 로깅
      if (sessionId) {
        await logVoice(sessionId, { 
          type: "results", 
          resultCount: itemsWithLocation.length, 
          meta: { tags, totalFound: data.length } 
        });
      }

      // 기존 마커 ?�거
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      const { kakao } = window;
      const bounds = new kakao.maps.LatLngBounds();

      // 결과 메시지 ?�데?�트
      const resultMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: itemsWithLocation.length > 0 
          ? `??${tags.join(", ")} 관???�품 ${itemsWithLocation.length}개�? 찾았?�니??`
          : `??${tags.join(", ")} 관???�품??찾을 ???�습?�다.`,
        timestamp: new Date(),
        tags,
        resultCount: itemsWithLocation.length
      };
      setMessages(prev => [...prev.slice(0, -1), resultMsg]);

      if (itemsWithLocation.length === 0) {
        const noResultMsg = `?�님, ${tags[0]} 관???�품??근처???�어?? ?�른 ?�워?�로 말�??�주?�요.`;
        await speak(noResultMsg);
        return;
      }

      // 지?�에 마커 ?�시
      itemsWithLocation.forEach((item) => {
        const pos = new kakao.maps.LatLng(item.loc.latitude, item.loc.longitude);
        bounds.extend(pos);
        
        const marker = new kakao.maps.Marker({
          position: pos,
          title: item.title,
        });
        marker.setMap(map);
        markersRef.current.push(marker);

        // ?�포?�도???�성
        const iwContent = `
          <div style="padding:10px;min-width:200px;">
            <img src="${item.images?.[0]?.url || "/img/placeholder.svg"}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px"/>
            <div style="font-weight:bold;margin-bottom:4px;">${item.title}</div>
            <div style="font-size:12px;color:#666;margin-bottom:4px;">${item.description || ""}</div>
            <div style="font-weight:bold;color:#333;">${item.price ? item.price.toLocaleString() + "?? : "가�?문의"}</div>
          </div>
        `;
        
        const infowindow = new kakao.maps.InfoWindow({
          content: iwContent,
        });

        kakao.maps.event.addListener(marker, "click", async () => {
          infowindow.open(map, marker);
          // 마커 ?�릭 로깅
          if (sessionId) {
            await logVoice(sessionId, { 
              type: "map", 
              text: "marker_click", 
              meta: { itemId: item.id, title: item.title } 
            });
          }
        });
      });

      // 지??범위 조정
      if (itemsWithLocation.length > 0) {
        map.setBounds(bounds);
      }

      // ?�성 ?�답
      const closestDistance = itemsWithLocation[0]?.distance || 0;
      const responseMsg = `?�님, ${tags[0]} 관???�품 ${itemsWithLocation.length}�?찾았?�요! 지?�에???�인?�보?�요.`;
      await speak(responseMsg);

    } catch (error) {
      console.error("검???�류:", error);
      
      // ?�류 로깅
      if (sessionId) {
        await logVoice(sessionId, { 
          type: "error", 
          text: "검???�류", 
          meta: { error: (error as Error).message } 
        });
      }
      
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        text: "??검??�??�류가 발생?�습?�다.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev.slice(0, -1), errorMsg]);
      
      const errorResponse = "?�님, 검??�??�류가 발생?�어?? ?�시 말�??�주?�요.";
      await speak(errorResponse);
    }
  };

  // === ?�성 ?�력 ?�작 ===
  const startListening = async () => {
    if (!recognizer) return;
    
    setListening(true);
    const listeningMsg: Message = {
      id: Date.now().toString(),
      role: "system",
      text: "?�� ?�는 �?.. '?�고???�고 말해보세??",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, listeningMsg]);
    
    // STT ?�작 로깅
    if (sessionId) {
      await logVoice(sessionId, { type: "stt", text: "start" });
    }
    
    recognizer.start();

    recognizer.onresult = async (e: any) => {
      const transcript = e.results[0][0].transcript;
      
      // ?�용??메시지 추�?
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        text: transcript,
        timestamp: new Date()
      };
      setMessages(prev => [...prev.slice(0, -1), userMsg]);
      
      // STT 결과 로깅
      if (sessionId) {
        await logVoice(sessionId, { type: "stt", text: transcript });
      }
      
      const tags = await extractTags(transcript);
      if (tags.length > 0) {
        await searchAndShow(tags);
      } else {
        const noKeywordMsg = "?�님, 무슨 말�??��? ??모르겠어?? ?�시 말�??�주?�요.";
        await speak(noKeywordMsg);
        
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: "???�식???�워?��? ?�습?�다. ?�른 방식?�로 말�??�주?�요.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
      setListening(false);
    };

    recognizer.onerror = async (e: any) => {
      console.error("?�성 ?�식 ?�류:", e);
      
      // STT ?�류 로깅
      if (sessionId) {
        await logVoice(sessionId, { 
          type: "error", 
          text: "STT ?�류", 
          meta: { error: e.error } 
        });
      }
      
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: "system",
        text: `?�️ ?�성 ?�식 ?�류: ${e.error}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev.slice(0, -1), errorMsg]);
      
      const errorResponse = "죄송?�니?? ?�시 ?�번 말�???주세??";
      await speak(errorResponse);
      setListening(false);
    };

    recognizer.onend = () => {
      setListening(false);
    };
  };

  // === ?�스???�력 처리 ===
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // ?�용??메시지 추�?
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    
    const tags = await extractTags(input);
    if (tags.length > 0) {
      await searchAndShow(tags);
    } else {
      const noKeywordMsg = "검?�어�??�시 말�???주세??";
      await speak(noKeywordMsg);
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: "??검?�할 ?�워?��? 찾을 ???�습?�다. ?? '축구??, '?�이???�동?? ??,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
    }
    setInput("");
  };

  // === 메시지 ?�크�?===
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* ?�더 */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">?���??�고 비서</h1>
          <p className="text-sm text-gray-600">?�성·?�스???�합 AI ?�시?�턴??/p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className={`w-2 h-2 rounded-full ${sessionId ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          {sessionId ? '?�결?? : '?�결 �?..'}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ?���?지???�역 */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />
          {userLocation && (
            <div className="absolute top-4 left-4 bg-white rounded-lg p-2 shadow-md text-sm">
              ?�� ???�치: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
            </div>
          )}
        </div>

        {/* ?�� ?�???�역 */}
        <div className="w-96 border-l bg-white flex flex-col">
          {/* 메시지 목록 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : message.role === "assistant"
                      ? "bg-gray-100 text-gray-800"
                      : "bg-yellow-100 text-yellow-800 text-center text-sm"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.text}</div>
                  {message.tags && message.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {message.tags.map((tag, i) => (
                        <span key={i} className="text-xs bg-blue-200 text-blue-700 rounded-full px-2 py-1">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* ?�력 ?�역 */}
          <div className="border-t p-4 bg-white">
            <form onSubmit={handleSend} className="flex gap-2 items-center">
              <button
                type="button"
                onClick={startListening}
                disabled={listening || isSpeaking}
                className={`rounded-full w-10 h-10 flex items-center justify-center text-white text-xl transition-colors ${
                  listening 
                    ? "bg-red-500 animate-pulse" 
                    : isSpeaking
                    ? "bg-gray-400"
                    : "bg-black hover:bg-gray-800"
                }`}
                title={listening ? "?�는 �?.." : isSpeaking ? "말하??�?.." : "?�성 ?�력"}
              >
                {listening ? "?��" : "?��"}
              </button>
              
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="메시지 ?�력 ?�는 말하�?.."
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={listening || isSpeaking}
              />
              
              <button
                type="submit"
                disabled={!input.trim() || listening || isSpeaking}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                보내�?              </button>
            </form>
            
            <div className="mt-2 text-xs text-gray-500 text-center">
              ?�� ?�시: "근처 축구??보여�?, "?�이???�동??찾아�?
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
