import { useEffect, useState } from "react";
import { getFirestore, collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthContext";

export default function useTradeAttention() {
  const db = getFirestore(app);
  const { user } = useAuth();
  const uid = user?.uid;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!uid) { setCount(0); return; }

    // 판매자 입장: 요청 들어온 건(=확정 필요)
    const qSeller = query(
      collection(db, "reservations"),
      where("sellerUid", "==", uid),
      where("status", "==", "requested"),
      orderBy("createdAt", "desc")
    );

    // 구매자 입장: 판매자가 확정한 건(=진행 상황 확인)
    const qBuyer = query(
      collection(db, "reservations"),
      where("buyerUid", "==", uid),
      where("status", "==", "confirmed"),
      orderBy("updatedAt", "desc")
    );

    let sellerN = 0, buyerN = 0;
    const unsub1 = onSnapshot(qSeller, { includeMetadataChanges: true }, s => {
      if (s.metadata.fromCache && !s.metadata.hasPendingWrites) return;
      sellerN = s.size; setCount(sellerN + buyerN);
    });
    const unsub2 = onSnapshot(qBuyer, { includeMetadataChanges: true }, s => {
      if (s.metadata.fromCache && !s.metadata.hasPendingWrites) return;
      buyerN = s.size; setCount(sellerN + buyerN);
    });

    return () => { unsub1(); unsub2(); };
  }, [db, uid]);

  return count;
}
