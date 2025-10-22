/**
 * ??YagoAssistant_AI.tsx
 * ?ÑÏ†Ñ ?åÏÑ±¬∑?çÏä§???µÌï© ?Ä??ÏΩòÏÜî
 *  - ?åÏÑ± ?∏Ïãù(STT)
 *  - Firestore Í≤Ä??ÏßÄ???∞Í≤∞
 *  - ?åÏÑ± ?ëÎãµ(TTS)
 *  - Î°úÍ∑∏ ?êÎèô ?Ä?? *  - ?§ÏãúÍ∞??Ä???úÍ∞Å?? */

import React, { useEffect, useRef, useState } from "react";
import { collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ensureSession, logVoice } from "@/lib/voiceLogger";
import { seedMarketItems, seedProducts } from "@/utils/devSeed";

// ???ºÌäº??Í≤Ä??Î°úÏßÅ (?ïÎãò ?úÏïà)
async function searchProductsByTags(db: any, rawTags: string[]) {
  // 1) ?úÍ∑∏ ?ïÎ¶¨
  const tags = (rawTags || [])
    .map(t => (t || "").toString().trim())
    .filter(Boolean)
    .slice(0, 10);

  console.log("?îé search tags:", tags);

  const ref = collection(db, "products");
  let snap;

  // 2) ?úÍ∑∏Í∞Ä ?àÏúºÎ©??∞ÏÑ† 'category in [...]' ?úÎèÑ, ?ÜÏúºÎ©??ÑÏ≤¥ Ï°∞Ìöå
  if (tags.length > 0) {
    try {
      const q1 = query(ref, where("category", "in", tags));
      snap = await getDocs(q1);
      console.log("1Ï∞?category in) Í≤∞Í≥º:", snap.size);
    } catch (e) {
      console.warn("1Ï∞?ÏøºÎ¶¨ ?§Ìå® ???ÑÏ≤¥ Ï°∞ÌöåÎ°??¥Î∞±", e);
    }
  }

  if (!snap || snap.empty) {
    // 3) 1Ï∞?Í≤∞Í≥ºÍ∞Ä ?ÜÏúºÎ©??ÑÏ≤¥ Ï°∞Ìöå ??2Ï∞??çÏä§??Îß§Ïπ≠
    const all = await getDocs(ref);
    const allData = all.docs.map(d => ({ id: d.id, ...d.data() }));

    const lowered = new Set(tags.map(t => t.toLowerCase()));

    const fallback = tags.length === 0
      ? allData // ?úÍ∑∏ ?ÜÏúºÎ©??ÑÏ≤¥
      : allData.filter(item => {
          const cat = (item.category || "").toString().toLowerCase();
          const title = (item.title || item.name || "").toString().toLowerCase();
          const desc  = (item.description || "").toString().toLowerCase();

          // Ïπ¥ÌÖåÍ≥†Î¶¨ ?ºÏπò ?êÎäî ?úÎ™©/?§Î™Ö???úÍ∑∏ Î¨∏Ïûê???¨Ìï®
          return (
            lowered.has(cat) ||
            [...lowered].some(t => title.includes(t) || desc.includes(t))
          );
        });

    console.log("2Ï∞?fallback) Í≤∞Í≥º:", fallback.length);
    return fallback;
  }

  // 4) 1Ï∞?Í≤∞Í≥º ?¨Ïö©
  const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // 5) ?ÑÏπò ?ïÎ≥¥ ?ÑÌÑ∞(?µÏÖò) ???ÑÏöî ?ÜÎã§Î©?Ï£ºÏÑù Ï≤òÎ¶¨
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

  // === ?∏ÏÖò Ï¥àÍ∏∞??===
  useEffect(() => {
    (async () => {
      const id = await ensureSession();
      setSessionId(id);
      
      // ??Í∞úÎ∞ú???úÎìú ?∞Ïù¥???ùÏÑ±
      try {
        await seedProducts();
        await seedMarketItems();
        console.log("??products & marketItems ?úÎìú ?∞Ïù¥???ùÏÑ± ?ÑÎ£å");
      } catch (error) {
        console.log("?πÔ∏è ?úÎìú ?∞Ïù¥???ùÏÑ± Í±¥ÎÑà?∞Í∏∞:", error);
      }
      
      // ?òÏòÅ Î©îÏãúÏßÄ
      const welcomeMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        text: "?àÎÖï?òÏÑ∏?? ?ºÍ≥† ÎπÑÏÑú?ÖÎãà?? ?åÏÑ±?ºÎ°ú ÎßêÌïòÍ±∞ÎÇò ?çÏä§?∏Î°ú ?ÖÎ†•?¥Ï£º?∏Ïöî. ?? 'Í∑ºÏ≤ò Ï∂ïÍµ¨??Î≥¥Ïó¨Ï§?",
        timestamp: new Date()
      };
      setMessages([welcomeMsg]);
    })();
  }, []);

  // === Kakao ÏßÄ??Ï¥àÍ∏∞??===
  useEffect(() => {
    if (!window.kakao || !mapRef.current) return;

    const { kakao } = window;
    const mapObj = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(37.5665, 126.9780),
      level: 6,
    });
    setMap(mapObj);

    // ?¨Ïö©???ÑÏπò Í∞Ä?∏Ïò§Í∏?    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const geo = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setUserLocation(geo);
          
          // ÏßÄ??Ï§ëÏã¨???¨Ïö©???ÑÏπòÎ°??¥Îèô
          mapObj.setCenter(new kakao.maps.LatLng(geo.lat, geo.lng));
          
          // ?¨Ïö©???ÑÏπò ÎßàÏª§ Ï∂îÍ?
          const userMarker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(geo.lat, geo.lng),
            title: "???ÑÏπò",
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

          // ?ÑÏπò ?ïÎ≥¥ Î°úÍπÖ
          if (sessionId) {
            await logVoice(sessionId, { 
              type: "start", 
              geo, 
              meta: { center: "gps", accuracy: pos.coords.accuracy } 
            });
          }
        },
        async (err) => {
          console.warn("?ÑÏπò ?ïÎ≥¥ ?òÏßë ?§Ìå®:", err.message);
          if (sessionId) {
            await logVoice(sessionId, { 
              type: "error", 
              text: "?ÑÏπò ?ïÎ≥¥ ?òÏßë ?§Ìå®", 
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

  // === ?åÏÑ± ?∏Ïãù Ï¥àÍ∏∞??===
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: "system",
        text: "?†Ô∏è Î∏åÎùº?∞Ï?Í∞Ä ?åÏÑ± ?∏Ïãù??ÏßÄ?êÌïòÏßÄ ?äÏäµ?àÎã§.",
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

  // === ?åÏÑ± Ï∂úÎ†• ===
  const speak = async (text: string) => {
    if (isSpeaking) return;
    
    setIsSpeaking(true);
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ko-KR";
    utter.rate = 1.05; // [[memory:5313820]]???∞Îùº ÏµúÏ†Å ?çÎèÑ ?§Ï†ï
    utter.pitch = 1.0;
    utter.volume = 0.8;
    
    utter.onend = async () => {
      setIsSpeaking(false);
      // TTS Î°úÍπÖ
      if (sessionId) {
        await logVoice(sessionId, { type: "tts", text });
      }
    };
    
    utter.onerror = async () => {
      setIsSpeaking(false);
      if (sessionId) {
        await logVoice(sessionId, { type: "error", text: "TTS ?§Î•ò" });
      }
    };

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  // === NLU ?úÍ∑∏ Ï∂îÏ∂úÍ∏?(?ôÏäµ ?∞Ïù¥??Ï∞∏Ï°∞) ===
  const extractTags = async (text: string): Promise<string[]> => {
    console.log("?é§ ?çÏä§??Î∂ÑÏÑù:", text);
    
    // Î∂àÏö©???úÍ±∞
    const stopWords = [
      "?ºÍ≥†??, "Í∑ºÏ≤ò", "Ï£ºÎ?", "Î≥¥Ïó¨Ï§?, "Ï∞æÏïÑÏ§?, "??, "Ï¢Ä", "?¥Í±∞", "?ïÎãò",
      "??, "Î•?, "??, "Í∞Ä", "?Ä", "??, "??, "?êÏÑú", "Î°?, "?ºÎ°ú", "?Ä", "Í≥?,
      "?àÏñ¥", "?àÎÇò", "?¥Ï§ò", "?¥Ï£º?∏Ïöî", "?åÎ†§Ï§?, "?åÎ†§Ï£ºÏÑ∏??, "??, "??, "??,
      "Í∑?, "?Ä", "??, "Í∑∏Í≤É", "?¥Í≤É", "?ÄÍ≤?, "Í±?, "Í≤?
    ];

    // Í∏∞Î≥∏ ?®Ïñ¥ Î∂ÑÎ¶¨ Î∞??ÑÌÑ∞Îß?    let words = text
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 1 && !stopWords.includes(w));

    // NLU ?ôÏäµ ?¨Ï†Ñ?êÏÑú ?ïÌôï??Îß§Ïπ≠ Ï∞æÍ∏∞
    try {
      const dictRef = collection(db, "nluCorrections");
      const dictSnap = await getDocs(dictRef);
      
      for (const doc of dictSnap.docs) {
        const data = doc.data();
        const inputText = data.inputText?.toLowerCase() || "";
        const correctedTags = data.correctedTags || [];
        
        // ?ïÌôï??Î¨∏Ïû• Îß§Ïπ≠ ?êÎäî ?†ÏÇ¨??Í∏∞Î∞ò Îß§Ïπ≠
        if (inputText === text.toLowerCase() || 
            (inputText.length > 3 && text.toLowerCase().includes(inputText))) {
          console.log("?ß† NLU ?¨Ï†Ñ?êÏÑú Îß§Ïπ≠ Î∞úÍ≤¨:", inputText, "??, correctedTags);
          words = correctedTags;
          break;
        }
      }
    } catch (error) {
      console.log("NLU ?¨Ï†Ñ Ï∞∏Ï°∞ ?§Î•ò (Í∏∞Î≥∏ ?úÍ∑∏ ?¨Ïö©):", error);
    }

    console.log("?è∑Ô∏?ÏµúÏ¢Ö Ï∂îÏ∂ú???úÍ∑∏:", words);
    return words;
  };

  // === Firestore Í≤Ä??Î∞?ÏßÄ???úÏãú ===
  const searchAndShow = async (tags: string[]) => {
    if (!map || tags.length === 0) return;

    // Í≤Ä??Ï§?Î©îÏãúÏßÄ
    const searchMsg: Message = {
      id: Date.now().toString(),
      role: "assistant",
      text: `?îç "${tags.join(", ")}" Í¥Ä???ÅÌíà??Í≤Ä??Ï§?..`,
      timestamp: new Date(),
      tags
    };
    setMessages(prev => [...prev, searchMsg]);

    // NLU Î°úÍπÖ
    if (sessionId) {
      await logVoice(sessionId, { type: "nlu", tags });
    }

    // ???îÎ≤ÑÍπÖÏö© ?ÑÏó≠ ?Ä??(?ïÎãò ?úÏïà)
    (window as any).tags = tags;
    console.log("?éØ ?ÑÏó≠ tags:", (window as any).tags);

    try {
      // ???ºÌäº??Í≤Ä??Î°úÏßÅ (?ïÎãò ?úÏïà)
      const searchResults = await searchProductsByTags(db, tags);
      
      // ?ÑÏπò ?ïÎ≥¥Í∞Ä ?àÎäî ?ÅÌíàÎß??ÑÌÑ∞Îß?      const itemsWithLocation = searchResults.filter(item => 
        item.loc && typeof item.loc.latitude === "number" && typeof item.loc.longitude === "number"
      );

      // Í≤Ä??Í≤∞Í≥º Î°úÍπÖ
      if (sessionId) {
        await logVoice(sessionId, { 
          type: "results", 
          resultCount: itemsWithLocation.length, 
          meta: { tags, totalFound: data.length } 
        });
      }

      // Í∏∞Ï°¥ ÎßàÏª§ ?úÍ±∞
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];

      const { kakao } = window;
      const bounds = new kakao.maps.LatLngBounds();

      // Í≤∞Í≥º Î©îÏãúÏßÄ ?ÖÎç∞?¥Ìä∏
      const resultMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: itemsWithLocation.length > 0 
          ? `??${tags.join(", ")} Í¥Ä???ÅÌíà ${itemsWithLocation.length}Í∞úÎ? Ï∞æÏïò?µÎãà??`
          : `??${tags.join(", ")} Í¥Ä???ÅÌíà??Ï∞æÏùÑ ???ÜÏäµ?àÎã§.`,
        timestamp: new Date(),
        tags,
        resultCount: itemsWithLocation.length
      };
      setMessages(prev => [...prev.slice(0, -1), resultMsg]);

      if (itemsWithLocation.length === 0) {
        const noResultMsg = `?ïÎãò, ${tags[0]} Í¥Ä???ÅÌíà??Í∑ºÏ≤ò???ÜÏñ¥?? ?§Î•∏ ?§Ïõå?úÎ°ú ÎßêÏ??¥Ï£º?∏Ïöî.`;
        await speak(noResultMsg);
        return;
      }

      // ÏßÄ?ÑÏóê ÎßàÏª§ ?úÏãú
      itemsWithLocation.forEach((item) => {
        const pos = new kakao.maps.LatLng(item.loc.latitude, item.loc.longitude);
        bounds.extend(pos);
        
        const marker = new kakao.maps.Marker({
          position: pos,
          title: item.title,
        });
        marker.setMap(map);
        markersRef.current.push(marker);

        // ?∏Ìè¨?àÎèÑ???ùÏÑ±
        const iwContent = `
          <div style="padding:10px;min-width:200px;">
            <img src="${item.images?.[0]?.url || "/img/placeholder.svg"}" style="width:100%;height:120px;object-fit:cover;border-radius:8px;margin-bottom:8px"/>
            <div style="font-weight:bold;margin-bottom:4px;">${item.title}</div>
            <div style="font-size:12px;color:#666;margin-bottom:4px;">${item.description || ""}</div>
            <div style="font-weight:bold;color:#333;">${item.price ? item.price.toLocaleString() + "?? : "Í∞ÄÍ≤?Î¨∏Ïùò"}</div>
          </div>
        `;
        
        const infowindow = new kakao.maps.InfoWindow({
          content: iwContent,
        });

        kakao.maps.event.addListener(marker, "click", async () => {
          infowindow.open(map, marker);
          // ÎßàÏª§ ?¥Î¶≠ Î°úÍπÖ
          if (sessionId) {
            await logVoice(sessionId, { 
              type: "map", 
              text: "marker_click", 
              meta: { itemId: item.id, title: item.title } 
            });
          }
        });
      });

      // ÏßÄ??Î≤îÏúÑ Ï°∞Ï†ï
      if (itemsWithLocation.length > 0) {
        map.setBounds(bounds);
      }

      // ?åÏÑ± ?ëÎãµ
      const closestDistance = itemsWithLocation[0]?.distance || 0;
      const responseMsg = `?ïÎãò, ${tags[0]} Í¥Ä???ÅÌíà ${itemsWithLocation.length}Í∞?Ï∞æÏïò?¥Ïöî! ÏßÄ?ÑÏóê???ïÏù∏?¥Î≥¥?∏Ïöî.`;
      await speak(responseMsg);

    } catch (error) {
      console.error("Í≤Ä???§Î•ò:", error);
      
      // ?§Î•ò Î°úÍπÖ
      if (sessionId) {
        await logVoice(sessionId, { 
          type: "error", 
          text: "Í≤Ä???§Î•ò", 
          meta: { error: (error as Error).message } 
        });
      }
      
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        text: "??Í≤Ä??Ï§??§Î•òÍ∞Ä Î∞úÏÉù?àÏäµ?àÎã§.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev.slice(0, -1), errorMsg]);
      
      const errorResponse = "?ïÎãò, Í≤Ä??Ï§??§Î•òÍ∞Ä Î∞úÏÉù?àÏñ¥?? ?§Ïãú ÎßêÏ??¥Ï£º?∏Ïöî.";
      await speak(errorResponse);
    }
  };

  // === ?åÏÑ± ?ÖÎ†• ?úÏûë ===
  const startListening = async () => {
    if (!recognizer) return;
    
    setListening(true);
    const listeningMsg: Message = {
      id: Date.now().toString(),
      role: "system",
      text: "?éß ?£Îäî Ï§?.. '?ºÍ≥†???ºÍ≥† ÎßêÌï¥Î≥¥ÏÑ∏??",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, listeningMsg]);
    
    // STT ?úÏûë Î°úÍπÖ
    if (sessionId) {
      await logVoice(sessionId, { type: "stt", text: "start" });
    }
    
    recognizer.start();

    recognizer.onresult = async (e: any) => {
      const transcript = e.results[0][0].transcript;
      
      // ?¨Ïö©??Î©îÏãúÏßÄ Ï∂îÍ?
      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        text: transcript,
        timestamp: new Date()
      };
      setMessages(prev => [...prev.slice(0, -1), userMsg]);
      
      // STT Í≤∞Í≥º Î°úÍπÖ
      if (sessionId) {
        await logVoice(sessionId, { type: "stt", text: transcript });
      }
      
      const tags = await extractTags(transcript);
      if (tags.length > 0) {
        await searchAndShow(tags);
      } else {
        const noKeywordMsg = "?ïÎãò, Î¨¥Ïä® ÎßêÏ??∏Ï? ??Î™®Î•¥Í≤†Ïñ¥?? ?§Ïãú ÎßêÏ??¥Ï£º?∏Ïöî.";
        await speak(noKeywordMsg);
        
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: "???∏Ïãù???§Ïõå?úÍ? ?ÜÏäµ?àÎã§. ?§Î•∏ Î∞©Ïãù?ºÎ°ú ÎßêÏ??¥Ï£º?∏Ïöî.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
      setListening(false);
    };

    recognizer.onerror = async (e: any) => {
      console.error("?åÏÑ± ?∏Ïãù ?§Î•ò:", e);
      
      // STT ?§Î•ò Î°úÍπÖ
      if (sessionId) {
        await logVoice(sessionId, { 
          type: "error", 
          text: "STT ?§Î•ò", 
          meta: { error: e.error } 
        });
      }
      
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: "system",
        text: `?†Ô∏è ?åÏÑ± ?∏Ïãù ?§Î•ò: ${e.error}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev.slice(0, -1), errorMsg]);
      
      const errorResponse = "Ï£ÑÏÜ°?©Îãà?? ?§Ïãú ?úÎ≤à ÎßêÏ???Ï£ºÏÑ∏??";
      await speak(errorResponse);
      setListening(false);
    };

    recognizer.onend = () => {
      setListening(false);
    };
  };

  // === ?çÏä§???ÖÎ†• Ï≤òÎ¶¨ ===
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // ?¨Ïö©??Î©îÏãúÏßÄ Ï∂îÍ?
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
      const noKeywordMsg = "Í≤Ä?âÏñ¥Î•??§Ïãú ÎßêÏ???Ï£ºÏÑ∏??";
      await speak(noKeywordMsg);
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: "??Í≤Ä?âÌï† ?§Ïõå?úÎ? Ï∞æÏùÑ ???ÜÏäµ?àÎã§. ?? 'Ï∂ïÍµ¨??, '?òÏù¥???¥Îèô?? ??,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
    }
    setInput("");
  };

  // === Î©îÏãúÏßÄ ?§ÌÅ¨Î°?===
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* ?§Îçî */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">?éôÔ∏??ºÍ≥† ÎπÑÏÑú</h1>
          <p className="text-sm text-gray-600">?åÏÑ±¬∑?çÏä§???µÌï© AI ?¥Ïãú?§ÌÑ¥??/p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className={`w-2 h-2 rounded-full ${sessionId ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          {sessionId ? '?∞Í≤∞?? : '?∞Í≤∞ Ï§?..'}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ?ó∫Ô∏?ÏßÄ???ÅÏó≠ */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />
          {userLocation && (
            <div className="absolute top-4 left-4 bg-white rounded-lg p-2 shadow-md text-sm">
              ?ìç ???ÑÏπò: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
            </div>
          )}
        </div>

        {/* ?í¨ ?Ä???ÅÏó≠ */}
        <div className="w-96 border-l bg-white flex flex-col">
          {/* Î©îÏãúÏßÄ Î™©Î°ù */}
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

          {/* ?ÖÎ†• ?ÅÏó≠ */}
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
                title={listening ? "?£Îäî Ï§?.." : isSpeaking ? "ÎßêÌïò??Ï§?.." : "?åÏÑ± ?ÖÎ†•"}
              >
                {listening ? "?éß" : "?é§"}
              </button>
              
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Î©îÏãúÏßÄ ?ÖÎ†• ?êÎäî ÎßêÌïòÍ∏?.."
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={listening || isSpeaking}
              />
              
              <button
                type="submit"
                disabled={!input.trim() || listening || isSpeaking}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Î≥¥ÎÇ¥Í∏?              </button>
            </form>
            
            <div className="mt-2 text-xs text-gray-500 text-center">
              ?í° ?àÏãú: "Í∑ºÏ≤ò Ï∂ïÍµ¨??Î≥¥Ïó¨Ï§?, "?òÏù¥???¥Îèô??Ï∞æÏïÑÏ§?
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
