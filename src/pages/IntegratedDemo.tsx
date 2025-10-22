import React, { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import AutoMockDemo from "../components/AutoMockDemo";

type MarketItem = {
  id: string;
  title: string;
  price: number;
  sellerUid: string;
  trustScore?: {
    total: number;
    priceScore: number;
    brandScore: number;
    conditionScore: number;
    descScore: number;
  };
  category: string;
  desc: string;
  aiTags?: string[];
  createdAt?: any;
};

type Seller = {
  id: string;
  sellerScore: number;
  summary: string;
  strengths: string[];
  risks: string[];
  avgTrust: number;
  itemCount: number;
  categoryCount: number;
  brandCount: number;
  categories: string[];
  brands: string[];
  updatedAt?: any;
};

type Transaction = {
  id: string;
  txId: string;
  itemId: string;
  buyerUid: string;
  sellerUid: string;
  amount: number;
  precheck?: any;
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

const IntegratedDemo: React.FC = () => {
  const cfg = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  const app = getApps().length ? getApps()[0] : initializeApp(cfg);
  const db = getFirestore(app);

  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [buyerUid, setBuyerUid] = useState("buyer_demo_001");
  const [loading, setLoading] = useState(false);
  const [precheckResult, setPrecheckResult] = useState<any>(null);
  const [currentTxId, setCurrentTxId] = useState<string | null>(null);

  // ?�시�??�이??구독
  useEffect(() => {
    // ?�품 목록 구독
    const itemsUnsub = onSnapshot(
      query(collection(db, "marketItems"), orderBy("createdAt", "desc")),
      (snap) => {
        const items: MarketItem[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...(d.data() as any) }));
        setMarketItems(items);
      }
    );

    // ?�매??목록 구독
    const sellersUnsub = onSnapshot(
      query(collection(db, "sellers"), orderBy("sellerScore", "desc")),
      (snap) => {
        const sellersList: Seller[] = [];
        snap.forEach((d) => sellersList.push({ id: d.id, ...(d.data() as any) }));
        setSellers(sellersList);
      }
    );

    // 거래 목록 구독
    const transactionsUnsub = onSnapshot(
      query(collection(db, "transactions"), orderBy("createdAt", "desc")),
      (snap) => {
        const txList: Transaction[] = [];
        snap.forEach((d) => txList.push({ id: d.id, ...(d.data() as any) }));
        setTransactions(txList);
      }
    );

    return () => {
      itemsUnsub();
      sellersUnsub();
      transactionsUnsub();
    };
  }, [db]);

  // AI ?�스?�로 ?�험 ?��? ?�출
  const callAiEscrowRisk = async (itemId: string, buyerUid: string, amount: number) => {
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

  // 거래 ?�작
  const startTransaction = async () => {
    if (!selectedItem) {
      alert("?�품???�택?�세??");
      return;
    }

    setLoading(true);
    const result = await callAiEscrowRisk(selectedItem.id, buyerUid, selectedItem.price);
    
    if (result.success) {
      setPrecheckResult(result.precheck);
      setCurrentTxId(result.txId || null);
      alert(`??AI ?�전검�??�료!\n?�험?? ${result.precheck?.grade} (${result.precheck?.risk}/100)\n?�스?�로: ${result.escrowRequired ? '?�요' : '불필??}`);
    } else {
      alert("??AI ?�전검�??�패: " + result.error);
    }
    
    setLoading(false);
  };

  // 결제 진행
  const proceedPayment = async () => {
    if (!currentTxId || !precheckResult) return;
    
    try {
      const ref = doc(db, "transactions", currentTxId);
      const status = precheckResult.escrowRecommended || precheckResult.grade === "HIGH" ? "ESCROW_HOLD" : "PAID";
      
      await updateDoc(ref, { 
        status, 
        paidAt: new Date(),
        paymentMethod: "DEMO_PAYMENT",
        paymentId: `pay_${Date.now()}`
      });
      
      alert(status === "ESCROW_HOLD" ? 
        "?���??�스?�로 ?�치 ?�료! ?�전?�게 거래?�세??" : 
        "???�반 결제 ?�료!"
      );
    } catch (error) {
      console.error("Payment processing error:", error);
      alert("결제 처리 �??�류가 발생?�습?�다.");
    }
  };

  // ?�스?�로 ?�제
  const releaseEscrow = async () => {
    if (!currentTxId) return;
    
    try {
      const ref = doc(db, "transactions", currentTxId);
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

  // ?�스?�로 ?�불
  const refundEscrow = async () => {
    if (!currentTxId) return;
    
    try {
      const ref = doc(db, "transactions", currentTxId);
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
    <div className="mx-auto max-w-7xl p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold mb-2">?���?AI 거래 보증 ?�스???�합 ?�모</h1>
        <p className="text-slate-600 mb-4">?�제 ?�이???�름?�로 ?�전??거래 ?�나리오 ?�스??/p>
        
        {/* ?�계 ?�보 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{marketItems.length}</div>
            <div className="text-sm text-slate-600">?�록 ?�품</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-green-600">{sellers.length}</div>
            <div className="text-sm text-slate-600">?�매??/div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-purple-600">{transactions.length}</div>
            <div className="text-sm text-slate-600">거래 ?�력</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-orange-600">
              {transactions.filter(t => t.status === "ESCROW_HOLD").length}
            </div>
            <div className="text-sm text-slate-600">?�스?�로</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ?�품 ?�택 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4">?�� ?�품 ?�택</h2>
          
          <div className="space-y-3">
            <input
              className="w-full border rounded-xl px-3 py-2 text-sm"
              placeholder="구매??UID"
              value={buyerUid}
              onChange={(e) => setBuyerUid(e.target.value)}
            />
            
            <div className="text-sm text-slate-600 mb-2">?�록???�품:</div>
            {marketItems.map((item) => (
              <div
                key={item.id}
                className={`p-3 border rounded-xl cursor-pointer transition ${
                  selectedItem?.id === item.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-slate-50'
                }`}
                onClick={() => setSelectedItem(item)}
              >
                <div className="font-semibold text-sm">{item.title}</div>
                <div className="text-xs text-slate-600">
                  {item.price.toLocaleString()}??| {item.category}
                </div>
                <div className="text-xs text-slate-500">
                  ?�뢰?? {item.trustScore?.total || 0}??| ?�매?? {item.sellerUid}
                </div>
              </div>
            ))}
            
            {selectedItem && (
              <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                <div className="text-sm font-semibold text-blue-700">?�택???�품</div>
                <div className="text-sm text-blue-600">{selectedItem.title}</div>
                <div className="text-xs text-blue-500">
                  {selectedItem.price.toLocaleString()}??| ?�뢰??{selectedItem.trustScore?.total || 0}??                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI ?�험 ?��? */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4">?�� AI ?�험 ?��?</h2>
          
          <div className="space-y-4">
            <button
              onClick={startTransaction}
              disabled={loading || !selectedItem}
              className="w-full bg-slate-900 text-white rounded-xl px-4 py-2 text-sm disabled:opacity-60 hover:bg-slate-800"
            >
              {loading ? "?�� AI 분석 �?.." : "?�� AI ?�전검�??�작"}
            </button>

            {precheckResult && (
              <div className="space-y-3">
                {/* ?�험???�급 */}
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold">?�험?��? 결과</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskBgColor(precheckResult.grade)}`}>
                    {precheckResult.grade} ({precheckResult.risk}/100)
                  </span>
                </div>

                {/* AI 코멘??*/}
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="text-sm text-slate-700">{precheckResult.notes}</div>
                </div>

                {/* ?�험 ?�소 */}
                {precheckResult.reasons && precheckResult.reasons.length > 0 && (
                  <div className="bg-red-50 p-3 rounded-xl">
                    <div className="text-sm font-semibold text-red-700 mb-2">?�️ ?�험 ?�소</div>
                    <ul className="text-xs text-red-600 list-disc ml-5 space-y-1">
                      {precheckResult.reasons.map((reason: string, index: number) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 결제 모드 결정 */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border">
                  <div className="text-center mb-3">
                    {precheckResult.escrowRecommended || precheckResult.grade === "HIGH" ? (
                      <span className="font-semibold text-red-600">?�️ ?�스?�로 모드 ?�요</span>
                    ) : (
                      <span className="font-semibold text-emerald-600">???�반 결제 가??/span>
                    )}
                  </div>
                  
                  <button
                    onClick={proceedPayment}
                    className="w-full rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 bg-white"
                  >
                    {precheckResult.escrowRecommended || precheckResult.grade === "HIGH" ? 
                      "?���??�스?�로 ?�치" : "?�� ?�반 결제"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 거래 관�?*/}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4">?�️ 거래 관�?/h2>
          
          {currentTxId && precheckResult && (
            <div className="space-y-3">
              <div className="text-sm font-semibold">?�재 거래</div>
              <div className="text-xs text-slate-600">TX ID: {currentTxId}</div>
              
              {(precheckResult.escrowRecommended || precheckResult.grade === "HIGH") && (
                <div className="flex gap-2">
                  <button
                    onClick={releaseEscrow}
                    className="flex-1 rounded-xl border px-3 py-2 text-xs hover:bg-slate-50 bg-white"
                  >
                    ?�� ?�스?�로 ?�제
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
          )}

          <div className="mt-4">
            <div className="text-sm font-semibold mb-2">최근 거래 ?�력</div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="p-2 border rounded text-xs">
                  <div className="font-semibold">{tx.itemInfo?.title || "?�품 ?�보 ?�음"}</div>
                  <div className="text-slate-600">
                    {tx.amount.toLocaleString()}??| {tx.status}
                  </div>
                  {tx.precheck && (
                    <div className={`text-xs ${getRiskColor(tx.precheck.grade)}`}>
                      {tx.precheck.grade} ({tx.precheck.risk}/100)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AutoMockDemo 컴포?�트 추�? */}
      <AutoMockDemo />

      {/* ?�단 ?�보 */}
      <div className="text-center text-xs text-slate-500 mt-8">
        <div>?���?AI 거래 보증 ?�스???�합 ?�모 | ?�제 ?�이???�름 ?�스??/div>
        <div>?�� ?�품 ?�록 ??거래 ?�성 ??AI ?��? ??결제 ?�환까�? ?�전???�나리오</div>
        <div>?�� Firestore ?�시�??�기?�로 모든 ?�태 변??즉시 반영</div>
        <div>?�� Mock 거래 ?�동 ?�성?�로 ?�전 ?�동 ?�스??가??/div>
      </div>
    </div>
  );
};

export default IntegratedDemo;
