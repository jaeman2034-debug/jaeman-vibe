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
  
  const [userLocation, setUserLocation] = useState("?„ì²´");
  const [loading, setLoading] = useState(true);

  // ?‰ì •???µì…˜ (?¤ì œ êµ¬í˜„?ì„œ??Firestore?ì„œ distinct ê°?ê°€?¸ì˜¤ê¸?
  const locationOptions = [
    "?„ì²´",
    "ê²½ê¸°???¬ì²œ???Œí˜??,
    "ê²½ê¸°???¬ì²œ??? ë‹¨??, 
    "?œìš¸?¹ë³„??ê°•ë‚¨êµ???‚¼??,
    "?œìš¸?¹ë³„???¡íŒŒêµ?? ì‹¤??,
    "?œìš¸?¹ë³„??ë§ˆí¬êµ??œêµ??,
    "ê²½ê¸°???©ì¸??ê¸°í¥êµ?
  ];

  // ?¬ìš©??ê¸°ë³¸ ?„ì¹˜ ë¶ˆëŸ¬?¤ê¸°
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
          setUserLocation(userData.defaultLocation || "?„ì²´");
        } else {
          // ?¬ìš©??ë¬¸ì„œê°€ ?†ìœ¼ë©??ì„±
          await setDoc(userDocRef, {
            displayName: currentUser.displayName || "?µëª…",
            photoURL: currentUser.photoURL || "",
            defaultLocation: "?„ì²´",
            createdAt: new Date(),
          });
          setUserLocation("?„ì²´");
        }
      } catch (error) {
        console.error("?¬ìš©???„ì¹˜ ?•ë³´ ë¡œë“œ ?¤íŒ¨:", error);
        setUserLocation("?„ì²´");
      } finally {
        setLoading(false);
      }
    };

    fetchUserLocation();
  }, [currentUser]);

  // ê¸°ë³¸ ?„ì¹˜ ë³€ê²?  const handleLocationChange = async (newLocation: string) => {
    if (!currentUser) return;

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        defaultLocation: newLocation,
        updatedAt: new Date(),
      });
      
      setUserLocation(newLocation);
      onLocationChange?.(newLocation);
      
      alert(`ê¸°ë³¸ ?„ì¹˜ê°€ '${newLocation}'?¼ë¡œ ?¤ì •?˜ì—ˆ?µë‹ˆ????);
    } catch (error) {
      console.error("ê¸°ë³¸ ?„ì¹˜ ?¤ì • ?¤íŒ¨:", error);
      alert("ê¸°ë³¸ ?„ì¹˜ ?¤ì •???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-sm text-gray-600">?„ì¹˜ ?•ë³´ë¥?ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">?  ??ê¸°ë³¸ ?™ë„¤</h3>
          <p className="text-sm text-gray-600">
            ?„ì¬ ?¤ì •: <span className="font-medium text-blue-600">{userLocation}</span>
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
          ?’¡ ê¸°ë³¸ ?™ë„¤ë¥??¤ì •?˜ë©´ ?´ë‹¹ ì§€??˜ ?í’ˆ???°ì„ ?ìœ¼ë¡?ë³????ˆìŠµ?ˆë‹¤.
        </p>
      </div>
    </div>
  );
}
