/**
 * ??MarketMap_AI.tsx
 * 기능:
 *  - Firebase Firestore?�서 marketItems 불러?�기
 *  - ?�재 ?�치 중심?�로 Kakao 지???�시
 *  - �??�품??location ?�드 기반 마커 ?�시
 *  - 마커 ?�릭 ??미리보기 ?�업 ?�시
 * 
 * ?�️ ?�요:
 *  - Kakao Maps JS SDK (index.html???�크립트 추�?)
 *  - �??�품 문서??{ location: { latitude, longitude } } ?�드 존재?�야 ?? */

import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Kakao SDK ?�역 ?�언
declare global {
  interface Window {
    kakao: any;
  }
}

type MarketItem = {
  id: string;
  title: string;
  price?: number;
  category?: string;
  imageUrls?: string[];
  autoDescription?: string;
  description?: string;
  autoTags?: string[];
  location?: { latitude: number; longitude: number };
};

export default function MarketMap_AI() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [filteredItems, setFilteredItems] = useState<MarketItem[]>([]);

  // === 거리 계산 ===
  const distanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  };

  // === Firestore ?�이??불러?�기 ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        setMsg("?�� ?�품 ?�이?��? 불러?�는 �?..");
        const ref = collection(db, "marketItems");
        const snap = await getDocs(ref);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as MarketItem[];
        const itemsWithLocation = data.filter((i) => i.location && i.location.latitude && i.location.longitude);
        setItems(itemsWithLocation);
        setFilteredItems(itemsWithLocation);
        setMsg(`??${itemsWithLocation.length}개의 ?�치 ?�보가 ?�는 ?�품??찾았?�니??`);
      } catch (err) {
        console.error(err);
        setMsg("???�품 ?�이?��? 불러?????�습?�다.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // === ?�용???�치 ===
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setMsg("??GPS�??�용?????�습?�다.");
      return;
    }

    setMsg("?�� ?�재 ?�치�??�인?�는 �?..");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setMsg("???�치 ?�인 ?�료! 지?��? ?�시?�니??");
      },
      (err) => {
        console.error(err);
        setMsg("???�치 ?�보�?불러?????�습?�다.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }, []);

  // === ?�그 ?�터�?===
  useEffect(() => {
    if (!tagFilter.trim()) {
      setFilteredItems(items);
      return;
    }

    const searchTags = tagFilter.toLowerCase().split(/\s+/);
    const filtered = items.filter(item => 
      item.autoTags?.some(tag => 
        searchTags.some(searchTag => 
          tag.toLowerCase().includes(searchTag)
        )
      )
    );
    setFilteredItems(filtered);
  }, [tagFilter, items]);

  // === 지??초기??===
  useEffect(() => {
    if (!window.kakao || !userPos || filteredItems.length === 0) return;

    const { kakao } = window;

    const mapContainer = document.getElementById("map");
    if (!mapContainer) return;

    // 기존 지???�거
    mapContainer.innerHTML = "";

    const map = new kakao.maps.Map(mapContainer, {
      center: new kakao.maps.LatLng(userPos.lat, userPos.lng),
      level: 8, // ?�자가 ?�을?�록 ?��?
    });

    // ?�� ?�용???�치 마커 (빨간??
    const userMarker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(userPos.lat, userPos.lng),
      title: "???�치",
      image: new kakao.maps.MarkerImage(
        'data:image/svg+xml;base64,' + btoa(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="8" fill="#FF0000" stroke="#FFFFFF" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" fill="#FFFFFF"/>
          </svg>
        `),
        new kakao.maps.Size(24, 24)
      )
    });
    userMarker.setMap(map);

    // ?�용???�치 ?�포?�도??    const userInfoContent = `
      <div style="padding:10px; text-align:center; min-width:120px;">
        <strong style="color:#FF0000;">?�� ???�치</strong><br/>
        <span style="font-size:12px; color:#666;">
          ${userPos.lat.toFixed(4)}, ${userPos.lng.toFixed(4)}
        </span>
      </div>
    `;
    const userInfoWindow = new kakao.maps.InfoWindow({
      content: userInfoContent,
    });
    userInfoWindow.open(map, userMarker);

    // ?�품 마커 추�?
    filteredItems.forEach((item) => {
      if (!item.location) return;
      
      // 거리 계산
      const distance = userPos ? distanceKm(
        userPos.lat, userPos.lng,
        item.location.latitude, item.location.longitude
      ) : 0;

      // ?�품 마커 (?��???
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(item.location.latitude, item.location.longitude),
        title: item.title,
        image: new kakao.maps.MarkerImage(
          'data:image/svg+xml;base64,' + btoa(`
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="#FFFFFF" stroke-width="2"/>
              <text x="12" y="16" text-anchor="middle" fill="white" font-size="12" font-weight="bold">?��</text>
            </svg>
          `),
          new kakao.maps.Size(32, 32)
        )
      });
      marker.setMap(map);

      // ?�품 ?�포?�도??      const iwContent = `
        <div style="padding:15px; min-width:250px; max-width:300px;">
          <div style="display:flex; gap:10px; align-items:flex-start;">
            <img 
              src="${item.imageUrls?.[0] || "/no-image.png"}" 
              style="width:80px; height:80px; object-fit:cover; border-radius:8px; border:1px solid #ddd;" 
              onerror="this.src='/no-image.png'"
            />
            <div style="flex:1;">
              <h3 style="margin:0 0 5px 0; font-size:14px; font-weight:bold; color:#333;">${item.title}</h3>
              <p style="margin:0 0 8px 0; font-size:12px; color:#666; line-height:1.4;">
                ${item.autoDescription || item.description || "?�명 ?�음"}
              </p>
              <div style="margin:0 0 8px 0;">
                <span style="font-size:16px; font-weight:bold; color:#059669;">??{(item.price || 0).toLocaleString()}</span>
                ${distance > 0 ? `<span style="margin-left:10px; font-size:11px; color:#3B82F6;">?�� ${distance.toFixed(1)}km</span>` : ''}
              </div>
              ${item.autoTags && item.autoTags.length > 0 ? `
                <div style="margin-top:8px;">
                  ${item.autoTags.slice(0, 3).map((tag: string) => 
                    `<span style="display:inline-block; background:#E3F2FD; color:#1976D2; font-size:10px; padding:2px 6px; border-radius:10px; margin-right:4px; margin-bottom:2px;">#${tag}</span>`
                  ).join('')}
                  ${item.autoTags.length > 3 ? `<span style="font-size:10px; color:#666;">+${item.autoTags.length - 3}</span>` : ''}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
      
      const infowindow = new kakao.maps.InfoWindow({
        content: iwContent,
      });

      kakao.maps.event.addListener(marker, "click", () => {
        infowindow.open(map, marker);
      });
    });

    // 지??범위 ?�동 조정
    if (filteredItems.length > 0) {
      const bounds = new kakao.maps.LatLngBounds();
      
      // ?�용???�치 ?�함
      bounds.extend(new kakao.maps.LatLng(userPos.lat, userPos.lng));
      
      // 모든 마커 ?�치 ?�함
      filteredItems.forEach(item => {
        if (item.location) {
          bounds.extend(new kakao.maps.LatLng(item.location.latitude, item.location.longitude));
        }
      });
      
      map.setBounds(bounds);
    }

  }, [filteredItems, userPos]);

  return (
    <div className="w-full h-screen relative flex flex-col">
      {/* ?�단 컨트�?*/}
      <div className="absolute top-4 left-4 right-4 z-10 flex gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="?�그 ?�터 (?? 축구, ?�이?? ?�동??"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="w-full rounded-xl border-2 border-white bg-white/90 backdrop-blur-sm p-3 shadow-lg focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg">
          <span className="text-sm font-medium text-gray-700">
            ?�� {filteredItems.length}�??�품
          </span>
        </div>
      </div>

      {/* ?�태 메시지 */}
      {(loading || msg) && (
        <div className="absolute top-20 left-4 z-10 bg-white/90 backdrop-blur-sm shadow-lg p-3 rounded-xl">
          <p className="text-sm font-medium text-gray-700">{msg}</p>
        </div>
      )}

      {/* 지??*/}
      <div id="map" className="flex-1 w-full" />

      {/* ?�단 ?�보 */}
      {userPos && filteredItems.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium">?�� ???�치:</span>
                <span className="text-gray-600 ml-2">
                  {userPos.lat.toFixed(4)}, {userPos.lng.toFixed(4)}
                </span>
              </div>
              <div>
                <span className="font-medium">?�� 주�? ?�품:</span>
                <span className="text-gray-600 ml-2">{filteredItems.length}�?/span>
              </div>
            </div>
            {tagFilter && (
              <div className="mt-2 text-xs text-gray-500">
                ?�터: "{tagFilter}" ??{filteredItems.length}�?결과
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
