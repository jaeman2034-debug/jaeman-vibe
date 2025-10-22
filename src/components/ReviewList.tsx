import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, query, where, orderBy, onSnapshot, getDocs } from "firebase/firestore";

interface Review {
  id: string;
  buyerId: string;
  rating: number;
  comment: string;
  createdAt: any;
  buyerName?: string;
}

interface ReviewListProps {
  sellerId: string;
  limit?: number;
  showHeader?: boolean;
}

export default function ReviewList({ sellerId, limit = 5, showHeader = true }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;

    const q = query(
      collection(db, "reviews"),
      where("sellerId", "==", sellerId),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, async (snap) => {
      const reviewsData = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Review[];

      // Íµ¨Îß§???¥Î¶Ñ Í∞Ä?∏Ïò§Í∏?      const reviewsWithNames = await Promise.all(
        reviewsData.map(async (review) => {
          try {
            const userDoc = await getDocs(query(
              collection(db, "users"),
              where("uid", "==", review.buyerId)
            ));
            if (!userDoc.empty) {
              review.buyerName = userDoc.docs[0].data().displayName || "?µÎ™Ö";
            } else {
              review.buyerName = "?µÎ™Ö";
            }
          } catch (error) {
            review.buyerName = "?µÎ™Ö";
          }
          return review;
        })
      );

      setReviews(limit ? reviewsWithNames.slice(0, limit) : reviewsWithNames);
      setLoading(false);
    });

    return () => unsub();
  }, [sellerId, limit]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-50 p-3 rounded-lg animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-gray-200 h-4 w-16 rounded"></div>
              <div className="bg-gray-200 h-4 w-20 rounded"></div>
            </div>
            <div className="bg-gray-200 h-3 w-full rounded mb-1"></div>
            <div className="bg-gray-200 h-3 w-3/4 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">?ìù</div>
        <p>?ÑÏßÅ ?ÑÍ∏∞Í∞Ä ?ÜÏäµ?àÎã§.</p>
        <p className="text-sm">Ï≤?Í±∞Îûò ?ÑÍ∏∞Î•??®Í≤®Î≥¥ÏÑ∏??</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ?§Îçî (?µÏÖò) */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-lg">?ìù Íµ¨Îß§???ÑÍ∏∞</h3>
          <span className="text-sm text-gray-500">
            Ï¥?{reviews.length}Í∞??ÑÍ∏∞
          </span>
        </div>
      )}

      {/* ?ÑÍ∏∞ Î™©Î°ù */}
      {reviews.map((review) => (
        <div key={review.id} className="bg-white p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
          {/* ?ÑÍ∏∞ ?§Îçî */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm">?ë§</span>
              </div>
              <div>
                <span className="font-medium text-sm text-gray-900">
                  {review.buyerName}
                </span>
                <div className="flex items-center gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`text-sm ${
                        star <= review.rating ? "text-yellow-400" : "text-gray-300"
                      }`}
                    >
                      ??                    </span>
                  ))}
                  <span className="text-xs text-gray-500 ml-1">
                    {review.rating}??                  </span>
                </div>
              </div>
            </div>
            <span className="text-xs text-gray-500">
              {review.createdAt?.toDate?.()?.toLocaleDateString() || "Î∞©Í∏à ??}
            </span>
          </div>

          {/* ?ÑÍ∏∞ ?¥Ïö© */}
          <p className="text-sm text-gray-700 leading-relaxed pl-11">
            {review.comment}
          </p>
        </div>
      ))}

      {/* ?îÎ≥¥Í∏?ÎßÅÌÅ¨ (?úÌïú???àÎäî Í≤ΩÏö∞) */}
      {limit && reviews.length === limit && (
        <div className="text-center pt-4">
          <button className="text-blue-600 text-sm hover:text-blue-800 font-medium">
            ??ÎßéÏ? ?ÑÍ∏∞ Î≥¥Í∏∞ ({reviews.length}Í∞? ??          </button>
        </div>
      )}
    </div>
  );
}
