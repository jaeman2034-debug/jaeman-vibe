import { useState } from "react";
import { getAuth } from "firebase/auth";
import { createDoc } from "@/lib/writeDoc";

export default function ProductQuickRegisterModal({ onClose, preset, imageUrl: imageUrlProp }: { onClose: () => void; preset?: { category?: string; price?: number }; imageUrl?: string }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(preset?.category || "");
  const [price, setPrice] = useState<number | undefined>(preset?.price);
  const [imageUrl, setImageUrl] = useState<string>(imageUrlProp || "");

  async function submit() {
    const u = getAuth().currentUser; if (!u) return alert("로그인이 필요합니다.");
    await createDoc("products", { title: title || category || "상품", price, imageUrl, category }, u.uid);
    onClose();
    alert("등록 완료");
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 w-full space-y-3">
      <h2 className="text-lg font-semibold">빠른 상품 등록</h2>
      <input className="w-full rounded-xl border px-3 py-2" placeholder="제목" value={title} onChange={(e)=>setTitle(e.target.value)} />
      <input className="w-full rounded-xl border px-3 py-2" placeholder="카테고리" value={category} onChange={(e)=>setCategory(e.target.value)} />
      <input className="w-full rounded-xl border px-3 py-2" placeholder="가격" value={price ?? ""} onChange={(e)=>setPrice(parseInt(e.target.value||"0",10)||undefined)} />
      <input className="w-full rounded-xl border px-3 py-2" placeholder="이미지 URL" value={imageUrl} onChange={(e)=>setImageUrl(e.target.value)} />
      <div className="flex gap-2 justify-end">
        <button className="px-3 py-1.5 rounded-xl border" onClick={onClose}>취소</button>
        <button className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white" onClick={submit}>등록</button>
      </div>
    </div>
  );
} 