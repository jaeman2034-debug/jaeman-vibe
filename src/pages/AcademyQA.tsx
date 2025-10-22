import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getFirestore, collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { app } from "@/lib/firebase";

// ?¤– FAQ ?™ìŠµ ëª¨ë“œ + n8n Webhook AI ?µë? ?œìŠ¤??async function askAI(question: string): Promise<string> {
  const db = getFirestore(app);
  
  try {
    // 1) Firestore FAQ ë¨¼ì? ê²€??    const faqRef = collection(db, "academyQA");
    const snapshot = await getDocs(query(faqRef, where("question", "==", question)));

    if (!snapshot.empty) {
      const faq = snapshot.docs[0].data();
      return faq.answer || "ê´€ë¦¬ìê°€ ?µë? ì¤€ë¹?ì¤‘ì…?ˆë‹¤.";
    }

    // 2) FAQ???†ìœ¼ë©?OpenAI ?¸ì¶œ (n8n webhook)
    const resp = await fetch("http://localhost:5678/webhook/academy-qa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    const data = await resp.json();

    // 3) Firestore????ì§ˆë¬¸/?µë? ?€??    const aiReply = data.answer || "? ï¸ ?µë???ë¶ˆëŸ¬?¤ì? ëª»í–ˆ?µë‹ˆ??";
    await addDoc(collection(db, "academyQA"), {
      question,
      answer: aiReply,
      createdAt: new Date(),
    });

    return aiReply;
  } catch (err) {
    console.error(err);
    return "???œë²„ ?¤ë¥˜ ë°œìƒ";
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
    // n8n ?œë²„ ?°ê²° ?íƒœ ?•ì¸
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
    const interval = setInterval(checkN8nStatus, 30000); // 30ì´ˆë§ˆ???íƒœ ?•ì¸
    return () => clearInterval(interval);
  }, []);

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoading(true);
    try {
      // askAI ?¸ì¶œ (FAQ ê²€??+ AI ?‘ë‹µ + ?ë™ ?€??
      const aiReply = await askAI(question);
      setAnswer(aiReply);
      
      // ì±„íŒ… ?ˆìŠ¤? ë¦¬??ì¶”ê?
      setChatHistory(prev => [...prev, { question, answer: aiReply }]);
    } catch (err) {
      console.error(err);
      setAnswer("???¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold">?’¬ ?„ì¹´?°ë? Q&A ì±—ë´‡</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-600">AI ?íƒœ:</span>
            <span className={`text-sm px-2 py-1 rounded ${
              n8nStatus === "connected" ? "bg-green-100 text-green-800" :
              n8nStatus === "connecting" ? "bg-yellow-100 text-yellow-800" :
              "bg-red-100 text-red-800"
            }`}>
              {n8nStatus === "connected" ? "?Ÿ¢ n8n AI ?°ê²°?? :
               n8nStatus === "connecting" ? "?Ÿ¡ ?°ê²° ì¤?.." :
               "?”´ n8n AI ?°ê²° ?ˆë¨"}
            </span>
          </div>
        </div>
        <Link 
          to="/academy-simple" 
          className="text-blue-500 hover:underline"
        >
          ???„ì¹´?°ë?ë¡??Œì•„ê°€ê¸?        </Link>
      </div>

              {/* ì§ˆë¬¸ ?ˆì‹œ */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">?’¡ ì§ˆë¬¸ ?ˆì‹œ:</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>??"?ˆë ¨ ?œê°„?€ ?´ë–»ê²??˜ë‚˜??"</p>
                  <p>??"ì¶•êµ¬ ê°•ì¢Œ???¸ì œ ?˜ë‚˜??"</p>
                  <p>??"ì£¼ë§ ê°•ì¢Œ ê°€ê²©ì´ ?¼ë§ˆ?¸ê???"</p>
                  <p>??"?±ë¡ ?ˆì°¨???´ë–»ê²??˜ë‚˜??"</p>
                </div>
                <div className="text-xs text-blue-600 mt-2">
                  ?“š ê´€ë¦¬ìê°€ ?˜ì •???µë??€ FAQë¡??€?¥ë˜???°ì„  ?œì‹œ?©ë‹ˆ??
                </div>
              </div>

      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="ê°•ì¢Œ???€??ê¶ê¸ˆ???ì„ ?…ë ¥?˜ì„¸??.."
        className="border w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        rows={3}
      />
      <button
        onClick={handleAsk}
        disabled={loading || !question.trim()}
        className="mt-3 bg-blue-500 text-white px-6 py-2 rounded-lg disabled:opacity-50 hover:bg-blue-600 transition-colors"
      >
        {loading ? "?¤– ?µë? ?ì„± ì¤?.." : "?’¬ ì§ˆë¬¸?˜ê¸°"}
      </button>
      
      {answer && (
        <div className="mt-4 p-4 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50">
          <div className="whitespace-pre-line text-gray-800">{answer}</div>
        </div>
      )}

      {/* ì±„íŒ… ?ˆìŠ¤? ë¦¬ */}
      {chatHistory.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">?’¬ ?€???ˆìŠ¤? ë¦¬</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {chatHistory.map((chat, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="bg-blue-100 p-2 rounded mb-2">
                  <strong>??ì§ˆë¬¸:</strong> {chat.question}
                </div>
                <div className="bg-green-100 p-2 rounded">
                  <strong>?¤– ?µë?:</strong>
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
