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

  // ?°ëª¨??ì¿¼ë¦¬ ?Œë¼ë¯¸í„° (itemId, buyerUid, amount)
  const [itemId, setItemId] = useState("");
  const [buyerUid, setBuyerUid] = useState("");
  const [amount, setAmount] = useState<number | undefined>();
  const [loading, setLoading] = useState(false);

  const [txId, setTxId] = useState<string | null>(null);
  const [precheck, setPrecheck] = useState<Precheck | null>(null);
  const [escrowRequired, setEscrowRequired] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // ê¸°ì¡´ ?¸ëœ??…˜ ëª©ë¡ êµ¬ë…
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

  // AI ?¬ì „ ?„í—˜ ?‰ê? ?¸ì¶œ
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
      console.error("AI Escrow Risk ?¸ì¶œ ?¤íŒ¨:", error);
      return { success: false, error: String(error) };
    }
  };

  const startPrecheck = async () => {
    if (!itemId || !buyerUid || !amount) {
      return alert("itemId / buyerUid / amount ë¥??…ë ¥?˜ì„¸??");
    }
    
    setLoading(true);
    const result = await callAiEscrowRisk();
    
    if (result.success) {
      setTxId(result.txId || null);
      setPrecheck(result.precheck || null);
      setEscrowRequired(Boolean(result.escrowRequired));
    } else {
      alert("?¬ì „ ?„í—˜ ë¶„ì„ ?¤íŒ¨: " + result.error);
    }
    
    setLoading(false);
  };

  const proceedPayment = async () => {
    if (!txId) return;
    
    try {
      // ?”’ ?¤ì œ PG ?°ë™ ?€???¤í… ?Œë¡œ??      // escrowRequiredë©?'?ìŠ¤?¬ë¡œ ?ˆì¹˜' ?íƒœë¡? ?„ë‹ˆë©?'?¼ë°˜ ê²°ì œ ?„ë£Œ'ë¡??œì‹œ
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
        "?›¡ï¸??ìŠ¤?¬ë¡œ ?ˆì¹˜ ?„ë£Œ! ?ˆì „?˜ê²Œ ê±°ë˜?˜ì„¸??" : 
        "???¼ë°˜ ê²°ì œ ?„ë£Œ!"
      );
    } catch (error) {
      console.error("Payment processing error:", error);
      alert("ê²°ì œ ì²˜ë¦¬ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
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
      alert("?’° ?ìŠ¤?¬ë¡œ ?´ì œ(?ë§¤???•ì‚°) ?„ë£Œ");
    } catch (error) {
      console.error("Escrow release error:", error);
      alert("?ìŠ¤?¬ë¡œ ?´ì œ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
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
      alert("?’¸ ?ìŠ¤?¬ë¡œ ?˜ë¶ˆ ì²˜ë¦¬ ?„ë£Œ");
    } catch (error) {
      console.error("Escrow refund error:", error);
      alert("?ìŠ¤?¬ë¡œ ?˜ë¶ˆ ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
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

  // ?µê³„ ?•ë³´
  const stats = {
    total: transactions.length,
    prechecked: transactions.filter(t => t.status === "PRECHECKED").length,
    paid: transactions.filter(t => t.status === "PAID").length,
    escrowHold: transactions.filter(t => t.status === "ESCROW_HOLD").length,
    released: transactions.filter(t => t.status === "RELEASED").length,
    refunded: transactions.filter(t => t.status === "REFUNDED").length
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
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold mb-2">?›¡ï¸?AI ê±°ë˜ ë³´ì¦ ?œìŠ¤??/h1>
        <p className="text-slate-600 mb-4">ê²°ì œ ì§ì „ AI ?„í—˜ ?‰ê? ???„í—˜ ???ë™ ?ìŠ¤?¬ë¡œ ëª¨ë“œ ?„í™˜</p>
        
        {/* ?µê³„ ?•ë³´ */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
            <div className="text-sm text-slate-600">ì´?ê±°ë˜</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">{stats.prechecked}</div>
            <div className="text-sm text-slate-600">?¬ì „ê²€ì¦?/div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
            <div className="text-sm text-slate-600">?¼ë°˜ê²°ì œ</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-orange-600">{stats.escrowHold}</div>
            <div className="text-sm text-slate-600">?ìŠ¤?¬ë¡œ</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-purple-600">{stats.released}</div>
            <div className="text-sm text-slate-600">?•ì‚°?„ë£Œ</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="text-2xl font-bold text-red-600">{stats.refunded}</div>
            <div className="text-sm text-slate-600">?˜ë¶ˆ?„ë£Œ</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI ?¬ì „ ?„í—˜ ?‰ê? ??*/}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4">?” AI ?¬ì „ ?„í—˜ ?‰ê?</h2>
          
          <div className="space-y-4">
            {/* ?…ë ¥ ?„ë“œ */}
            <div className="grid grid-cols-1 gap-3">
              <input
                className="border rounded-xl px-3 py-2 text-sm"
                placeholder="itemId (marketItems ë¬¸ì„œ ID) *"
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
              />
              <input
                className="border rounded-xl px-3 py-2 text-sm"
                placeholder="buyerUid (êµ¬ë§¤??UID) *"
                value={buyerUid}
                onChange={(e) => setBuyerUid(e.target.value)}
              />
              <input
                type="number"
                className="border rounded-xl px-3 py-2 text-sm"
                placeholder="ê²°ì œê¸ˆì•¡ (?? *"
                value={amount ?? ""}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
            </div>

            {/* ë²„íŠ¼??*/}
            <div className="flex gap-3">
              <button
                onClick={startPrecheck}
                disabled={loading}
                className="flex-1 bg-slate-900 text-white rounded-xl px-4 py-2 text-sm disabled:opacity-60 hover:bg-slate-800"
              >
                {loading ? "?§  AI ë¶„ì„ ì¤?.." : "?§  AI ?¬ì „ê²€ì¦??œì‘"}
              </button>
              <button
                onClick={clearForm}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50"
              >
                ?—‘ï¸?ì´ˆê¸°??              </button>
            </div>
          </div>
        </div>

        {/* AI ?„í—˜ ?‰ê? ê²°ê³¼ */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold mb-4">?–ï¸ AI ?„í—˜ ?‰ê? ê²°ê³¼</h2>
          
          {precheck ? (
            <div className="space-y-4">
              {/* ?„í—˜???±ê¸‰ */}
              <div className="flex items-center justify-between">
                <div className="text-base font-bold">ê²°ì œ ???„í—˜?‰ê? ê²°ê³¼</div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskBgColor(precheck.grade)}`}>
                  {precheck.grade} ({precheck.risk}/100)
                </span>
              </div>

              {/* AI ì½”ë©˜??*/}
              <div className="bg-slate-50 p-3 rounded-xl">
                <div className="text-sm text-slate-700">{precheck.notes}</div>
              </div>

              {/* ?„í—˜ ?”ì†Œ */}
              {precheck.reasons && precheck.reasons.length > 0 && (
                <div className="bg-red-50 p-3 rounded-xl">
                  <div className="text-sm font-semibold text-red-700 mb-2">? ï¸ ?„í—˜ ?”ì†Œ</div>
                  <ul className="text-xs text-red-600 list-disc ml-5 space-y-1">
                    {precheck.reasons.map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ?ì„¸ ?„í—˜ ë¶„ì„ */}
              {precheck.riskFactors && (
                <div className="bg-blue-50 p-3 rounded-xl">
                  <div className="text-sm font-semibold text-blue-700 mb-2">?” ?ì„¸ ?„í—˜ ë¶„ì„</div>
                  <div className="space-y-2 text-xs">
                    <div><span className="font-semibold">ê°€ê²??„í—˜:</span> {precheck.riskFactors.priceRisk}</div>
                    <div><span className="font-semibold">?ë§¤???„í—˜:</span> {precheck.riskFactors.sellerRisk}</div>
                    <div><span className="font-semibold">?í’ˆ ?„í—˜:</span> {precheck.riskFactors.itemRisk}</div>
                    <div><span className="font-semibold">ê±°ë˜ ?„í—˜:</span> {precheck.riskFactors.transactionRisk}</div>
                  </div>
                </div>
              )}

              {/* ê¶Œì¥?¬í•­ */}
              {precheck.recommendations && precheck.recommendations.length > 0 && (
                <div className="bg-green-50 p-3 rounded-xl">
                  <div className="text-sm font-semibold text-green-700 mb-2">?’¡ ê¶Œì¥?¬í•­</div>
                  <ul className="text-xs text-green-600 list-disc ml-5 space-y-1">
                    {precheck.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ê²°ì œ ëª¨ë“œ ê²°ì • */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    {escrowRequired ? (
                      <span className="font-semibold text-red-600">? ï¸ ?ìŠ¤?¬ë¡œ ëª¨ë“œê°€ ê¶Œì¥/?„ìˆ˜?…ë‹ˆ??</span>
                    ) : (
                      <span className="font-semibold text-emerald-600">???¼ë°˜ ê²°ì œ ê°€??(??? ?„í—˜)</span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={proceedPayment}
                    className="flex-1 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 bg-white"
                  >
                    {escrowRequired ? "?›¡ï¸??ìŠ¤?¬ë¡œ ?ˆì¹˜" : "?’³ ?¼ë°˜ ê²°ì œ"}
                  </button>
                </div>

                {/* ?´ì˜???¬í›„ ë²„íŠ¼ (?°ëª¨?? */}
                {escrowRequired && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={releaseEscrow}
                      className="flex-1 rounded-xl border px-3 py-2 text-xs hover:bg-slate-50 bg-white"
                    >
                      ?’° ?ìŠ¤?¬ë¡œ ?´ì œ(?•ì‚°)
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
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-slate-500">AI ?„í—˜ ?‰ê? ê²°ê³¼ê°€ ?¬ê¸°???œì‹œ?©ë‹ˆ??</div>
            </div>
          )}
        </div>
      </div>

      {/* ê¸°ì¡´ ?¸ëœ??…˜ ëª©ë¡ */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">?“‹ ê±°ë˜ ?´ë ¥</h2>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-slate-500">?±ë¡??ê±°ë˜ê°€ ?†ìŠµ?ˆë‹¤.</div>
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
                    <div className="font-semibold text-sm">{tx.itemInfo?.title || "?í’ˆ ?•ë³´ ?†ìŒ"}</div>
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
                    {tx.amount.toLocaleString()}??| {tx.itemInfo?.category || "ê¸°í?"}
                  </div>
                  
                  {tx.precheck && (
                    <div className="text-xs">
                      <div className={`font-semibold ${getRiskColor(tx.precheck.grade)}`}>
                        ?„í—˜?? {tx.precheck.grade} ({tx.precheck.risk}/100)
                      </div>
                      <div className="text-slate-500">
                        {tx.escrowRequired ? "?›¡ï¸??ìŠ¤?¬ë¡œ" : "?’³ ?¼ë°˜ê²°ì œ"}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-slate-400">
                    {tx.createdAt ? 
                      new Date(tx.createdAt.toDate()).toLocaleDateString() : 
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
        <div>?›¡ï¸?AI ê±°ë˜ ë³´ì¦ ?œìŠ¤??| OpenAI GPT-4o-mini ê¸°ë°˜ ?¤ì‹œê°??„í—˜ ?‰ê?</div>
        <div>?–ï¸ ê²°ì œ ì§ì „ AI ?„í—˜ ë¶„ì„ ???ë™ ?ìŠ¤?¬ë¡œ ëª¨ë“œ ?„í™˜</div>
        <div>?” ?¤ì œ ê²°ì œ/?•ì‚°?€ PG/?€??API?€ ?°ê²°?˜ì„¸?? ???˜ì´ì§€??ë¦¬ìŠ¤??ê²€ì¦?+ ?ìŠ¤?¬ë¡œ ?íƒœ?„ì´ ?°ëª¨?…ë‹ˆ??</div>
      </div>
    </div>
  );
};

export default EscrowCheckout;
