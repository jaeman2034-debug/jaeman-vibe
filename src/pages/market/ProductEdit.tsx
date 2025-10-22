import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { doc, onSnapshot, updateDoc, getFirestore } from "firebase/firestore";
import { app } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthContext";
import useIsAdmin from "@/lib/useIsAdmin";

export default function ProductEdit() {
  const { id } = useParams<{id: string}>();
  const nav = useNavigate();
  const db = getFirestore(app);
  const { user } = useAuth();
  const isAdmin = useIsAdmin();

  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const ref = doc(db, "products", id);
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) { setForm(null); setLoading(false); return; }
      setForm({ id: snap.id, ...snap.data() });
      setLoading(false);
    });
    return () => unsub();
  }, [db, id]);

  if (loading) return <div className="p-4">로딩중…</div>;
  if (!form) return <div className="p-4">문서를 찾을 수 없습니다. <Link to="/app/market" className="underline">목록</Link></div>;

  const isOwner = user && form.sellerUid && user.uid === form.sellerUid;
  if (!(isOwner || isAdmin)) return <div className="p-4">수정 권한이 없습니다.</div>;

  const onChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((s: any) => ({ ...s, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db,"products",form.id), {
        title: form.name,
        name: form.name,
        price: Number(form.price) || 0,
        category: form.category || null,
        description: form.description || "",
        status: form.status || "active",
        published: !!form.published,
      });
      nav(`/market/${form.id}`);
    } catch (e) {
      console.error(e); 
      alert("수정 실패");
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">상품 수정</h1>
        <Link to={`/app/market/${form.id}`} className="underline">← 상세</Link>
      </div>

      <form onSubmit={onSubmit} className="space-y-3 max-w-xl">
        <div>
          <label className="block text-sm mb-1">상품명</label>
          <input name="name" value={form.name ?? ""} onChange={onChange} className="w-full h-10 px-3 border rounded" />
        </div>
        
        <div>
          <label className="block text-sm mb-1">가격(원)</label>
          <input name="price" value={form.price ?? ""} onChange={onChange} className="w-full h-10 px-3 border rounded" />
        </div>
        
        <div>
          <label className="block text-sm mb-1">카테고리</label>
          <select name="category" value={form.category ?? ""} onChange={onChange} className="w-full h-10 px-3 border rounded">
            <option value="">선택</option>
            <option value="축구화">축구화</option>
            <option value="유니폼">유니폼</option>
            <option value="공">공</option>
            <option value="기타">기타</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm mb-1">설명</label>
          <textarea name="description" value={form.description ?? ""} onChange={onChange} rows={4} className="w-full px-3 py-2 border rounded" />
        </div>
        
        <div className="flex gap-2">
          <select name="status" value={form.status ?? "active"} onChange={onChange} className="h-9 px-3 border rounded">
            <option value="active">판매중</option>
            <option value="sold">판매완료</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="published" checked={!!form.published} onChange={(e)=>setForm((s:any)=>({...s, published:e.target.checked}))}/>
            공개
          </label>
        </div>
        
        <button className="px-4 py-2 border rounded">저장</button>
      </form>
    </div>
  );
}
