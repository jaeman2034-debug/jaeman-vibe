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
      toast("?‰ì ??? íƒ?´ì£¼?¸ìš”.");
      return;
    }
    
    if (comment.trim().length < 10) {
      toast("?„ê¸°??ìµœì†Œ 10???´ìƒ ?‘ì„±?´ì£¼?¸ìš”.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ rating, comment });
      toast("?„ê¸°ê°€ ?±ê³µ?ìœ¼ë¡??‘ì„±?˜ì—ˆ?µë‹ˆ??");
      onClose();
    } catch (error: any) {
      toast(`?„ê¸° ?‘ì„±???¤íŒ¨?ˆìŠµ?ˆë‹¤: ${error.message}`);
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
            {existingReview ? "?„ê¸° ?˜ì •" : "?„ê¸° ?‘ì„±"}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            Ã—
          </button>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">?œì„¤</div>
          <div className="font-medium">{facilityName}</div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">?œê°„</div>
          <div className="font-medium">{slotTime}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ?‰ì  ? íƒ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ?‰ì  *
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
                  {rating === 1 && "ë§¤ìš° ?˜ì¨"}
                  {rating === 2 && "?˜ì¨"}
                  {rating === 3 && "ë³´í†µ"}
                  {rating === 4 && "ì¢‹ìŒ"}
                  {rating === 5 && "ë§¤ìš° ì¢‹ìŒ"}
                </span>
              )}
            </div>
          </div>

          {/* ?„ê¸° ?´ìš© */}
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              ?„ê¸° ?´ìš© *
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="?œì„¤ ?´ìš© ê²½í—˜???ì„¸???‘ì„±?´ì£¼?¸ìš”. (ìµœì†Œ 10??"
              disabled={isSubmitting}
            />
            <div className="text-sm text-gray-500 mt-1">
              {comment.length}/500??
              {comment.length < 10 && comment.length > 0 && (
                <span className="text-red-500 ml-2">
                  ìµœì†Œ 10???´ìƒ ?‘ì„±?´ì£¼?¸ìš”
                </span>
              )}
            </div>
          </div>

          {/* ?‘ì„± ê°€?´ë“œ?¼ì¸ */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="text-sm text-blue-800 font-medium mb-2">?’¡ ?„ê¸° ?‘ì„± ??/div>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>???œì„¤??ì²?²°?? ?¸ì˜?? ?œë¹„???ˆì§ˆ???€??êµ¬ì²´?ìœ¼ë¡??‘ì„±?´ì£¼?¸ìš”</li>
              <li>??ê°œì¸?ì¸ ê²½í—˜ê³??ë? ?ì„ ?¬í•¨?˜ë©´ ?”ìš± ?„ì????©ë‹ˆ??/li>
              <li>??ë¶€?ì ˆ???´ìš©?´ë‚˜ ê°œì¸?•ë³´???¬í•¨?˜ì? ë§ˆì„¸??/li>
            </ul>
          </div>

          {/* ë²„íŠ¼ */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              ì·¨ì†Œ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "?‘ì„± ì¤?.." : existingReview ? "?˜ì •?˜ê¸°" : "?‘ì„±?˜ê¸°"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
