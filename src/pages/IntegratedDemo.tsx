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

  // ?¤ì‹œê°??°ì´??êµ¬ë…
  useEffect(() => {
    // ?í’ˆ ëª©ë¡ êµ¬ë…
    const itemsUnsub = onSnapshot(
      query(collection(db, "marketItems"), orderBy("createdAt", "desc")),
      (snap) => {
        const items: MarketItem[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...(d.data() as any) }));
        setMarketItems(items);
      }
    );

    // ?ë§¤??ëª©ë¡ êµ¬ë…
    const sellersUnsub = onSnapshot(
      query(collection(db, "sellers"), orderBy("sellerScore", "desc")),
      (snap) => {
        const sellersList: Seller[] = [];
        snap.forEach((d) => sellersList.push({ id: d.id, ...(d.data() as any) }));
        setSellers(sellersList);
      }
    );

    // ê±°ë˜ ëª©ë¡ êµ¬ë…
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

  // AI ?ìŠ¤?¬ë¡œ ?„í—˜ ?‰ê? ?¸ì¶œ
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
      console.error("AI Escrow Risk ?¸ì¶œ ?¤íŒ¨:", error);
      return { success: false, error: String(error) };
    }
  };

  // ê±°ë˜ ?œì‘
  const startTransaction = async () => {
    if (!selectedItem) {
      alert("?í’ˆ??? íƒ?˜ì„¸??");
      return;
    }

    setLoading(true);
    const result = await callAiEscrowRisk(selectedItem.id, buyerUid, selectedItem.price);
    
    if (result.success) {
      setPrecheckResult(result.precheck);
      setCurrentTxId(result.txId || null);
      alert(`??AI ?¬ì „ê²€ì¦??„ë£Œ!\n?„í—˜?? ${result.precheck?.grade} (${result.precheck?.risk}/100)\n?ìŠ¤?¬ë¡œ: ${result.escrowRequired ? '?„ìš”' : 'ë¶ˆí•„??}`);
    } else {
      alert("??AI ?¬ì „ê²€ì¦??¤íŒ¨: " + result.error);
    }
    
    setLoading(false);
  };

  // ê²°ì œ ì§„í–‰
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
        "?›¡ï¸??ìŠ¤?¬ë¡œ ?ˆì¹˜ ?„ë£Œ! ?ˆì „?˜ê²Œ ê±°ë˜?˜ì„¸??" : 
        "???¼ë°˜ ê²°ì œ ?„ë£Œ!"
      );
    } catch (error) {
      console.error("Payment processing error:", error);
      alert("ê²°ì œ ì²˜ë¦¬ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    }
  };

  // ?ìŠ¤?¬ë¡œ ?´ì œ
  const releaseEscrow = async () => {
    if (!currentTxId) return;
    
    try {
      const ref = doc(db, "transactions", currentTxId);
      await updateDoc(ref, { 
        status: "RELEASED", 
        releasedAt: new Date(),
        releasedBy: "ADMIN"
      });
      alert("?’° ?ìŠ¤?¬ë¡œ ?´ì œ(?ë§¤???•ì‚°) ?„ë£Œ");
    } catch (error) {
      console.error("Escrow release error:", error);
      alert("?ìŠ¤?¬ë¡œ ?´ì œ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    }
  };

  // ?ìŠ¤?¬ë¡œ ?˜ë¶ˆ
  const refundEscrow = async () => {
    if (!currentTxId) return;
    
    try {
      const ref = doc(db, "transactions", currentTxId);
      await updateDoc(ref, { 
        status: "REFUNDED", 
        refundedAt: new Date(),
        refundedBy: "ADMIN"
      });
      alert("?’¸ ?ìŠ¤?¬ë¡œ ?˜ë¶ˆ ì²˜ë¦¬ ?„ë£Œ");
    } catch (error) {
      console.error("Escrow refund error:", error);
      alert("?ìŠ¤?¬ë¡œ ?˜ë¶ˆ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    }
  };

  // ?„í—˜???±ê¸‰ ?‰ìƒ
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
        <h1 className="text-3xl font-extrabold mb-2">?›¡ï¸?AI ê±°ë˜ ë³´ì¦ ?œìŠ¤???µí•© ?°ëª¨</h1>
        <p className="text-slate-600 mb-4">?¤ì œ ?°ì´???ë¦„?¼ë¡œ ?„ì „??ê±°ë˜ ?œë‚˜ë¦¬ì˜¤ ?ŒìŠ¤??/p>
        
        {/* ?µê³„ ?•ë³´ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{marketItems.length}</div>
            <div className="text-sm text-slate-600">?±ë¡ ?í’ˆ</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-green-600">{sellers.length}</div>
            <div className="text-sm text-slate-600">?ë§¤??/div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-purple-600">{transactions.length}</div>
            <div className="text-sm text-slate-600">ê±°ë˜ ?´ë ¥</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-orange-600">
              {transactions.filter(t => t.status === "ESCROW_HOLD").length}
            </div>
            <div className="text-sm text-slate-600">?ìŠ¤?¬ë¡œ</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ?í’ˆ ? íƒ */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4">?›’ ?í’ˆ ? íƒ</h2>
          
          <div className="space-y-3">
            <input
              className="w-full border rounded-xl px-3 py-2 text-sm"
              placeholder="êµ¬ë§¤??UID"
              value={buyerUid}
              onChange={(e) => setBuyerUid(e.target.value)}
            />
            
            <div className="text-sm text-slate-600 mb-2">?±ë¡???í’ˆ:</div>
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
                  ? ë¢°?? {item.trustScore?.total || 0}??| ?ë§¤?? {item.sellerUid}
                </div>
              </div>
            ))}
            
            {selectedItem && (
              <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                <div className="text-sm font-semibold text-blue-700">? íƒ???í’ˆ</div>
                <div className="text-sm text-blue-600">{selectedItem.title}</div>
                <div className="text-xs text-blue-500">
                  {selectedItem.price.toLocaleString()}??| ? ë¢°??{selectedItem.trustScore?.total || 0}??                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI ?„í—˜ ?‰ê? */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4">?§  AI ?„í—˜ ?‰ê?</h2>
          
          <div className="space-y-4">
            <button
              onClick={startTransaction}
              disabled={loading || !selectedItem}
              className="w-full bg-slate-900 text-white rounded-xl px-4 py-2 text-sm disabled:opacity-60 hover:bg-slate-800"
            >
              {loading ? "?§  AI ë¶„ì„ ì¤?.." : "?§  AI ?¬ì „ê²€ì¦??œì‘"}
            </button>

            {precheckResult && (
              <div className="space-y-3">
                {/* ?„í—˜???±ê¸‰ */}
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold">?„í—˜?‰ê? ê²°ê³¼</div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskBgColor(precheckResult.grade)}`}>
                    {precheckResult.grade} ({precheckResult.risk}/100)
                  </span>
                </div>

                {/* AI ì½”ë©˜??*/}
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="text-sm text-slate-700">{precheckResult.notes}</div>
                </div>

                {/* ?„í—˜ ?”ì†Œ */}
                {precheckResult.reasons && precheckResult.reasons.length > 0 && (
                  <div className="bg-red-50 p-3 rounded-xl">
                    <div className="text-sm font-semibold text-red-700 mb-2">? ï¸ ?„í—˜ ?”ì†Œ</div>
                    <ul className="text-xs text-red-600 list-disc ml-5 space-y-1">
                      {precheckResult.reasons.map((reason: string, index: number) => (
                        <li key={index}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* ê²°ì œ ëª¨ë“œ ê²°ì • */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border">
                  <div className="text-center mb-3">
                    {precheckResult.escrowRecommended || precheckResult.grade === "HIGH" ? (
                      <span className="font-semibold text-red-600">? ï¸ ?ìŠ¤?¬ë¡œ ëª¨ë“œ ?„ìš”</span>
                    ) : (
                      <span className="font-semibold text-emerald-600">???¼ë°˜ ê²°ì œ ê°€??/span>
                    )}
                  </div>
                  
                  <button
                    onClick={proceedPayment}
                    className="w-full rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 bg-white"
                  >
                    {precheckResult.escrowRecommended || precheckResult.grade === "HIGH" ? 
                      "?›¡ï¸??ìŠ¤?¬ë¡œ ?ˆì¹˜" : "?’³ ?¼ë°˜ ê²°ì œ"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ê±°ë˜ ê´€ë¦?*/}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4">?–ï¸ ê±°ë˜ ê´€ë¦?/h2>
          
          {currentTxId && precheckResult && (
            <div className="space-y-3">
              <div className="text-sm font-semibold">?„ì¬ ê±°ë˜</div>
              <div className="text-xs text-slate-600">TX ID: {currentTxId}</div>
              
              {(precheckResult.escrowRecommended || precheckResult.grade === "HIGH") && (
                <div className="flex gap-2">
                  <button
                    onClick={releaseEscrow}
                    className="flex-1 rounded-xl border px-3 py-2 text-xs hover:bg-slate-50 bg-white"
                  >
                    ?’° ?ìŠ¤?¬ë¡œ ?´ì œ
                  </button>
                  <button
                    onClick={refundEscrow}
                    className="flex-1 rounded-xl border px-3 py-2 text-xs hover:bg-slate-50 bg-white"
                  >
                    ?’¸ ?ìŠ¤?¬ë¡œ ?˜ë¶ˆ
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mt-4">
            <div className="text-sm font-semibold mb-2">ìµœê·¼ ê±°ë˜ ?´ë ¥</div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="p-2 border rounded text-xs">
                  <div className="font-semibold">{tx.itemInfo?.title || "?í’ˆ ?•ë³´ ?†ìŒ"}</div>
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

      {/* AutoMockDemo ì»´í¬?ŒíŠ¸ ì¶”ê? */}
      <AutoMockDemo />

      {/* ?˜ë‹¨ ?•ë³´ */}
      <div className="text-center text-xs text-slate-500 mt-8">
        <div>?›¡ï¸?AI ê±°ë˜ ë³´ì¦ ?œìŠ¤???µí•© ?°ëª¨ | ?¤ì œ ?°ì´???ë¦„ ?ŒìŠ¤??/div>
        <div>?“Š ?í’ˆ ?±ë¡ ??ê±°ë˜ ?ì„± ??AI ?‰ê? ??ê²°ì œ ?„í™˜ê¹Œì? ?„ì „???œë‚˜ë¦¬ì˜¤</div>
        <div>?” Firestore ?¤ì‹œê°??™ê¸°?”ë¡œ ëª¨ë“  ?íƒœ ë³€??ì¦‰ì‹œ ë°˜ì˜</div>
        <div>?§ª Mock ê±°ë˜ ?ë™ ?ì„±?¼ë¡œ ?„ì „ ?ë™ ?ŒìŠ¤??ê°€??/div>
      </div>
    </div>
  );
};

export default IntegratedDemo;
