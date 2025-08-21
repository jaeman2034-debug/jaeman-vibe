import { useEffect, useState } from "react";
import { analyzeProduct } from "@/voice/util/vision";

export default function ProductAnalyzeModal({ onClose, imageUrl }: { onClose: () => void; imageUrl?: string }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const r = await analyzeProduct(imageUrl);
      setResult(r); setLoading(false);
    })();
  }, [imageUrl]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 w-full space-y-3">
      <h2 className="text-lg font-semibold">상품 AI 분석</h2>
      {loading ? <div className="p-6 text-center">분석 중…</div> : (
        <pre className="text-xs bg-zinc-100 dark:bg-zinc-800 rounded-xl p-3 overflow-auto max-h-80">{JSON.stringify(result, null, 2)}</pre>
      )}
      <div className="flex gap-2 justify-end">
        <button className="px-3 py-1.5 rounded-xl border" onClick={onClose}>닫기</button>
      </div>
    </div>
  );
} 