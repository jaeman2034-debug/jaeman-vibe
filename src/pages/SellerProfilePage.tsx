import React, { useEffect, useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore, doc, getDoc, collection, query, where, getDocs, orderBy,
} from "firebase/firestore";

type Seller = { 
  nickname?: string; 
  avgTrust?: number; 
  aiScore?: number;
  sellerScore?: number;
  summary?: string;
  strengths?: string[];
  risks?: string[];
  avgReviewScore?: number;
  totalReviews?: number;
  totalItems?: number;
  lastUpdated?: any;
};

type Review = { 
  id: string; 
  score: number; 
  comment: string; 
  createdAt?: any;
  txId?: string;
};

type Tx = { 
  id: string; 
  itemId: string; 
  amount: number; 
  status: string;
  createdAt?: any;
  itemSnapshot?: {
    title: string;
    imageUrl?: string;
  };
};

const SellerProfilePage: React.FC = () => {
  const sellerUid = window.location.pathname.split("/").pop();
  
  const cfg = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  
  let app, db;
  try {
    app = getApps().length ? getApps()[0] : initializeApp(cfg);
    db = getFirestore(app);
  } catch (error) {
    console.error('[SellerProfilePage] Firebase 초기???�패:', error);
    app = { name: 'dummy-app' };
    db = null;
  }

  const [seller, setSeller] = useState<Seller | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!sellerUid || !db) return;
      
      try {
        // ?�매???�보 로드
        const sellerSnap = await getDoc(doc(db, "sellers", sellerUid));
        if (sellerSnap.exists()) {
          setSeller(sellerSnap.data() as Seller);
        }

        // 리뷰 로드
        const reviewsQuery = query(
          collection(db, "reviews"),
          where("sellerUid", "==", sellerUid),
          orderBy("createdAt", "desc")
        );
        const reviewsSnap = await getDocs(reviewsQuery);
        const reviewsList: Review[] = [];
        reviewsSnap.forEach((doc) => {
          reviewsList.push({ id: doc.id, ...(doc.data() as any) });
        });
        setReviews(reviewsList);

        // 거래 ?�역 로드
        const txsQuery = query(
          collection(db, "transactions"),
          where("sellerUid", "==", sellerUid),
          orderBy("createdAt", "desc")
        );
        const txsSnap = await getDocs(txsQuery);
        const txsList: Tx[] = [];
        txsSnap.forEach((doc) => {
          txsList.push({ id: doc.id, ...(doc.data() as any) });
        });
        setTxs(txsList);

      } catch (error) {
        console.error("?�이??로드 ?�패:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [sellerUid, db]);

  const getScoreColor = (score?: number) => {
    if (!score) return "bg-gray-100 text-gray-700";
    if (score >= 80) return "bg-green-100 text-green-700";
    if (score >= 60) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "bg-green-100 text-green-700";
      case "CHATTING": return "bg-blue-100 text-blue-700";
      case "REQUESTED": return "bg-amber-100 text-amber-700";
      case "CANCELED": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "?�짜 ?�음";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("ko-KR");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">??/div>
          <h3 className="text-xl font-semibold text-slate-600 mb-2">불러?�는 중�?/h3>
          <p className="text-slate-500">?�매???�로?�을 가?�오�??�습?�다.</p>
        </div>
      </div>
    );
  }

  if (!sellerUid) {
    return (
      <div className="mx-auto max-w-3xl p-4">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">??/div>
          <h3 className="text-xl font-semibold text-slate-600 mb-2">?�못???�근?�니??/h3>
          <p className="text-slate-500">?�매??ID가 ?�바르�? ?�습?�다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => window.history.back()}
          className="text-slate-600 hover:text-slate-800 text-sm mb-4"
        >
          ???�로가�?        </button>
        <h1 className="text-2xl font-extrabold mb-2">?�� ?�매???�로??/h1>
      </div>

      {/* ?�매??기본 ?�보 */}
      <div className="border rounded-2xl p-6 bg-white shadow-sm mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-2xl">
            ?��
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-1">
              {seller?.nickname || `?�매??${sellerUid.slice(0, 8)}`}
            </h2>
            <p className="text-sm text-slate-600">
              ?�매??ID: {sellerUid.slice(0, 12)}...
            </p>
          </div>
        </div>

        {/* ?�뢰???�수??*/}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-sm font-semibold text-slate-700 mb-1">�??�용??리뷰 ?�점</div>
            <div className="text-lg font-bold text-slate-800">
              {seller?.avgReviewScore?.toFixed(1) || "0.0"} / 5.0
            </div>
            <div className="text-xs text-slate-500">
              �?{seller?.totalReviews || 0}�?리뷰
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-sm font-semibold text-slate-700 mb-1">?�� AI 종합 ?�뢰??/div>
            <div className="text-lg font-bold text-slate-800">
              {seller?.sellerScore || seller?.aiScore || 0} / 100
            </div>
            <div className="text-xs text-slate-500">
              AI 분석 기반
            </div>
          </div>
        </div>

        {/* AI ?�약 */}
        {seller?.summary && (
          <div className="mt-4 p-3 bg-blue-50 rounded-xl">
            <div className="text-sm font-semibold text-blue-700 mb-1">?�� AI ?�매???��?</div>
            <p className="text-sm text-blue-800">{seller.summary}</p>
          </div>
        )}

        {/* 강점�?주의??*/}
        {(seller?.strengths?.length || seller?.risks?.length) && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {seller?.strengths?.length && (
              <div className="p-3 bg-green-50 rounded-xl">
                <div className="text-sm font-semibold text-green-700 mb-1">??강점</div>
                <ul className="text-xs text-green-800 space-y-1">
                  {seller.strengths.map((strength, index) => (
                    <li key={index}>??{strength}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {seller?.risks?.length && (
              <div className="p-3 bg-orange-50 rounded-xl">
                <div className="text-sm font-semibold text-orange-700 mb-1">?�️ 주의??/div>
                <ul className="text-xs text-orange-800 space-y-1">
                  {seller.risks.map((risk, index) => (
                    <li key={index}>??{risk}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 거래 ?�계 */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="bg-white border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-slate-800">{txs.length}</div>
          <div className="text-sm text-slate-600">�?거래</div>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {txs.filter(t => t.status === "COMPLETED").length}
          </div>
          <div className="text-sm text-slate-600">?�료??거래</div>
        </div>
        <div className="bg-white border rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-slate-800">{seller?.totalItems || 0}</div>
          <div className="text-sm text-slate-600">?�록 ?�품</div>
        </div>
      </div>

      {/* 최근 거래 ?�역 */}
      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3">?�� 최근 거래 ?�역</h2>
        {txs.length === 0 ? (
          <div className="text-center py-8 bg-white border rounded-xl">
            <div className="text-4xl mb-2">?��</div>
            <p className="text-slate-500">?�직 거래 ?�역???�습?�다.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {txs.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="border rounded-xl p-3 bg-white shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="font-semibold text-sm">
                      {tx.itemSnapshot?.title || "?�품�??�음"}
                    </div>
                    <div className="text-xs text-slate-600">
                      ?�� {tx.amount?.toLocaleString()}??| {formatDate(tx.createdAt)}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusColor(tx.status)}`}>
                    {tx.status === "COMPLETED" ? "?�료" :
                     tx.status === "CHATTING" ? "채팅 �? :
                     tx.status === "REQUESTED" ? "?�청" :
                     tx.status === "CANCELED" ? "취소" : tx.status}
                  </span>
                </div>
              </div>
            ))}
            {txs.length > 5 && (
              <div className="text-center text-xs text-slate-500 py-2">
                ... ??{txs.length - 5}�?거래
              </div>
            )}
          </div>
        )}
      </div>

      {/* 리뷰 목록 */}
      <div>
        <h2 className="text-lg font-bold mb-3">?�� 구매??리뷰</h2>
        {reviews.length === 0 ? (
          <div className="text-center py-8 bg-white border rounded-xl">
            <div className="text-4xl mb-2">�?/div>
            <p className="text-slate-500">?�직 리뷰가 ?�습?�다.</p>
            <p className="text-xs text-slate-400 mt-1">�?거래 ??리뷰�?받아보세??</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="border rounded-xl p-4 bg-white shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex text-yellow-400">
                    {"??.repeat(review.score)}
                    {"??.repeat(5 - review.score)}
                  </div>
                  <span className="text-xs text-slate-500">
                    {formatDate(review.createdAt)}
                  </span>
                  {review.txId && (
                    <span className="text-xs text-slate-400">
                      거래 #{review.txId.slice(0, 6)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-700">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ?�단 ?�보 */}
      <div className="mt-8 text-center text-xs text-slate-500">
        <div>?�� ?�매???�로??| AI + ?�용??리뷰 기반 ?�뢰?��?</div>
        <div>?���??�전??거래�??�한 ?�명???�매???�보</div>
        <div>?�� ?�시�??�데?�트?�는 ?�뢰???�수</div>
      </div>
    </div>
  );
};

export default SellerProfilePage;
