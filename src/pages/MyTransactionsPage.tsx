import React, { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore, collection, query, where, onSnapshot, orderBy, updateDoc, doc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { Link } from "react-router-dom";
import ReviewForm from "../components/ReviewForm";

type Tx = {
  id: string;
  itemId: string;
  amount: number;
  status: string;
  createdAt?: any;
  precheck?: { grade?: string; risk?: number; notes?: string };
  itemSnapshot?: {
    title: string;
    price: number;
    category?: string;
    imageUrl?: string;
  };
  buyerUid: string;
  sellerUid?: string;
};

const MyTransactionsPage: React.FC = () => {
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
    console.error('[MyTransactionsPage] Firebase ì´ˆê¸°???¤íŒ¨:', error);
    app = { name: 'dummy-app' };
    db = null;
    auth = null;
  }

  const [uid, setUid] = useState<string | null>(null);
  const [list, setList] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) return;
    
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          setUid(cred.user.uid);
        } catch (error) {
          console.error("?µëª… ë¡œê·¸???¤íŒ¨:", error);
        }
      }
    });
    return () => unsub();
  }, [auth]);

  useEffect(() => {
    if (!uid || !db) return;
    
    const q = query(
      collection(db, "transactions"),
      where("buyerUid", "==", uid),
      orderBy("createdAt", "desc")
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const arr: Tx[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as any) }));
      setList(arr);
      setLoading(false);
    });
    
    return () => unsub();
  }, [uid, db]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "REQUESTED": return "bg-amber-100 text-amber-700";
      case "CHATTING": return "bg-blue-100 text-blue-700";
      case "COMPLETED": return "bg-green-100 text-green-700";
      case "CANCELED": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "REQUESTED": return "êµ¬ë§¤ ?”ì²­";
      case "CHATTING": return "ì±„íŒ… ì¤?;
      case "COMPLETED": return "ê±°ë˜ ?„ë£Œ";
      case "CANCELED": return "ê±°ë˜ ì·¨ì†Œ";
      default: return status;
    }
  };

  const getRiskColor = (grade?: string) => {
    switch (grade) {
      case "LOW": return "bg-green-100 text-green-700";
      case "MEDIUM": return "bg-yellow-100 text-yellow-700";
      case "HIGH": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // ê±°ë˜ ?íƒœ ë³€ê²??¨ìˆ˜
  const handleUpdateStatus = async (txId: string, status: string) => {
    if (!db) return;
    
    setUpdating(txId);
    try {
      await updateDoc(doc(db, "transactions", txId), { 
        status,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("ê±°ë˜ ?íƒœ ë³€ê²??¤íŒ¨:", error);
      alert("ê±°ë˜ ?íƒœ ë³€ê²½ì— ?¤íŒ¨?ˆìŠµ?ˆë‹¤.");
    } finally {
      setUpdating(null);
    }
  };

  if (!uid) {
    return (
      <div className="mx-auto max-w-4xl p-4">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">?”</div>
          <h3 className="text-xl font-semibold text-slate-600 mb-2">ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??/h3>
          <p className="text-slate-500">ê±°ë˜ ?´ì—­??ë³´ë ¤ë©?ë¡œê·¸?¸í•´ì£¼ì„¸??</p>
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
          <p className="text-slate-500">ê±°ë˜ ?´ì—­??ê°€?¸ì˜¤ê³??ˆìŠµ?ˆë‹¤.</p>
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
        <h1 className="text-xl font-extrabold mb-3">?“¦ ??ê±°ë˜??/h1>
        <p className="text-slate-600 text-sm">
          ì´?{list.length}ê°œì˜ ê±°ë˜
        </p>
      </div>

      {/* ê±°ë˜ ëª©ë¡ */}
      {list.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">?“¦</div>
          <h3 className="text-xl font-semibold text-slate-600 mb-2">ê±°ë˜ ?´ì—­???†ìŠµ?ˆë‹¤</h3>
          <p className="text-slate-500 mb-4">?„ì§ ê±°ë˜ ?”ì²­???˜ì? ?Šì•˜?µë‹ˆ??</p>
          <button
            onClick={() => window.location.href = "/market"}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            ?í’ˆ ?˜ëŸ¬ë³´ê¸°
          </button>
        </div>
      ) : (
        <ul className="grid gap-3">
          {list.map((tx) => (
            <li
              key={tx.id}
              className="border rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition"
            >
              <div className="flex gap-3 mb-3">
                <img
                  src={tx.itemSnapshot?.imageUrl || "https://via.placeholder.com/80x80?text=No+Image"}
                  alt={tx.itemSnapshot?.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-semibold text-slate-800">
                      {tx.itemSnapshot?.title || "?í’ˆëª??†ìŒ"}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusColor(tx.status)}`}>
                      {getStatusText(tx.status)}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 mb-1">
                    ?’° {tx.amount?.toLocaleString()}??                  </div>
                  <div className="text-xs text-slate-500">
                    ?“‚ {tx.itemSnapshot?.category || "ì¹´í…Œê³ ë¦¬ ë¯¸ë¶„ë¥?}
                  </div>
                  <div className="text-xs text-slate-500">
                    ê±°ë˜ ID: #{tx.id.slice(0, 8)}...
                  </div>
                </div>
              </div>

              {/* AI ?‰ê? ê²°ê³¼ */}
              {tx.precheck?.grade && (
                <div className="mb-3 p-2 bg-slate-50 rounded-lg">
                  <div className="text-xs font-semibold text-slate-700 mb-1">?§  AI ê±°ë˜ ?‰ê?</div>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getRiskColor(tx.precheck.grade)}`}>
                      {tx.precheck.grade} ?„í—˜??                    </span>
                    <span className="text-xs text-slate-600">
                      ?ìˆ˜: {tx.precheck.risk}/100
                    </span>
                  </div>
                  {tx.precheck.notes && (
                    <div className="text-xs text-slate-500 mt-1">
                      {tx.precheck.notes}
                    </div>
                  )}
                </div>
              )}

              {/* ?¡ì…˜ ë²„íŠ¼ */}
              <div className="flex gap-2 flex-wrap">
                <Link
                  to={`/chat/${tx.id}`}
                  className="text-xs px-3 py-1 border rounded-xl hover:bg-slate-50 transition"
                >
                  ?’¬ ì±„íŒ…
                </Link>
                <Link
                  to={`/product/${tx.itemId}`}
                  className="text-xs px-3 py-1 border rounded-xl hover:bg-slate-50 transition"
                >
                  ?” ?í’ˆë³´ê¸°
                </Link>
                {tx.sellerUid && (
                  <Link
                    to={`/seller/${tx.sellerUid}`}
                    className="text-xs px-3 py-1 border rounded-xl hover:bg-slate-50 transition"
                  >
                    ?‘¤ ?ë§¤??ë³´ê¸°
                  </Link>
                )}
                
                {/* ê±°ë˜ ?íƒœë³?ë²„íŠ¼ */}
                {tx.status === "REQUESTED" && (
                  <button
                    onClick={() => handleUpdateStatus(tx.id, "CHATTING")}
                    disabled={updating === tx.id}
                    className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition disabled:opacity-50"
                  >
                    {updating === tx.id ? "ì²˜ë¦¬ ì¤?.." : "???¹ì¸?˜ê¸°"}
                  </button>
                )}
                
                {tx.status === "CHATTING" && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(tx.id, "COMPLETED")}
                      disabled={updating === tx.id}
                      className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition disabled:opacity-50"
                    >
                      {updating === tx.id ? "ì²˜ë¦¬ ì¤?.." : "??ê±°ë˜ ?„ë£Œ"}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(tx.id, "CANCELED")}
                      disabled={updating === tx.id}
                      className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition disabled:opacity-50"
                    >
                      {updating === tx.id ? "ì²˜ë¦¬ ì¤?.." : "??ê±°ë˜ ì·¨ì†Œ"}
                    </button>
                  </>
                )}
              </div>
              
              {/* ë¦¬ë·° ?‘ì„± ??*/}
              {tx.status === "COMPLETED" && (
                <ReviewForm 
                  sellerUid={tx.sellerUid} 
                  txId={tx.id}
                  onComplete={() => {
                    // ë¦¬ë·° ?„ë£Œ ??ì¶”ê? ?¡ì…˜ (? íƒ?¬í•­)
                    console.log("ë¦¬ë·° ?‘ì„± ?„ë£Œ:", tx.id);
                  }}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {/* ?˜ë‹¨ ?•ë³´ */}
      <div className="mt-8 text-center text-xs text-slate-500">
        <div>?“¦ ?„ì „ ?µí•©??ê±°ë˜ ê´€ë¦?| êµ¬ë§¤ ?´ì—­ ?µí•©</div>
        <div>?’¬ ?¤ì‹œê°?ì±„íŒ…?¼ë¡œ ê±°ë˜ ?ì„¸ ì¡°ìœ¨</div>
        <div>?›¡ï¸?AI ?„í—˜???‰ê? ê¸°ë°˜ ?ˆì „ ê±°ë˜</div>
      </div>
    </div>
  );
};

export default MyTransactionsPage;
