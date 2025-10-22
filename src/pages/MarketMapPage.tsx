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

        // ?¬ìš©???„ì¬ ?„ì¹˜ ê°€?¸ì˜¤ê¸?        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const userLat = pos.coords.latitude;
            const userLng = pos.coords.longitude;

            // ì§€???ì„±
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

            // ?¬ìš©???„ì¹˜ ë§ˆì»¤ ì¶”ê?
            new window.google.maps.Marker({
              position: { lat: userLat, lng: userLng },
              map,
              title: "???„ì¹˜",
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              },
              label: {
                text: "?“",
                fontSize: "16px",
                fontWeight: "bold"
              }
            });

            // Firestore ?í’ˆ ë¶ˆëŸ¬?¤ê¸°
            const snap = await getDocs(collection(db, "products"));
            const productsData: Product[] = [];
            
            snap.forEach((doc) => {
              const productData = doc.data() as Product;
              if (!productData.lat || !productData.lng || productData.status === "ë¶„ì„ì¤?) return;
              
              productsData.push({
                id: doc.id,
                ...productData
              });

              // ë§ˆì»¤ ?ì„±
              const marker = new window.google.maps.Marker({
                position: { lat: productData.lat, lng: productData.lng },
                map,
                title: productData.title,
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 6,
                  fillColor: productData.status === "?ë§¤ì¤? ? "#34D399" : 
                           productData.status === "?ˆì•½ì¤? ? "#FBBF24" : "#9CA3AF",
                  fillOpacity: 0.8,
                  strokeColor: "#ffffff",
                  strokeWeight: 2,
                }
              });

              // ë§ˆì»¤ ?´ë¦­ ???í’ˆ ?•ë³´ ?œì‹œ
              const infoWindow = new window.google.maps.InfoWindow({
                content: `
                  <div style="min-width: 200px; max-width: 250px; padding: 0;">
                    <div style="position: relative; overflow: hidden; border-radius: 8px 8px 0 0;">
                      ${productData.images && productData.images.length > 0 ? 
                        `<img src="${productData.images[0]}" style="width: 100%; height: 120px; object-fit: cover;" alt="${productData.title}"/>` :
                        `<div style="width: 100%; height: 120px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; color: #9ca3af;">
                          ?“· ?´ë?ì§€ ?†ìŒ
                        </div>`
                      }
                      <div style="position: absolute; top: 8px; right: 8px; background: ${
                        productData.status === "?ë§¤ì¤? ? "#34D399" : 
                        productData.status === "?ˆì•½ì¤? ? "#FBBF24" : "#9CA3AF"
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
                        ?“ ${productData.locationText || productData.locationAdmin}
                      </p>
                      <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">
                        ?‘¤ ${productData.sellerName}
                      </p>
                      <button 
                        onclick="window.openProductDetail('${doc.id}')"
                        style="width: 100%; background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer; transition: background 0.2s;"
                        onmouseover="this.style.background='#2563eb'"
                        onmouseout="this.style.background='#3b82f6'"
                      >
                        ?í’ˆ ë³´ê¸°
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

            // ?„ì—­ ?¨ìˆ˜ë¡??í’ˆ ?ì„¸ ?˜ì´ì§€ ?´ë™
            (window as any).openProductDetail = (productId: string) => {
              navigate(`/market/${productId}`);
            };

          },
          (error) => {
            console.error("?„ì¹˜ ?‘ê·¼ ?¤íŒ¨:", error);
            setError("?„ì¹˜ ?‘ê·¼??ê±°ë??˜ì—ˆ?µë‹ˆ?? ë¸Œë¼?°ì? ?¤ì •?ì„œ ?„ì¹˜ ê¶Œí•œ???ˆìš©?´ì£¼?¸ìš”.");
            setLoading(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          }
        );

      } catch (error) {
        console.error("ì§€??ì´ˆê¸°???¤íŒ¨:", error);
        setError("ì§€?„ë? ë¶ˆëŸ¬?¤ëŠ” ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
        setLoading(false);
      }
    };

    // Google Maps API ë¡œë“œ
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `/gapi/maps/api/js?key=${
        import.meta.env.VITE_GOOGLE_API_KEY
      }&language=ko&region=KR`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = () => {
        setError("Google Maps APIë¥?ë¶ˆëŸ¬?¤ëŠ”???¤íŒ¨?ˆìŠµ?ˆë‹¤. API ?¤ë? ?•ì¸?´ì£¼?¸ìš”.");
        setLoading(false);
      };
      document.head.appendChild(script);
    } else {
      initMap();
    }

    // ì»´í¬?ŒíŠ¸ ?¸ë§ˆ?´íŠ¸ ???„ì—­ ?¨ìˆ˜ ?•ë¦¬
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">ì§€??ë¡œë”© ì¤?..</h3>
          <p className="text-gray-600">ê·¼ì²˜ ?í’ˆ??ì°¾ê³  ?ˆìŠµ?ˆë‹¤</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">?—ºï¸?/div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">ì§€?„ë? ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ?¤ì‹œ ?œë„
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ?ë‹¨ ?¤ë” */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">?—ºï¸?ê·¼ì²˜ ?í’ˆ ì§€??/h1>
              <p className="text-sm text-gray-600 mt-1">
                ì§€?„ì—??ê·¼ì²˜ ?í’ˆ???•ì¸?˜ê³  ë§ˆì»¤ë¥??´ë¦­?´ë³´?¸ìš”
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* ?í’ˆ ê°œìˆ˜ ?œì‹œ */}
              <div className="bg-blue-50 text-blue-800 px-3 py-2 rounded-lg text-sm font-medium">
                ?“ ?í’ˆ {products.length}ê°?              </div>
              {/* ëª©ë¡ ë³´ê¸° ë²„íŠ¼ */}
              <button
                onClick={() => navigate("/market")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                ?“‹ ëª©ë¡ ë³´ê¸°
              </button>
            </div>
          </div>
          
          {/* ë²”ë? */}
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
              <span className="text-gray-600">?ë§¤ì¤?/span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span className="text-gray-600">?ˆì•½ì¤?/span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span className="text-gray-600">ê±°ë˜?„ë£Œ</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
              <span className="text-gray-600">???„ì¹˜</span>
            </div>
          </div>
        </div>
      </div>

      {/* ì§€??*/}
      <div ref={mapRef} className="w-full h-[calc(100vh-120px)]" />

      {/* ?˜ë‹¨ ?•ë³´ ë°?*/}
      <div className="bg-white border-t p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              ?’¡ ë§ˆì»¤ë¥??´ë¦­?˜ë©´ ?í’ˆ ?•ë³´ë¥??•ì¸?????ˆìŠµ?ˆë‹¤
            </div>
            <div>
              ?“± ëª¨ë°”?¼ì—?œë„ ìµœì ?”ë˜???ˆìŠµ?ˆë‹¤
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
