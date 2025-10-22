/**
 * ??AI ê¸°ë°˜ ?í’ˆ ê²€??/ ì¶”ì²œ ?˜ì´ì§€
 * ê¸°ëŠ¥:
 *  - ?¬ìš©?ê? ê²€?‰ì–´ ?…ë ¥
 *  - AIê°€ ê²€?‰ì–´ë¥??°ê? ?œê·¸ë¡?ë³€?? *  - Firestore?ì„œ autoTags ë°°ì—´ê³?ë§¤ì¹­?˜ëŠ” ë¬¸ì„œ ê²€?? *  - ê´€???í’ˆ ?ë™ ì¶”ì²œ
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

  // === AI ê¸°ë°˜ ?œê·¸ ?•ì¥ê¸?===
  const expandTagsWithAI = async (text: string): Promise<string[]> => {
    try {
      // OpenAI APIë¡??°ê? ?œê·¸ ?ì„±
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        return toTags(text); // OpenAI ?†ìœ¼ë©?ê¸°ë³¸ ?œê·¸ ë³€??      }

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
              content: `"${text}"?€ ?°ê????¤í¬ì¸??©í’ˆ ?¤ì›Œ??5~8ê°œë? JSON ë°°ì—´ë¡?ì¶œë ¥?´ì¤˜. ?œêµ­?´ë¡œë§?
?? ["ì¶•êµ¬", "?´ë™??, "?˜ì´??, "ì¶•êµ¬??, "?¤í¬ì¸?, "? ë°œ"]`,
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
      
      // JSON ?Œì‹± ?œë„
      try {
        const parsed = JSON.parse(aiTags);
        return Array.isArray(parsed) ? parsed.map(String) : toTags(text);
      } catch {
        // JSON ?Œì‹± ?¤íŒ¨??ê¸°ë³¸ ?œê·¸ + AI ?‘ë‹µ?ì„œ ì¶”ì¶œ
        const basicTags = toTags(text);
        const aiWords = aiTags
          .replace(/[\[\]"']/g, "")
          .split(/[ ,\n]+/)
          .filter((w: string) => w.length > 1);
        return [...new Set([...basicTags, ...aiWords])];
      }
    } catch (error) {
      console.error("AI ?œê·¸ ?•ì¥ ?¤íŒ¨:", error);
      return toTags(text);
    }
  };

  // === ê¸°ë³¸ ?œê·¸ ë³€?˜ê¸° (ë°±ì—…?? ===
  const toTags = (text: string): string[] => {
    const clean = text
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .trim()
      .toLowerCase();
    const words = clean.split(/\s+/);
    // ë¶ˆí•„???¨ì–´ ?„í„°ë§?    const stop = ["?í’ˆ", "ë¬¼ê±´", "?œí’ˆ", "ê²€??, "ê´€??, "ì¶”ì²œ"];
    return words.filter((w) => !stop.includes(w) && w.length > 1);
  };

  // === ?œê·¸ ë§¤ì¹­ ?ìˆ˜ ê³„ì‚° ===
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
      // AIë¡??œê·¸ ?•ì¥
      setMsg("?§  AIê°€ ê²€?‰ì–´ë¥?ë¶„ì„?˜ì—¬ ?°ê? ?œê·¸ë¥??ì„± ì¤?..");
      const tags = await expandTagsWithAI(keyword);
      
      if (tags.length === 0) {
        setMsg("ê²€?‰ì–´?ì„œ ? íš¨???œê·¸ë¥?ì°¾ì? ëª»í–ˆ?µë‹ˆ??");
        setLoading(false);
        return;
      }

      console.log("?” AI ?•ì¥ ?œê·¸:", tags);
      setMsg(`AIê°€ ?ì„±??ê²€???œê·¸: ${tags.join(", ")}`);

      // Firestore ì¿¼ë¦¬
      const ref = collection(db, "marketItems");
      // ì²?ë²ˆì§¸ ?œê·¸ ê¸°ì??¼ë¡œ ê²€???œì‘
      const q = query(
        ref,
        where("autoTags", "array-contains-any", tags.slice(0, 5)),
        orderBy("updatedAt", "desc"),
        limit(20)
      );

      const snap = await getDocs(q);
      let data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // ?œê·¸ ë§¤ì¹­ ?ìˆ˜ë¡??•ë ¬
      data = data.sort((a, b) => matchScore(b, tags) - matchScore(a, tags));

      setResults(data);

      if (data.length === 0) {
        setMsg("ê´€???í’ˆ???†ìŠµ?ˆë‹¤.");
      } else {
        setMsg(`${data.length}ê°œì˜ ê´€???í’ˆ??ì°¾ì•˜?µë‹ˆ??`);
      }
    } catch (err) {
      console.error(err);
      setMsg("ê²€??ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl p-4">
      <h1 className="text-3xl font-bold mb-2">?§  AI ?œê·¸ ê¸°ë°˜ ê²€??/h1>
      <p className="text-gray-600 mb-6">
        ê²€?‰ì–´ë¥??…ë ¥?˜ë©´ AIê°€ ?ë™?¼ë¡œ ?°ê? ?í’ˆ??ì°¾ì•„?œë¦½?ˆë‹¤!
      </p>

      <form onSubmit={handleSearch} className="flex gap-3 mb-8">
        <input
          type="text"
          placeholder="?? ì¶•êµ¬?? ?˜ì´???´ë™?? ?„ë””?¤ìŠ¤, ?¤í¬ì¸???
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-1 rounded-xl border-2 border-gray-200 p-4 text-lg focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 font-semibold text-lg hover:opacity-90 transition"
          disabled={loading}
        >
          {loading ? "?” ê²€??ì¤?.." : "?? ê²€??}
        </button>
      </form>

      {msg && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
          <p className="text-blue-800 font-medium">{msg}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">?“¦ ê²€??ê²°ê³¼</h2>
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
                    {item.autoDescription || item.description || "?¤ëª… ?†ìŒ"}
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-green-600">
                      ??Number(item.price || 0).toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {item.category || "ê¸°í?"}
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
                          +{item.autoTags.length - 4}ê°?                        </span>
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
          <div className="text-6xl mb-4">?”</div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            ê²€??ê²°ê³¼ê°€ ?†ìŠµ?ˆë‹¤
          </h3>
          <p className="text-gray-500">
            ?¤ë¥¸ ?¤ì›Œ?œë¡œ ê²€?‰í•´ë³´ì„¸??
          </p>
        </div>
      )}
    </div>
  );
}
