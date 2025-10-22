import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase"; // ???�일 진입???�용

export default function BookingModal({
  open, onClose, eventId
}: { open: boolean; onClose:()=>void; eventId: string }) {
  
  if (!open) return null;

  async function handleBook() {
    const user = auth.currentUser;
    if (!user) return alert("로그?�이 ?�요?�니??");
    
    await addDoc(collection(db, "bookings"), {
      eventId,
      userUid: user.uid,
      createdAt: serverTimestamp(),
      status: "requested",
    });
    
    onClose();
    alert("?�약 ?�청???�록?�었?�니??");
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 shadow-lg p-4">
        <div className="font-semibold mb-2">?�약?�기</div>
        <div className="text-sm text-gray-500 mb-4">???�벤?��? ?�약?�시겠어??</div>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-2 rounded-xl border" onClick={onClose}>취소</button>
          <button className="px-3 py-2 rounded-xl border bg-black text-white" onClick={handleBook}>?�약</button>
        </div>
      </div>
    </div>
  );
}
