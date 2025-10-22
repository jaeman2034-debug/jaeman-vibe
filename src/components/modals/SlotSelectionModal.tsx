import React, { useState, useEffect } from "react";
import { FacilityReservationService } from "@/services/facilityReservationService";
import { useToast } from "@/components/common/Toast";
import { Badge } from "@/components/common/Badge";
import { ymd, addDays } from "@/lib/date";
import type { FacilitySlot } from "@/types/facility";

interface SlotSelectionModalProps {
  open: boolean;
  onClose: () => void;
  facilityId: string;
  facilityName: string;
}

export default function SlotSelectionModal({
  open,
  onClose,
  facilityId,
  facilityName
}: SlotSelectionModalProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState<FacilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const toast = useToast();

  // 날짜별 슬롯 조회
  useEffect(() => {
    if (!open) return;
    
    const loadSlots = async () => {
      setLoading(true);
      try {
        const dateKey = ymd(selectedDate);
        const slotsData = await FacilityReservationService.getFacilitySlots(facilityId, dateKey);
        setSlots(slotsData);
      } catch (error) {
        console.error("슬롯 조회 실패:", error);
        toast("슬롯 정보를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadSlots();
  }, [open, facilityId, selectedDate, toast]);

  // 날짜 변경
  const changeDate = (direction: "prev" | "next") => {
    setSelectedDate(prev => addDays(prev, direction === "next" ? 1 : -1));
  };

  // 슬롯 예약
  const handleBookSlot = async (slot: FacilitySlot) => {
    setBooking(true);
    try {
      const result = await FacilityReservationService.createReservation({
        facilityId,
        slotId: slot.id
      });

      if (result.ok) {
        toast("예약이 완료되었습니다!");
        onClose();
        // 슬롯 목록 새로고침
        const dateKey = ymd(selectedDate);
        const updatedSlots = await FacilityReservationService.getFacilitySlots(facilityId, dateKey);
        setSlots(updatedSlots);
      } else {
        toast(result.error || "예약에 실패했습니다.");
      }
    } catch (error) {
      console.error("예약 실패:", error);
      toast("예약 처리 중 오류가 발생했습니다.");
    } finally {
      setBooking(false);
    }
  };

  // 시간 포맷팅
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  };

  // 슬롯 상태에 따른 스타일
  const getSlotStyle = (slot: FacilitySlot) => {
    const remaining = slot.capacity - slot.reserved;
    if (remaining <= 0) return "opacity-50 cursor-not-allowed";
    if (remaining <= 2) return "border-orange-300 bg-orange-50";
    return "border-green-300 bg-green-50 hover:bg-green-100";
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-neutral-900 shadow-lg max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold">{facilityName}</h2>
            <p className="text-sm text-gray-500">슬롯 선택 및 예약</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* 날짜 선택 */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeDate("prev")}
              className="px-3 py-2 rounded-lg border hover:bg-gray-50"
            >
              ← 이전
            </button>
            <div className="text-lg font-medium">
              {selectedDate.toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
                weekday: "long"
              })}
            </div>
            <button
              onClick={() => changeDate("next")}
              className="px-3 py-2 rounded-lg border hover:bg-gray-50"
            >
              다음 →
            </button>
          </div>
        </div>

        {/* 슬롯 목록 */}
        <div className="p-6 overflow-y-auto max-h-96">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-500">슬롯을 불러오는 중...</p>
            </div>
          ) : slots.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">해당 날짜에 예약 가능한 슬롯이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {slots.map((slot) => {
                const remaining = slot.capacity - slot.reserved;
                const startTime = slot.startAt instanceof Date ? slot.startAt : new Date(slot.startAt);
                const endTime = slot.endAt instanceof Date ? slot.endAt : new Date(slot.endAt);
                
                return (
                  <div
                    key={slot.id}
                    className={`p-4 rounded-xl border-2 ${getSlotStyle(slot)} transition-all`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium">
                            {formatTime(startTime)} - {formatTime(endTime)}
                          </span>
                          <Badge 
                            text={`${remaining}/${slot.capacity}명`} 
                            tone={remaining <= 2 ? "amber" : "green"} 
                          />
                          {slot.price && (
                            <Badge text={`₩${slot.price.toLocaleString()}`} tone="blue" />
                          )}
                        </div>
                        {remaining <= 0 && (
                          <p className="text-sm text-red-600">예약 마감</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleBookSlot(slot)}
                        disabled={remaining <= 0 || booking}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          remaining <= 0
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {booking ? "예약 중..." : "예약하기"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>• 예약은 시작 시간 5분 전까지 가능합니다.</p>
            <p>• 중복 예약은 불가능합니다.</p>
            <p>• 예약 변경/취소는 고객센터를 이용해주세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
}