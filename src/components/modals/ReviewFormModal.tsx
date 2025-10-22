import React, { useState } from "react";
import { useToast } from "@/components/common/Toast";
import { ReviewFormData } from "@/types/review";

interface ReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReviewFormData) => Promise<void>;
  facilityName: string;
  slotTime: string;
  existingReview?: ReviewFormData;
}

export default function ReviewFormModal({
  isOpen,
  onClose,
  onSubmit,
  facilityName,
  slotTime,
  existingReview
}: ReviewFormModalProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast("?�점???�택?�주?�요.");
      return;
    }
    
    if (comment.trim().length < 10) {
      toast("?�기??최소 10???�상 ?�성?�주?�요.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ rating, comment });
      toast("?�기가 ?�공?�으�??�성?�었?�니??");
      onClose();
    } catch (error: any) {
      toast(`?�기 ?�성???�패?�습?�다: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {existingReview ? "?�기 ?�정" : "?�기 ?�성"}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">?�설</div>
          <div className="font-medium">{facilityName}</div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">?�간</div>
          <div className="font-medium">{slotTime}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ?�점 ?�택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ?�점 *
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${
                    rating >= star
                      ? "border-yellow-400 bg-yellow-400 text-white"
                      : "border-gray-300 text-gray-400 hover:border-yellow-300"
                  }`}
                >
                  ??
                </button>
              ))}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {rating > 0 && (
                <span>
                  {rating === 1 && "매우 ?�쁨"}
                  {rating === 2 && "?�쁨"}
                  {rating === 3 && "보통"}
                  {rating === 4 && "좋음"}
                  {rating === 5 && "매우 좋음"}
                </span>
              )}
            </div>
          </div>

          {/* ?�기 ?�용 */}
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              ?�기 ?�용 *
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="?�설 ?�용 경험???�세???�성?�주?�요. (최소 10??"
              disabled={isSubmitting}
            />
            <div className="text-sm text-gray-500 mt-1">
              {comment.length}/500??
              {comment.length < 10 && comment.length > 0 && (
                <span className="text-red-500 ml-2">
                  최소 10???�상 ?�성?�주?�요
                </span>
              )}
            </div>
          </div>

          {/* ?�성 가?�드?�인 */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="text-sm text-blue-800 font-medium mb-2">?�� ?�기 ?�성 ??/div>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>???�설??�?��?? ?�의?? ?�비???�질???�??구체?�으�??�성?�주?�요</li>
              <li>??개인?�인 경험�??��? ?�을 ?�함?�면 ?�욱 ?��????�니??/li>
              <li>??부?�절???�용?�나 개인?�보???�함?��? 마세??/li>
            </ul>
          </div>

          {/* 버튼 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "?�성 �?.." : existingReview ? "?�정?�기" : "?�성?�기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
