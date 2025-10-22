import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

// 카드와 동일한 포맷을 맞추는 간단한 뷰
type MarketItem = {
  title: string;
  price: number;
  category: string; // "shoes" | "uniform" | "ball" | "etc"
  status: "selling" | "reserved" | "sold";
  published: boolean;
  dongCode: string;
  district?: string;
  images?: string[]; // storage URL들
  desc?: string;
  sellerUid: string;
  createdAt: Timestamp;
};

export default function MarketDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const s = await getDoc(doc(db, "market", id));
      if (!s.exists()) return nav("/market", { replace: true });
      setData({ id: s.id, ...s.data() });
    })();
  }, [id, nav]);

  if (!data) return <div className="p-4">불러오는 중…</div>;

  const isOwner = auth.currentUser?.uid && data.sellerUid === auth.currentUser?.uid;

  async function markSold() {
    await updateDoc(doc(db, "market", data.id), { status: "sold" });
    alert("판매완료로 변경했습니다.");
  }
  async function togglePublish() {
    await updateDoc(doc(db,"market", data.id), { published: !data.published });
    setData({ ...data, published: !data.published });
  }
  async function hardDelete() {
    if (!confirm("정말 삭제하시겠어요? 복구할 수 없습니다.")) return;
    await deleteDoc(doc(db, "market", data.id));
    nav("/market", { replace: true });
  }

  return (
    <div className="mx-auto max-w-screen-sm p-4">
      <button onClick={() => nav(-1)} className="mb-3">← 뒤로</button>
      <h1 className="text-xl font-bold mb-1">{data.title}</h1>
      <div className="text-neutral-500 text-sm mb-2">
        {data.district ?? data.dongCode} · {data.status}
      </div>
      <div className="text-lg font-bold mb-4">{data.price?.toLocaleString()}원</div>

      {/* 이미지/설명 등 표시 ... */}
      {data.images?.length ? (
        <div className="grid gap-2 mb-4">
          {data.images.map((src: string, i: number) => (
            <img key={i} src={src} alt="" className="w-full rounded-lg bg-neutral-100" />
          ))}
        </div>
      ) : (
        <div className="h-48 rounded-lg bg-neutral-100 mb-4" />
      )}

      {data.desc && (
        <p className="mb-4 leading-relaxed">{data.desc}</p>
      )}

      {isOwner && (
        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={() => nav(`/market/${data.id}/edit`)} className="px-3 py-2 rounded-lg border">수정</button>
          <button onClick={markSold} className="px-3 py-2 rounded-lg border">판매완료</button>
          <button onClick={togglePublish} className="px-3 py-2 rounded-lg border">
            {data.published ? "숨기기" : "다시 보이기"}
          </button>
          {/* (옵션) 삭제 허용 시 버튼 노출 */}
          <button onClick={hardDelete} className="px-3 py-2 rounded-lg border text-red-600">삭제</button>
        </div>
      )}
    </div>
  );
}
