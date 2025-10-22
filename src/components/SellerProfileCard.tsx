/**
 * ?‘¤ ?ë§¤???„ë¡œ??ì¹´ë“œ ì»´í¬?ŒíŠ¸
 * 
 * ?ë§¤?ì˜ ? ë¢°?? ê±°ë˜ ?µê³„, ?‰ì ???œì‹œ?©ë‹ˆ??
 */

import React, { useEffect, useState } from "react";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { Star, Award, TrendingUp, Clock } from "lucide-react";

const db = getFirestore();

interface SellerProfileCardProps {
  sellerId: string;
}

interface SellerData {
  trustScore?: number;
  totalSales?: number;
  avgRating?: number;
  completedTransactions?: number;
  lastActive?: any;
}

export default function SellerProfileCard({ sellerId }: SellerProfileCardProps) {
  const [seller, setSeller] = useState<SellerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        const sellerRef = doc(db, "users", sellerId);
        const sellerSnap = await getDoc(sellerRef);
        
        if (sellerSnap.exists()) {
          setSeller(sellerSnap.data() as SellerData);
        } else {
          // ê¸°ë³¸ê°??¤ì • (? ê·œ ?ë§¤??
          setSeller({
            trustScore: 50,
            totalSales: 0,
            avgRating: 0,
            completedTransactions: 0,
          });
        }
      } catch (error) {
        console.error("?ë§¤???•ë³´ ì¡°íšŒ ?¤íŒ¨:", error);
        setSeller({
          trustScore: 50,
          totalSales: 0,
          avgRating: 0,
          completedTransactions: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    if (sellerId) {
      fetchSeller();
    }
  }, [sellerId]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  if (!seller) {
    return null;
  }

  const trustScore = seller.trustScore || 50;
  const totalSales = seller.totalSales || 0;
  const avgRating = seller.avgRating || 0;
  const completedTransactions = seller.completedTransactions || 0;

  // ? ë¢°?„ì— ?°ë¥¸ ?‰ìƒ
  const trustColor =
    trustScore >= 90
      ? "text-green-600"
      : trustScore >= 70
      ? "text-yellow-600"
      : trustScore >= 50
      ? "text-orange-600"
      : "text-red-600";

  const trustBgColor =
    trustScore >= 90
      ? "bg-green-50 border-green-200"
      : trustScore >= 70
      ? "bg-yellow-50 border-yellow-200"
      : trustScore >= 50
      ? "bg-orange-50 border-orange-200"
      : "bg-red-50 border-red-200";

  // ? ë¢°???±ê¸‰
  const trustGrade =
    trustScore >= 90 ? "?† ìµœìš°??
    : trustScore >= 70 ? "?¥‡ ?°ìˆ˜"
    : trustScore >= 50 ? "?¥ˆ ë³´í†µ"
    : "?¥‰ ? ì¤‘";

  return (
    <div className={`rounded-2xl p-6 shadow-sm border-2 ${trustBgColor}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Award size={22} className={trustColor} />
          ?ë§¤???„ë¡œ??        </h3>
        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
          trustScore >= 90 ? "bg-green-600 text-white" :
          trustScore >= 70 ? "bg-yellow-500 text-white" :
          "bg-gray-400 text-white"
        }`}>
          {trustGrade}
        </span>
      </div>

      {/* ? ë¢°???ìˆ˜ */}
      <div className="text-center mb-4 pb-4 border-b">
        <div className="text-sm text-gray-600 mb-1">? ë¢°???ìˆ˜</div>
        <div className={`text-4xl font-bold ${trustColor}`}>
          {trustScore}??        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className={`h-2 rounded-full transition-all ${
              trustScore >= 90 ? "bg-green-600" :
              trustScore >= 70 ? "bg-yellow-500" :
              trustScore >= 50 ? "bg-orange-500" :
              "bg-red-500"
            }`}
            style={{ width: `${trustScore}%` }}
          ></div>
        </div>
      </div>

      {/* ê±°ë˜ ?µê³„ */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-white rounded-xl">
          <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
            <TrendingUp size={16} />
            <span>ì´?ê±°ë˜</span>
          </div>
          <div className="text-2xl font-bold text-gray-800">{totalSales}ê±?/div>
        </div>

        <div className="text-center p-3 bg-white rounded-xl">
          <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
            <Star size={16} />
            <span>?‰ê·  ?‰ì </span>
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {avgRating > 0 ? avgRating.toFixed(1) : "-"}
          </div>
        </div>
      </div>

      {/* ì¶”ê? ?•ë³´ */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>???„ë£Œ??ê±°ë˜</span>
          <span className="font-semibold">{completedTransactions}ê±?/span>
        </div>
        
        {seller.lastActive && (
          <div className="flex justify-between text-gray-500">
            <span className="flex items-center gap-1">
              <Clock size={14} />
              ìµœê·¼ ?œë™
            </span>
            <span className="text-xs">
              {seller.lastActive.toDate?.().toLocaleDateString("ko-KR") || "?•ë³´ ?†ìŒ"}
            </span>
          </div>
        )}
      </div>

      {/* ?ˆë‚´ ë¬¸êµ¬ */}
      <div className="mt-4 pt-4 border-t">
        <p className="text-xs text-gray-500 text-center">
          ?’¡ ? ë¢°?„ëŠ” ê±°ë˜ ?Ÿìˆ˜, ?‰ì , ì°??˜ë? ê¸°ë°˜?¼ë¡œ ?ë™ ê³„ì‚°?©ë‹ˆ??        </p>
      </div>
    </div>
  );
}

