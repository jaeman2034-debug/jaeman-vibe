import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

declare global {
  interface Window {
    google: any;
  }
}

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  lat: number;
  lng: number;
  locationText: string;
  locationAdmin: string;
  status: string;
  sellerName: string;
}

export default function MarketMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;

      try {
        setLoading(true);
        setError(null);

        // ?�용???�재 ?�치 가?�오�?        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const userLat = pos.coords.latitude;
            const userLng = pos.coords.longitude;

            // 지???�성
            const map = new window.google.maps.Map(mapRef.current, {
              center: { lat: userLat, lng: userLng },
              zoom: 13,
              mapTypeControl: true,
              streetViewControl: true,
              fullscreenControl: true,
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }]
                }
              ]
            });

            // ?�용???�치 마커 추�?
            new window.google.maps.Marker({
              position: { lat: userLat, lng: userLng },
              map,
              title: "???�치",
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              },
              label: {
                text: "?��",
                fontSize: "16px",
                fontWeight: "bold"
              }
            });

            // Firestore ?�품 불러?�기
            const snap = await getDocs(collection(db, "products"));
            const productsData: Product[] = [];
            
            snap.forEach((doc) => {
              const productData = doc.data() as Product;
              if (!productData.lat || !productData.lng || productData.status === "분석�?) return;
              
              productsData.push({
                id: doc.id,
                ...productData
              });

              // 마커 ?�성
              const marker = new window.google.maps.Marker({
                position: { lat: productData.lat, lng: productData.lng },
                map,
                title: productData.title,
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 6,
                  fillColor: productData.status === "?�매�? ? "#34D399" : 
                           productData.status === "?�약�? ? "#FBBF24" : "#9CA3AF",
                  fillOpacity: 0.8,
                  strokeColor: "#ffffff",
                  strokeWeight: 2,
                }
              });

              // 마커 ?�릭 ???�품 ?�보 ?�시
              const infoWindow = new window.google.maps.InfoWindow({
                content: `
                  <div style="min-width: 200px; max-width: 250px; padding: 0;">
                    <div style="position: relative; overflow: hidden; border-radius: 8px 8px 0 0;">
                      ${productData.images && productData.images.length > 0 ? 
                        `<img src="${productData.images[0]}" style="width: 100%; height: 120px; object-fit: cover;" alt="${productData.title}"/>` :
                        `<div style="width: 100%; height: 120px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; color: #9ca3af;">
                          ?�� ?��?지 ?�음
                        </div>`
                      }
                      <div style="position: absolute; top: 8px; right: 8px; background: ${
                        productData.status === "?�매�? ? "#34D399" : 
                        productData.status === "?�약�? ? "#FBBF24" : "#9CA3AF"
                      }; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                        ${productData.status}
                      </div>
                    </div>
                    <div style="padding: 12px;">
                      <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1f2937; line-height: 1.3;">
                        ${productData.title}
                      </h4>
                      <p style="margin: 0 0 8px 0; color: #dc2626; font-size: 18px; font-weight: bold;">
                        ${productData.price?.toLocaleString()}??                      </p>
                      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                        ?�� ${productData.locationText || productData.locationAdmin}
                      </p>
                      <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">
                        ?�� ${productData.sellerName}
                      </p>
                      <button 
                        onclick="window.openProductDetail('${doc.id}')"
                        style="width: 100%; background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer; transition: background 0.2s;"
                        onmouseover="this.style.background='#2563eb'"
                        onmouseout="this.style.background='#3b82f6'"
                      >
                        ?�품 보기
                      </button>
                    </div>
                  </div>
                `,
              });

              marker.addListener("click", () => {
                infoWindow.open(map, marker);
              });
            });

            setProducts(productsData);
            setLoading(false);

            // ?�역 ?�수�??�품 ?�세 ?�이지 ?�동
            (window as any).openProductDetail = (productId: string) => {
              navigate(`/market/${productId}`);
            };

          },
          (error) => {
            console.error("?�치 ?�근 ?�패:", error);
            setError("?�치 ?�근??거�??�었?�니?? 브라?��? ?�정?�서 ?�치 권한???�용?�주?�요.");
            setLoading(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          }
        );

      } catch (error) {
        console.error("지??초기???�패:", error);
        setError("지?��? 불러?�는 �??�류가 발생?�습?�다.");
        setLoading(false);
      }
    };

    // Google Maps API 로드
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `/gapi/maps/api/js?key=${
        import.meta.env.VITE_GOOGLE_API_KEY
      }&language=ko&region=KR`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = () => {
        setError("Google Maps API�?불러?�는???�패?�습?�다. API ?��? ?�인?�주?�요.");
        setLoading(false);
      };
      document.head.appendChild(script);
    } else {
      initMap();
    }

    // 컴포?�트 ?�마?�트 ???�역 ?�수 ?�리
    return () => {
      if ((window as any).openProductDetail) {
        delete (window as any).openProductDetail;
      }
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">지??로딩 �?..</h3>
          <p className="text-gray-600">근처 ?�품??찾고 ?�습?�다</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">?���?/div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">지?��? 불러?????�습?�다</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ?�시 ?�도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ?�단 ?�더 */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">?���?근처 ?�품 지??/h1>
              <p className="text-sm text-gray-600 mt-1">
                지?�에??근처 ?�품???�인?�고 마커�??�릭?�보?�요
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* ?�품 개수 ?�시 */}
              <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium">
                ?�� ?�품 {products.length}�?              </div>
              {/* 목록 보기 버튼 */}
              <button
                onClick={() => navigate("/market")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                ?�� 목록 보기
              </button>
            </div>
          </div>
          
          {/* 범�? */}
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="text-gray-600">?�매�?/span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span className="text-gray-600">?�약�?/span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-gray-600">거래?�료</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
              <span className="text-gray-600">???�치</span>
            </div>
          </div>
        </div>
      </div>

      {/* 지??*/}
      <div ref={mapRef} className="w-full h-[calc(100vh-120px)]" />

      {/* ?�단 ?�보 �?*/}
      <div className="bg-white border-t p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              ?�� 마커�??�릭?�면 ?�품 ?�보�??�인?????�습?�다
            </div>
            <div>
              ?�� 모바?�에?�도 최적?�되???�습?�다
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
