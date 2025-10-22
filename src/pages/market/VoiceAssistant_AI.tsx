import React, { useEffect, useState } from "react";
import { signInAnonymously } from "firebase/auth";
import { auth } from "@/lib/firebase";

const { kakao } = window as any;

export default function VoiceAssistant_AI() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("?Œì„±?¸ì‹ ?€ê¸?ì¤?..");
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);

  // ??Firebase ?µëª… ë¡œê·¸??(?ŒìŠ¤?¸ìš©)
  useEffect(() => {
    signInAnonymously(auth)
      .then(() => {
        console.log("???µëª… ë¡œê·¸???±ê³µ");
        setStatus("??ë¡œê·¸???„ë£Œ - ?Œì„±?¸ì‹ ?€ê¸?ì¤?..");
      })
      .catch((e) => {
        console.error("???µëª… ë¡œê·¸???¤íŒ¨:", e);
        setStatus("??ë¡œê·¸???¤íŒ¨");
      });
  }, []);

  // ??Kakao Map ì´ˆê¸°??  useEffect(() => {
    const script = document.createElement("script");
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${
      import.meta.env.VITE_KAKAO_API_KEY || "***REMOVED***"
    }&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = document.getElementById("map");
        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.978),
          level: 5,
        };
        const newMap = new window.kakao.maps.Map(container, options);
        setMap(newMap);
        setStatus("??ì§€??ì´ˆê¸°???„ë£Œ");
      });
    };
  }, []);

  // ???Œì„± ?¸ì‹ ?œì‘
  const startVoiceRecognition = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("??ë¸Œë¼?°ì????Œì„± ?¸ì‹??ì§€?í•˜ì§€ ?ŠìŠµ?ˆë‹¤.");
      return;
    }
    
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.start();
    setStatus("?¤ ?Œì„± ?¸ì‹ ì¤?..");

    recognition.onresult = async (event: any) => {
      const result = event.results[0][0].transcript;
      setMessage(result);
      setStatus("???¸ì‹ ?„ë£Œ");

      // ???ˆì‹œ: "ê·¼ì²˜ ?½êµ­ ì°¾ì•„ì¤?
      if (result.includes("?½êµ­")) {
        searchPlace("?½êµ­");
      } else if (result.includes("ì¹´í˜")) {
        searchPlace("ì¹´í˜");
      } else if (result.includes("?¸ì˜??)) {
        searchPlace("?¸ì˜??);
      } else if (result.includes("ë³‘ì›")) {
        searchPlace("ë³‘ì›");
      } else if (result.includes("ë§ˆíŠ¸")) {
        searchPlace("ë§ˆíŠ¸");
      } else {
        setStatus("?˜… ?¸ì‹?€ ?±ê³µ?ˆì?ë§?ê´€??ëª…ë ¹?´ê? ?†ìŠµ?ˆë‹¤.");
      }
    };

    recognition.onerror = (event: any) => {
      setStatus(`???Œì„± ?¸ì‹ ?¤ë¥˜: ${event.error}`);
    };

    recognition.onend = () => {
      setStatus("?”š ?Œì„± ?¸ì‹ ì¢…ë£Œ");
    };
  };

  // ??Kakao ?¥ì†Œ ê²€??  const searchPlace = (keyword: string) => {
      if (!map) {
      setStatus("??ì§€?„ê? ?„ì§ ì¤€ë¹„ë˜ì§€ ?Šì•˜?µë‹ˆ??");
        return;
      }

    const ps = new window.kakao.maps.services.Places();
    setStatus(`?” ${keyword} ê²€??ì¤?..`);
    
    ps.keywordSearch(keyword, (data: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
        const first = data[0];
        const coords = new window.kakao.maps.LatLng(first.y, first.x);

        if (marker) marker.setMap(null);
        const newMarker = new window.kakao.maps.Marker({ map, position: coords });
        setMarker(newMarker);
        map.setCenter(coords);

        setStatus(`??${keyword} ê²€???„ë£Œ: ${first.place_name}`);
        
        // ??TTS ?Œì„± ?ˆë‚´
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(`${first.place_name}ë¥?ì°¾ì•˜?µë‹ˆ??`);
          utterance.lang = 'ko-KR';
          speechSynthesis.speak(utterance);
        }
      } else {
        setStatus("?˜¥ ê²€??ê²°ê³¼ë¥?ì°¾ì„ ???†ìŠµ?ˆë‹¤.");
      }
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">?™ï¸?AI Voice Assistant (v3)</h2>
      
        <button
        onClick={startVoiceRecognition}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        ?¤ ?Œì„± ?œì‘
        </button>
        
      <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
        <p className="text-sm text-gray-700">
          <span className="font-medium">?¤ ?íƒœ:</span> {status}
        </p>
        </div>

      <input
        type="text"
        className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="?Œì„±?¸ì‹ ?€ê¸?ì¤?.."
        value={message}
        readOnly
      />
      
      <div id="map" className="w-full h-96 rounded-xl border shadow"></div>
      
      <div className="text-sm text-gray-600">
        <p><strong>?¬ìš©ë²?</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>"ê·¼ì²˜ ?½êµ­ ì°¾ì•„ì¤?</li>
          <li>"ì¹´í˜ ì°¾ì•„ì¤?</li>
          <li>"?¸ì˜??ì°¾ì•„ì¤?</li>
          <li>"ë³‘ì› ì°¾ì•„ì¤?</li>
          <li>"ë§ˆíŠ¸ ì°¾ì•„ì¤?</li>
        </ul>
      </div>
    </div>
  );
}
