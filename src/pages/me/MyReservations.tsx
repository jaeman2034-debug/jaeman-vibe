import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getFirestore, collection, query, where, orderBy, onSnapshot, DocumentData, getDoc, doc
} from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthContext";
import useIsAdmin from "@/lib/useIsAdmin";
import { setReservationStatus } from "@/features/trade/reservation";

type R = { id: string } & DocumentData;
type Tab = "buyer" | "seller";
const prettyStatus = (s: string) =>
  s === "requested" ? "예약요청" :
  s === "confirmed" ? "확정" :
  s === "completed" ? "거래완료" :
  s === "canceled"  ? "취소" : s;

export default function MyReservations() {
  const db = getFirestore(app);
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const uid = user?.uid;
  const [tab, setTab] = useState<Tab>("buyer");
  const [buyerRows, setBuyerRows] = useState<R[]>([]);
  const [sellerRows, setSellerRows] = useState<R[]>([]);
  const [loading, setLoading] = useState(true);

  // 구매자 탭 구독
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "reservations"),
      where("buyerUid", "==", uid),
      orderBy("updatedAt", "desc")
    );
    return onSnapshot(q, { includeMetadataChanges: true }, (snap) => {
      if (snap.metadata.fromCache && !snap.metadata.hasPendingWrites) return;
      setBuyerRows(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [db, uid]);

  // 판매자 탭 구독
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "reservations"),
      where("sellerUid", "==", uid),
      orderBy("updatedAt", "desc")
    );
    return onSnapshot(q, { includeMetadataChanges: true }, (snap) => {
      if (snap.metadata.fromCache && !snap.metadata.hasPendingWrites) return;
      setSellerRows(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [db, uid]);

  const buyerCount = buyerRows.length;
  const sellerCount = sellerRows.length;
  const rows = tab === "buyer" ? buyerRows : sellerRows;

  const onConfirm = async (r: R) => {
    if (!(isAdmin || r.sellerUid === uid)) return alert("권한 없음");
    await setReservationStatus(db, r.id, "confirmed");
  };
  const onComplete = async (r: R) => {
    if (!(isAdmin || r.sellerUid === uid)) return alert("권한 없음");
    await setReservationStatus(db, r.id, "completed");
  };
  const onCancel = async (r: R) => {
    // 구매자는 requested일 때만, 판매자는 언제든 취소(규칙에서 추가 검증)
    if (r.buyerUid === uid && r.status !== "requested" && !isAdmin) {
      return alert("요청 단계에서만 취소할 수 있습니다.");
    }
    if (!(isAdmin || r.buyerUid === uid || r.sellerUid === uid)) return alert("권한 없음");
    await setReservationStatus(db, r.id, "canceled");
  };

  async function goWriteReview(r: R) {
    // 이미 작성했는지 체크
    const ex = await getDoc(doc(db, "reviews", r.id));
    if (ex.exists()) return alert("이미 리뷰를 작성했습니다.");
    // 완료 건만 허용
    if (r.status !== "completed") return alert("거래 완료 후 작성 가능합니다.");
    // 이동
    location.assign(`/reviews/${r.id}/new`);
  }

  const Empty = (
    <div className="text-muted-foreground">
      {tab === "buyer" ? "구매 예약이 없습니다." : "판매 예약이 없습니다."}
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">나의 거래</h1>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded border ${tab==="buyer"?"bg-muted":""}`}
            onClick={()=>setTab("buyer")}
          >
            구매 ({buyerCount})
          </button>
          <button
            className={`px-3 py-1 rounded border ${tab==="seller"?"bg-muted":""}`}
            onClick={()=>setTab("seller")}
          >
            판매 ({sellerCount})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-10 bg-muted/60 rounded animate-pulse" />
          <div className="h-10 bg-muted/60 rounded animate-pulse" />
          <div className="h-10 bg-muted/60 rounded animate-pulse" />
        </div>
      ) : rows.length === 0 ? (
        Empty
      ) : (
        <ul className="space-y-2">
          {rows.map(r => {
            const youAreSeller = r.sellerUid === uid;
            const youAreBuyer  = r.buyerUid === uid;
            return (
              <li key={r.id} className="p-3 border rounded">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.productName ?? r.productId}</div>
                    <div className="text-xs text-muted-foreground">
                      상태: {prettyStatus(r.status)} · 가격: {r.priceAt != null ? `${Number(r.priceAt).toLocaleString()}원` : "-"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link to={`/app/market/${r.productId}`} className="px-2 py-1 border rounded text-sm">상품</Link>
                    {r.chatId && (
                      <Link to={`/chats/${r.chatId}`} className="px-2 py-1 border rounded text-sm">채팅</Link>
                    )}
                  </div>
                </div>

                {/* 액션 영역 */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {/* 구매자 액션 */}
                  {youAreBuyer && r.status === "requested" && (
                    <button onClick={()=>onCancel(r)} className="px-2 py-1 border rounded text-sm">예약 취소</button>
                  )}
                  {youAreBuyer && r.status === "completed" && (
                    <button onClick={()=>goWriteReview(r)} className="px-2 py-1 border rounded text-sm">리뷰 쓰기</button>
                  )}

                  {/* 판매자/관리자 액션 */}
                  {(youAreSeller || isAdmin) && r.status === "requested" && (
                    <>
                      <button onClick={()=>onConfirm(r)} className="px-2 py-1 border rounded text-sm">예약 확정</button>
                      <button onClick={()=>onCancel(r)}  className="px-2 py-1 border rounded text-sm">취소</button>
                    </>
                  )}
                  {(youAreSeller || isAdmin) && r.status === "confirmed" && (
                    <>
                      <button onClick={()=>onComplete(r)} className="px-2 py-1 border rounded text-sm">거래 완료</button>
                      <button onClick={()=>onCancel(r)}   className="px-2 py-1 border rounded text-sm">취소</button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
