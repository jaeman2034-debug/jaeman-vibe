import React, { useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const AutoMockDemo: React.FC = () => {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const runDemo = async () => {
    setLoading(true);
    setStatus("?? Mock ê±°ë˜ ?ì„± ì¤?..");

    try {
      // 1ï¸âƒ£ Mock ?°ì´???•ì˜
      const itemId = `demo_item_auto_${Date.now()}`;
      const buyerUid = `buyer_${Math.random().toString(36).substring(2, 6)}`;
      const sellerUid = `seller_${Math.random().toString(36).substring(2, 6)}`;
      const price = Math.floor(Math.random() * 40000) + 10000;
      
      // ?œë¤ ? ë¢°???ì„± (30-90??
      const trustScore = Math.floor(Math.random() * 60) + 30;
      
      // ?œë¤ ì¹´í…Œê³ ë¦¬ ?ì„±
      const categories = ["ì¶•êµ¬??, "? ë‹ˆ??, "ê³?, "?©í’ˆ", "ê¸°í?"];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      // ?œë¤ ë¸Œëœ???ì„±
      const brands = ["?˜ì´??, "?„ë””?¤ìŠ¤", "?¨ë§ˆ", "ë¯¸ì¹´??, "ê¸°í?"];
      const brand = brands[Math.floor(Math.random() * brands.length)];

      // 2ï¸âƒ£ Firebase ?¤ì •
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
      };

      const { getFirestore } = await import("firebase/firestore");
      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      const db = getFirestore(app);

      // 3ï¸âƒ£ Firestore ?í’ˆ ?±ë¡
      setStatus("?“¦ Mock ?í’ˆ ?±ë¡ ì¤?..");
      
      await setDoc(doc(db, "marketItems", itemId), {
        title: `AI ?ë™ ?ì„± ?°ëª¨ ?í’ˆ (${brand} ${category})`,
        price,
        sellerUid,
        category,
        desc: `???í’ˆ?€ AI ?¬ì „ê²€ì¦??œë‚˜ë¦¬ì˜¤ ?ŒìŠ¤?¸ìš©?…ë‹ˆ?? ${brand} ë¸Œëœ??${category} ?í’ˆ?¼ë¡œ, ê°€ê²©ì? ${price.toLocaleString()}?ì…?ˆë‹¤.`,
        trustScore: { 
          total: trustScore,
          priceScore: Math.floor(Math.random() * 20) + 70,
          brandScore: Math.floor(Math.random() * 30) + 60,
          conditionScore: Math.floor(Math.random() * 25) + 65,
          descScore: Math.floor(Math.random() * 15) + 75
        },
        aiTags: {
          brand,
          condition: trustScore > 70 ? "ì¢‹ìŒ" : trustScore > 50 ? "ë³´í†µ" : "?˜ì¨",
          color: "?œë¤",
          size: "M"
        },
        tags: [brand, category, "?°ëª¨", "?ë™?ì„±"],
        createdAt: serverTimestamp(),
      });

      setStatus(`???í’ˆ ?±ë¡ ?„ë£Œ (${itemId})\n?’° ê°€ê²? ${price.toLocaleString()}??n?·ï¸?ì¹´í…Œê³ ë¦¬: ${category}\n?“Š ? ë¢°?? ${trustScore}??);

      // 4ï¸âƒ£ Cloud Function ?¸ì¶œ
      setStatus("?§  AI ?„í—˜??ë¶„ì„ ì¤?..");
      
      const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      const functionUrl = `https://asia-northeast3-${projectId}.cloudfunctions.net/aiEscrowRisk`;
      
      const res = await fetch(functionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          buyerUid,
          paymentAmount: price,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      if (!data.ok) {
        throw new Error(data.error || "AI ?‰ê? ?¤íŒ¨");
      }

      // 5ï¸âƒ£ ê²°ê³¼ ?€??ë°??œì‹œ
      setLastResult({
        itemId,
        buyerUid,
        sellerUid,
        price,
        trustScore,
        category,
        brand,
        ...data
      });

      // 6ï¸âƒ£ ê²°ê³¼ ?œì‹œ
      const riskEmoji = data.precheck.grade === "LOW" ? "?Ÿ¢" : 
                      data.precheck.grade === "MEDIUM" ? "?Ÿ¡" : "?”´";
      
      const escrowEmoji = data.escrowRequired ? "?›¡ï¸? : "?’³";
      
      setStatus(
        `?¯ Mock ê±°ë˜ ?ì„± ?±ê³µ!\n\n` +
        `?“¦ ?í’ˆ: ${brand} ${category}\n` +
        `?’° ê°€ê²? ${price.toLocaleString()}??n` +
        `?“Š ? ë¢°?? ${trustScore}??n` +
        `?§  AI ë¶„ì„ ê²°ê³¼:\n` +
        `   ${riskEmoji} ë¦¬ìŠ¤?? ${data.precheck.risk}/100\n` +
        `   ?“ˆ ?±ê¸‰: ${data.precheck.grade}\n` +
        `   ${escrowEmoji} ?ìŠ¤?¬ë¡œ: ${data.escrowRequired ? '?„ìš”' : 'ë¶ˆí•„??}\n` +
        `   ?’¬ ì½”ë©˜?? ${data.precheck.notes}\n\n` +
        `?†” ê±°ë˜ ID: ${data.txId}\n` +
        `??Firestore???ë™ ?€???„ë£Œ!`
      );

    } catch (err: any) {
      console.error("Mock Demo Error:", err);
      setStatus(`???¤ë¥˜ ë°œìƒ: ${err.message}\n\n?’¡ ?´ê²° ë°©ë²•:\n1. Cloud Function??ë°°í¬?˜ì—ˆ?”ì? ?•ì¸\n2. Firebase ?„ë¡œ?íŠ¸ ?¤ì • ?•ì¸\n3. ?¤íŠ¸?Œí¬ ?°ê²° ?•ì¸`);
    } finally {
      setLoading(false);
    }
  };

  const clearStatus = () => {
    setStatus("");
    setLastResult(null);
  };

  return (
    <div className="p-6 border rounded-xl bg-white mt-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800">?§ª ?°ëª¨ ?œë‚˜ë¦¬ì˜¤ ?¤í–‰</h2>
        <div className="flex gap-2">
          <button
            onClick={clearStatus}
            className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
          >
            ?—‘ï¸?ì´ˆê¸°??          </button>
        </div>
      </div>
      
      <div className="mb-4 p-3 bg-blue-50 rounded-xl">
        <div className="text-sm text-blue-700 font-semibold mb-1">?? ?ë™ ?ŒìŠ¤???œë‚˜ë¦¬ì˜¤</div>
        <div className="text-xs text-blue-600">
          ??ë²„íŠ¼???´ë¦­?˜ë©´ AIê°€ ?ë™?¼ë¡œ Mock ê±°ë˜ë¥??ì„±?˜ê³  ?„í—˜?„ë? ë¶„ì„?©ë‹ˆ??
        </div>
      </div>

      <button
        onClick={runDemo}
        disabled={loading}
        className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl text-sm hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed font-semibold"
      >
        {loading ? "?”„ ì²˜ë¦¬ ì¤?.." : "?? Mock ê±°ë˜ ?ë™ ?ì„± + AI ?‰ê?"}
      </button>

      {status && (
        <div className="mt-4 p-4 bg-slate-50 rounded-xl">
          <div className="text-sm font-semibold text-slate-700 mb-2">?“Š ?¤í–‰ ê²°ê³¼</div>
          <pre className="text-xs bg-white p-3 rounded-lg whitespace-pre-wrap text-slate-600 border overflow-x-auto">
            {status}
          </pre>
        </div>
      )}

      {lastResult && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border">
          <div className="text-sm font-semibold text-green-700 mb-2">?¯ ìµœê·¼ ?ì„±??ê±°ë˜</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><strong>?í’ˆ ID:</strong> {lastResult.itemId}</div>
            <div><strong>ê±°ë˜ ID:</strong> {lastResult.txId}</div>
            <div><strong>êµ¬ë§¤??</strong> {lastResult.buyerUid}</div>
            <div><strong>?ë§¤??</strong> {lastResult.sellerUid}</div>
            <div><strong>ê°€ê²?</strong> {lastResult.price?.toLocaleString()}??/div>
            <div><strong>? ë¢°??</strong> {lastResult.trustScore}??/div>
            <div><strong>?„í—˜??</strong> {lastResult.precheck?.risk}/100</div>
            <div><strong>?±ê¸‰:</strong> {lastResult.precheck?.grade}</div>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-slate-500">
        <div className="font-semibold mb-1">?’¡ ?ŒìŠ¤???œë‚˜ë¦¬ì˜¤:</div>
        <ul className="list-disc ml-4 space-y-1">
          <li>?œë¤ ?í’ˆ ?•ë³´ ?ì„± (ê°€ê²? ì¹´í…Œê³ ë¦¬, ë¸Œëœ??</li>
          <li>Firestore???ë™ ?±ë¡</li>
          <li>AI ?„í—˜??ë¶„ì„ ?˜í–‰</li>
          <li>?ìŠ¤?¬ë¡œ ?„ìš”???ë‹¨</li>
          <li>ê±°ë˜ ?íƒœ ?ë™ ?€??/li>
        </ul>
      </div>
    </div>
  );
};

export default AutoMockDemo;
