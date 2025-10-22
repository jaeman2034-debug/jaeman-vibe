import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getFirestore, collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { app } from "@/lib/firebase";

// ?�� FAQ ?�습 모드 + n8n Webhook AI ?��? ?�스??async function askAI(question: string): Promise<string> {
  const db = getFirestore(app);
  
  try {
    // 1) Firestore FAQ 먼�? 검??    const faqRef = collection(db, "academyQA");
    const snapshot = await getDocs(query(faqRef, where("question", "==", question)));

    if (!snapshot.empty) {
      const faq = snapshot.docs[0].data();
      return faq.answer || "관리자가 ?��? 준�?중입?�다.";
    }

    // 2) FAQ???�으�?OpenAI ?�출 (n8n webhook)
    const resp = await fetch("http://localhost:5678/webhook/academy-qa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await resp.json();

    // 3) Firestore????질문/?��? ?�??    const aiReply = data.answer || "?�️ ?��???불러?��? 못했?�니??";
    await addDoc(collection(db, "academyQA"), {
      question,
      answer: aiReply,
      createdAt: new Date(),
    });

    return aiReply;
  } catch (err) {
    console.error(err);
    return "???�버 ?�류 발생";
  }
}

export default function AcademyQA() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{question: string, answer: string}>>([]);
  const [n8nStatus, setN8nStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  
  const db = getFirestore(app);

  useEffect(() => {
    // n8n ?�버 ?�결 ?�태 ?�인
    const checkN8nStatus = async () => {
      try {
        const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL || "http://localhost:5678/webhook/academy-qa";
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ test: true }),
        });
        setN8nStatus(response.ok ? "connected" : "disconnected");
      } catch (err) {
        setN8nStatus("disconnected");
      }
    };
    
    checkN8nStatus();
    const interval = setInterval(checkN8nStatus, 30000); // 30초마???�태 ?�인
    return () => clearInterval(interval);
  }, []);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      // askAI ?�출 (FAQ 검??+ AI ?�답 + ?�동 ?�??
      const aiReply = await askAI(question);
      setAnswer(aiReply);
      
      // 채팅 ?�스?�리??추�?
      setChatHistory(prev => [...prev, { question, answer: aiReply }]);
    } catch (err) {
      console.error(err);
      setAnswer("???�류가 발생?�습?�다.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">?�� ?�카?��? Q&A 챗봇</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-600">AI ?�태:</span>
            <span className={`text-sm px-2 py-1 rounded ${
              n8nStatus === "connected" ? "bg-green-100 text-green-800" :
              n8nStatus === "connecting" ? "bg-yellow-100 text-yellow-800" :
              "bg-red-100 text-red-800"
            }`}>
              {n8nStatus === "connected" ? "?�� n8n AI ?�결?? :
               n8nStatus === "connecting" ? "?�� ?�결 �?.." :
               "?�� n8n AI ?�결 ?�됨"}
            </span>
          </div>
        </div>
        <Link 
          to="/academy-simple" 
          className="text-blue-500 hover:underline"
        >
          ???�카?��?�??�아가�?        </Link>
      </div>

              {/* 질문 ?�시 */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">?�� 질문 ?�시:</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>??"?�련 ?�간?� ?�떻�??�나??"</p>
                  <p>??"축구 강좌???�제 ?�나??"</p>
                  <p>??"주말 강좌 가격이 ?�마?��???"</p>
                  <p>??"?�록 ?�차???�떻�??�나??"</p>
                </div>
                <div className="text-xs text-blue-600 mt-2">
                  ?�� 관리자가 ?�정???��??� FAQ�??�?�되???�선 ?�시?�니??
                </div>
              </div>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="강좌???�??궁금???�을 ?�력?�세??.."
        className="border w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        rows={3}
      />
      <button
        onClick={handleAsk}
        disabled={loading || !question.trim()}
        className="mt-3 bg-blue-500 text-white px-6 py-2 rounded-lg disabled:opacity-50 hover:bg-blue-600 transition-colors"
      >
        {loading ? "?�� ?��? ?�성 �?.." : "?�� 질문?�기"}
      </button>
      
      {answer && (
        <div className="mt-4 p-4 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50">
          <div className="whitespace-pre-line text-gray-800">{answer}</div>
        </div>
      )}

      {/* 채팅 ?�스?�리 */}
      {chatHistory.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">?�� ?�???�스?�리</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {chatHistory.map((chat, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="bg-blue-100 p-2 rounded mb-2">
                  <strong>??질문:</strong> {chat.question}
                </div>
                <div className="bg-green-100 p-2 rounded">
                  <strong>?�� ?��?:</strong>
                  <div className="whitespace-pre-line mt-1">{chat.answer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
