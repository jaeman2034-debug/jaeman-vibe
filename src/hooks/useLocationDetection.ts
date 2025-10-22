import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface LocationDetectionResult {
  locationAdmin: string;
  loading: boolean;
  error: string | null;
  requestPermission: () => void;
  needsPermission: boolean;
}

export default function useLocationDetection(): LocationDetectionResult {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  const [locationAdmin, setLocationAdmin] = useState("?„ì²´");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsPermission, setNeedsPermission] = useState(false);

  // Google Maps API ??  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

  // ì¢Œí‘œ ???‰ì •??ë³€???¨ìˆ˜
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    if (!GOOGLE_API_KEY) {
      throw new Error("Google Maps API ?¤ê? ?¤ì •?˜ì? ?Šì•˜?µë‹ˆ??");
    }

    try {
      const url = `/gapi/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}&language=ko`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "OK" && data.results.length > 0) {
        const components = data.results[0].address_components;

        // ?‰ì •????ë©??? êµ?êµ? ???? ì¶”ì¶œ
        const district = components.find((c: any) =>
          c.types.includes("sublocality_level_1") || 
          c.types.includes("sublocality_level_2") ||
          c.types.includes("sublocality_level_3")
        )?.long_name;

        const city = components.find((c: any) =>
          c.types.includes("locality") ||
          c.types.includes("administrative_area_level_2")
        )?.long_name;

        const province = components.find((c: any) =>
          c.types.includes("administrative_area_level_1")
        )?.long_name;

        // ìµœì¢… ?œê¸° (?? "ê²½ê¸°???¬ì²œ???Œí˜??)
        const adminDistrict = `${province || ""} ${city || ""} ${district || ""}`.trim();
        
        console.log("?„ì¹˜ ë³€??ê²°ê³¼:", {
          ì¢Œí‘œ: { lat, lng },
          ë³€?? adminDistrict,
          components: { province, city, district }
        });

        return adminDistrict || "?„ì²´";
      } else {
        console.warn("Reverse Geocoding API ?‘ë‹µ ?¤ë¥˜:", data.status);
        return "?„ì²´";
      }
    } catch (error) {
      console.error("?„ì¹˜ ë³€???¤íŒ¨:", error);
      throw error;
    }
  };

  // ?¬ìš©???„ì¹˜ ê°ì? ë°??€??  const detectAndSaveLocation = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Firestore?ì„œ ê¸°ì¡´ ?„ì¹˜ ?•ì¸
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().locationAdmin) {
        // ???´ë? ?€?¥ëœ ?„ì¹˜ê°€ ?ˆìœ¼ë©??¬ìš©
        const savedLocation = userSnap.data().locationAdmin;
        setLocationAdmin(savedLocation);
        console.log("?€?¥ëœ ?„ì¹˜ ?¬ìš©:", savedLocation);
        setLoading(false);
        return;
      }

      // 2. ë¸Œë¼?°ì??ì„œ ?„ìž¬ ?„ì¹˜ ê°€?¸ì˜¤ê¸?      if (!navigator.geolocation) {
        throw new Error("??ë¸Œë¼?°ì????„ì¹˜ ?œë¹„?¤ë? ì§€?í•˜ì§€ ?ŠìŠµ?ˆë‹¤.");
      }

      // ?„ì¹˜ ê¶Œí•œ ?íƒœ ?•ì¸
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          if (result.state === 'denied') {
            setNeedsPermission(true);
            setError("?„ì¹˜ ê¶Œí•œ??ê±°ë??˜ì—ˆ?µë‹ˆ?? ë¸Œë¼?°ì? ?¤ì •?ì„œ ?„ì¹˜ ê¶Œí•œ???ˆìš©?´ì£¼?¸ìš”.");
            setLoading(false);
            return;
          }
        });
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            console.log("?„ìž¬ ?„ì¹˜ ì¢Œí‘œ:", { lat, lng });

            // 3. ì¢Œí‘œ ???‰ì •??ë³€??            const adminDistrict = await reverseGeocode(lat, lng);
            
            // 4. Firestore???€??            await setDoc(userRef, { 
              locationAdmin: adminDistrict,
              lastLocationUpdate: new Date(),
              coordinates: { lat, lng } // ?”ë²„ê¹…ìš© (?¤ì œ ?œë¹„?¤ì—?œëŠ” ?„ë¼?´ë²„??ê³ ë ¤)
            }, { merge: true });

            setLocationAdmin(adminDistrict);
            console.log("?„ì¹˜ ê°ì? ë°??€???„ë£Œ:", adminDistrict);
            
          } catch (error) {
            console.error("?„ì¹˜ ì²˜ë¦¬ ?¤íŒ¨:", error);
            setError("?„ì¹˜ë¥?ì²˜ë¦¬?˜ëŠ” ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
            setLocationAdmin("?„ì²´");
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error("?„ì¹˜ ê¶Œí•œ ?¤ë¥˜:", error);
          let errorMessage = "?„ì¹˜ë¥?ê°€?¸ì˜¬ ???†ìŠµ?ˆë‹¤.";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "?„ì¹˜ ê¶Œí•œ??ê±°ë??˜ì—ˆ?µë‹ˆ?? ë¸Œë¼?°ì? ?¤ì •?ì„œ ?„ì¹˜ ê¶Œí•œ???ˆìš©?´ì£¼?¸ìš”.";
              setNeedsPermission(true);
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "?„ì¹˜ ?•ë³´ë¥??¬ìš©?????†ìŠµ?ˆë‹¤.";
              break;
            case error.TIMEOUT:
              errorMessage = "?„ì¹˜ ?”ì²­ ?œê°„??ì´ˆê³¼?˜ì—ˆ?µë‹ˆ??";
              break;
          }
          
          setError(errorMessage);
          setLocationAdmin("?„ì²´");
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5ë¶?ìºì‹œ
        }
      );

    } catch (error) {
      console.error("?„ì¹˜ ê°ì? ?¤íŒ¨:", error);
      setError("?„ì¹˜ ê°ì? ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
      setLocationAdmin("?„ì²´");
      setLoading(false);
    }
  };

  // ?„ì¹˜ ê¶Œí•œ ?”ì²­ ?¨ìˆ˜
  const requestPermission = () => {
    detectAndSaveLocation();
  };

  // ì´ˆê¸° ë¡œë“œ ???„ì¹˜ ê°ì?
  useEffect(() => {
    detectAndSaveLocation();
  }, [currentUser]);

  return {
    locationAdmin,
    loading,
    error,
    requestPermission,
    needsPermission
  };
}
