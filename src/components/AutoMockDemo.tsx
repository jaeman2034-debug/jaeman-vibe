import React, { useState } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const AutoMockDemo: React.FC = () => {
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const runDemo = async () => {
    setLoading(true);
    setStatus("?? Mock 거래 ?�성 �?..");

    try {
      // 1️⃣ Mock ?�이???�의
      const itemId = `demo_item_auto_${Date.now()}`;
      const buyerUid = `buyer_${Math.random().toString(36).substring(2, 6)}`;
      const sellerUid = `seller_${Math.random().toString(36).substring(2, 6)}`;
      const price = Math.floor(Math.random() * 40000) + 10000;
      
      // ?�덤 ?�뢰???�성 (30-90??
      const trustScore = Math.floor(Math.random() * 60) + 30;
      
      // ?�덤 카테고리 ?�성
      const categories = ["축구??, "?�니??, "�?, "?�품", "기�?"];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      // ?�덤 브랜???�성
      const brands = ["?�이??, "?�디?�스", "?�마", "미카??, "기�?"];
      const brand = brands[Math.floor(Math.random() * brands.length)];

      // 2️⃣ Firebase ?�정
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

      // 3️⃣ Firestore ?�품 ?�록
      setStatus("?�� Mock ?�품 ?�록 �?..");
      
      await setDoc(doc(db, "marketItems", itemId), {
        title: `AI ?�동 ?�성 ?�모 ?�품 (${brand} ${category})`,
        price,
        sellerUid,
        category,
        desc: `???�품?� AI ?�전검�??�나리오 ?�스?�용?�니?? ${brand} 브랜??${category} ?�품?�로, 가격�? ${price.toLocaleString()}?�입?�다.`,
        trustScore: { 
          total: trustScore,
          priceScore: Math.floor(Math.random() * 20) + 70,
          brandScore: Math.floor(Math.random() * 30) + 60,
          conditionScore: Math.floor(Math.random() * 25) + 65,
          descScore: Math.floor(Math.random() * 15) + 75
        },
        aiTags: {
          brand,
          condition: trustScore > 70 ? "좋음" : trustScore > 50 ? "보통" : "?�쁨",
          color: "?�덤",
          size: "M"
        },
        tags: [brand, category, "?�모", "?�동?�성"],
        createdAt: serverTimestamp(),
      });

      setStatus(`???�품 ?�록 ?�료 (${itemId})\n?�� 가�? ${price.toLocaleString()}??n?���?카테고리: ${category}\n?�� ?�뢰?? ${trustScore}??);

      // 4️⃣ Cloud Function ?�출
      setStatus("?�� AI ?�험??분석 �?..");
      
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
        throw new Error(data.error || "AI ?��? ?�패");
      }

      // 5️⃣ 결과 ?�??�??�시
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

      // 6️⃣ 결과 ?�시
      const riskEmoji = data.precheck.grade === "LOW" ? "?��" : 
                      data.precheck.grade === "MEDIUM" ? "?��" : "?��";
      
      const escrowEmoji = data.escrowRequired ? "?���? : "?��";
      
      setStatus(
        `?�� Mock 거래 ?�성 ?�공!\n\n` +
        `?�� ?�품: ${brand} ${category}\n` +
        `?�� 가�? ${price.toLocaleString()}??n` +
        `?�� ?�뢰?? ${trustScore}??n` +
        `?�� AI 분석 결과:\n` +
        `   ${riskEmoji} 리스?? ${data.precheck.risk}/100\n` +
        `   ?�� ?�급: ${data.precheck.grade}\n` +
        `   ${escrowEmoji} ?�스?�로: ${data.escrowRequired ? '?�요' : '불필??}\n` +
        `   ?�� 코멘?? ${data.precheck.notes}\n\n` +
        `?�� 거래 ID: ${data.txId}\n` +
        `??Firestore???�동 ?�???�료!`
      );

    } catch (err: any) {
      console.error("Mock Demo Error:", err);
      setStatus(`???�류 발생: ${err.message}\n\n?�� ?�결 방법:\n1. Cloud Function??배포?�었?��? ?�인\n2. Firebase ?�로?�트 ?�정 ?�인\n3. ?�트?�크 ?�결 ?�인`);
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
        <h2 className="text-xl font-bold text-slate-800">?�� ?�모 ?�나리오 ?�행</h2>
        <div className="flex gap-2">
          <button
            onClick={clearStatus}
            className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"
          >
            ?���?초기??          </button>
        </div>
      </div>
      
      <div className="mb-4 p-3 bg-blue-50 rounded-xl">
        <div className="text-sm text-blue-700 font-semibold mb-1">?? ?�동 ?�스???�나리오</div>
        <div className="text-xs text-blue-600">
          ??버튼???�릭?�면 AI가 ?�동?�로 Mock 거래�??�성?�고 ?�험?��? 분석?�니??
        </div>
      </div>

      <button
        onClick={runDemo}
        disabled={loading}
        className="w-full bg-slate-900 text-white px-4 py-3 rounded-xl text-sm hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed font-semibold"
      >
        {loading ? "?�� 처리 �?.." : "?? Mock 거래 ?�동 ?�성 + AI ?��?"}
      </button>

      {status && (
        <div className="mt-4 p-4 bg-slate-50 rounded-xl">
          <div className="text-sm font-semibold text-slate-700 mb-2">?�� ?�행 결과</div>
          <pre className="text-xs bg-white p-3 rounded-lg whitespace-pre-wrap text-slate-600 border overflow-x-auto">
            {status}
          </pre>
        </div>
      )}

      {lastResult && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border">
          <div className="text-sm font-semibold text-green-700 mb-2">?�� 최근 ?�성??거래</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><strong>?�품 ID:</strong> {lastResult.itemId}</div>
            <div><strong>거래 ID:</strong> {lastResult.txId}</div>
            <div><strong>구매??</strong> {lastResult.buyerUid}</div>
            <div><strong>?�매??</strong> {lastResult.sellerUid}</div>
            <div><strong>가�?</strong> {lastResult.price?.toLocaleString()}??/div>
            <div><strong>?�뢰??</strong> {lastResult.trustScore}??/div>
            <div><strong>?�험??</strong> {lastResult.precheck?.risk}/100</div>
            <div><strong>?�급:</strong> {lastResult.precheck?.grade}</div>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-slate-500">
        <div className="font-semibold mb-1">?�� ?�스???�나리오:</div>
        <ul className="list-disc ml-4 space-y-1">
          <li>?�덤 ?�품 ?�보 ?�성 (가�? 카테고리, 브랜??</li>
          <li>Firestore???�동 ?�록</li>
          <li>AI ?�험??분석 ?�행</li>
          <li>?�스?�로 ?�요???�단</li>
          <li>거래 ?�태 ?�동 ?�??/li>
        </ul>
      </div>
    </div>
  );
};

export default AutoMockDemo;
