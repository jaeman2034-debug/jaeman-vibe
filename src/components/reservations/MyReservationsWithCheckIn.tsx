import React, { useState, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "@/lib/firebase"; // ???�일 진입???�용
import { useToast } from "@/components/common/Toast";
import { getReservationStatusBadge } from "@/lib/reservationStatus";
import { ymd } from "@/lib/date";

const functions = getFunctions();

interface Reservation {
  id: string;
  facilityId: string;
  slotId: string;
  userId: string;
  status: "active" | "canceled" | "no_show" | "attended";
  createdAt: any;
  slot?: {
    startAt: any;
    endAt: any;
    facilityName?: string;
  };
}

// ?�약 목록 ??
function useMyReservations(userId: string | undefined) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setReservations([]);
      setLoading(false);
      return;
    }

    const loadReservations = async () => {
      try {
        // ?�제 구현?�서??FacilityReservationService.getUserReservations() ?�용
        // ?�기?�는 ?�시 ?�이?�로 ?��?
        const mockReservations: Reservation[] = [
          {
            id: "resv1",
            facilityId: "facility1",
            slotId: "slot1",
            userId,
            status: "active",
            createdAt: new Date(),
            slot: {
              startAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2?�간 ??
              endAt: new Date(Date.now() + 3 * 60 * 60 * 1000),   // 3?�간 ??
              facilityName: "축구??A"
            }
          },
          {
            id: "resv2",
            facilityId: "facility2",
            slotId: "slot2",
            userId,
            status: "canceled",
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1????
            slot: {
              startAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
              endAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
              facilityName: "?�니?�장 B"
            }
          }
        ];
        
        setReservations(mockReservations);
      } catch (error) {
        console.error("?�약 목록 로드 ?�패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReservations();
  }, [userId]);

  return { reservations, loading };
}

export default function MyReservationsWithCheckIn() {
  const userId = auth.currentUser?.uid;
  const { reservations, loading } = useMyReservations(userId);
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();

  // ?�약 취소
  async function handleCancel(r: Reservation) {
    try {
      setBusy(r.id);
      const cancelReservationFn = httpsCallable(functions, 'cancelReservationFn');
      await cancelReservationFn({ reservationId: r.id });
      toast('?�약 취소 ?�료');
      
      // 목록 ?�로고침 (?�제로는 ?�태 ?�데?�트)
      window.location.reload();
    } catch (e: any) {
      console.error("취소 ?�패:", e);
      toast(`취소 ?�패: ${e?.message || '?????�는 ?�류'}`);
    } finally {
      setBusy(null);
    }
  }

  // 체크??
  async function handleCheckIn(r: Reservation) {
    try {
      setBusy(r.id);
      const checkInReservationFn = httpsCallable(functions, 'checkInReservationFn');
      await checkInReservationFn({ reservationId: r.id });
      toast('체크???�료');
      
      // 목록 ?�로고침 (?�제로는 ?�태 ?�데?�트)
      window.location.reload();
    } catch (e: any) {
      console.error("체크???�패:", e);
      let errorMessage = "체크???�패";
      
      if (e?.code === "functions/failed-precondition") {
        if (e?.message === "CHECKIN_WINDOW") {
          errorMessage = "체크???�간???�닙?�다 (?�작 10�???~ 종료 15�???";
        } else if (e?.message === "NOT_ACTIVE") {
          errorMessage = "?�성 ?�약???�닙?�다";
        }
      } else if (e?.code === "functions/permission-denied") {
        errorMessage = "권한???�습?�다";
      } else if (e?.code === "functions/not-found") {
        errorMessage = "?�약??찾을 ???�습?�다";
      }
      
      toast(errorMessage);
    } finally {
      setBusy(null);
    }
  }

  // ?�태�?뱃�? ?�더�?
  const renderStatusBadge = (status: Reservation['status']) => {
    return getReservationStatusBadge(status);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500">로딩 �?..</div>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500">?�약 ?�역???�습?�다</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">???�약</h2>
        <div className="text-sm text-gray-500">
          �?{reservations.length}�?
        </div>
      </div>

      {/* 체크???�내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="text-sm text-blue-800">
          ?�� <strong>체크???�내:</strong> ?�약 ?�작 10�??��???종료 15�??�까지 체크?�할 ???�습?�다.
        </div>
      </div>

      {reservations.map(r => (
        <div key={r.id} className="border rounded-lg p-4 space-y-3">
          {/* ?�태 �?기본 ?�보 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {renderStatusBadge(r.status)}
              <div className="text-sm font-medium text-gray-900">
                {r.slot?.facilityName || `?�설 ${r.facilityId}`}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString("ko-KR") : "?�짜 ?�보 ?�음"}
            </div>
          </div>

          {/* ?�롯 ?�보 */}
          {r.slot && (
            <div className="text-sm text-gray-600">
              <div>?�간: {r.slot.startAt?.toDate ? 
                r.slot.startAt.toDate().toLocaleString("ko-KR") : 
                "?�간 ?�보 ?�음"} ~ {r.slot.endAt?.toDate ? 
                r.slot.endAt.toDate().toLocaleString("ko-KR") : 
                "?�간 ?�보 ?�음"}</div>
              <div>?�롯 ID: {r.slotId}</div>
            </div>
          )}

          {/* ?�션 버튼 */}
          <div className="flex items-center gap-2 pt-2">
            {r.status === 'active' && (
              <>
                <button 
                  disabled={busy === r.id} 
                  onClick={() => handleCheckIn(r)} 
                  className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {busy === r.id ? '체크??�?..' : '체크??}
                </button>
                <button 
                  disabled={busy === r.id} 
                  onClick={() => handleCancel(r)} 
                  className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {busy === r.id ? '취소 �?..' : '취소'}
                </button>
              </>
            )}
            {r.status === 'canceled' && (
              <span className="text-sm text-gray-500">취소???�약?�니??/span>
            )}
            {r.status === 'no_show' && (
              <span className="text-sm text-red-500">?�쇼�?처리?�었?�니??/span>
            )}
            {r.status === 'attended' && (
              <span className="text-sm text-green-500">출석 ?�료</span>
            )}
          </div>
        </div>
      ))}

      {/* 추�? ?�내 */}
      <div className="text-xs text-gray-500 text-center">
        ?�약 취소???�작 30�??�까지 가?�합?�다
      </div>
    </div>
  );
}
