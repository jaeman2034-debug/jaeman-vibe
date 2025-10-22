import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function MarketEditPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState<any>(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!id) return;
    (async () => {
      const s = await getDoc(doc(db, "market", id));
      if (!s.exists()) return nav("/market", { replace: true });
      const d = s.data() as any;
      if (!user || d.sellerUid !== user.uid) {
        alert("수정 권한이 없습니다.");
        return nav(`/market/${id}`, { replace: true });
      }
      setForm({ ...d });
    })();
  }, [id, nav, user]);

  if (!form) return <div className="p-4">불러오는 중…</div>;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await updateDoc(doc(db, "market", id!), {
      title: form.title,
      price: Number(form.price),
      category: form.category,
      status: form.status,
      desc: form.desc ?? "",
      published: !!form.published,
    });
    nav(`/market/${id}`, { replace: true });
  }

  function update(k: string, v: any) { setForm((s:any)=>({ ...s, [k]: v })); }

  return (
    <div className="mx-auto max-w-screen-sm p-4">
      <h1 className="text-xl font-bold mb-3">상품 수정</h1>
      <form onSubmit={onSubmit} className="grid gap-3">
        <input className="border rounded-lg p-2" value={form.title} onChange={e=>update("title", e.target.value)} />
        <input className="border rounded-lg p-2" type="number" value={form.price}
               onChange={e=>update("price", e.target.value)} />
        <div className="flex gap-2">
          <select className="border rounded-lg p-2" value={form.category}
                  onChange={e=>update("category", e.target.value)}>
            <option>축구화</option><option>유니폼</option><option>공</option><option>기타</option>
          </select>
          <select className="border rounded-lg p-2" value={form.status}
                  onChange={e=>update("status", e.target.value)}>
            <option value="selling">판매중</option>
            <option value="reserved">예약중</option>
            <option value="sold">판매완료</option>
          </select>
        </div>
        <textarea className="border rounded-lg p-2" rows={4}
                  value={form.desc ?? ""} onChange={e=>update("desc", e.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!form.published}
                 onChange={e=>update("published", e.target.checked)} />
          공개(published)
        </label>
        <button className="h-11 rounded-lg bg-black text-white font-semibold">저장</button>
      </form>
    </div>
  );
}
