import React, { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import OpenAI from "openai";

export default function ChatbotPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question) return alert("질문???�력?�세??");
    setLoading(true);
    try {
      // ?�� Firestore ?�이???�플 조회
      const coursesSnap = await getDocs(collection(db, "academy", "courses", "list"));
      const attendanceSnap = await getDocs(collection(db, "academy", "attendance", "list"));
      const reportsSnap = await getDocs(collection(db, "academy", "reports", "list"));

      const courses = coursesSnap.docs.map((doc) => doc.data());
      const attendance = attendanceSnap.docs.map((doc) => doc.data());
      const reports = reportsSnap.docs.map((doc) => doc.data());

      // ?�� OpenAI ?�출
      const client = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "?�는 ?�소???�카?��? 관�?AI ?�시?�턴?�야. Firestore ?�이?��? 참고??질문???�해." },
          { role: "user", content: `질문: ${question}\n\n강좌 ?�이?? ${JSON.stringify(courses)}\n\n출석 ?�이?? ${JSON.stringify(attendance)}\n\n리포???�이?? ${JSON.stringify(reports)}` }
        ],
      });

      setAnswer(completion.choices[0].message?.content || "?��? ?�성 ?�패");
    } catch (err) {
      console.error("챗봇 ?�류:", err);
      setAnswer("AI ?�답 ?�성 ?�패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">AI 챗봇 ?�담</h2>

      <div className="mb-4">
        <input
          className="border p-2 w-2/3 mr-2"
          placeholder="?�카?��? 관??질문 ?�력..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded"
          onClick={handleAsk}
          disabled={loading}
        >
          {loading ? "?�성 �?.." : "질문?�기"}
        </button>
      </div>

      {answer && (
        <div className="mt-4 p-4 border rounded bg-gray-50">
          <h3 className="font-bold">AI ?��?</h3>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}
