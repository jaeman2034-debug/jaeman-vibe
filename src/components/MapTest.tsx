import React, { useEffect } from "react";

export default function MapTest() {
  useEffect(() => {
    console.log("?���?MapTest useEffect ?�작");
    console.log("?�� API Key:", import.meta.env.VITE_KAKAO_JS_KEY);
    
    const apiKey = import.meta.env.VITE_KAKAO_JS_KEY;
    if (!apiKey) {
      console.error("??VITE_KAKAO_JS_KEY가 ?�습?�다!");
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`;
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      console.log("??SDK loaded");
      window.kakao.maps.load(() => {
        const container = document.getElementById("map");
        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.978),
          level: 3,
        };
        const map = new window.kakao.maps.Map(container, options);
        new window.kakao.maps.Marker({
          map,
          position: new window.kakao.maps.LatLng(37.5665, 126.978),
        });
      });
    };
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">?���?Kakao 지???�스??/h2>
      <div
        id="map"
        className="w-full h-[500px] rounded-2xl border"
      ></div>
      <p className="text-sm text-gray-500 mt-2">
        지?��? ?�시?�면 Kakao Maps SDK가 ?�상 ?�동?�니??
      </p>
    </div>
  );
}
