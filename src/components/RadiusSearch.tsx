import { useState, useEffect } from "react";
import useGeoQuery from "../hooks/useGeoQuery";

interface RadiusSearchProps {
  center: { lat: number; lng: number };
  onProductsChange: (products: any[]) => void;
}

export default function RadiusSearch({ center, onProductsChange }: RadiusSearchProps) {
  const [radius, setRadius] = useState(5); // ê¸°ë³¸ 5km
  const [isActive, setIsActive] = useState(false);

  // GeoQuery Hook ?¬ìš©
  const { products, loading, error } = useGeoQuery({
    center,
    radius: isActive ? radius : 0, // ë¹„í™œ?±í™” ??ë°˜ê²½ 0?¼ë¡œ ?¤ì •
    limit: 50
  });

  // ?í’ˆ ëª©ë¡ ë³€ê²???ë¶€ëª?ì»´í¬?ŒíŠ¸???Œë¦¼
  useEffect(() => {
    if (isActive) {
      onProductsChange(products);
    }
  }, [products, isActive, onProductsChange]);

  const radiusOptions = [
    { value: 1, label: "1km" },
    { value: 3, label: "3km" },
    { value: 5, label: "5km" },
    { value: 10, label: "10km" },
    { value: 20, label: "20km" }
  ];

  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">?“ ë°˜ê²½ ê²€??/h3>
          <p className="text-sm text-gray-600">
            ???„ì¹˜ ê¸°ì? ë°˜ê²½ {radius}km ???í’ˆ??ì°¾ì•„ë³´ì„¸??          </p>
        </div>
        
        <button
          onClick={() => setIsActive(!isActive)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isActive
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {isActive ? "ê²€??ì¤? : "ë°˜ê²½ ê²€???œì‘"}
        </button>
      </div>

      {isActive && (
        <div className="space-y-4">
          {/* ë°˜ê²½ ? íƒ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ê²€??ë°˜ê²½
            </label>
            <div className="flex flex-wrap gap-2">
              {radiusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setRadius(option.value)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    radius === option.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* ê²€??ê²°ê³¼ ?íƒœ */}
          {loading && (
            <div className="flex items-center text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm">ë°˜ê²½ {radius}km ???í’ˆ ê²€??ì¤?..</span>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm">
              ? ï¸ {error}
            </div>
          )}

          {!loading && !error && isActive && (
            <div className="text-sm text-gray-600">
              ??ë°˜ê²½ {radius}km ???í’ˆ {products.length}ê°?ë°œê²¬
            </div>
          )}

          {/* ê±°ë¦¬ ?•ë³´ ?œì‹œ */}
          {products.length > 0 && (
            <div className="text-xs text-gray-500">
              ?’¡ ?í’ˆ?€ ê±°ë¦¬?œìœ¼ë¡??•ë ¬?˜ì–´ ?œì‹œ?©ë‹ˆ??
            </div>
          )}
        </div>
      )}
    </div>
  );
}
