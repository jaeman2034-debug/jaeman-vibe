import React, { useEffect, useState } from "react";
import { signInAnonymously } from "firebase/auth";
import { auth } from "@/lib/firebase";

const { kakao } = window as any;

export default function VoiceAssistant_AI() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("?�성?�식 ?��?�?..");
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);

  // ??Firebase ?�명 로그??(?�스?�용)
  useEffect(() => {
    signInAnonymously(auth)
      .then(() => {
        console.log("???�명 로그???�공");
        setStatus("??로그???�료 - ?�성?�식 ?��?�?..");
      })
      .catch((e) => {
        console.error("???�명 로그???�패:", e);
        setStatus("??로그???�패");
      });
  }, []);

  // ??Kakao Map 초기??  useEffect(() => {
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
        setStatus("??지??초기???�료");
      });
    };
  }, []);

  // ???�성 ?�식 ?�작
  const startVoiceRecognition = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("??브라?��????�성 ?�식??지?�하지 ?�습?�다.");
      return;
    }
    
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.start();
    setStatus("?�� ?�성 ?�식 �?..");

    recognition.onresult = async (event: any) => {
      const result = event.results[0][0].transcript;
      setMessage(result);
      setStatus("???�식 ?�료");

      // ???�시: "근처 ?�국 찾아�?
      if (result.includes("?�국")) {
        searchPlace("?�국");
      } else if (result.includes("카페")) {
        searchPlace("카페");
      } else if (result.includes("?�의??)) {
        searchPlace("?�의??);
      } else if (result.includes("병원")) {
        searchPlace("병원");
      } else if (result.includes("마트")) {
        searchPlace("마트");
      } else {
        setStatus("?�� ?�식?� ?�공?��?�?관??명령?��? ?�습?�다.");
      }
    };

    recognition.onerror = (event: any) => {
      setStatus(`???�성 ?�식 ?�류: ${event.error}`);
    };

    recognition.onend = () => {
      setStatus("?�� ?�성 ?�식 종료");
    };
  };

  // ??Kakao ?�소 검??  const searchPlace = (keyword: string) => {
      if (!map) {
      setStatus("??지?��? ?�직 준비되지 ?�았?�니??");
        return;
      }

    const ps = new window.kakao.maps.services.Places();
    setStatus(`?�� ${keyword} 검??�?..`);
    
    ps.keywordSearch(keyword, (data: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
        const first = data[0];
        const coords = new window.kakao.maps.LatLng(first.y, first.x);

        if (marker) marker.setMap(null);
        const newMarker = new window.kakao.maps.Marker({ map, position: coords });
        setMarker(newMarker);
        map.setCenter(coords);

        setStatus(`??${keyword} 검???�료: ${first.place_name}`);
        
        // ??TTS ?�성 ?�내
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(`${first.place_name}�?찾았?�니??`);
          utterance.lang = 'ko-KR';
          speechSynthesis.speak(utterance);
        }
      } else {
        setStatus("?�� 검??결과�?찾을 ???�습?�다.");
      }
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">?���?AI Voice Assistant (v3)</h2>
      
        <button
        onClick={startVoiceRecognition}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        ?�� ?�성 ?�작
        </button>
        
      <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
        <p className="text-sm text-gray-700">
          <span className="font-medium">?�� ?�태:</span> {status}
        </p>
        </div>

      <input
        type="text"
        className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="?�성?�식 ?��?�?.."
        value={message}
        readOnly
      />
      
      <div id="map" className="w-full h-96 rounded-xl border shadow"></div>
      
      <div className="text-sm text-gray-600">
        <p><strong>?�용�?</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>"근처 ?�국 찾아�?</li>
          <li>"카페 찾아�?</li>
          <li>"?�의??찾아�?</li>
          <li>"병원 찾아�?</li>
          <li>"마트 찾아�?</li>
        </ul>
      </div>
    </div>
  );
}
