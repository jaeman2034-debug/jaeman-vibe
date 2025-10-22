import React, { useEffect, useRef } from "react";

declare global {
  interface Window {
    google: any;
  }
}

export default function MarketMap() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Google Maps SDKê°€ ë¡œë“œ???Œê¹Œì§€ ?€ê¸?    const checkGoogle = () => {
      if (window.google && window.google.maps) {
        initMap();
      } else {
        setTimeout(checkGoogle, 100);
      }
    };
    
    checkGoogle();

    function initMap() {
      if (!mapRef.current) return;
      
      // ?? ?„ì „???¸í„°?™ì…˜ ?µì…˜ ?ìš©!
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 37.74659, lng: 127.08274 },
        zoom: 14,
        // ?” ?•ë?/ì¶•ì†Œ ë²„íŠ¼ ?œì‹œ
        zoomControl: true,
        // ?–± ë§ˆìš°????ì¤??ˆìš©
        scrollwheel: true,
        // ??ë§ˆìš°???°ì¹˜ ëª¨ë‘ë¡??œë˜ê·?ê°€??        gestureHandling: "greedy",
        // ?– ?œë˜ê·??´ë™ ?ˆìš©
        draggable: true,
        // ?—º ?„ì„±/ì§€???„í™˜ ë²„íŠ¼
        mapTypeControl: true,
        // ?š¶ ?¤íŠ¸ë¦¬íŠ¸ë·?ë²„íŠ¼ ?œì‹œ
        streetViewControl: true,
        // ?¨ ì§€???¤í???(POI ?¼ë²¨ ?¨ê?)
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      // ?“ ë§ˆì»¤ ì¶”ê? (? ë‹ˆë©”ì´???¬í•¨)
      new window.google.maps.Marker({
        position: { lat: 37.74659, lng: 127.08274 },
        map,
        title: "?„ì¬ ?„ì¹˜",
        animation: window.google.maps.Animation.DROP
      });

      console.log("??Google Maps ì´ˆê¸°???„ë£Œ! ëª¨ë“  ?¸í„°?™ì…˜ ?œì„±?”ë¨");
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
