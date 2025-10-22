import React, { useState } from "react";
import {
  getFirestore,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import app from "../../lib/firebase";

interface ReviewModalProps {
  productId: string;
  onClose: () => void;
}

export default function ReviewModal({ productId, onClose }: ReviewModalProps) {
  const db = getFirestore(app);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !comment.trim()) return alert("?�점�??�기�?모두 ?�력?�주?�요!");

    setLoading(true);
    try {
      const productRef = doc(db, "products", productId);
      await updateDoc(productRef, {
        reviews: arrayUnion({
          rating,
          comment,
          createdAt: serverTimestamp(),
        }),
      });
      alert("리뷰가 ?�록?�었?�니??");
      onClose();
    } catch (err) {
      console.error("리뷰 ?�록 ?�류:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-80">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">�?리뷰 ?�성</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex justify-center space-x-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-2xl ${
                  star <= rating ? "text-yellow-400" : "text-gray-300"
                }`}
              >
                ??              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="?�기�??�력?�주?�요..."
            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#FF7E36]"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF7E36] text-white py-2 rounded-lg hover:bg-[#ff6716]"
          >
            {loading ? "?�록 �?.." : "?�록?�기"}
          </button>
        </form>
        <button
          onClick={onClose}
          className="w-full text-gray-500 text-sm mt-3 hover:text-gray-700"
        >
          취소
        </button>
      </div>
    </div>
  );
}
