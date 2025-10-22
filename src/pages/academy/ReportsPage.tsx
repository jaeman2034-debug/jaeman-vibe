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

  // Î¶¨Ìè¨??Î∂àÎü¨?§Í∏∞
  useEffect(() => {
    const fetchReports = async () => {
      const querySnapshot = await getDocs(collection(db, "academy", "reports", "list"));
      const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setReports(data);
    };
    fetchReports();
  }, []);

  // ?îπ AI Summary ?êÎèô ?ùÏÑ±
  const generateReport = async () => {
    if (!title) return alert("Î¶¨Ìè¨???úÎ™©???ÖÎ†•?òÏÑ∏??);
    setLoading(true);
    try {
      const client = new OpenAI({ apiKey: import.meta.env.VITE_OPENAI_API_KEY });
      const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "?àÎäî ?†ÏÜå???ÑÏπ¥?∞Î? ÏΩîÏπò ?¥Ïãú?§ÌÑ¥?∏Ïïº. Ï∂úÏÑù/?àÎ†® ?∞Ïù¥?∞Î? Í∏∞Î∞ò?ºÎ°ú ÏßßÏ? Î¶¨Ìè¨???îÏïΩ???ëÏÑ±??" },
          { role: "user", content: `Î¶¨Ìè¨???úÎ™©: ${title}. ÏµúÍ∑º ?àÎ†®/Ï∂úÏÑù ?îÏïΩ???ëÏÑ±?¥Ï§ò.` }
        ],
      });
      const aiSummary = completion.choices[0].message?.content || "?îÏïΩ ?ùÏÑ± ?§Ìå®";

      await addDoc(collection(db, "academy", "reports", "list"), {
        title,
        summary: aiSummary,
        createdAt: new Date(),
      });

      setTitle("");
      setSummary("");
      alert("AI Î¶¨Ìè¨?∏Í? ?ùÏÑ±?òÏóà?µÎãà??");
      window.location.reload();
    } catch (err) {
      console.error("AI Î¶¨Ìè¨???ùÏÑ± ?§Î•ò:", err);
      alert("AI ?îÏïΩ ?ùÏÑ±???§Ìå®?àÏäµ?àÎã§.");
    } finally {
      setLoading(false);
    }
  };

  // ?îπ PDF ?§Ïö¥Î°úÎìú ?®Ïàò
  const downloadPDF = async (report: any) => {
    const element = document.createElement("div");
    element.style.width = "600px";
    element.style.padding = "20px";
    element.innerHTML = `
      <h2 style="font-size:20px; font-weight:bold;">${report.title}</h2>
      <p style="margin-top:10px;">${report.summary}</p>
      <p style="margin-top:20px; font-size:12px; color:gray;">
        ?ùÏÑ±?? ${new Date(report.createdAt?.seconds * 1000).toLocaleDateString()}
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
      <h2 className="text-xl font-semibold mb-4">AI Î¶¨Ìè¨??/h2>

      {/* Î¶¨Ìè¨???ùÏÑ± ??*/}
      <div className="mb-6">
        <input
          className="border p-2 mr-2"
          placeholder="Î¶¨Ìè¨???úÎ™©"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded"
          onClick={generateReport}
          disabled={loading}
        >
          {loading ? "AI ?ùÏÑ± Ï§?.." : "AI Î¶¨Ìè¨???ùÏÑ±"}
        </button>
      </div>

      {/* Î¶¨Ìè¨??Î™©Î°ù */}
      <ul className="space-y-2">
        {reports.map((r) => (
          <li key={r.id} className="border p-3 rounded relative">
            <h3 className="font-bold">{r.title}</h3>
            <p className="text-gray-600">{r.summary}</p>
            <button
              className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded text-sm"
              onClick={() => downloadPDF(r)}
            >
              PDF ?Ä??            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
