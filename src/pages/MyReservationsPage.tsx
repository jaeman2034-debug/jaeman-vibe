import React, { useState, useEffect } from "react";
import { FacilityReservationService } from "@/services/facilityReservationService";
import { Badge } from "@/components/common/Badge";
import { useToast } from "@/components/common/Toast";
import { ymd } from "@/lib/date";

// ?�약 취소 ?�인 모달
function CancelConfirmModal({ 
  open, 
  onClose, 
  onConfirm, 
  reservation 
}: { 
  open: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  reservation: any; 
}) {
  if (!open || !reservation) return null;

  const startTime = reservation.slotInfo?.startAt?.toDate ? 
    reservation.slotInfo.startAt.toDate() : 
    new Date(reservation.slotInfo?.startAt);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">?�약 취소 ?�인</h3>
        <div className="space-y-3 mb-6">
          <p className="text-sm text-gray-600">
            <strong>{reservation.facilityName || "?�설"}</strong>???�약??취소?�시겠습?�까?
          </p>
          <div className="text-xs text-gray-500">
            <p>???�약 ?�간: {startTime.toLocaleString("ko-KR")}</p>
            <p>??취소 ?�책: ?�작 30�??�까지 무료 취소</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            ?�약 취소
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelModal, setCancelModal] = useState<{ open: boolean; reservation: any }>({ open: false, reservation: null });
  const [canceling, setCanceling] = useState(false);
  const toast = useToast();

  // ?�약 목록 로드 (?�롯 ?�보 ?�함)
  const loadReservations = async () => {
    try {
      const data = await FacilityReservationService.getUserReservations();
      
      // �??�약???�롯 ?�보 ?�함
      const enrichedData = await Promise.all(
        data.map(async (reservation) => {
          const enriched = await FacilityReservationService.getReservationWithSlot(reservation.id);
          return enriched || reservation;
        })
      );
      
      setReservations(enrichedData);
    } catch (error) {
      console.error("?�약 목록 로드 ?�패:", error);
      toast("?�약 목록??불러?�는???�패?�습?�다.");
    } finally {
      setLoading(false);
    }
  };

  // ?�로고침
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReservations();
    setRefreshing(false);
    toast("?�약 목록???�로고침?�었?�니??");
  };

  // ?�약 취소
  const handleCancelReservation = async (reservation: any) => {
    setCancelModal({ open: true, reservation });
  };

  // 취소 ?�인
  const confirmCancel = async () => {
    if (!cancelModal.reservation) return;
    
    setCanceling(true);
    try {
      const result = await FacilityReservationService.cancelReservation(cancelModal.reservation.id);
      
      if (result.ok) {
        toast("?�약??취소?�었?�니??");
        setCancelModal({ open: false, reservation: null });
        // 목록 ?�로고침
        await loadReservations();
      } else {
        toast(result.error || "취소???�패?�습?�다.");
      }
    } catch (error) {
      console.error("취소 처리 ?�패:", error);
      toast("취소 처리 �??�류가 발생?�습?�다.");
    } finally {
      setCanceling(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  // ?�약 ?�태???�른 배�? ?�상
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge text="?�성" tone="green" />;
      case "canceled": return <Badge text="취소?? tone="red" />;
      case "cancelled": return <Badge text="취소?? tone="red" />;
      case "completed": return <Badge text="?�료" tone="blue" />;
      default: return <Badge text={status} tone="gray" />;
    }
  };

  // ?�간 ?�맷??
  const formatDateTime = (date: any) => {
    if (!date) return "?�간 미정";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString("ko-KR");
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-500">?�약 목록??불러?�는 �?..</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* ?�더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">???�약</h1>
            <p className="text-gray-500 mt-2">?�약???�설�??�벤?��? ?�인?�세??/p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-50"
          >
            {refreshing ? "?�로고침 �?.." : "?�로고침"}
          </button>
        </div>
      </div>

      {/* ?�약 목록 */}
      {reservations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">?��</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">?�약???�습?�다</h3>
          <p className="text-gray-500">?�직 ?�약???�설?�나 ?�벤?��? ?�습?�다.</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          >
            ?�설 ?�러보기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation) => (
            <div
              key={reservation.id}
              className="p-6 rounded-2xl border bg-white/70 dark:bg-white/10 border-gray-200/70 dark:border-white/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-medium">
                      {reservation.facilityName || "?�설�?미정"}
                    </h3>
                    {getStatusBadge(reservation.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">?�약 ID:</span> {reservation.id}
                    </div>
                    <div>
                      <span className="font-medium">?�약??</span> {formatDateTime(reservation.createdAt)}
                    </div>
                    {reservation.slotInfo && (
                      <>
                        <div>
                          <span className="font-medium">?�짜:</span> {ymd(new Date(reservation.slotInfo.startAt))}
                        </div>
                        <div>
                          <span className="font-medium">?�간:</span> {formatDateTime(reservation.slotInfo.startAt)} - {formatDateTime(reservation.slotInfo.endAt)}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                                  <div className="flex flex-col gap-2">
                    {reservation.status === "active" && (
                      <>
                        <button 
                          onClick={() => handleCancelReservation(reservation)}
                          className="px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                        >
                          ?�약 취소
                        </button>
                        <button className="px-4 py-2 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50">
                          ?�세 보기
                        </button>
                      </>
                    )}
                    {reservation.status === "canceled" && (
                      <span className="px-4 py-2 text-sm text-gray-500">
                        취소??
                      </span>
                    )}
                    {reservation.status === "completed" && (
                      <button className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
                        리뷰 ?�성
                      </button>
                    )}
                  </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ?�터 ?�보 */}
      <div className="mt-12 p-6 rounded-2xl bg-gray-50 dark:bg-gray-800">
        <h3 className="font-medium mb-3">?�약 관???�내</h3>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p>???�약 취소???�작 ?�간 30�??�까지 가?�합?�다.</p>
          <p>???�쇼 ???�뢰???�수가 ?�락?????�습?�다.</p>
          <p>???�약 변경이??문의?�항?� 고객?�터�??�용?�주?�요.</p>
        </div>
      </div>

      {/* 취소 ?�인 모달 */}
      <CancelConfirmModal
        open={cancelModal.open}
        onClose={() => setCancelModal({ open: false, reservation: null })}
        onConfirm={confirmCancel}
        reservation={cancelModal.reservation}
      />
    </div>
  );
}
