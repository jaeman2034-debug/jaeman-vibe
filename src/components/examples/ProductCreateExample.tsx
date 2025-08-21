import React, { useState } from "react";
import { createDoc } from "../../lib/firebase";
import { getUid } from "../../lib/auth";

export default function ProductCreateExample() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    price: "",
    imageUrl: "",
    category: "",
    location: "",
    tags: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const uid = getUid();
    if (!uid) return alert("로그인이 필요합니다.");

    setLoading(true);
    try {
      await createDoc("products", {
        title: formData.title,
        price: formData.price ? Number(formData.price) : undefined,
        imageUrl: formData.imageUrl || undefined,
        category: formData.category || undefined,
        location: formData.location || undefined,
        tags: formData.tags ? formData.tags.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      }, uid);

      alert("상품 등록 완료!");
      setFormData({ title: "", price: "", imageUrl: "", category: "", location: "", tags: "" });
    } catch (error) {
      console.error("상품 등록 실패:", error);
      alert("상품 등록에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-zinc-900 rounded-2xl border">
      <h2 className="text-xl font-bold mb-4">상품 등록 예시</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">상품명 *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="아디다스 축구화 X Speedflow"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">가격</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="65000"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">이미지 URL</label>
          <input
            type="url"
            value={formData.imageUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">카테고리</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="축구화"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">지역</label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="서울"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">태그 (쉼표로 구분)</label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            className="w-full px-3 py-2 border rounded-lg"
            placeholder="축구, 스피드, 운동화"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "등록 중..." : "상품 등록"}
        </button>
      </form>

      <div className="mt-4 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-sm">
        <p className="font-medium mb-2">자동 생성되는 키워드 예시:</p>
        <p className="text-xs opacity-70">
          "아디다스 축구화 X Speedflow" → ["아디다스", "축구화", "speedflow", "아", "아디", "아디다", "축", "축구", "스", "스피", "스피드", ...]
        </p>
      </div>
    </div>
  );
} 