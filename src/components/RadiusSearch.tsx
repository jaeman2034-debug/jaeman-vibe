import { useState, useEffect } from "react";
import useGeoQuery from "../hooks/useGeoQuery";

interface RadiusSearchProps {
  center: { lat: number; lng: number };
  onProductsChange: (products: any[]) => void;
}

export default function RadiusSearch({ center, onProductsChange }: RadiusSearchProps) {
  const [radius, setRadius] = useState(5); // 기본 5km
  const [isActive, setIsActive] = useState(false);

  // GeoQuery Hook ?�용
  const { products, loading, error } = useGeoQuery({
    center,
    radius: isActive ? radius : 0, // 비활?�화 ??반경 0?�로 ?�정
    limit: 50
  });

  // ?�품 목록 변�???부�?컴포?�트???�림
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
          <h3 className="font-semibold text-gray-900 mb-1">?�� 반경 검??/h3>
          <p className="text-sm text-gray-600">
            ???�치 기�? 반경 {radius}km ???�품??찾아보세??          </p>
        </div>
        
        <button
          onClick={() => setIsActive(!isActive)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isActive
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {isActive ? "검??�? : "반경 검???�작"}
        </button>
      </div>

      {isActive && (
        <div className="space-y-4">
          {/* 반경 ?�택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              검??반경
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

          {/* 검??결과 ?�태 */}
          {loading && (
            <div className="flex items-center text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm">반경 {radius}km ???�품 검??�?..</span>
            </div>
          )}

          {error && (
            <div className="text-red-600 text-sm">
              ?�️ {error}
            </div>
          )}

          {!loading && !error && isActive && (
            <div className="text-sm text-gray-600">
              ??반경 {radius}km ???�품 {products.length}�?발견
            </div>
          )}

          {/* 거리 ?�보 ?�시 */}
          {products.length > 0 && (
            <div className="text-xs text-gray-500">
              ?�� ?�품?� 거리?�으�??�렬?�어 ?�시?�니??
            </div>
          )}
        </div>
      )}
    </div>
  );
}
