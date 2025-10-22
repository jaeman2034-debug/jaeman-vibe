import React, { useState, useEffect } from "react";
import { getFirestore, collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useToast } from "@/components/common/Toast";

const db = getFirestore();
const functions = getFunctions();

interface Slot {
  id: string;
  facilityId: string;
  dateKey: string;
  startAt: Timestamp;
  endAt: Timestamp;
  capacity: number;
  reserved: number;
  status: string;
}

interface Reservation {
  id: string;
  facilityId: string;
  slotId: string;
  userId: string;
  status: string;
  createdAt: Timestamp;
}

export default function AdminSlotDashboard() {
  const [facilityId, setFacilityId] = useState("");
  const [dateKey, setDateKey] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [resvRows, setResvRows] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();

  // ?�롯 목록 로드
  const loadSlots = async () => {
    if (!facilityId || !dateKey) return;
    
    setLoading(true);
    try {
      const slotsQuery = query(
        collection(db, "facility_slots"),
        where("facilityId", "==", facilityId),
        where("dateKey", "==", dateKey),
        orderBy("startAt", "asc")
      );
      
      const snapshot = await getDocs(slotsQuery);
      const slotsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Slot[];
      
      setSlots(slotsData);
      setSelectedSlot(null);
      setResvRows([]);
    } catch (error) {
      console.error("?�롯 로드 ?�패:", error);
      toast("?�롯 ?�보�?불러?�는???�패?�습?�다.");
    } finally {
      setLoading(false);
    }
  };

  // ?�약 목록 로드
  const loadReservations = async (slotId: string) => {
    try {
      const resvQuery = query(
        collection(db, "reservations"),
        where("slotId", "==", slotId),
        orderBy("createdAt", "desc")
      );
      
      const snapshot = await getDocs(resvQuery);
      const resvData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reservation[];
      
      setResvRows(resvData);
    } catch (error) {
      console.error("?�약 목록 로드 ?�패:", error);
      toast("?�약 ?�보�?불러?�는???�패?�습?�다.");
    }
  };

  // ?�롯 ?�택 ???�약 목록 로드
  useEffect(() => {
    if (selectedSlot) {
      loadReservations(selectedSlot.id);
    }
  }, [selectedSlot]);

  // 체크??처리 (참석/?�쇼)
  const markAttendance = async (reservationId: string, status: 'attended' | 'no_show') => {
    if (!confirm(`?�약??${status === 'attended' ? '참석' : '?�쇼'}?�로 처리?�시겠습?�까?`)) return;
    
    setBusy(reservationId);
    try {
      const markAttendanceFn = httpsCallable(functions, 'markAttendanceFn');
      await markAttendanceFn({ reservationId, status });
      
      toast(`?�약??${status === 'attended' ? '참석' : '?�쇼'}?�로 처리?�었?�니??`);
      
      // 목록 ?�로고침
      if (selectedSlot) {
        await loadReservations(selectedSlot.id);
        await loadSlots(); // ?�롯 ?�보???�로고침
      }
    } catch (error: any) {
      console.error("체크??처리 ?�패:", error);
      let errorMessage = "체크??처리???�패?�습?�다.";
      
      if (error.code === "functions/permission-denied") {
        errorMessage = "관리자 권한???�요?�니??";
      } else if (error.code === "functions/not-found") {
        errorMessage = "?�약??찾을 ???�습?�다.";
      }
      
      toast(errorMessage);
    } finally {
      setBusy(null);
    }
  };

  // 관리자 강제 취소
  const adminCancel = async (reservation: Reservation) => {
    if (!confirm(`?�약??${reservation.userId}???�약??강제 취소?�시겠습?�까?`)) return;
    
    setBusy(reservation.id);
    try {
      const adminCancelFn = httpsCallable(functions, 'adminCancelReservationFn');
      await adminCancelFn({ 
        reservationId: reservation.id, 
        reason: "관리자 강제 취소" 
      });
      
      toast("?�약??강제 취소?�었?�니??");
      
      // 목록 ?�로고침
      if (selectedSlot) {
        await loadReservations(selectedSlot.id);
        await loadSlots(); // ?�롯 ?�보???�로고침
      }
    } catch (error: any) {
      console.error("강제 취소 ?�패:", error);
      let errorMessage = "강제 취소???�패?�습?�다.";
      
      if (error.code === "functions/permission-denied") {
        errorMessage = "관리자 권한???�요?�니??";
      } else if (error.code === "functions/not-found") {
        errorMessage = "?�약??찾을 ???�습?�다.";
      }
      
      toast(errorMessage);
    } finally {
      setBusy(null);
    }
  };

  // QR 체크???�스???�성
  const generateQrPoster = async (slotId: string) => {
    try {
      setBusy(slotId);
      const genSlotQrPngFn = httpsCallable(functions, 'genSlotQrPngFn');
      const result = await genSlotQrPngFn({ slotId, expiryMinutes: 60 });
      
      const { posterUrl } = result.data as any;
      
      // ????��???�스???�기
      window.open(posterUrl, '_blank');
      
      toast("QR 체크???�스?��? ?�성?�었?�니?? ????��???�인?�세??");
    } catch (error: any) {
      console.error("QR ?�스???�성 ?�패:", error);
      toast("QR ?�스???�성???�패?�습?�다");
    } finally {
      setBusy(null);
    }
  };

  // ?�짜 변�????�동 로드
  useEffect(() => {
    if (facilityId && dateKey) {
      loadSlots();
    }
  }, [facilityId, dateKey]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">관리자 ?�롯 ?�?�보??/h1>
        <p className="text-gray-500 mt-2">?�설 ?�롯�??�약 ?�황??관리하?�요</p>
      </div>

      {/* 검??조건 */}
      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm w-24">Facility ID</label>
          <input 
            className="border rounded px-3 py-2 w-full" 
            value={facilityId} 
            onChange={(e) => setFacilityId(e.target.value)}
            placeholder="?�설 ID ?�력"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm w-24">?�짜</label>
          <input 
            className="border rounded px-3 py-2 w-full" 
            type="date" 
            value={dateKey} 
            onChange={(e) => setDateKey(e.target.value)} 
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadSlots}
            disabled={loading || !facilityId || !dateKey}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "로딩 �?.." : "조회"}
          </button>
        </div>
      </div>

      {/* ?�롯 �??�약 ?�황 */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* ?�롯 목록 */}
        <div className="border rounded-xl p-4">
          <h2 className="font-semibold mb-3">?�롯 목록</h2>
          <div className="space-y-2 max-h-[60vh] overflow-auto">
            {loading && <div className="text-sm text-gray-500">로딩 �?..</div>}
            {!loading && slots.length === 0 && (
              <div className="text-sm text-gray-500">?�당 ?�짜 ?�롯 ?�음</div>
            )}
            {slots.map((slot) => {
              const s = slot.startAt.toDate();
              const e = slot.endAt.toDate();
              const left = Math.max(0, (slot.capacity || 0) - (slot.reserved || 0));
              const label = `${s.getHours().toString().padStart(2, '0')}:${s.getMinutes().toString().padStart(2, '0')}~${e.getHours().toString().padStart(2, '0')}:${e.getMinutes().toString().padStart(2, '0')} · ?�여 ${left}/${slot.capacity}`;
              const isSel = selectedSlot?.id === slot.id;
              
              return (
                <button 
                  key={slot.id} 
                  onClick={() => setSelectedSlot(slot)} 
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                    isSel 
                      ? 'bg-black text-white border-black' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{label}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      slot.status === 'open' ? 'bg-green-100 text-green-800' :
                      slot.status === 'closed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {slot.status}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ?�약??목록 */}
        <div className="border rounded-xl p-4">
          <h2 className="font-semibold mb-3">
            ?�약??목록 
            {selectedSlot && (
              <span className="text-sm text-gray-500 ml-2">
                (slot: {selectedSlot.id})
              </span>
            )}
          </h2>
          <div className="space-y-2 max-h-[60vh] overflow-auto">
            {!selectedSlot && (
              <div className="text-sm text-gray-500">좌측?�서 ?�롯???�택?�세??/div>
            )}
            {selectedSlot && resvRows.length === 0 && (
              <div className="text-sm text-gray-500">?�약?��? ?�습?�다.</div>
            )}
            {resvRows.map((r) => (
              <div key={r.id} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.userId}</div>
                  <div className="text-xs text-gray-500">
                    {r.id} · {r.status} · {r.createdAt.toDate().toLocaleString("ko-KR")}
                  </div>
                </div>
                <div className="flex gap-2">
                  {r.status === 'active' && (
                    <div className="flex gap-2">
                      <button 
                        disabled={busy === r.id} 
                        onClick={() => markAttendance(r.id, 'attended')} 
                        className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 text-xs"
                      >
                        {busy === r.id ? '처리 �?..' : '참석'}
                      </button>
                      <button 
                        disabled={busy === r.id} 
                        onClick={() => markAttendance(r.id, 'no_show')} 
                        className="px-3 py-1 rounded bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 text-xs"
                      >
                        {busy === r.id ? '처리 �?..' : '?�쇼'}
                      </button>
                      <button 
                        disabled={busy === r.id} 
                        onClick={() => adminCancel(r)} 
                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 text-xs"
                      >
                        {busy === r.id ? '취소 �?..' : '강제 취소'}
                      </button>
                    </div>
                  )}
                  {r.status === 'canceled' && (
                    <span className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      취소??
                    </span>
                  )}
                  {r.status === 'no_show' && (
                    <span className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded">
                      ?�쇼
                    </span>
                  )}
                  {r.status === 'attended' && (
                    <span className="px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded">
                      참석
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ?�계 ?�보 */}
      {selectedSlot && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-medium mb-3">?�택???�롯 ?�보</h3>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">?�롯 ID:</span>
              <div className="font-mono">{selectedSlot.id}</div>
            </div>
            <div>
              <span className="text-gray-500">?�간:</span>
              <div>
                {selectedSlot.startAt.toDate().toLocaleTimeString("ko-KR")} - 
                {selectedSlot.endAt.toDate().toLocaleTimeString("ko-KR")}
              </div>
            </div>
            <div>
              <span className="text-gray-500">?�용 ?�원:</span>
              <div>{selectedSlot.reserved}/{selectedSlot.capacity}</div>
            </div>
            <div>
              <span className="text-gray-500">?�태:</span>
              <div className={`inline-block px-2 py-1 rounded text-xs ${
                selectedSlot.status === 'open' ? 'bg-green-100 text-green-800' :
                selectedSlot.status === 'closed' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {selectedSlot.status}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
