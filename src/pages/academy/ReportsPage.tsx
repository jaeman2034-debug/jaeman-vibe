import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import OpenAI from "openai";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  // 리포??불러?�기
  useEffect(() => {
    const fetchReports = async () => {
      const querySnapshot = await getDocs(collection(db, "academy", "reports", "list"));
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setReports(data);
    };
    fetchReports();
  }, []);

  // ?�� AI Summary ?�동 ?�성
  const generateReport = async () => {
    if (!title) return alert("리포???�목???�력?�세??);
    setLoading(true);
    try {
      const client = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "?�는 ?�소???�카?��? 코치 ?�시?�턴?�야. 출석/?�련 ?�이?��? 기반?�로 짧�? 리포???�약???�성??" },
          { role: "user", content: `리포???�목: ${title}. 최근 ?�련/출석 ?�약???�성?�줘.` }
        ],
      });
      const aiSummary = completion.choices[0].message?.content || "?�약 ?�성 ?�패";

      await addDoc(collection(db, "academy", "reports", "list"), {
        title,
        summary: aiSummary,
        createdAt: new Date(),
      });

      setTitle("");
      setSummary("");
      alert("AI 리포?��? ?�성?�었?�니??");
      window.location.reload();
    } catch (err) {
      console.error("AI 리포???�성 ?�류:", err);
      alert("AI ?�약 ?�성???�패?�습?�다.");
    } finally {
      setLoading(false);
    }
  };

  // ?�� PDF ?�운로드 ?�수
  const downloadPDF = async (report: any) => {
    const element = document.createElement("div");
    element.style.width = "600px";
    element.style.padding = "20px";
    element.innerHTML = `
      <h2 style="font-size:20px; font-weight:bold;">${report.title}</h2>
      <p style="margin-top:10px;">${report.summary}</p>
      <p style="margin-top:20px; font-size:12px; color:gray;">
        ?�성?? ${new Date(report.createdAt?.seconds * 1000).toLocaleDateString()}
      </p>
    `;

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${report.title}.pdf`);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">AI 리포??/h2>

      {/* 리포???�성 ??*/}
      <div className="mb-6">
        <input
          className="border p-2 mr-2"
          placeholder="리포???�목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded"
          onClick={generateReport}
          disabled={loading}
        >
          {loading ? "AI ?�성 �?.." : "AI 리포???�성"}
        </button>
      </div>

      {/* 리포??목록 */}
      <ul className="space-y-2">
        {reports.map((r) => (
          <li key={r.id} className="border p-3 rounded relative">
            <h3 className="font-bold">{r.title}</h3>
            <p className="text-gray-600">{r.summary}</p>
            <button
              className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded text-sm"
              onClick={() => downloadPDF(r)}
            >
              PDF ?�??            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
