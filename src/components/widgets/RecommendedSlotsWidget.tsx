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
  title = "추천 ?�롯",
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
    if (score >= 80) return "매우 추천";
    if (score >= 60) return "추천";
    if (score >= 40) return "보통";
    return "??��";
  };

  const renderFilters = () => {
    if (!showFilters) return null;

    return (
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm font-medium text-gray-700 mb-2">?�터 ?�션</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 최�? 가�?*/}
          <div>
            <label className="block text-xs text-gray-600 mb-1">최�? 가�?/label>
            <input
              type="number"
              placeholder="가�??�한 ?�음"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              value={filters.maxPrice || ""}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                maxPrice: e.target.value ? parseInt(e.target.value) : undefined
              }))}
            />
          </div>

          {/* 최소 ?�점 */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">최소 ?�점</label>
            <select
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              value={filters.minRating || ""}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                minRating: e.target.value ? parseFloat(e.target.value) : undefined
              }))}
            >
              <option value="">?�점 ?�한 ?�음</option>
              <option value="4.0">4.0 ?�상</option>
              <option value="3.5">3.5 ?�상</option>
              <option value="3.0">3.0 ?�상</option>
            </select>
          </div>

          {/* ?�호 ?�일 */}
          <div>
            <label className="block text-xs text-gray-600 mb-1">?�호 ?�일</label>
            <div className="flex flex-wrap gap-1">
              {["??, "??, "??, "??, "�?, "�?, "??].map((day, index) => (
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
          로그?�하�?맞춤 추천 ?�롯??받을 ???�습?�다.
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
          {loading ? "?�로고침 �?.." : "?�로고침"}
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
          <div className="text-4xl mb-2">?��</div>
          <div className="text-sm">추천???�롯???�습?�다.</div>
          <div className="text-xs text-gray-400 mt-1">
            ??많�? ?�약???�면 맞춤 추천??받을 ???�습?�다.
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

              {/* ?�수 ?��??�항 */}
              <div className="grid grid-cols-5 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-medium text-blue-600">{slot.factors.timePreference.toFixed(1)}</div>
                  <div className="text-gray-500">?�간</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-green-600">{slot.factors.facilityRating.toFixed(1)}</div>
                  <div className="text-gray-500">?�점</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-purple-600">{slot.factors.popularity.toFixed(1)}</div>
                  <div className="text-gray-500">?�기</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-orange-600">{slot.factors.urgency.toFixed(1)}</div>
                  <div className="text-gray-500">?�박</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-red-600">{slot.factors.availability.toFixed(1)}</div>
                  <div className="text-gray-500">가??/div>
                </div>
              </div>

              {/* 추�? ?�보 */}
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>�?{slot.facility.avgRating.toFixed(1)} ({slot.facility.reviewCount}�??�기)</span>
                  <span>?�� {slot.slot.reserved}/{slot.slot.capacity}</span>
                  {slot.slot.price && <span>?�� {slot.slot.price.toLocaleString()}??/span>}
                </div>
                
                {onSlotSelect && (
                  <button className="text-xs text-blue-600 hover:text-blue-800">
                    ?�택?�기 ??
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 추천 ?�고리즘 ?�명 */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-xs text-blue-800">
          <div className="font-medium mb-1">?�� 추천 ?�수 계산 방법</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>???�간 ?�호?? ?�용???�용 ?�턴 분석</div>
            <div>???�설 ?�점: ?�기 기반 ?�점</div>
            <div>???�기?? ?�약�?기반</div>
            <div>???�박?? ?�작 ?�간까�? ?��? ?�간</div>
            <div>??가?�성: ?�여 좌석 ??/div>
          </div>
        </div>
      </div>
    </div>
  );
}
