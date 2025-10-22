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
        console.error("?�용???�이??로드 ?�패:", error);
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
        <span className="text-sm">?�규 ?�용??/span>
      </div>
    );
  }

  const avgRating = userData.avgRating || 0;
  const ratingCount = userData.ratingCount || 0;
  const tradeCount = userData.tradeCount || 0;

  // 별점 ?�시 (�?별과 채워�?�?
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

  // ?�뢰???�벨 계산
  const getTrustLevel = (rating: number, count: number) => {
    if (count === 0) return { level: "?�규", color: "gray", icon: "?��" };
    if (rating >= 4.5 && count >= 5) return { level: "?�수", color: "green", icon: "?��" };
    if (rating >= 4.0 && count >= 3) return { level: "?�호", color: "blue", icon: "?��" };
    if (rating >= 3.0) return { level: "보통", color: "yellow", icon: "?��" };
    return { level: "주의", color: "red", icon: "?�️" };
  };

  const trustLevel = getTrustLevel(avgRating, ratingCount);

  return (
    <div className="flex items-center gap-2">
      {/* 별점 */}
      <div className="flex items-center gap-1">
        {renderStars(avgRating)}
        <span className="text-sm font-medium text-gray-700">
          {avgRating.toFixed(1)}
        </span>
      </div>

      {/* ?�뢰???�벨 */}
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

      {/* ?�세 ?�보 (?�션) */}
      {showDetails && (
        <div className="text-xs text-gray-500">
          ({ratingCount}�??�기, {tradeCount}??거래)
        </div>
      )}
    </div>
  );
}
