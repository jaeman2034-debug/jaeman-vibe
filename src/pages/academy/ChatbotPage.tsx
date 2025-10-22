import React, { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import OpenAI from "openai";

export default function ChatbotPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question) return alert("ì§ˆë¬¸???…ë ¥?˜ì„¸??");
    setLoading(true);
    try {
      // ?”¹ Firestore ?°ì´???˜í”Œ ì¡°íšŒ
      const coursesSnap = await getDocs(collection(db, "academy", "courses", "list"));
      const attendanceSnap = await getDocs(collection(db, "academy", "attendance", "list"));
      const reportsSnap = await getDocs(collection(db, "academy", "reports", "list"));

      const courses = coursesSnap.docs.map((doc) => doc.data());
      const attendance = attendanceSnap.docs.map((doc) => doc.data());
      const reports = reportsSnap.docs.map((doc) => doc.data());

      // ?”¹ OpenAI ?¸ì¶œ
      const client = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "?ˆëŠ” ? ì†Œ???„ì¹´?°ë? ê´€ë¦?AI ?´ì‹œ?¤í„´?¸ì•¼. Firestore ?°ì´?°ë? ì°¸ê³ ??ì§ˆë¬¸???µí•´." },
          { role: "user", content: `ì§ˆë¬¸: ${question}\n\nê°•ì¢Œ ?°ì´?? ${JSON.stringify(courses)}\n\nì¶œì„ ?°ì´?? ${JSON.stringify(attendance)}\n\në¦¬í¬???°ì´?? ${JSON.stringify(reports)}` }
        ],
      });

      setAnswer(completion.choices[0].message?.content || "?µë? ?ì„± ?¤íŒ¨");
    } catch (err) {
      console.error("ì±—ë´‡ ?¤ë¥˜:", err);
      setAnswer("AI ?‘ë‹µ ?ì„± ?¤íŒ¨");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">AI ì±—ë´‡ ?ë‹´</h2>

      <div className="mb-4">
        <input
          className="border p-2 w-2/3 mr-2"
          placeholder="?„ì¹´?°ë? ê´€??ì§ˆë¬¸ ?…ë ¥..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded"
          onClick={handleAsk}
          disabled={loading}
        >
          {loading ? "?ì„± ì¤?.." : "ì§ˆë¬¸?˜ê¸°"}
        </button>
      </div>

      {answer && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h3 className="font-bold">AI ?µë?</h3>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}
