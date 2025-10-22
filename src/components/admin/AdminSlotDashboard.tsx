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

  // ?¨Î°Ø Î™©Î°ù Î°úÎìú
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
      console.error("?¨Î°Ø Î°úÎìú ?§Ìå®:", error);
      toast("?¨Î°Ø ?ïÎ≥¥Î•?Î∂àÎü¨?§Îäî???§Ìå®?àÏäµ?àÎã§.");
    } finally {
      setLoading(false);
    }
  };

  // ?àÏïΩ Î™©Î°ù Î°úÎìú
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
      console.error("?àÏïΩ Î™©Î°ù Î°úÎìú ?§Ìå®:", error);
      toast("?àÏïΩ ?ïÎ≥¥Î•?Î∂àÎü¨?§Îäî???§Ìå®?àÏäµ?àÎã§.");
    }
  };

  // ?¨Î°Ø ?†ÌÉù ???àÏïΩ Î™©Î°ù Î°úÎìú
  useEffect(() => {
    if (selectedSlot) {
      loadReservations(selectedSlot.id);
    }
  }, [selectedSlot]);

  // Ï≤¥ÌÅ¨??Ï≤òÎ¶¨ (Ï∞∏ÏÑù/?∏Ïáº)
  const markAttendance = async (reservationId: string, status: 'attended' | 'no_show') => {
    if (!confirm(`?àÏïΩ??${status === 'attended' ? 'Ï∞∏ÏÑù' : '?∏Ïáº'}?ºÎ°ú Ï≤òÎ¶¨?òÏãúÍ≤†Ïäµ?àÍπå?`)) return;
    
    setBusy(reservationId);
    try {
      const markAttendanceFn = httpsCallable(functions, 'markAttendanceFn');
      await markAttendanceFn({ reservationId, status });
      
      toast(`?àÏïΩ??${status === 'attended' ? 'Ï∞∏ÏÑù' : '?∏Ïáº'}?ºÎ°ú Ï≤òÎ¶¨?òÏóà?µÎãà??`);
      
      // Î™©Î°ù ?àÎ°úÍ≥†Ïπ®
      if (selectedSlot) {
        await loadReservations(selectedSlot.id);
        await loadSlots(); // ?¨Î°Ø ?ïÎ≥¥???àÎ°úÍ≥†Ïπ®
      }
    } catch (error: any) {
      console.error("Ï≤¥ÌÅ¨??Ï≤òÎ¶¨ ?§Ìå®:", error);
      let errorMessage = "Ï≤¥ÌÅ¨??Ï≤òÎ¶¨???§Ìå®?àÏäµ?àÎã§.";
      
      if (error.code === "functions/permission-denied") {
        errorMessage = "Í¥ÄÎ¶¨Ïûê Í∂åÌïú???ÑÏöî?©Îãà??";
      } else if (error.code === "functions/not-found") {
        errorMessage = "?àÏïΩ??Ï∞æÏùÑ ???ÜÏäµ?àÎã§.";
      }
      
      toast(errorMessage);
    } finally {
      setBusy(null);
    }
  };

  // Í¥ÄÎ¶¨Ïûê Í∞ïÏ†ú Ï∑®ÏÜå
  const adminCancel = async (reservation: Reservation) => {
    if (!confirm(`?àÏïΩ??${reservation.userId}???àÏïΩ??Í∞ïÏ†ú Ï∑®ÏÜå?òÏãúÍ≤†Ïäµ?àÍπå?`)) return;
    
    setBusy(reservation.id);
    try {
      const adminCancelFn = httpsCallable(functions, 'adminCancelReservationFn');
      await adminCancelFn({ 
        reservationId: reservation.id, 
        reason: "Í¥ÄÎ¶¨Ïûê Í∞ïÏ†ú Ï∑®ÏÜå" 
      });
      
      toast("?àÏïΩ??Í∞ïÏ†ú Ï∑®ÏÜå?òÏóà?µÎãà??");
      
      // Î™©Î°ù ?àÎ°úÍ≥†Ïπ®
      if (selectedSlot) {
        await loadReservations(selectedSlot.id);
        await loadSlots(); // ?¨Î°Ø ?ïÎ≥¥???àÎ°úÍ≥†Ïπ®
      }
    } catch (error: any) {
      console.error("Í∞ïÏ†ú Ï∑®ÏÜå ?§Ìå®:", error);
      let errorMessage = "Í∞ïÏ†ú Ï∑®ÏÜå???§Ìå®?àÏäµ?àÎã§.";
      
      if (error.code === "functions/permission-denied") {
        errorMessage = "Í¥ÄÎ¶¨Ïûê Í∂åÌïú???ÑÏöî?©Îãà??";
      } else if (error.code === "functions/not-found") {
        errorMessage = "?àÏïΩ??Ï∞æÏùÑ ???ÜÏäµ?àÎã§.";
      }
      
      toast(errorMessage);
    } finally {
      setBusy(null);
    }
  };

  // QR Ï≤¥ÌÅ¨???¨Ïä§???ùÏÑ±
  const generateQrPoster = async (slotId: string) => {
    try {
      setBusy(slotId);
      const genSlotQrPngFn = httpsCallable(functions, 'genSlotQrPngFn');
      const result = await genSlotQrPngFn({ slotId, expiryMinutes: 60 });
      
      const { posterUrl } = result.data as any;
      
      // ????óê???¨Ïä§???¥Í∏∞
      window.open(posterUrl, '_blank');
      
      toast("QR Ï≤¥ÌÅ¨???¨Ïä§?∞Í? ?ùÏÑ±?òÏóà?µÎãà?? ????óê???ïÏù∏?òÏÑ∏??");
    } catch (error: any) {
      console.error("QR ?¨Ïä§???ùÏÑ± ?§Ìå®:", error);
      toast("QR ?¨Ïä§???ùÏÑ±???§Ìå®?àÏäµ?àÎã§");
    } finally {
      setBusy(null);
    }
  };

  // ?†Ïßú Î≥ÄÍ≤????êÎèô Î°úÎìú
  useEffect(() => {
    if (facilityId && dateKey) {
      loadSlots();
    }
  }, [facilityId, dateKey]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Í¥ÄÎ¶¨Ïûê ?¨Î°Ø ?Ä?úÎ≥¥??/h1>
        <p className="text-gray-500 mt-2">?úÏÑ§ ?¨Î°ØÍ≥??àÏïΩ ?ÑÌô©??Í¥ÄÎ¶¨Ìïò?∏Ïöî</p>
      </div>

      {/* Í≤Ä??Ï°∞Í±¥ */}
      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm w-24">Facility ID</label>
          <input 
            className="border rounded px-3 py-2 w-full" 
            value={facilityId} 
            onChange={(e) => setFacilityId(e.target.value)}
            placeholder="?úÏÑ§ ID ?ÖÎ†•"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm w-24">?†Ïßú</label>
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
            {loading ? "Î°úÎî© Ï§?.." : "Ï°∞Ìöå"}
          </button>
        </div>
      </div>

      {/* ?¨Î°Ø Î∞??àÏïΩ ?ÑÌô© */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* ?¨Î°Ø Î™©Î°ù */}
        <div className="border rounded-xl p-4">
          <h2 className="font-semibold mb-3">?¨Î°Ø Î™©Î°ù</h2>
          <div className="space-y-2 max-h-[60vh] overflow-auto">
            {loading && <div className="text-sm text-gray-500">Î°úÎî© Ï§?..</div>}
            {!loading && slots.length === 0 && (
              <div className="text-sm text-gray-500">?¥Îãπ ?†Ïßú ?¨Î°Ø ?ÜÏùå</div>
            )}
            {slots.map((slot) => {
              const s = slot.startAt.toDate();
              const e = slot.endAt.toDate();
              const left = Math.max(0, (slot.capacity || 0) - (slot.reserved || 0));
              const label = `${s.getHours().toString().padStart(2, '0')}:${s.getMinutes().toString().padStart(2, '0')}~${e.getHours().toString().padStart(2, '0')}:${e.getMinutes().toString().padStart(2, '0')} ¬∑ ?îÏó¨ ${left}/${slot.capacity}`;
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

        {/* ?àÏïΩ??Î™©Î°ù */}
        <div className="border rounded-xl p-4">
          <h2 className="font-semibold mb-3">
            ?àÏïΩ??Î™©Î°ù 
            {selectedSlot && (
              <span className="text-sm text-gray-500 ml-2">
                (slot: {selectedSlot.id})
              </span>
            )}
          </h2>
          <div className="space-y-2 max-h-[60vh] overflow-auto">
            {!selectedSlot && (
              <div className="text-sm text-gray-500">Ï¢åÏ∏°?êÏÑú ?¨Î°Ø???†ÌÉù?òÏÑ∏??/div>
            )}
            {selectedSlot && resvRows.length === 0 && (
              <div className="text-sm text-gray-500">?àÏïΩ?êÍ? ?ÜÏäµ?àÎã§.</div>
            )}
            {resvRows.map((r) => (
              <div key={r.id} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{r.userId}</div>
                  <div className="text-xs text-gray-500">
                    {r.id} ¬∑ {r.status} ¬∑ {r.createdAt.toDate().toLocaleString("ko-KR")}
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
                        {busy === r.id ? 'Ï≤òÎ¶¨ Ï§?..' : 'Ï∞∏ÏÑù'}
                      </button>
                      <button 
                        disabled={busy === r.id} 
                        onClick={() => markAttendance(r.id, 'no_show')} 
                        className="px-3 py-1 rounded bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 text-xs"
                      >
                        {busy === r.id ? 'Ï≤òÎ¶¨ Ï§?..' : '?∏Ïáº'}
                      </button>
                      <button 
                        disabled={busy === r.id} 
                        onClick={() => adminCancel(r)} 
                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 text-xs"
                      >
                        {busy === r.id ? 'Ï∑®ÏÜå Ï§?..' : 'Í∞ïÏ†ú Ï∑®ÏÜå'}
                      </button>
                    </div>
                  )}
                  {r.status === 'canceled' && (
                    <span className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      Ï∑®ÏÜå??
                    </span>
                  )}
                  {r.status === 'no_show' && (
                    <span className="px-3 py-1 text-xs bg-red-100 text-red-600 rounded">
                      ?∏Ïáº
                    </span>
                  )}
                  {r.status === 'attended' && (
                    <span className="px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded">
                      Ï∞∏ÏÑù
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ?µÍ≥Ñ ?ïÎ≥¥ */}
      {selectedSlot && (
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <h3 className="font-medium mb-3">?†ÌÉù???¨Î°Ø ?ïÎ≥¥</h3>
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">?¨Î°Ø ID:</span>
              <div className="font-mono">{selectedSlot.id}</div>
            </div>
            <div>
              <span className="text-gray-500">?úÍ∞Ñ:</span>
              <div>
                {selectedSlot.startAt.toDate().toLocaleTimeString("ko-KR")} - 
                {selectedSlot.endAt.toDate().toLocaleTimeString("ko-KR")}
              </div>
            </div>
            <div>
              <span className="text-gray-500">?òÏö© ?∏Ïõê:</span>
              <div>{selectedSlot.reserved}/{selectedSlot.capacity}</div>
            </div>
            <div>
              <span className="text-gray-500">?ÅÌÉú:</span>
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
