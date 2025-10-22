import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRecommendedSlots } from "@/hooks/useRecommendedSlots";
import { SlotRecommendationScore } from "@/types/review";
import { formatDate, formatTime } from "@/lib/date";

interface RecommendedSlotsWidgetProps {
  facilityId?: string;
  maxSlots?: number;
  title?: string;
  showFilters?: boolean;
  onSlotSelect?: (slot: SlotRecommendationScore) => void;
}

export default function RecommendedSlotsWidget({
  facilityId,
  maxSlots = 5,
  title = "ì¶”ì²œ ?¬ë¡¯",
  showFilters = false,
  onSlotSelect
}: RecommendedSlotsWidgetProps) {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    maxPrice: undefined as number | undefined,
    minRating: undefined as number | undefined,
    preferredDays: [] as number[]
  });

  const { recommendedSlots, loading, error, refresh } = useRecommendedSlots({
    userId: user?.uid,
    facilityId,
    maxSlots,
    filters
  });

  const handleSlotClick = (slot: SlotRecommendationScore) => {
    if (onSlotSelect) {
      onSlotSelect(slot);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-gray-600";
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return "ë§¤ìš° ì¶”ì²œ";
    if (score >= 60) return "ì¶”ì²œ";
    if (score >= 40) return "ë³´í†µ";
    return "??Œ";
  };

  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm font-medium text-gray-700 mb-2">?„í„° ?µì…˜</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* ìµœë? ê°€ê²?*/}
          <div>
            <label className="block text-xs text-gray-600 mb-1">ìµœë? ê°€ê²?/label>
            <input
              type="number"
              placeholder="ê°€ê²??œí•œ ?†ìŒ"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              value={filters.maxPrice || ""}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                maxPrice: e.target.value ? parseInt(e.target.value) : undefined
              }))}
            />
          </div>

          {/* ìµœì†Œ ?‰ì  */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">ìµœì†Œ ?‰ì </label>
            <select
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              value={filters.minRating || ""}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                minRating: e.target.value ? parseFloat(e.target.value) : undefined
              }))}
            >
              <option value="">?‰ì  ?œí•œ ?†ìŒ</option>
              <option value="4.0">4.0 ?´ìƒ</option>
              <option value="3.5">3.5 ?´ìƒ</option>
              <option value="3.0">3.0 ?´ìƒ</option>
            </select>
          </div>

          {/* ? í˜¸ ?”ì¼ */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">? í˜¸ ?”ì¼</label>
            <div className="flex flex-wrap gap-1">
              {["??, "??, "??, "??, "ëª?, "ê¸?, "??].map((day, index) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    const newDays = filters.preferredDays.includes(index)
                      ? filters.preferredDays.filter(d => d !== index)
                      : [...filters.preferredDays, index];
                    setFilters(prev => ({ ...prev, preferredDays: newDays }));
                  }}
                  className={`px-2 py-1 text-xs rounded ${
                    filters.preferredDays.includes(index)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="text-center text-gray-500">
          ë¡œê·¸?¸í•˜ë©?ë§ì¶¤ ì¶”ì²œ ?¬ë¡¯??ë°›ì„ ???ˆìŠµ?ˆë‹¤.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          {loading ? "?ˆë¡œê³ ì¹¨ ì¤?.." : "?ˆë¡œê³ ì¹¨"}
        </button>
      </div>

      {renderFilters()}

      {error && (
        <div className="text-red-600 text-sm mb-4">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: maxSlots }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : recommendedSlots.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">?¯</div>
          <div className="text-sm">ì¶”ì²œ???¬ë¡¯???†ìŠµ?ˆë‹¤.</div>
          <div className="text-xs text-gray-400 mt-1">
            ??ë§ì? ?ˆì•½???˜ë©´ ë§ì¶¤ ì¶”ì²œ??ë°›ì„ ???ˆìŠµ?ˆë‹¤.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendedSlots.map((slot) => (
            <div
              key={slot.slotId}
              onClick={() => handleSlotClick(slot)}
              className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                onSlotSelect ? "hover:border-blue-300" : ""
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="font-medium text-gray-800 mb-1">
                    {slot.facility.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDate(slot.slot.startAt)} {formatTime(slot.slot.startAt)} - {formatTime(slot.slot.endAt)}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-lg font-bold ${getScoreColor(slot.score)}`}>
                    {slot.score}??
                  </div>
                  <div className="text-xs text-gray-500">
                    {getScoreLabel(slot.score)}
                  </div>
                </div>
              </div>

              {/* ?ìˆ˜ ?¸ë??¬í•­ */}
              <div className="grid grid-cols-5 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-medium text-blue-600">{slot.factors.timePreference.toFixed(1)}</div>
                  <div className="text-gray-500">?œê°„</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-green-600">{slot.factors.facilityRating.toFixed(1)}</div>
                  <div className="text-gray-500">?‰ì </div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-purple-600">{slot.factors.popularity.toFixed(1)}</div>
                  <div className="text-gray-500">?¸ê¸°</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-orange-600">{slot.factors.urgency.toFixed(1)}</div>
                  <div className="text-gray-500">?„ë°•</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-red-600">{slot.factors.availability.toFixed(1)}</div>
                  <div className="text-gray-500">ê°€??/div>
                </div>
              </div>

              {/* ì¶”ê? ?•ë³´ */}
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>â­?{slot.facility.avgRating.toFixed(1)} ({slot.facility.reviewCount}ê°??„ê¸°)</span>
                  <span>?‘¥ {slot.slot.reserved}/{slot.slot.capacity}</span>
                  {slot.slot.price && <span>?’° {slot.slot.price.toLocaleString()}??/span>}
                </div>
                
                {onSlotSelect && (
                  <button className="text-xs text-blue-600 hover:text-blue-800">
                    ? íƒ?˜ê¸° ??
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ì¶”ì²œ ?Œê³ ë¦¬ì¦˜ ?¤ëª… */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-xs text-blue-800">
          <div className="font-medium mb-1">?’¡ ì¶”ì²œ ?ìˆ˜ ê³„ì‚° ë°©ë²•</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>???œê°„ ? í˜¸?? ?¬ìš©???´ìš© ?¨í„´ ë¶„ì„</div>
            <div>???œì„¤ ?‰ì : ?„ê¸° ê¸°ë°˜ ?‰ì </div>
            <div>???¸ê¸°?? ?ˆì•½ë¥?ê¸°ë°˜</div>
            <div>???„ë°•?? ?œì‘ ?œê°„ê¹Œì? ?¨ì? ?œê°„</div>
            <div>??ê°€?©ì„±: ?”ì—¬ ì¢Œì„ ??/div>
          </div>
        </div>
      </div>
    </div>
  );
}
