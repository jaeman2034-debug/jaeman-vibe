import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { doc, getDoc, setDoc, serverTimestamp, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthContext";

export default function ReviewCreate() {
  const { rid } = useParams<{rid: string}>();
  const nav = useNavigate();
  const db = getFirestore(app);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<any|null>(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  useEffect(() => {
    (async () => {
      if (!rid) return;
      const rs = await getDoc(doc(db, "reservations", rid));
      if (!rs.exists()) { setLoading(false); return; }
      const r = rs.data();
      setReservation({ id: rs.id, ...r });
      setLoading(false);
    })();
  }, [db, rid]);

  if (loading) return <div className="p-4">로딩중…</div>;
  if (!reservation) return <div className="p-4">예약을 찾을 수 없습니다. <Link to="/me/reservations" className="underline">돌아가기</Link></div>;

  const canWrite = user?.uid === reservation.buyerUid && reservation.status === "completed";
  if (!canWrite) return <div className="p-4">리뷰 권한이 없습니다.</div>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) return alert("평점은 1~5");
    try {
      await setDoc(doc(db, "reviews", reservation.id), {
        reservationId: reservation.id,
        productId: reservation.productId,
        productName: reservation.productName ?? null,
        sellerUid: reservation.sellerUid,
        buyerUid: user!.uid,
        rating,
        text: text.trim(),
        createdAt: serverTimestamp(),
      }, { merge: false }); // 존재하면 실패시키려면 merge:false 유지
      nav(`/market/${reservation.productId}`);
    } catch (e) {
      console.error(e);
      alert("리뷰 저장 실패");
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-xl">
      <h1 className="text-xl font-semibold">리뷰 작성</h1>
      <div className="text-sm text-muted-foreground">
        상품: {reservation.productName ?? reservation.productId}
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-sm mb-1">평점(1~5)</label>
          <select value={rating} onChange={e=>setRating(Number(e.target.value))} className="h-10 px-3 border rounded">
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">리뷰</label>
          <textarea value={text} onChange={e=>setText(e.target.value)} rows={4} className="w-full px-3 py-2 border rounded" />
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border rounded">저장</button>
          <Link to={`/app/market/${reservation.productId}`} className="px-4 py-2 border rounded">취소</Link>
        </div>
      </form>
    </div>
  );
}
