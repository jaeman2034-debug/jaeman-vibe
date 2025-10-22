/**
 * ??AI 기반 ?�품 검??/ 추천 ?�이지
 * 기능:
 *  - ?�용?��? 검?�어 ?�력
 *  - AI가 검?�어�??��? ?�그�?변?? *  - Firestore?�서 autoTags 배열�?매칭?�는 문서 검?? *  - 관???�품 ?�동 추천
 */

import React, { useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, generateImageDescription } from "@/lib/firebase";

export default function MarketSearch_AI() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // === AI 기반 ?�그 ?�장�?===
  const expandTagsWithAI = async (text: string): Promise<string[]> => {
    try {
      // OpenAI API�??��? ?�그 ?�성
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        return toTags(text); // OpenAI ?�으�?기본 ?�그 변??      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: `"${text}"?� ?��????�포�??�품 ?�워??5~8개�? JSON 배열�?출력?�줘. ?�국?�로�?
?? ["축구", "?�동??, "?�이??, "축구??, "?�포�?, "?�발"]`,
            },
          ],
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        return toTags(text);
      }

      const data = await response.json();
      const aiTags = data.choices[0]?.message?.content?.trim() || "";
      
      // JSON ?�싱 ?�도
      try {
        const parsed = JSON.parse(aiTags);
        return Array.isArray(parsed) ? parsed.map(String) : toTags(text);
      } catch {
        // JSON ?�싱 ?�패??기본 ?�그 + AI ?�답?�서 추출
        const basicTags = toTags(text);
        const aiWords = aiTags
          .replace(/[\[\]"']/g, "")
          .split(/[ ,\n]+/)
          .filter((w: string) => w.length > 1);
        return [...new Set([...basicTags, ...aiWords])];
      }
    } catch (error) {
      console.error("AI ?�그 ?�장 ?�패:", error);
      return toTags(text);
    }
  };

  // === 기본 ?�그 변?�기 (백업?? ===
  const toTags = (text: string): string[] => {
    const clean = text
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .trim()
      .toLowerCase();
    const words = clean.split(/\s+/);
    // 불필???�어 ?�터�?    const stop = ["?�품", "물건", "?�품", "검??, "관??, "추천"];
    return words.filter((w) => !stop.includes(w) && w.length > 1);
  };

  // === ?�그 매칭 ?�수 계산 ===
  const matchScore = (item: any, searchTags: string[]): number => {
    const itemTags = item.autoTags || [];
    let score = 0;
    searchTags.forEach(tag => {
      if (itemTags.includes(tag)) score += 1;
    });
    return score;
  };

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setMsg("");
    try {
      // AI�??�그 ?�장
      setMsg("?�� AI가 검?�어�?분석?�여 ?��? ?�그�??�성 �?..");
      const tags = await expandTagsWithAI(keyword);
      
      if (tags.length === 0) {
        setMsg("검?�어?�서 ?�효???�그�?찾�? 못했?�니??");
        setLoading(false);
        return;
      }

      console.log("?�� AI ?�장 ?�그:", tags);
      setMsg(`AI가 ?�성??검???�그: ${tags.join(", ")}`);

      // Firestore 쿼리
      const ref = collection(db, "marketItems");
      // �?번째 ?�그 기�??�로 검???�작
      const q = query(
        ref,
        where("autoTags", "array-contains-any", tags.slice(0, 5)),
        orderBy("updatedAt", "desc"),
        limit(20)
      );

      const snap = await getDocs(q);
      let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // ?�그 매칭 ?�수�??�렬
      data = data.sort((a, b) => matchScore(b, tags) - matchScore(a, tags));

      setResults(data);

      if (data.length === 0) {
        setMsg("관???�품???�습?�다.");
      } else {
        setMsg(`${data.length}개의 관???�품??찾았?�니??`);
      }
    } catch (err) {
      console.error(err);
      setMsg("검??�??�류가 발생?�습?�다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-4">
      <h1 className="text-3xl font-bold mb-2">?�� AI ?�그 기반 검??/h1>
      <p className="text-gray-600 mb-6">
        검?�어�??�력?�면 AI가 ?�동?�로 ?��? ?�품??찾아?�립?�다!
      </p>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <input
          type="text"
          placeholder="?? 축구?? ?�이???�동?? ?�디?�스, ?�포�???
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-1 rounded-xl border-2 border-gray-200 p-4 text-lg focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 font-semibold text-lg hover:opacity-90 transition"
          disabled={loading}
        >
          {loading ? "?�� 검??�?.." : "?? 검??}
        </button>
      </form>

      {msg && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <p className="text-blue-800 font-medium">{msg}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">?�� 검??결과</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map((item) => (
              <div
                key={item.id}
                className="border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 bg-white"
              >
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  <img
                    src={item.imageUrls?.[0] || "/no-image.png"}
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/no-image.png";
                    }}
                  />
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {item.autoDescription || item.description || "?�명 ?�음"}
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-green-600">
                      ??Number(item.price || 0).toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {item.category || "기�?"}
                    </span>
                  </div>

                  {item.autoTags && item.autoTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.autoTags.slice(0, 4).map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-1"
                        >
                          #{tag}
                        </span>
                      ))}
                      {item.autoTags.length > 4 && (
                        <span className="text-xs text-gray-500">
                          +{item.autoTags.length - 4}�?                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && !loading && keyword && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">?��</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            검??결과가 ?�습?�다
          </h3>
          <p className="text-gray-500">
            ?�른 ?�워?�로 검?�해보세??
          </p>
        </div>
      )}
    </div>
  );
}
