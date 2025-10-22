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
  
  const [locationAdmin, setLocationAdmin] = useState("?�체");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsPermission, setNeedsPermission] = useState(false);

  // Google Maps API ??  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

  // 좌표 ???�정??변???�수
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    if (!GOOGLE_API_KEY) {
      throw new Error("Google Maps API ?��? ?�정?��? ?�았?�니??");
    }

    try {
      const url = `/gapi/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}&language=ko`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status === "OK" && data.results.length > 0) {
        const components = data.results[0].address_components;

        // ?�정????�??? �?�? ???? 추출
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

        // 최종 ?�기 (?? "경기???�천???�흘??)
        const adminDistrict = `${province || ""} ${city || ""} ${district || ""}`.trim();
        
        console.log("?�치 변??결과:", {
          좌표: { lat, lng },
          변?? adminDistrict,
          components: { province, city, district }
        });

        return adminDistrict || "?�체";
      } else {
        console.warn("Reverse Geocoding API ?�답 ?�류:", data.status);
        return "?�체";
      }
    } catch (error) {
      console.error("?�치 변???�패:", error);
      throw error;
    }
  };

  // ?�용???�치 감�? �??�??  const detectAndSaveLocation = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Firestore?�서 기존 ?�치 ?�인
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().locationAdmin) {
        // ???��? ?�?�된 ?�치가 ?�으�??�용
        const savedLocation = userSnap.data().locationAdmin;
        setLocationAdmin(savedLocation);
        console.log("?�?�된 ?�치 ?�용:", savedLocation);
        setLoading(false);
        return;
      }

      // 2. 브라?��??�서 ?�재 ?�치 가?�오�?      if (!navigator.geolocation) {
        throw new Error("??브라?��????�치 ?�비?��? 지?�하지 ?�습?�다.");
      }

      // ?�치 권한 ?�태 ?�인
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          if (result.state === 'denied') {
            setNeedsPermission(true);
            setError("?�치 권한??거�??�었?�니?? 브라?��? ?�정?�서 ?�치 권한???�용?�주?�요.");
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

            console.log("?�재 ?�치 좌표:", { lat, lng });

            // 3. 좌표 ???�정??변??            const adminDistrict = await reverseGeocode(lat, lng);
            
            // 4. Firestore???�??            await setDoc(userRef, { 
              locationAdmin: adminDistrict,
              lastLocationUpdate: new Date(),
              coordinates: { lat, lng } // ?�버깅용 (?�제 ?�비?�에?�는 ?�라?�버??고려)
            }, { merge: true });

            setLocationAdmin(adminDistrict);
            console.log("?�치 감�? �??�???�료:", adminDistrict);
            
          } catch (error) {
            console.error("?�치 처리 ?�패:", error);
            setError("?�치�?처리?�는 �??�류가 발생?�습?�다.");
            setLocationAdmin("?�체");
          } finally {
            setLoading(false);
          }
        },
        (error) => {
          console.error("?�치 권한 ?�류:", error);
          let errorMessage = "?�치�?가?�올 ???�습?�다.";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "?�치 권한??거�??�었?�니?? 브라?��? ?�정?�서 ?�치 권한???�용?�주?�요.";
              setNeedsPermission(true);
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "?�치 ?�보�??�용?????�습?�다.";
              break;
            case error.TIMEOUT:
              errorMessage = "?�치 ?�청 ?�간??초과?�었?�니??";
              break;
          }
          
          setError(errorMessage);
          setLocationAdmin("?�체");
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5�?캐시
        }
      );

    } catch (error) {
      console.error("?�치 감�? ?�패:", error);
      setError("?�치 감�? �??�류가 발생?�습?�다.");
      setLocationAdmin("?�체");
      setLoading(false);
    }
  };

  // ?�치 권한 ?�청 ?�수
  const requestPermission = () => {
    detectAndSaveLocation();
  };

  // 초기 로드 ???�치 감�?
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
