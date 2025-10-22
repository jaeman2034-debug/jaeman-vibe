import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";

interface GeoPoint {
  lat: number;
  lng: number;
}

interface GeoQueryOptions {
  center: GeoPoint;
  radius: number; // km ?¨ìœ„
  limit?: number;
}

interface GeoQueryResult {
  products: any[];
  loading: boolean;
  error: string | null;
  distance: number; // ?„ì¬ ?¤ì •??ë°˜ê²½
}

// Haversine ê³µì‹?¼ë¡œ ?????¬ì´??ê±°ë¦¬ ê³„ì‚° (km ?¨ìœ„)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // ì§€êµ?ë°˜ì?ë¦?(km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ì¢Œí‘œ ë²”ìœ„ ê³„ì‚° (?€?µì ???¬ê°???ì—­)
function getBoundingBox(center: GeoPoint, radiusKm: number) {
  const latRange = radiusKm / 111; // ?€??1??= 111km
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
      // 1. ?€?µì ???¬ê°???ì—­?¼ë¡œ 1ì°??„í„°ë§?(Firestore ì¿¼ë¦¬ ìµœì ??
      const bbox = getBoundingBox(options.center, options.radius);
      
      // Firestore??ë³µí•© ì¿¼ë¦¬ê°€ ?œí•œ?ì´ë¯€ë¡? lat ë²”ìœ„ë§Œìœ¼ë¡?ë¨¼ì? ?„í„°ë§?      let q = query(
        collection(db, "products"),
        where("lat", ">=", bbox.minLat),
        where("lat", "<=", bbox.maxLat),
        orderBy("createdAt", "desc")
      );

      if (options.limit) {
        q = query(q, limit(options.limit * 2)); // ?•í™•??ê±°ë¦¬ ê³„ì‚°???„í•´ ?¬ìœ ë¶??•ë³´
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        try {
          const allProducts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // 2. ?•í™•??ê±°ë¦¬ ê³„ì‚°?¼ë¡œ 2ì°??„í„°ë§?          const nearbyProducts = allProducts
            .filter(product => {
              if (!product.lat || !product.lng) return false;
              
              const distance = calculateDistance(
                options.center.lat,
                options.center.lng,
                product.lat,
                product.lng
              );
              
              // ê±°ë¦¬ ?•ë³´ë¥??í’ˆ ê°ì²´??ì¶”ê?
              product.distance = Math.round(distance * 10) / 10; // ?Œìˆ˜??1?ë¦¬ê¹Œì?
              
              return distance <= options.radius;
            })
            .sort((a, b) => a.distance - b.distance); // ê±°ë¦¬???•ë ¬

          // 3. limit ?ìš©
          const finalProducts = options.limit 
            ? nearbyProducts.slice(0, options.limit)
            : nearbyProducts;

          setProducts(finalProducts);
          setLoading(false);

          console.log(`ë°˜ê²½ ${options.radius}km ???í’ˆ ${finalProducts.length}ê°?ë°œê²¬`, {
            center: options.center,
            radius: options.radius,
            total: allProducts.length,
            filtered: nearbyProducts.length,
            final: finalProducts.length
          });

        } catch (err) {
          console.error("?í’ˆ ?°ì´??ì²˜ë¦¬ ?¤íŒ¨:", err);
          setError("?í’ˆ ?°ì´?°ë? ì²˜ë¦¬?˜ëŠ” ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
          setLoading(false);
        }
      }, (err) => {
        console.error("Firestore ì¿¼ë¦¬ ?¤íŒ¨:", err);
        setError("?í’ˆ??ë¶ˆëŸ¬?¤ëŠ” ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
        setLoading(false);
      });

      return () => unsubscribe();

    } catch (err) {
      console.error("GeoQuery ì´ˆê¸°???¤íŒ¨:", err);
      setError("?„ì¹˜ ê¸°ë°˜ ê²€?‰ì„ ì´ˆê¸°?”í•˜??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
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
