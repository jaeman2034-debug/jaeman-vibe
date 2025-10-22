import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

interface UserLocationSettingsProps {
  onLocationChange?: (location: string) => void;
}

export default function UserLocationSettings({ onLocationChange }: UserLocationSettingsProps) {
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  const [userLocation, setUserLocation] = useState("?�체");
  const [loading, setLoading] = useState(true);

  // ?�정???�션 (?�제 구현?�서??Firestore?�서 distinct �?가?�오�?
  const locationOptions = [
    "?�체",
    "경기???�천???�흘??,
    "경기???�천???�단??, 
    "?�울?�별??강남�???��??,
    "?�울?�별???�파�??�실??,
    "?�울?�별??마포�??�교??,
    "경기???�인??기흥�?
  ];

  // ?�용??기본 ?�치 불러?�기
  useEffect(() => {
    const fetchUserLocation = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setUserLocation(userData.defaultLocation || "?�체");
        } else {
          // ?�용??문서가 ?�으�??�성
          await setDoc(userDocRef, {
            displayName: currentUser.displayName || "?�명",
            photoURL: currentUser.photoURL || "",
            defaultLocation: "?�체",
            createdAt: new Date(),
          });
          setUserLocation("?�체");
        }
      } catch (error) {
        console.error("?�용???�치 ?�보 로드 ?�패:", error);
        setUserLocation("?�체");
      } finally {
        setLoading(false);
      }
    };

    fetchUserLocation();
  }, [currentUser]);

  // 기본 ?�치 변�?  const handleLocationChange = async (newLocation: string) => {
    if (!currentUser) return;

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        defaultLocation: newLocation,
        updatedAt: new Date(),
      });
      
      setUserLocation(newLocation);
      onLocationChange?.(newLocation);
      
      alert(`기본 ?�치가 '${newLocation}'?�로 ?�정?�었?�니????);
    } catch (error) {
      console.error("기본 ?�치 ?�정 ?�패:", error);
      alert("기본 ?�치 ?�정???�패?�습?�다.");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">?�치 ?�보�?불러?�는 �?..</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">?�� ??기본 ?�네</h3>
          <p className="text-sm text-gray-600">
            ?�재 ?�정: <span className="font-medium text-blue-600">{userLocation}</span>
          </p>
        </div>
        
        <select
          value={userLocation}
          onChange={(e) => handleLocationChange(e.target.value)}
          className="border rounded-md px-3 py-2 bg-white text-sm"
        >
          {locationOptions.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          ?�� 기본 ?�네�??�정?�면 ?�당 지??�� ?�품???�선?�으�?�????�습?�다.
        </p>
      </div>
    </div>
  );
}
