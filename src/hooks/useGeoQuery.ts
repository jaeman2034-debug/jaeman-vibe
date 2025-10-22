import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";

interface GeoPoint {
  lat: number;
  lng: number;
}

interface GeoQueryOptions {
  center: GeoPoint;
  radius: number; // km ?�위
  limit?: number;
}

interface GeoQueryResult {
  products: any[];
  loading: boolean;
  error: string | null;
  distance: number; // ?�재 ?�정??반경
}

// Haversine 공식?�로 ?????�이??거리 계산 (km ?�위)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 지�?반�?�?(km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// 좌표 범위 계산 (?�?�적???�각???�역)
function getBoundingBox(center: GeoPoint, radiusKm: number) {
  const latRange = radiusKm / 111; // ?�??1??= 111km
  const lngRange = radiusKm / (111 * Math.cos(center.lat * Math.PI / 180));
  
  return {
    minLat: center.lat - latRange,
    maxLat: center.lat + latRange,
    minLng: center.lng - lngRange,
    maxLng: center.lng + lngRange
  };
}

export default function useGeoQuery(options: GeoQueryOptions): GeoQueryResult {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!options.center.lat || !options.center.lng) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. ?�?�적???�각???�역?�로 1�??�터�?(Firestore 쿼리 최적??
      const bbox = getBoundingBox(options.center, options.radius);
      
      // Firestore??복합 쿼리가 ?�한?�이므�? lat 범위만으�?먼�? ?�터�?      let q = query(
        collection(db, "products"),
        where("lat", ">=", bbox.minLat),
        where("lat", "<=", bbox.maxLat),
        orderBy("createdAt", "desc")
      );

      if (options.limit) {
        q = query(q, limit(options.limit * 2)); // ?�확??거리 계산???�해 ?�유�??�보
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
          const allProducts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // 2. ?�확??거리 계산?�로 2�??�터�?          const nearbyProducts = allProducts
            .filter(product => {
              if (!product.lat || !product.lng) return false;
              
              const distance = calculateDistance(
                options.center.lat,
                options.center.lng,
                product.lat,
                product.lng
              );
              
              // 거리 ?�보�??�품 객체??추�?
              product.distance = Math.round(distance * 10) / 10; // ?�수??1?�리까�?
              
              return distance <= options.radius;
            })
            .sort((a, b) => a.distance - b.distance); // 거리???�렬

          // 3. limit ?�용
          const finalProducts = options.limit 
            ? nearbyProducts.slice(0, options.limit)
            : nearbyProducts;

          setProducts(finalProducts);
          setLoading(false);

          console.log(`반경 ${options.radius}km ???�품 ${finalProducts.length}�?발견`, {
            center: options.center,
            radius: options.radius,
            total: allProducts.length,
            filtered: nearbyProducts.length,
            final: finalProducts.length
          });

        } catch (err) {
          console.error("?�품 ?�이??처리 ?�패:", err);
          setError("?�품 ?�이?��? 처리?�는 �??�류가 발생?�습?�다.");
          setLoading(false);
        }
      }, (err) => {
        console.error("Firestore 쿼리 ?�패:", err);
        setError("?�품??불러?�는 �??�류가 발생?�습?�다.");
        setLoading(false);
      });

      return () => unsubscribe();

    } catch (err) {
      console.error("GeoQuery 초기???�패:", err);
      setError("?�치 기반 검?�을 초기?�하??�??�류가 발생?�습?�다.");
      setLoading(false);
    }
  }, [options.center.lat, options.center.lng, options.radius, options.limit]);

  return {
    products,
    loading,
    error,
    distance: options.radius
  };
}
