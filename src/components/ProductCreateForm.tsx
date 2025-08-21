import { useState } from "react";
import { createProduct } from "@/services/productService";

export default function ProductCreateForm() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [files, setFiles] = useState<File[]>([]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("[PRODUCT] submit start");
    try {
      const res = await createProduct({
        title,
        price: Number(price),
        files,
      });
      alert(`등록 완료: ${res.id}`);
    } catch (e: any) {
      console.error("[PRODUCT] create failed:", e);
      alert(`등록 실패: ${e?.code || e?.message}`);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="제목" required />
      <input type="number" value={price} onChange={e=>setPrice(e.target.value===""?"":Number(e.target.value))} placeholder="가격" required />
      <input type="file" multiple onChange={e=>setFiles(Array.from(e.target.files || []))} />
      <button type="submit">등록</button>
    </form>
  );
} 