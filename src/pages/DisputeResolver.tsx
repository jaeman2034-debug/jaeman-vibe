import React, { useState, useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, orderBy } from "firebase/firestore";

type DisputeResult = {
  summary: string;
  buyerView: string;
  sellerView: string;
  aiDecision: string;
  responsibility: {
    buyer: number;
    seller: number;
  };
  recommendation: string[];
  evidence: {
    buyerEvidence: string[];
    sellerEvidence: string[];
  };
  confidence: number;
  nextSteps: string[];
};

type Dispute = {
  id: string;
  disputeId: string;
  buyer: any;
  seller: any;
  transaction: any;
  disputeType: string;
  status: string;
  resolvedAt?: any;
  createdAt?: any;
  summary?: string;
  aiDecision?: string;
  responsibility?: any;
  recommendation?: string[];
  confidence?: number;
};

const DisputeResolver: React.FC = () => {
  const cfg = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  const app = getApps().length ? getApps()[0] : initializeApp(cfg);
  const db = getFirestore(app);

  const [buyerStatement, setBuyerStatement] = useState("");
  const [sellerStatement, setSellerStatement] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<number | undefined>();
  const [disputeType, setDisputeType] = useState("?í’ˆ ?íƒœ ë¶ˆì¼ì¹?);
  const [buyerTrustScore, setBuyerTrustScore] = useState<number | undefined>();
  const [sellerTrustScore, setSellerTrustScore] = useState<number | undefined>();
  const [aiResult, setAiResult] = useState<DisputeResult | null>(null);
  const [status, setStatus] = useState("");
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  // ê¸°ì¡´ ë¶„ìŸ ëª©ë¡ êµ¬ë…
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "disputes"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr: Dispute[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
      setDisputes(arr);
      setLoading(false);
    }, (error) => {
      console.error("Disputes subscription error:", error);
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  // AI ë¶„ìŸ ì¡°ì • ?¸ì¶œ
  const callAiDisputeResolver = async (): Promise<{ success: boolean; result?: DisputeResult; error?: string }> => {
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const functionUrl = `https://asia-northeast3-${projectId}.cloudfunctions.net/aiDisputeResolver`;
    
    try {
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          disputeId: "disp-" + Date.now(),
          buyer: { 
            statement: buyerStatement,
            trustScore: buyerTrustScore || 50
          },
          seller: { 
            statement: sellerStatement,
            trustScore: sellerTrustScore || 50
          },
          transaction: { 
            title, 
            price, 
            trustScore: { total: 70 },
            date: new Date().toISOString(),
            condition: "ê±°ë˜ ?¹ì‹œ ?íƒœ"
          },
          disputeType: disputeType
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return { success: true, result: data.result };
    } catch (error) {
      console.error("AI Dispute Resolver ?¸ì¶œ ?¤íŒ¨:", error);
      return { success: false, error: String(error) };
    }
  };

  const handleResolve = async () => {
    if (!buyerStatement || !sellerStatement || !title) {
      return alert("ëª¨ë“  ?„ìˆ˜ ?„ë“œë¥??…ë ¥?˜ì„¸??");
    }

    setStatus("?§  AI ë¶„ì„ ì¤?..");
    const result = await callAiDisputeResolver();
    
    if (result.success) {
      setAiResult(result.result || null);
      setStatus("??AI ì¡°ì • ?„ë£Œ");
    } else {
      setStatus(`??AI ì¡°ì • ?¤íŒ¨: ${result.error}`);
    }
  };

  const clearForm = () => {
    setBuyerStatement("");
    setSellerStatement("");
    setTitle("");
    setPrice(undefined);
    setDisputeType("?í’ˆ ?íƒœ ë¶ˆì¼ì¹?);
    setBuyerTrustScore(undefined);
    setSellerTrustScore(undefined);
    setAiResult(null);
    setStatus("");
  };

  // ?µê³„ ?•ë³´
  const stats = {
    total: disputes.length,
    resolved: disputes.filter(d => d.status === "resolved").length,
    failed: disputes.filter(d => d.status === "failed").length,
    avgConfidence: disputes.length > 0 ? 
      Math.round(disputes.reduce((sum, d) => sum + (d.confidence || 0), 0) / disputes.length) : 0
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold mb-2">?–ï¸ AI ë¶„ìŸ ì¡°ì • ?´ì‹œ?¤í„´??/h1>
        <p className="text-slate-600 mb-4">YAGO VIBE ?Œë«?¼ì˜ ê±°ë˜ ?ˆì „ë§??µì‹¬ ?”ì§„</p>
        
        {/* ?µê³„ ?•ë³´ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
            <div className="text-sm text-slate-600">ì´?ë¶„ìŸ</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-sm text-slate-600">ì¡°ì • ?„ë£Œ</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-slate-600">ì¡°ì • ?¤íŒ¨</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{stats.avgConfidence}</div>
            <div className="text-sm text-slate-600">?‰ê·  ? ë¢°??/div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ë¶„ìŸ ì¡°ì • ??*/}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4">?“ ?ˆë¡œ??ë¶„ìŸ ì¡°ì •</h2>
          
          <div className="space-y-4">
            {/* ê¸°ë³¸ ?•ë³´ */}
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="ê±°ë˜ ?í’ˆëª?*"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border rounded-xl px-3 py-2 text-sm"
              />
              <input
                placeholder="ê°€ê²?(??"
                type="number"
                value={price ?? ""}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="border rounded-xl px-3 py-2 text-sm"
              />
            </div>

            <select
              value={disputeType}
              onChange={(e) => setDisputeType(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm w-full"
            >
              <option value="?í’ˆ ?íƒœ ë¶ˆì¼ì¹?>?í’ˆ ?íƒœ ë¶ˆì¼ì¹?/option>
              <option value="?˜ë¶ˆ ?”ì²­">?˜ë¶ˆ ?”ì²­</option>
              <option value="ê±°ë˜ ë¯¸ì´??>ê±°ë˜ ë¯¸ì´??/option>
              <option value="ë°°ì†¡ ë¬¸ì œ">ë°°ì†¡ ë¬¸ì œ</option>
              <option value="ê°€ê²?ë¶„ìŸ">ê°€ê²?ë¶„ìŸ</option>
              <option value="ê¸°í?">ê¸°í?</option>
            </select>

            {/* ? ë¢°???•ë³´ */}
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="êµ¬ë§¤??? ë¢°??(0-100)"
                type="number"
                min="0"
                max="100"
                value={buyerTrustScore ?? ""}
                onChange={(e) => setBuyerTrustScore(Number(e.target.value))}
                className="border rounded-xl px-3 py-2 text-sm"
              />
              <input
                placeholder="?ë§¤??? ë¢°??(0-100)"
                type="number"
                min="0"
                max="100"
                value={sellerTrustScore ?? ""}
                onChange={(e) => setSellerTrustScore(Number(e.target.value))}
                className="border rounded-xl px-3 py-2 text-sm"
              />
            </div>

            {/* ì£¼ì¥ ?…ë ¥ */}
            <textarea
              placeholder="êµ¬ë§¤??ì£¼ì¥ *"
              value={buyerStatement}
              onChange={(e) => setBuyerStatement(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm h-24 w-full"
            />
            <textarea
              placeholder="?ë§¤??ì£¼ì¥ *"
              value={sellerStatement}
              onChange={(e) => setSellerStatement(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm h-24 w-full"
            />

            {/* ë²„íŠ¼??*/}
            <div className="flex gap-3">
              <button
                onClick={handleResolve}
                className="flex-1 bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-700"
              >
                ?§  AI ì¡°ì • ?œì‘
              </button>
              <button
                onClick={clearForm}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50"
              >
                ?—‘ï¸?ì´ˆê¸°??              </button>
            </div>
          </div>

          {status && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="text-sm text-blue-800">{status}</div>
            </div>
          )}
        </div>

        {/* AI ì¡°ì • ê²°ê³¼ */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4">?–ï¸ AI ì¡°ì • ê²°ê³¼</h2>
          
          {aiResult ? (
            <div className="space-y-4 text-sm">
              {/* ?¬ê±´ ?”ì•½ */}
              <div className="bg-slate-50 p-3 rounded-xl">
                <div className="font-semibold text-slate-700 mb-2">?§¾ ?¬ê±´ ?”ì•½</div>
                <div className="text-slate-600">{aiResult.summary}</div>
              </div>

              {/* ?‘ì¸¡ ?…ì¥ */}
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-blue-50 p-3 rounded-xl">
                  <div className="font-semibold text-blue-700 mb-1">?§?â™‚ï¸?êµ¬ë§¤???…ì¥</div>
                  <div className="text-blue-600 text-xs">{aiResult.buyerView}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-xl">
                  <div className="font-semibold text-green-700 mb-1">?§?â?ï¸??ë§¤???…ì¥</div>
                  <div className="text-green-600 text-xs">{aiResult.sellerView}</div>
                </div>
              </div>

              {/* AI ?ë‹¨ */}
              <div className="bg-purple-50 p-3 rounded-xl">
                <div className="font-semibold text-purple-700 mb-2">?–ï¸ AI ?ë‹¨</div>
                <div className="text-purple-600">{aiResult.aiDecision}</div>
              </div>

              {/* ì±…ì„ ë¹„ìœ¨ */}
              <div className="bg-amber-50 p-3 rounded-xl">
                <div className="font-semibold text-amber-700 mb-2">?“Š ì±…ì„ ë¹„ìœ¨</div>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-blue-600 font-bold">{aiResult.responsibility.buyer}%</div>
                    <div className="text-xs text-blue-500">êµ¬ë§¤??/div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-600 font-bold">{aiResult.responsibility.seller}%</div>
                    <div className="text-xs text-green-500">?ë§¤??/div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-amber-600">
                  ? ë¢°?? {aiResult.confidence}%
                </div>
              </div>

              {/* ê¶Œì¥ ì¡°ì¹˜ */}
              <div className="bg-emerald-50 p-3 rounded-xl">
                <div className="font-semibold text-emerald-700 mb-2">?’¡ ê¶Œì¥ ì¡°ì¹˜</div>
                <ul className="space-y-1">
                  {aiResult.recommendation.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-emerald-500 mr-2">??/span>
                      <span className="text-emerald-600 text-xs">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ?¤ìŒ ?¨ê³„ */}
              {aiResult.nextSteps && aiResult.nextSteps.length > 0 && (
                <div className="bg-orange-50 p-3 rounded-xl">
                  <div className="font-semibold text-orange-700 mb-2">?“‹ ?¤ìŒ ?¨ê³„</div>
                  <ul className="space-y-1">
                    {aiResult.nextSteps.map((step, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-orange-500 mr-2">??/span>
                        <span className="text-orange-600 text-xs">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-slate-500">ë¶„ìŸ ì¡°ì • ê²°ê³¼ê°€ ?¬ê¸°???œì‹œ?©ë‹ˆ??</div>
            </div>
          )}
        </div>
      </div>

      {/* ê¸°ì¡´ ë¶„ìŸ ëª©ë¡ */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">?“‹ ê¸°ì¡´ ë¶„ìŸ ëª©ë¡</h2>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="text-slate-500">ë¶„ìŸ ëª©ë¡??ë¶ˆëŸ¬?¤ëŠ” ì¤?..</div>
          </div>
        ) : disputes.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-slate-500">?±ë¡??ë¶„ìŸ???†ìŠµ?ˆë‹¤.</div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {disputes.slice(0, 6).map((dispute) => (
              <div
                key={dispute.id}
                className="bg-white p-4 rounded-xl shadow-sm border"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm">{dispute.transaction?.title || "?œëª© ?†ìŒ"}</div>
                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                      dispute.status === "resolved" 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    }`}>
                      {dispute.status === "resolved" ? "?„ë£Œ" : "?¤íŒ¨"}
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-600">
                    {dispute.disputeType} | {dispute.transaction?.price ? `${dispute.transaction.price.toLocaleString()}?? : 'ê°€ê²?ë¯¸ì •'}
                  </div>
                  
                  {dispute.summary && (
                    <div className="text-xs text-slate-500 line-clamp-2">
                      {dispute.summary}
                    </div>
                  )}
                  
                  {dispute.responsibility && (
                    <div className="text-xs">
                      <div className="flex justify-between">
                        <span className="text-blue-600">êµ¬ë§¤??{dispute.responsibility.buyer}%</span>
                        <span className="text-green-600">?ë§¤??{dispute.responsibility.seller}%</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-slate-400">
                    {dispute.createdAt ? 
                      new Date(dispute.createdAt.toDate()).toLocaleDateString() : 
                      '? ì§œ ?†ìŒ'
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ?˜ë‹¨ ?•ë³´ */}
      <div className="text-center text-xs text-slate-500 mt-8">
        <div>?–ï¸ AI ë¶„ìŸ ì¡°ì • ?´ì‹œ?¤í„´??| OpenAI GPT-4o-mini ê¸°ë°˜ ì¤‘ë¦½??ë¶„ì„</div>
        <div>?›¡ï¸?ê°ê???ì¦ê±° ë¶„ì„ ë°?ê³µì •??ì±…ì„ ë¹„ìœ¨ ?°ì •</div>
        <div>?“Š ?¤ì‹œê°?ë¶„ìŸ ëª¨ë‹ˆ?°ë§ ë°?ì¡°ì • ?´ë ¥ ê´€ë¦?/div>
      </div>
    </div>
  );
};

export default DisputeResolver;
