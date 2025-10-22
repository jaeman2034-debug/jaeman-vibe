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
  const [disputeType, setDisputeType] = useState("?�품 ?�태 불일�?);
  const [buyerTrustScore, setBuyerTrustScore] = useState<number | undefined>();
  const [sellerTrustScore, setSellerTrustScore] = useState<number | undefined>();
  const [aiResult, setAiResult] = useState<DisputeResult | null>(null);
  const [status, setStatus] = useState("");
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  // 기존 분쟁 목록 구독
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

  // AI 분쟁 조정 ?�출
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
            condition: "거래 ?�시 ?�태"
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
      console.error("AI Dispute Resolver ?�출 ?�패:", error);
      return { success: false, error: String(error) };
    }
  };

  const handleResolve = async () => {
    if (!buyerStatement || !sellerStatement || !title) {
      return alert("모든 ?�수 ?�드�??�력?�세??");
    }

    setStatus("?�� AI 분석 �?..");
    const result = await callAiDisputeResolver();
    
    if (result.success) {
      setAiResult(result.result || null);
      setStatus("??AI 조정 ?�료");
    } else {
      setStatus(`??AI 조정 ?�패: ${result.error}`);
    }
  };

  const clearForm = () => {
    setBuyerStatement("");
    setSellerStatement("");
    setTitle("");
    setPrice(undefined);
    setDisputeType("?�품 ?�태 불일�?);
    setBuyerTrustScore(undefined);
    setSellerTrustScore(undefined);
    setAiResult(null);
    setStatus("");
  };

  // ?�계 ?�보
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
        <h1 className="text-3xl font-extrabold mb-2">?�️ AI 분쟁 조정 ?�시?�턴??/h1>
        <p className="text-slate-600 mb-4">YAGO VIBE ?�랫?�의 거래 ?�전�??�심 ?�진</p>
        
        {/* ?�계 ?�보 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
            <div className="text-sm text-slate-600">�?분쟁</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <div className="text-sm text-slate-600">조정 ?�료</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-slate-600">조정 ?�패</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{stats.avgConfidence}</div>
            <div className="text-sm text-slate-600">?�균 ?�뢰??/div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 분쟁 조정 ??*/}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4">?�� ?�로??분쟁 조정</h2>
          
          <div className="space-y-4">
            {/* 기본 ?�보 */}
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="거래 ?�품�?*"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border rounded-xl px-3 py-2 text-sm"
              />
              <input
                placeholder="가�?(??"
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
              <option value="?�품 ?�태 불일�?>?�품 ?�태 불일�?/option>
              <option value="?�불 ?�청">?�불 ?�청</option>
              <option value="거래 미이??>거래 미이??/option>
              <option value="배송 문제">배송 문제</option>
              <option value="가�?분쟁">가�?분쟁</option>
              <option value="기�?">기�?</option>
            </select>

            {/* ?�뢰???�보 */}
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="구매???�뢰??(0-100)"
                type="number"
                min="0"
                max="100"
                value={buyerTrustScore ?? ""}
                onChange={(e) => setBuyerTrustScore(Number(e.target.value))}
                className="border rounded-xl px-3 py-2 text-sm"
              />
              <input
                placeholder="?�매???�뢰??(0-100)"
                type="number"
                min="0"
                max="100"
                value={sellerTrustScore ?? ""}
                onChange={(e) => setSellerTrustScore(Number(e.target.value))}
                className="border rounded-xl px-3 py-2 text-sm"
              />
            </div>

            {/* 주장 ?�력 */}
            <textarea
              placeholder="구매??주장 *"
              value={buyerStatement}
              onChange={(e) => setBuyerStatement(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm h-24 w-full"
            />
            <textarea
              placeholder="?�매??주장 *"
              value={sellerStatement}
              onChange={(e) => setSellerStatement(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm h-24 w-full"
            />

            {/* 버튼??*/}
            <div className="flex gap-3">
              <button
                onClick={handleResolve}
                className="flex-1 bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-700"
              >
                ?�� AI 조정 ?�작
              </button>
              <button
                onClick={clearForm}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50"
              >
                ?���?초기??              </button>
            </div>
          </div>

          {status && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="text-sm text-blue-800">{status}</div>
            </div>
          )}
        </div>

        {/* AI 조정 결과 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4">?�️ AI 조정 결과</h2>
          
          {aiResult ? (
            <div className="space-y-4 text-sm">
              {/* ?�건 ?�약 */}
              <div className="bg-slate-50 p-3 rounded-xl">
                <div className="font-semibold text-slate-700 mb-2">?�� ?�건 ?�약</div>
                <div className="text-slate-600">{aiResult.summary}</div>
              </div>

              {/* ?�측 ?�장 */}
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-blue-50 p-3 rounded-xl">
                  <div className="font-semibold text-blue-700 mb-1">?��?�♂�?구매???�장</div>
                  <div className="text-blue-600 text-xs">{aiResult.buyerView}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-xl">
                  <div className="font-semibold text-green-700 mb-1">?��?��?�??�매???�장</div>
                  <div className="text-green-600 text-xs">{aiResult.sellerView}</div>
                </div>
              </div>

              {/* AI ?�단 */}
              <div className="bg-purple-50 p-3 rounded-xl">
                <div className="font-semibold text-purple-700 mb-2">?�️ AI ?�단</div>
                <div className="text-purple-600">{aiResult.aiDecision}</div>
              </div>

              {/* 책임 비율 */}
              <div className="bg-amber-50 p-3 rounded-xl">
                <div className="font-semibold text-amber-700 mb-2">?�� 책임 비율</div>
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-blue-600 font-bold">{aiResult.responsibility.buyer}%</div>
                    <div className="text-xs text-blue-500">구매??/div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-600 font-bold">{aiResult.responsibility.seller}%</div>
                    <div className="text-xs text-green-500">?�매??/div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-amber-600">
                  ?�뢰?? {aiResult.confidence}%
                </div>
              </div>

              {/* 권장 조치 */}
              <div className="bg-emerald-50 p-3 rounded-xl">
                <div className="font-semibold text-emerald-700 mb-2">?�� 권장 조치</div>
                <ul className="space-y-1">
                  {aiResult.recommendation.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-emerald-500 mr-2">??/span>
                      <span className="text-emerald-600 text-xs">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ?�음 ?�계 */}
              {aiResult.nextSteps && aiResult.nextSteps.length > 0 && (
                <div className="bg-orange-50 p-3 rounded-xl">
                  <div className="font-semibold text-orange-700 mb-2">?�� ?�음 ?�계</div>
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
              <div className="text-slate-500">분쟁 조정 결과가 ?�기???�시?�니??</div>
            </div>
          )}
        </div>
      </div>

      {/* 기존 분쟁 목록 */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">?�� 기존 분쟁 목록</h2>
        
        {loading ? (
          <div className="text-center py-4">
            <div className="text-slate-500">분쟁 목록??불러?�는 �?..</div>
          </div>
        ) : disputes.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-slate-500">?�록??분쟁???�습?�다.</div>
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
                    <div className="font-semibold text-sm">{dispute.transaction?.title || "?�목 ?�음"}</div>
                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                      dispute.status === "resolved" 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    }`}>
                      {dispute.status === "resolved" ? "?�료" : "?�패"}
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-600">
                    {dispute.disputeType} | {dispute.transaction?.price ? `${dispute.transaction.price.toLocaleString()}?? : '가�?미정'}
                  </div>
                  
                  {dispute.summary && (
                    <div className="text-xs text-slate-500 line-clamp-2">
                      {dispute.summary}
                    </div>
                  )}
                  
                  {dispute.responsibility && (
                    <div className="text-xs">
                      <div className="flex justify-between">
                        <span className="text-blue-600">구매??{dispute.responsibility.buyer}%</span>
                        <span className="text-green-600">?�매??{dispute.responsibility.seller}%</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-slate-400">
                    {dispute.createdAt ? 
                      new Date(dispute.createdAt.toDate()).toLocaleDateString() : 
                      '?�짜 ?�음'
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ?�단 ?�보 */}
      <div className="text-center text-xs text-slate-500 mt-8">
        <div>?�️ AI 분쟁 조정 ?�시?�턴??| OpenAI GPT-4o-mini 기반 중립??분석</div>
        <div>?���?객�???증거 분석 �?공정??책임 비율 ?�정</div>
        <div>?�� ?�시�?분쟁 모니?�링 �?조정 ?�력 관�?/div>
      </div>
    </div>
  );
};

export default DisputeResolver;
