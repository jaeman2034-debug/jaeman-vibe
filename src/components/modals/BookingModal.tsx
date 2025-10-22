import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase"; // ???¨ì¼ ì§„ì…???¬ìš©

export default function BookingModal({
  open, onClose, eventId
}: { open: boolean; onClose:()=>void; eventId: string }) {
  
  if (!open) return null;

  async function handleBook() {
    const user = auth.currentUser;
    if (!user) return alert("ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??");
    
    await addDoc(collection(db, "bookings"), {
      eventId,
      userUid: user.uid,
      createdAt: serverTimestamp(),
      status: "requested",
    });
    
    onClose();
    alert("?ˆì•½ ?”ì²­???±ë¡?˜ì—ˆ?µë‹ˆ??");
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 shadow-lg p-4">
        <div className="font-semibold mb-2">?ˆì•½?˜ê¸°</div>
        <div className="text-sm text-gray-500 mb-4">???´ë²¤?¸ë? ?ˆì•½?˜ì‹œê² ì–´??</div>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-2 rounded-xl border" onClick={onClose}>ì·¨ì†Œ</button>
          <button className="px-3 py-2 rounded-xl border bg-black text-white" onClick={handleBook}>?ˆì•½</button>
        </div>
      </div>
    </div>
  );
}
