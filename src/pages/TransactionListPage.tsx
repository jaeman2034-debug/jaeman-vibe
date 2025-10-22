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
    console.error('[TransactionListPage] Firebase 초기???�패:', error);
    app = { name: 'dummy-app' };
    db = null;
    auth = null;
  }

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 로그???�태 ?�인
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

  // 거래 목록 불러?�기
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
      case "REQUESTED": return "구매 ?�청";
      case "CHATTING": return "채팅 �?;
      case "MEETUP": return "만남 ?�정";
      case "COMPLETED": return "거래 ?�료";
      case "CANCELED": return "거래 취소";
      default: return status;
    }
  };

  if (!uid) {
    return (
      <div className="mx-auto max-w-4xl p-4">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">?��</div>
          <h3 className="text-xl font-semibold text-slate-600 mb-2">로그?�이 ?�요?�니??/h3>
          <p className="text-slate-500">거래 목록??보려�?로그?�해주세??</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-4">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">??/div>
          <h3 className="text-xl font-semibold text-slate-600 mb-2">불러?�는 중�?/h3>
          <p className="text-slate-500">거래 목록??가?�오�??�습?�다.</p>
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
          ???�로가�?        </button>
        <h1 className="text-2xl font-extrabold text-slate-800">??거래??/h1>
        <p className="text-slate-600 text-sm mt-2">
          �?{transactions.length}개의 거래 ?�청
        </p>
      </div>

      {/* 거래 목록 */}
      {transactions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">?��</div>
          <h3 className="text-xl font-semibold text-slate-600 mb-2">거래 ?�청???�습?�다</h3>
          <p className="text-slate-500 mb-4">?�직 거래 ?�청???��? ?�았?�니??</p>
          <button
            onClick={() => window.location.href = "/market"}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            ?�품 ?�러보기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx) => (
            <div key={tx.id} className="bg-white border rounded-xl p-4 hover:shadow-md transition">
              <div className="grid gap-4 md:grid-cols-2">
                {/* ?�품 ?�보 */}
                <div className="flex gap-3">
                  <img
                    src={tx.itemSnapshot?.imageUrl || "https://via.placeholder.com/100x100?text=No+Image"}
                    alt={tx.itemSnapshot?.title}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{tx.itemSnapshot?.title}</h3>
                    <div className="text-sm text-slate-600 mb-1">
                      ?�� {tx.amount?.toLocaleString()}??                    </div>
                    <div className="text-xs text-slate-500">
                      ?�� {tx.itemSnapshot?.category || "카테고리 미분�?}
                    </div>
                  </div>
                </div>

                {/* 거래 ?�태 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(tx.status)}`}>
                      {getStatusText(tx.status)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {tx.createdAt?.toDate?.()?.toLocaleDateString() || "?�짜 ?�음"}
                    </span>
                  </div>

                  {/* 거래 조건 */}
                  {tx.conditions && (
                    <div className="text-xs text-slate-600 space-y-1">
                      <div>?�� 결제: {tx.conditions.paymentMethod}</div>
                      <div>?�� ?�소: {tx.conditions.meetupLocation}</div>
                      <div>???�간: {tx.conditions.meetupTime}</div>
                    </div>
                  )}

                  {/* 진행 ?�계 */}
                  {tx.progress && (
                    <div className="text-xs text-slate-500">
                      ?�계 {tx.progress.step}/4: {tx.progress.status}
                    </div>
                  )}
                </div>
              </div>

              {/* ?�션 버튼 */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.href = `/product/${tx.itemId}`}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs hover:bg-slate-200 transition"
                  >
                    ?�품 보기
                  </button>
                  <button
                    onClick={() => alert("채팅 기능?� ?�음 ?�계?�서 구현?�니??")}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200 transition"
                  >
                    채팅?�기
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ?�단 ?�보 */}
      <div className="mt-8 text-center text-xs text-slate-500">
        <div>?�� ?�전 ?�합??마켓 | 거래 ?�청 관�?/div>
        <div>?�� 채팅 기능?� ?�음 ?�계?�서 구현 ?�정</div>
        <div>?�� ?�치 ?�보 기반 ?�전??거래</div>
      </div>
    </div>
  );
};

export default TransactionListPage;
