import React, { useEffect, useRef } from "react";

declare global {
  interface Window {
    google: any;
  }
}

export default function MarketMap() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Google Maps SDK가 로드???�까지 ?��?    const checkGoogle = () => {
      if (window.google && window.google.maps) {
        initMap();
      } else {
        setTimeout(checkGoogle, 100);
      }
    };
    
    checkGoogle();

    function initMap() {
      if (!mapRef.current) return;
      
      // ?? ?�전???�터?�션 ?�션 ?�용!
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 37.74659, lng: 127.08274 },
        zoom: 14,
        // ?�� ?��?/축소 버튼 ?�시
        zoomControl: true,
        // ?�� 마우????�??�용
        scrollwheel: true,
        // ??마우???�치 모두�??�래�?가??        gestureHandling: "greedy",
        // ?�� ?�래�??�동 ?�용
        draggable: true,
        // ?�� ?�성/지???�환 버튼
        mapTypeControl: true,
        // ?�� ?�트리트�?버튼 ?�시
        streetViewControl: true,
        // ?�� 지???��???(POI ?�벨 ?��?)
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      // ?�� 마커 추�? (?�니메이???�함)
      new window.google.maps.Marker({
        position: { lat: 37.74659, lng: 127.08274 },
        map,
        title: "?�재 ?�치",
        animation: window.google.maps.Animation.DROP
      });

      console.log("??Google Maps 초기???�료! 모든 ?�터?�션 ?�성?�됨");
    }
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "520px",
        borderRadius: "16px",
        background: "#f9f9f9",
      }}
    />
  );
}
