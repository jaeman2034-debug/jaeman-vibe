import React, { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore, collection, onSnapshot, query, orderBy, where,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

type Transaction = {
  id: string;
  itemId: string;
  buyerUid: string;
  sellerUid?: string;
  amount?: number;
  status: string;
  createdAt?: any;
  type: string;
  locationSnapshot?: { lat: number; lng: number; address?: string };
  itemSnapshot?: {
    title: string;
    price: number;
    category?: string;
    imageUrl?: string;
  };
  buyerInfo?: {
    uid: string;
    requestTime: string;
  };
  progress?: {
    step: number;
    status: string;
    lastUpdated?: any;
  };
  conditions?: {
    paymentMethod: string;
    meetupLocation: string;
    meetupTime: string;
  };
};

const TransactionListPage: React.FC = () => {
  const cfg = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  
  let app, db, auth;
  try {
    app = getApps().length ? getApps()[0] : initializeApp(cfg);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error('[TransactionListPage] Firebase ì´ˆê¸°???¤íŒ¨:', error);
    app = { name: 'dummy-app' };
    db = null;
    auth = null;
  }

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ë¡œê·¸???íƒœ ?•ì¸
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      } else {
        setUid(null);
      }
    });
    return () => unsub();
  }, [auth]);

  // ê±°ë˜ ëª©ë¡ ë¶ˆëŸ¬?¤ê¸°
  useEffect(() => {
    if (!uid || !db) return;

    const q = query(
      collection(db, "transactions"),
      where("buyerUid", "==", uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const arr: Transaction[] = [];
      snap.forEach((doc) => {
        arr.push({ id: doc.id, ...(doc.data() as any) });
      });
      setTransactions(arr);
      setLoading(false);
    });

    return () => unsub();
  }, [db, uid]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "REQUESTED": return "bg-blue-100 text-blue-700";
      case "CHATTING": return "bg-yellow-100 text-yellow-700";
      case "MEETUP": return "bg-orange-100 text-orange-700";
      case "COMPLETED": return "bg-green-100 text-green-700";
      case "CANCELED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "REQUESTED": return "êµ¬ë§¤ ?”ì²­";
      case "CHATTING": return "ì±„íŒ… ì¤?;
      case "MEETUP": return "ë§Œë‚¨ ?ˆì •";
      case "COMPLETED": return "ê±°ë˜ ?„ë£Œ";
      case "CANCELED": return "ê±°ë˜ ì·¨ì†Œ";
      default: return status;
    }
  };

  if (!uid) {
    return (
      <div className="mx-auto max-w-4xl p-4">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">?”</div>
          <h3 className="text-xl font-semibold text-slate-600 mb-2">ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??/h3>
          <p className="text-slate-500">ê±°ë˜ ëª©ë¡??ë³´ë ¤ë©?ë¡œê·¸?¸í•´ì£¼ì„¸??</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-4">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">??/div>
          <h3 className="text-xl font-semibold text-slate-600 mb-2">ë¶ˆëŸ¬?¤ëŠ” ì¤‘â€?/h3>
          <p className="text-slate-500">ê±°ë˜ ëª©ë¡??ê°€?¸ì˜¤ê³??ˆìŠµ?ˆë‹¤.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => window.history.back()}
          className="text-slate-600 hover:text-slate-800 text-sm mb-4"
        >
          ???¤ë¡œê°€ê¸?        </button>
        <h1 className="text-2xl font-extrabold text-slate-800">??ê±°ë˜??/h1>
        <p className="text-slate-600 text-sm mt-2">
          ì´?{transactions.length}ê°œì˜ ê±°ë˜ ?”ì²­
        </p>
      </div>

      {/* ê±°ë˜ ëª©ë¡ */}
      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">?“¦</div>
          <h3 className="text-xl font-semibold text-slate-600 mb-2">ê±°ë˜ ?”ì²­???†ìŠµ?ˆë‹¤</h3>
          <p className="text-slate-500 mb-4">?„ì§ ê±°ë˜ ?”ì²­???˜ì? ?Šì•˜?µë‹ˆ??</p>
          <button
            onClick={() => window.location.href = "/market"}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            ?í’ˆ ?˜ëŸ¬ë³´ê¸°
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="bg-white border rounded-xl p-4 hover:shadow-md transition">
              <div className="grid gap-4 md:grid-cols-2">
                {/* ?í’ˆ ?•ë³´ */}
                <div className="flex gap-3">
                  <img
                    src={tx.itemSnapshot?.imageUrl || "https://via.placeholder.com/100x100?text=No+Image"}
                    alt={tx.itemSnapshot?.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{tx.itemSnapshot?.title}</h3>
                    <div className="text-sm text-slate-600 mb-1">
                      ?’° {tx.amount?.toLocaleString()}??                    </div>
                    <div className="text-xs text-slate-500">
                      ?“‚ {tx.itemSnapshot?.category || "ì¹´í…Œê³ ë¦¬ ë¯¸ë¶„ë¥?}
                    </div>
                  </div>
                </div>

                {/* ê±°ë˜ ?íƒœ */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(tx.status)}`}>
                      {getStatusText(tx.status)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {tx.createdAt?.toDate?.()?.toLocaleDateString() || "? ì§œ ?†ìŒ"}
                    </span>
                  </div>

                  {/* ê±°ë˜ ì¡°ê±´ */}
                  {tx.conditions && (
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>?’³ ê²°ì œ: {tx.conditions.paymentMethod}</div>
                      <div>?“ ?¥ì†Œ: {tx.conditions.meetupLocation}</div>
                      <div>???œê°„: {tx.conditions.meetupTime}</div>
                    </div>
                  )}

                  {/* ì§„í–‰ ?¨ê³„ */}
                  {tx.progress && (
                    <div className="text-xs text-slate-500">
                      ?¨ê³„ {tx.progress.step}/4: {tx.progress.status}
                    </div>
                  )}
                </div>
              </div>

              {/* ?¡ì…˜ ë²„íŠ¼ */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.href = `/product/${tx.itemId}`}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs hover:bg-slate-200 transition"
                  >
                    ?í’ˆ ë³´ê¸°
                  </button>
                  <button
                    onClick={() => alert("ì±„íŒ… ê¸°ëŠ¥?€ ?¤ìŒ ?¨ê³„?ì„œ êµ¬í˜„?©ë‹ˆ??")}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200 transition"
                  >
                    ì±„íŒ…?˜ê¸°
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ?˜ë‹¨ ?•ë³´ */}
      <div className="mt-8 text-center text-xs text-slate-500">
        <div>?›’ ?„ì „ ?µí•©??ë§ˆì¼“ | ê±°ë˜ ?”ì²­ ê´€ë¦?/div>
        <div>?’¬ ì±„íŒ… ê¸°ëŠ¥?€ ?¤ìŒ ?¨ê³„?ì„œ êµ¬í˜„ ?ˆì •</div>
        <div>?“ ?„ì¹˜ ?•ë³´ ê¸°ë°˜ ?ˆì „??ê±°ë˜</div>
      </div>
    </div>
  );
};

export default TransactionListPage;
