import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

interface SellerProfileProps {
  sellerId: string;
  showDetails?: boolean;
}

export default function SellerProfile({ sellerId, showDetails = true }: SellerProfileProps) {
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", sellerId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const avg = data.ratingCount > 0 ? (data.totalRating / data.ratingCount).toFixed(1) : "0.0";
        setSeller({ ...data, avgRating: avg });
      } else {
        // ?¬ìš©???°ì´?°ê? ?†ëŠ” ê²½ìš° ê¸°ë³¸ê°??¤ì •
        setSeller({
          displayName: "?µëª…",
          photoURL: null,
          tradeCount: 0,
          totalRating: 0,
          ratingCount: 0,
          avgRating: "0.0"
        });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [sellerId]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg shadow animate-pulse">
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-32 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg shadow">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-gray-400 text-lg">?‘¤</span>
        </div>
        <div>
          <p className="font-semibold text-gray-900">?¬ìš©???•ë³´ ?†ìŒ</p>
          <p className="text-sm text-gray-500">?„ë¡œ?„ì„ ë¶ˆëŸ¬?????†ìŠµ?ˆë‹¤</p>
        </div>
      </div>
    );
  }

  // ? ë¢°???ˆë²¨ ê³„ì‚°
  const getTrustLevel = (rating: number, count: number) => {
    if (count === 0) return { level: "? ê·œ", color: "gray", icon: "?†•" };
    if (rating >= 4.5 && count >= 5) return { level: "?°ìˆ˜", color: "green", icon: "?”¥" };
    if (rating >= 4.0 && count >= 3) return { level: "?‘í˜¸", color: "blue", icon: "?‘" };
    if (rating >= 3.0) return { level: "ë³´í†µ", color: "yellow", icon: "?‘Œ" };
    return { level: "ì£¼ì˜", color: "red", icon: "? ï¸" };
  };

  const trustLevel = getTrustLevel(parseFloat(seller.avgRating), seller.ratingCount);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex items-center gap-3">
        {/* ?„ë¡œ???¬ì§„ */}
        <div className="relative">
          <img
            src={seller.photoURL || "https://via.placeholder.com/48x48?text=?‘¤"}
            alt={seller.displayName}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
            onError={(e) => {
              e.currentTarget.src = "https://via.placeholder.com/48x48?text=?‘¤";
            }}
          />
          {/* ? ë¢°??ë°°ì? */}
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs ${
            trustLevel.color === "green"
              ? "bg-green-500 text-white"
              : trustLevel.color === "blue"
              ? "bg-blue-500 text-white"
              : trustLevel.color === "yellow"
              ? "bg-yellow-500 text-white"
              : trustLevel.color === "red"
              ? "bg-red-500 text-white"
              : "bg-gray-500 text-white"
          }`}>
            {trustLevel.icon}
          </div>
        </div>

        {/* ?ë§¤???•ë³´ */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-gray-900">
              {seller.displayName || "?µëª…"}
            </p>
            <span className={`text-xs px-2 py-1 rounded-full ${
              trustLevel.color === "green"
                ? "bg-green-100 text-green-800"
                : trustLevel.color === "blue"
                ? "bg-blue-100 text-blue-800"
                : trustLevel.color === "yellow"
                ? "bg-yellow-100 text-yellow-800"
                : trustLevel.color === "red"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }`}>
              {trustLevel.level}
            </span>
          </div>

          {/* ?‰ê·  ë³„ì  */}
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-sm ${
                    star <= Math.round(parseFloat(seller.avgRating)) ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ??                </span>
              ))}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {seller.avgRating}/5.0
            </span>
          </div>

          {/* ê±°ë˜ ?µê³„ */}
          {showDetails && (
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>?„ê¸° {seller.ratingCount || 0}ê°?/span>
              <span>??/span>
              <span>ê±°ë˜ {seller.tradeCount || 0}??/span>
            </div>
          )}
        </div>
      </div>

      {/* ? ë¢°???¤ëª… (?ì„¸ ëª¨ë“œ?ì„œë§? */}
      {showDetails && seller.ratingCount > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-600">
            <span className="font-medium">? ë¢°??</span> {trustLevel.level} 
            {trustLevel.level === "?°ìˆ˜" && " - ë§¤ìš° ? ë¢°?????ˆëŠ” ?ë§¤?ì…?ˆë‹¤"}
            {trustLevel.level === "?‘í˜¸" && " - ?ˆì „??ê±°ë˜ê°€ ê°€?¥í•©?ˆë‹¤"}
            {trustLevel.level === "ë³´í†µ" && " - ?¼ë°˜?ì¸ ê±°ë˜ ?˜ì??…ë‹ˆ??}
            {trustLevel.level === "ì£¼ì˜" && " - ê±°ë˜ ??ì£¼ì˜ê°€ ?„ìš”?©ë‹ˆ??}
          </div>
        </div>
      )}
    </div>
  );
}
