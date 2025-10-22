import React, { useState, useEffect } from "react";
import { FacilityReservationService } from "@/services/facilityReservationService";
import { Badge } from "@/components/common/Badge";
import { useToast } from "@/components/common/Toast";
import { ymd } from "@/lib/date";

// ?ˆì•½ ì·¨ì†Œ ?•ì¸ ëª¨ë‹¬
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
        <h3 className="text-lg font-semibold mb-4">?ˆì•½ ì·¨ì†Œ ?•ì¸</h3>
        <div className="space-y-3 mb-6">
          <p className="text-sm text-gray-600">
            <strong>{reservation.facilityName || "?œì„¤"}</strong>???ˆì•½??ì·¨ì†Œ?˜ì‹œê² ìŠµ?ˆê¹Œ?
          </p>
          <div className="text-xs text-gray-500">
            <p>???ˆì•½ ?œê°„: {startTime.toLocaleString("ko-KR")}</p>
            <p>??ì·¨ì†Œ ?•ì±…: ?œì‘ 30ë¶??„ê¹Œì§€ ë¬´ë£Œ ì·¨ì†Œ</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border hover:bg-gray-50"
          >
            ì·¨ì†Œ
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            ?ˆì•½ ì·¨ì†Œ
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

  // ?ˆì•½ ëª©ë¡ ë¡œë“œ (?¬ë¡¯ ?•ë³´ ?¬í•¨)
  const loadReservations = async () => {
    try {
      const data = await FacilityReservationService.getUserReservations();
      
      // ê°??ˆì•½???¬ë¡¯ ?•ë³´ ?¬í•¨
      const enrichedData = await Promise.all(
        data.map(async (reservation) => {
          const enriched = await FacilityReservationService.getReservationWithSlot(reservation.id);
          return enriched || reservation;
        })
      );
      
      setReservations(enrichedData);
    } catch (error) {
      console.error("?ˆì•½ ëª©ë¡ ë¡œë“œ ?¤íŒ¨:", error);
      toast("?ˆì•½ ëª©ë¡??ë¶ˆëŸ¬?¤ëŠ”???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
    } finally {
      setLoading(false);
    }
  };

  // ?ˆë¡œê³ ì¹¨
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReservations();
    setRefreshing(false);
    toast("?ˆì•½ ëª©ë¡???ˆë¡œê³ ì¹¨?˜ì—ˆ?µë‹ˆ??");
  };

  // ?ˆì•½ ì·¨ì†Œ
  const handleCancelReservation = async (reservation: any) => {
    setCancelModal({ open: true, reservation });
  };

  // ì·¨ì†Œ ?•ì¸
  const confirmCancel = async () => {
    if (!cancelModal.reservation) return;
    
    setCanceling(true);
    try {
      const result = await FacilityReservationService.cancelReservation(cancelModal.reservation.id);
      
      if (result.ok) {
        toast("?ˆì•½??ì·¨ì†Œ?˜ì—ˆ?µë‹ˆ??");
        setCancelModal({ open: false, reservation: null });
        // ëª©ë¡ ?ˆë¡œê³ ì¹¨
        await loadReservations();
      } else {
        toast(result.error || "ì·¨ì†Œ???¤íŒ¨?ˆìŠµ?ˆë‹¤.");
      }
    } catch (error) {
      console.error("ì·¨ì†Œ ì²˜ë¦¬ ?¤íŒ¨:", error);
      toast("ì·¨ì†Œ ì²˜ë¦¬ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    } finally {
      setCanceling(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  // ?ˆì•½ ?íƒœ???°ë¥¸ ë°°ì? ?‰ìƒ
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge text="?œì„±" tone="green" />;
      case "canceled": return <Badge text="ì·¨ì†Œ?? tone="red" />;
      case "cancelled": return <Badge text="ì·¨ì†Œ?? tone="red" />;
      case "completed": return <Badge text="?„ë£Œ" tone="blue" />;
      default: return <Badge text={status} tone="gray" />;
    }
  };

  // ?œê°„ ?¬ë§·??
  const formatDateTime = (date: any) => {
    if (!date) return "?œê°„ ë¯¸ì •";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString("ko-KR");
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-500">?ˆì•½ ëª©ë¡??ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* ?¤ë” */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">???ˆì•½</h1>
            <p className="text-gray-500 mt-2">?ˆì•½???œì„¤ê³??´ë²¤?¸ë? ?•ì¸?˜ì„¸??/p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl border hover:bg-gray-50 disabled:opacity-50"
          >
            {refreshing ? "?ˆë¡œê³ ì¹¨ ì¤?.." : "?ˆë¡œê³ ì¹¨"}
          </button>
        </div>
      </div>

      {/* ?ˆì•½ ëª©ë¡ */}
      {reservations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">?“…</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">?ˆì•½???†ìŠµ?ˆë‹¤</h3>
          <p className="text-gray-500">?„ì§ ?ˆì•½???œì„¤?´ë‚˜ ?´ë²¤?¸ê? ?†ìŠµ?ˆë‹¤.</p>
          <button
            onClick={() => window.history.back()}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          >
            ?œì„¤ ?˜ëŸ¬ë³´ê¸°
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
                      {reservation.facilityName || "?œì„¤ëª?ë¯¸ì •"}
                    </h3>
                    {getStatusBadge(reservation.status)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">?ˆì•½ ID:</span> {reservation.id}
                    </div>
                    <div>
                      <span className="font-medium">?ˆì•½??</span> {formatDateTime(reservation.createdAt)}
                    </div>
                    {reservation.slotInfo && (
                      <>
                        <div>
                          <span className="font-medium">? ì§œ:</span> {ymd(new Date(reservation.slotInfo.startAt))}
                        </div>
                        <div>
                          <span className="font-medium">?œê°„:</span> {formatDateTime(reservation.slotInfo.startAt)} - {formatDateTime(reservation.slotInfo.endAt)}
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
                          ?ˆì•½ ì·¨ì†Œ
                        </button>
                        <button className="px-4 py-2 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50">
                          ?ì„¸ ë³´ê¸°
                        </button>
                      </>
                    )}
                    {reservation.status === "canceled" && (
                      <span className="px-4 py-2 text-sm text-gray-500">
                        ì·¨ì†Œ??
                      </span>
                    )}
                    {reservation.status === "completed" && (
                      <button className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
                        ë¦¬ë·° ?‘ì„±
                      </button>
                    )}
                  </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ?¸í„° ?•ë³´ */}
      <div className="mt-12 p-6 rounded-2xl bg-gray-50 dark:bg-gray-800">
        <h3 className="font-medium mb-3">?ˆì•½ ê´€???ˆë‚´</h3>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
          <p>???ˆì•½ ì·¨ì†Œ???œì‘ ?œê°„ 30ë¶??„ê¹Œì§€ ê°€?¥í•©?ˆë‹¤.</p>
          <p>???¸ì‡¼ ??? ë¢°???ìˆ˜ê°€ ?˜ë½?????ˆìŠµ?ˆë‹¤.</p>
          <p>???ˆì•½ ë³€ê²½ì´??ë¬¸ì˜?¬í•­?€ ê³ ê°?¼í„°ë¥??´ìš©?´ì£¼?¸ìš”.</p>
        </div>
      </div>

      {/* ì·¨ì†Œ ?•ì¸ ëª¨ë‹¬ */}
      <CancelConfirmModal
        open={cancelModal.open}
        onClose={() => setCancelModal({ open: false, reservation: null })}
        onConfirm={confirmCancel}
        reservation={cancelModal.reservation}
      />
    </div>
  );
}
