import React, { useState, useEffect } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { auth } from "@/lib/firebase"; // ???¨ì¼ ì§„ì…???¬ìš©
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

// ?ˆì•½ ëª©ë¡ ??
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
        // ?¤ì œ êµ¬í˜„?ì„œ??FacilityReservationService.getUserReservations() ?¬ìš©
        // ?¬ê¸°?œëŠ” ?ˆì‹œ ?°ì´?°ë¡œ ?€ì²?
        const mockReservations: Reservation[] = [
          {
            id: "resv1",
            facilityId: "facility1",
            slotId: "slot1",
            userId,
            status: "active",
            createdAt: new Date(),
            slot: {
              startAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2?œê°„ ??
              endAt: new Date(Date.now() + 3 * 60 * 60 * 1000),   // 3?œê°„ ??
              facilityName: "ì¶•êµ¬??A"
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
              facilityName: "?Œë‹ˆ?¤ì¥ B"
            }
          }
        ];
        
        setReservations(mockReservations);
      } catch (error) {
        console.error("?ˆì•½ ëª©ë¡ ë¡œë“œ ?¤íŒ¨:", error);
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

  // ?ˆì•½ ì·¨ì†Œ
  async function handleCancel(r: Reservation) {
    try {
      setBusy(r.id);
      const cancelReservationFn = httpsCallable(functions, 'cancelReservationFn');
      await cancelReservationFn({ reservationId: r.id });
      toast('?ˆì•½ ì·¨ì†Œ ?„ë£Œ');
      
      // ëª©ë¡ ?ˆë¡œê³ ì¹¨ (?¤ì œë¡œëŠ” ?íƒœ ?…ë°?´íŠ¸)
      window.location.reload();
    } catch (e: any) {
      console.error("ì·¨ì†Œ ?¤íŒ¨:", e);
      toast(`ì·¨ì†Œ ?¤íŒ¨: ${e?.message || '?????†ëŠ” ?¤ë¥˜'}`);
    } finally {
      setBusy(null);
    }
  }

  // ì²´í¬??
  async function handleCheckIn(r: Reservation) {
    try {
      setBusy(r.id);
      const checkInReservationFn = httpsCallable(functions, 'checkInReservationFn');
      await checkInReservationFn({ reservationId: r.id });
      toast('ì²´í¬???„ë£Œ');
      
      // ëª©ë¡ ?ˆë¡œê³ ì¹¨ (?¤ì œë¡œëŠ” ?íƒœ ?…ë°?´íŠ¸)
      window.location.reload();
    } catch (e: any) {
      console.error("ì²´í¬???¤íŒ¨:", e);
      let errorMessage = "ì²´í¬???¤íŒ¨";
      
      if (e?.code === "functions/failed-precondition") {
        if (e?.message === "CHECKIN_WINDOW") {
          errorMessage = "ì²´í¬???œê°„???„ë‹™?ˆë‹¤ (?œì‘ 10ë¶???~ ì¢…ë£Œ 15ë¶???";
        } else if (e?.message === "NOT_ACTIVE") {
          errorMessage = "?œì„± ?ˆì•½???„ë‹™?ˆë‹¤";
        }
      } else if (e?.code === "functions/permission-denied") {
        errorMessage = "ê¶Œí•œ???†ìŠµ?ˆë‹¤";
      } else if (e?.code === "functions/not-found") {
        errorMessage = "?ˆì•½??ì°¾ì„ ???†ìŠµ?ˆë‹¤";
      }
      
      toast(errorMessage);
    } finally {
      setBusy(null);
    }
  }

  // ?íƒœë³?ë±ƒì? ?Œë”ë§?
  const renderStatusBadge = (status: Reservation['status']) => {
    return getReservationStatusBadge(status);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500">ë¡œë”© ì¤?..</div>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center text-gray-500">?ˆì•½ ?´ì—­???†ìŠµ?ˆë‹¤</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">???ˆì•½</h2>
        <div className="text-sm text-gray-500">
          ì´?{reservations.length}ê±?
        </div>
      </div>

      {/* ì²´í¬???ˆë‚´ */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="text-sm text-blue-800">
          ?’¡ <strong>ì²´í¬???ˆë‚´:</strong> ?ˆì•½ ?œì‘ 10ë¶??„ë???ì¢…ë£Œ 15ë¶??„ê¹Œì§€ ì²´í¬?¸í•  ???ˆìŠµ?ˆë‹¤.
        </div>
      </div>

      {reservations.map(r => (
        <div key={r.id} className="border rounded-lg p-4 space-y-3">
          {/* ?íƒœ ë°?ê¸°ë³¸ ?•ë³´ */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {renderStatusBadge(r.status)}
              <div className="text-sm font-medium text-gray-900">
                {r.slot?.facilityName || `?œì„¤ ${r.facilityId}`}
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString("ko-KR") : "? ì§œ ?•ë³´ ?†ìŒ"}
            </div>
          </div>

          {/* ?¬ë¡¯ ?•ë³´ */}
          {r.slot && (
            <div className="text-sm text-gray-600">
              <div>?œê°„: {r.slot.startAt?.toDate ? 
                r.slot.startAt.toDate().toLocaleString("ko-KR") : 
                "?œê°„ ?•ë³´ ?†ìŒ"} ~ {r.slot.endAt?.toDate ? 
                r.slot.endAt.toDate().toLocaleString("ko-KR") : 
                "?œê°„ ?•ë³´ ?†ìŒ"}</div>
              <div>?¬ë¡¯ ID: {r.slotId}</div>
            </div>
          )}

          {/* ?¡ì…˜ ë²„íŠ¼ */}
          <div className="flex items-center gap-2 pt-2">
            {r.status === 'active' && (
              <>
                <button 
                  disabled={busy === r.id} 
                  onClick={() => handleCheckIn(r)} 
                  className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {busy === r.id ? 'ì²´í¬??ì¤?..' : 'ì²´í¬??}
                </button>
                <button 
                  disabled={busy === r.id} 
                  onClick={() => handleCancel(r)} 
                  className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {busy === r.id ? 'ì·¨ì†Œ ì¤?..' : 'ì·¨ì†Œ'}
                </button>
              </>
            )}
            {r.status === 'canceled' && (
              <span className="text-sm text-gray-500">ì·¨ì†Œ???ˆì•½?…ë‹ˆ??/span>
            )}
            {r.status === 'no_show' && (
              <span className="text-sm text-red-500">?¸ì‡¼ë¡?ì²˜ë¦¬?˜ì—ˆ?µë‹ˆ??/span>
            )}
            {r.status === 'attended' && (
              <span className="text-sm text-green-500">ì¶œì„ ?„ë£Œ</span>
            )}
          </div>
        </div>
      ))}

      {/* ì¶”ê? ?ˆë‚´ */}
      <div className="text-xs text-gray-500 text-center">
        ?ˆì•½ ì·¨ì†Œ???œì‘ 30ë¶??„ê¹Œì§€ ê°€?¥í•©?ˆë‹¤
      </div>
    </div>
  );
}
