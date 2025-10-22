import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getFirestore, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase";
import { useAuth } from "@/features/auth/AuthContext";

export default function ProductCreate() {
  const nav = useNavigate();
  const db = getFirestore(app);
  const storage = getStorage(app);
  const { user } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    region: "KR",
    published: true,
    status: "active",
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return alert("상품명을 입력하세요.");
    if (!form.price || isNaN(Number(form.price))) return alert("가격은 숫자여야 합니다.");

    setSubmitting(true);
    try {
      let thumbnailUrl: string | null = null;

      if (file) {
        const id = crypto.randomUUID();
        const r = ref(storage, `market/${id}-${file.name}`);
        await uploadBytes(r, file);
        thumbnailUrl = await getDownloadURL(r);
      }

      const docRef = await addDoc(collection(db, "products"), {
        title: form.name,
        name: form.name,
        price: Number(form.price),
        category: form.category || null,
        description: form.description || "",
        region: form.region,
        status: form.status,
        published: form.published,
        thumbnailUrl,
        createdAt: serverTimestamp(),
        sellerUid: user?.uid ?? null,
        sellerName: user?.displayName ?? null,
      });

      nav(`/market/${docRef.id}`);
    } catch (e) {
      console.error("[ProductCreate] submit error", e);
      alert("등록 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">상품 등록</h1>
        <Link to="/app/market" className="underline">← 목록</Link>
      </div>

      <form onSubmit={onSubmit} className="space-y-3 max-w-xl">
        <div>
          <label className="block text-sm mb-1">상품명</label>
          <input name="name" value={form.name} onChange={onChange} className="w-full h-10 px-3 border rounded" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">가격(원)</label>
            <input name="price" value={form.price} onChange={onChange} className="w-full h-10 px-3 border rounded" />
          </div>
          <div>
            <label className="block text-sm mb-1">카테고리</label>
            <select name="category" value={form.category} onChange={onChange} className="w-full h-10 px-3 border rounded">
              <option value="">선택</option>
              <option value="축구화">축구화</option>
              <option value="유니폼">유니폼</option>
              <option value="공">공</option>
              <option value="기타">기타</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">설명</label>
          <textarea name="description" value={form.description} onChange={onChange} rows={4} className="w-full px-3 py-2 border rounded" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">지역</label>
            <input name="region" value={form.region} onChange={onChange} className="w-full h-10 px-3 border rounded" />
          </div>
          <div>
            <label className="block text-sm mb-1">썸네일</label>
            <input type="file" accept="image/*" onChange={(e)=>setFile(e.target.files?.[0] ?? null)} className="w-full h-10" />
          </div>
        </div>

        <div className="flex gap-2">
          <button type="button" className="px-3 py-2 border rounded"
            onClick={() => alert("AI 분석: 이미지/텍스트 기반 자동 채우기(후속 연결)")}>
            AI 분석
          </button>
          <button disabled={submitting} className="px-4 py-2 border rounded">
            {submitting ? "등록 중…" : "등록"}
          </button>
        </div>
      </form>
    </div>
  );
}
