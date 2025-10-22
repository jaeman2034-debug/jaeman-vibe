import React, { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc, collection, onSnapshot, query, orderBy } from "firebase/firestore";

type Precheck = {
  risk: number;
  grade: "LOW" | "MEDIUM" | "HIGH";
  reasons: string[];
  escrowRecommended: boolean;
  notes: string;
  riskFactors?: {
    priceRisk: string;
    sellerRisk: string;
    itemRisk: string;
    transactionRisk: string;
  };
  recommendations?: string[];
};

type Transaction = {
  id: string;
  txId: string;
  itemId: string;
  buyerUid: string;
  sellerUid: string;
  amount: number;
  precheck?: Precheck;
  escrowRequired: boolean;
  status: string;
  createdAt?: any;
  paidAt?: any;
  releasedAt?: any;
  refundedAt?: any;
  itemInfo?: any;
  sellerInfo?: any;
  buyerInfo?: any;
};

const EscrowCheckout: React.FC = () => {
  const cfg = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  const app = getApps().length ? getApps()[0] : initializeApp(cfg);
  const db = getFirestore(app);

  // ?�모??쿼리 ?�라미터 (itemId, buyerUid, amount)
  const [itemId, setItemId] = useState("");
  const [buyerUid, setBuyerUid] = useState("");
  const [amount, setAmount] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);

  const [txId, setTxId] = useState<string | null>(null);
  const [precheck, setPrecheck] = useState<Precheck | null>(null);
  const [escrowRequired, setEscrowRequired] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // 기존 ?�랜??�� 목록 구독
  useEffect(() => {
    const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr: Transaction[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
      setTransactions(arr);
    }, (error) => {
      console.error("Transactions subscription error:", error);
    });
    return () => unsub();
  }, [db]);

  // AI ?�전 ?�험 ?��? ?�출
  const callAiEscrowRisk = async (): Promise<{ success: boolean; txId?: string; precheck?: Precheck; escrowRequired?: boolean; error?: string }> => {
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const functionUrl = `https://asia-northeast3-${projectId}.cloudfunctions.net/aiEscrowRisk`;
    
    try {
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          itemId, 
          buyerUid, 
          paymentAmount: amount 
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return { 
        success: true, 
        txId: data.txId, 
        precheck: data.precheck, 
        escrowRequired: data.escrowRequired 
      };
    } catch (error) {
      console.error("AI Escrow Risk ?�출 ?�패:", error);
      return { success: false, error: String(error) };
    }
  };

  const startPrecheck = async () => {
    if (!itemId || !buyerUid || !amount) {
      return alert("itemId / buyerUid / amount �??�력?�세??");
    }
    
    setLoading(true);
    const result = await callAiEscrowRisk();
    
    if (result.success) {
      setTxId(result.txId || null);
      setPrecheck(result.precheck || null);
      setEscrowRequired(Boolean(result.escrowRequired));
    } else {
      alert("?�전 ?�험 분석 ?�패: " + result.error);
    }
    
    setLoading(false);
  };

  const proceedPayment = async () => {
    if (!txId) return;
    
    try {
      // ?�� ?�제 PG ?�동 ?�???�텁 ?�로??      // escrowRequired�?'?�스?�로 ?�치' ?�태�? ?�니�?'?�반 결제 ?�료'�??�시
      const ref = doc(db, "transactions", txId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        return alert("Transaction not found");
      }

      const status = escrowRequired ? "ESCROW_HOLD" : "PAID";
      await updateDoc(ref, { 
        status, 
        paidAt: new Date(),
        paymentMethod: "DEMO_PAYMENT",
        paymentId: `pay_${Date.now()}`
      });
      
      alert(escrowRequired ? 
        "?���??�스?�로 ?�치 ?�료! ?�전?�게 거래?�세??" : 
        "???�반 결제 ?�료!"
      );
    } catch (error) {
      console.error("Payment processing error:", error);
      alert("결제 처리 �??�류가 발생?�습?�다.");
    }
  };

  const releaseEscrow = async () => {
    if (!txId) return;
    
    try {
      const ref = doc(db, "transactions", txId);
      await updateDoc(ref, { 
        status: "RELEASED", 
        releasedAt: new Date(),
        releasedBy: "ADMIN"
      });
      alert("?�� ?�스?�로 ?�제(?�매???�산) ?�료");
    } catch (error) {
      console.error("Escrow release error:", error);
      alert("?�스?�로 ?�제 �??�류가 발생?�습?�다.");
    }
  };

  const refundEscrow = async () => {
    if (!txId) return;
    
    try {
      const ref = doc(db, "transactions", txId);
      await updateDoc(ref, { 
        status: "REFUNDED", 
        refundedAt: new Date(),
        refundedBy: "ADMIN"
      });
      alert("?�� ?�스?�로 ?�불 처리 ?�료");
    } catch (error) {
      console.error("Escrow refund error:", error);
      alert("?�스?�로 ?�불 �??�류가 발생?�습?�다.");
    }
  };

  const clearForm = () => {
    setItemId("");
    setBuyerUid("");
    setAmount(undefined);
    setTxId(null);
    setPrecheck(null);
    setEscrowRequired(false);
  };

  // ?�계 ?�보
  const stats = {
    total: transactions.length,
    prechecked: transactions.filter(t => t.status === "PRECHECKED").length,
    paid: transactions.filter(t => t.status === "PAID").length,
    escrowHold: transactions.filter(t => t.status === "ESCROW_HOLD").length,
    released: transactions.filter(t => t.status === "RELEASED").length,
    refunded: transactions.filter(t => t.status === "REFUNDED").length
  };

  // ?�험???�급 ?�상
  const getRiskColor = (grade: string) => {
    switch (grade) {
      case "LOW": return "text-emerald-600";
      case "MEDIUM": return "text-amber-600";
      case "HIGH": return "text-red-600";
      default: return "text-slate-600";
    }
  };

  const getRiskBgColor = (grade: string) => {
    switch (grade) {
      case "LOW": return "bg-emerald-100 text-emerald-700";
      case "MEDIUM": return "bg-amber-100 text-amber-700";
      case "HIGH": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold mb-2">?���?AI 거래 보증 ?�스??/h1>
        <p className="text-slate-600 mb-4">결제 직전 AI ?�험 ?��? ???�험 ???�동 ?�스?�로 모드 ?�환</p>
        
        {/* ?�계 ?�보 */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
            <div className="text-sm text-slate-600">�?거래</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{stats.prechecked}</div>
            <div className="text-sm text-slate-600">?�전검�?/div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            <div className="text-sm text-slate-600">?�반결제</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-orange-600">{stats.escrowHold}</div>
            <div className="text-sm text-slate-600">?�스?�로</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-purple-600">{stats.released}</div>
            <div className="text-sm text-slate-600">?�산?�료</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-red-600">{stats.refunded}</div>
            <div className="text-sm text-slate-600">?�불?�료</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI ?�전 ?�험 ?��? ??*/}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4">?�� AI ?�전 ?�험 ?��?</h2>
          
          <div className="space-y-4">
            {/* ?�력 ?�드 */}
            <div className="grid grid-cols-1 gap-3">
              <input
                className="border rounded-xl px-3 py-2 text-sm"
                placeholder="itemId (marketItems 문서 ID) *"
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
              />
              <input
                className="border rounded-xl px-3 py-2 text-sm"
                placeholder="buyerUid (구매??UID) *"
                value={buyerUid}
                onChange={(e) => setBuyerUid(e.target.value)}
              />
              <input
                type="number"
                className="border rounded-xl px-3 py-2 text-sm"
                placeholder="결제금액 (?? *"
                value={amount ?? ""}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>

            {/* 버튼??*/}
            <div className="flex gap-3">
              <button
                onClick={startPrecheck}
                disabled={loading}
                className="flex-1 bg-slate-900 text-white rounded-xl px-4 py-2 text-sm disabled:opacity-60 hover:bg-slate-800"
              >
                {loading ? "?�� AI 분석 �?.." : "?�� AI ?�전검�??�작"}
              </button>
              <button
                onClick={clearForm}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50"
              >
                ?���?초기??              </button>
            </div>
          </div>
        </div>

        {/* AI ?�험 ?��? 결과 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4">?�️ AI ?�험 ?��? 결과</h2>
          
          {precheck ? (
            <div className="space-y-4">
              {/* ?�험???�급 */}
              <div className="flex items-center justify-between">
                <div className="text-base font-bold">결제 ???�험?��? 결과</div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskBgColor(precheck.grade)}`}>
                  {precheck.grade} ({precheck.risk}/100)
                </span>
              </div>

              {/* AI 코멘??*/}
              <div className="bg-slate-50 p-3 rounded-xl">
                <div className="text-sm text-slate-700">{precheck.notes}</div>
              </div>

              {/* ?�험 ?�소 */}
              {precheck.reasons && precheck.reasons.length > 0 && (
                <div className="bg-red-50 p-3 rounded-xl">
                  <div className="text-sm font-semibold text-red-700 mb-2">?�️ ?�험 ?�소</div>
                  <ul className="text-xs text-red-600 list-disc ml-5 space-y-1">
                    {precheck.reasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ?�세 ?�험 분석 */}
              {precheck.riskFactors && (
                <div className="bg-blue-50 p-3 rounded-xl">
                  <div className="text-sm font-semibold text-blue-700 mb-2">?�� ?�세 ?�험 분석</div>
                  <div className="space-y-2 text-xs">
                    <div><span className="font-semibold">가�??�험:</span> {precheck.riskFactors.priceRisk}</div>
                    <div><span className="font-semibold">?�매???�험:</span> {precheck.riskFactors.sellerRisk}</div>
                    <div><span className="font-semibold">?�품 ?�험:</span> {precheck.riskFactors.itemRisk}</div>
                    <div><span className="font-semibold">거래 ?�험:</span> {precheck.riskFactors.transactionRisk}</div>
                  </div>
                </div>
              )}

              {/* 권장?�항 */}
              {precheck.recommendations && precheck.recommendations.length > 0 && (
                <div className="bg-green-50 p-3 rounded-xl">
                  <div className="text-sm font-semibold text-green-700 mb-2">?�� 권장?�항</div>
                  <ul className="text-xs text-green-600 list-disc ml-5 space-y-1">
                    {precheck.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 결제 모드 결정 */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    {escrowRequired ? (
                      <span className="font-semibold text-red-600">?�️ ?�스?�로 모드가 권장/?�수?�니??</span>
                    ) : (
                      <span className="font-semibold text-emerald-600">???�반 결제 가??(??? ?�험)</span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={proceedPayment}
                    className="flex-1 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 bg-white"
                  >
                    {escrowRequired ? "?���??�스?�로 ?�치" : "?�� ?�반 결제"}
                  </button>
                </div>

                {/* ?�영???�후 버튼 (?�모?? */}
                {escrowRequired && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={releaseEscrow}
                      className="flex-1 rounded-xl border px-3 py-2 text-xs hover:bg-slate-50 bg-white"
                    >
                      ?�� ?�스?�로 ?�제(?�산)
                    </button>
                    <button
                      onClick={refundEscrow}
                      className="flex-1 rounded-xl border px-3 py-2 text-xs hover:bg-slate-50 bg-white"
                    >
                      ?�� ?�스?�로 ?�불
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-slate-500">AI ?�험 ?��? 결과가 ?�기???�시?�니??</div>
            </div>
          )}
        </div>
      </div>

      {/* 기존 ?�랜??�� 목록 */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">?�� 거래 ?�력</h2>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-slate-500">?�록??거래가 ?�습?�다.</div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {transactions.slice(0, 9).map((tx) => (
              <div
                key={tx.id}
                className="bg-white p-4 rounded-xl shadow-sm border"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm">{tx.itemInfo?.title || "?�품 ?�보 ?�음"}</div>
                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                      tx.status === "PAID" ? "bg-green-100 text-green-700" :
                      tx.status === "ESCROW_HOLD" ? "bg-orange-100 text-orange-700" :
                      tx.status === "RELEASED" ? "bg-purple-100 text-purple-700" :
                      tx.status === "REFUNDED" ? "bg-red-100 text-red-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {tx.status}
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-600">
                    {tx.amount.toLocaleString()}??| {tx.itemInfo?.category || "기�?"}
                  </div>
                  
                  {tx.precheck && (
                    <div className="text-xs">
                      <div className={`font-semibold ${getRiskColor(tx.precheck.grade)}`}>
                        ?�험?? {tx.precheck.grade} ({tx.precheck.risk}/100)
                      </div>
                      <div className="text-slate-500">
                        {tx.escrowRequired ? "?���??�스?�로" : "?�� ?�반결제"}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-slate-400">
                    {tx.createdAt ? 
                      new Date(tx.createdAt.toDate()).toLocaleDateString() : 
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
        <div>?���?AI 거래 보증 ?�스??| OpenAI GPT-4o-mini 기반 ?�시�??�험 ?��?</div>
        <div>?�️ 결제 직전 AI ?�험 분석 ???�동 ?�스?�로 모드 ?�환</div>
        <div>?�� ?�제 결제/?�산?� PG/?�??API?� ?�결?�세?? ???�이지??리스??검�?+ ?�스?�로 ?�태?�이 ?�모?�니??</div>
      </div>
    </div>
  );
};

export default EscrowCheckout;
