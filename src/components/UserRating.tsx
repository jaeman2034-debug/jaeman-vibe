import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface UserRatingProps {
  userId: string;
  showDetails?: boolean;
}

export default function UserRating({ userId, showDetails = false }: UserRatingProps) {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } catch (error) {
        console.error("?¨Ïö©???∞Ïù¥??Î°úÎìú ?§Ìå®:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center gap-1">
        <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex items-center gap-1 text-gray-400">
        <span className="text-sm">?†Í∑ú ?¨Ïö©??/span>
      </div>
    );
  }

  const avgRating = userData.avgRating || 0;
  const ratingCount = userData.ratingCount || 0;
  const tradeCount = userData.tradeCount || 0;

  // Î≥ÑÏ†ê ?úÏãú (Îπ?Î≥ÑÍ≥º Ï±ÑÏõåÏß?Î≥?
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm ${
              star <= Math.round(rating) ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            ??          </span>
        ))}
      </div>
    );
  };

  // ?†Î¢∞???àÎ≤® Í≥ÑÏÇ∞
  const getTrustLevel = (rating: number, count: number) => {
    if (count === 0) return { level: "?†Í∑ú", color: "gray", icon: "?Üï" };
    if (rating >= 4.5 && count >= 5) return { level: "?∞Ïàò", color: "green", icon: "?î•" };
    if (rating >= 4.0 && count >= 3) return { level: "?ëÌò∏", color: "blue", icon: "?ëç" };
    if (rating >= 3.0) return { level: "Î≥¥ÌÜµ", color: "yellow", icon: "?ëå" };
    return { level: "Ï£ºÏùò", color: "red", icon: "?†Ô∏è" };
  };

  const trustLevel = getTrustLevel(avgRating, ratingCount);

  return (
    <div className="flex items-center gap-2">
      {/* Î≥ÑÏ†ê */}
      <div className="flex items-center gap-1">
        {renderStars(avgRating)}
        <span className="text-sm font-medium text-gray-700">
          {avgRating.toFixed(1)}
        </span>
      </div>

      {/* ?†Î¢∞???àÎ≤® */}
      <span
        className={`text-xs px-2 py-1 rounded-full ${
          trustLevel.color === "green"
            ? "bg-green-100 text-green-800"
            : trustLevel.color === "blue"
            ? "bg-blue-100 text-blue-800"
            : trustLevel.color === "yellow"
            ? "bg-yellow-100 text-yellow-800"
            : trustLevel.color === "red"
            ? "bg-red-100 text-red-800"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        {trustLevel.icon} {trustLevel.level}
      </span>

      {/* ?ÅÏÑ∏ ?ïÎ≥¥ (?µÏÖò) */}
      {showDetails && (
        <div className="text-xs text-gray-500">
          ({ratingCount}Í∞??ÑÍ∏∞, {tradeCount}??Í±∞Îûò)
        </div>
      )}
    </div>
  );
}
