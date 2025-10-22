import React, { useEffect, useRef, useState } from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

// ??AI ?îÏ≤≠ ?®Ïàò (Î≤àÏó≠ ?¨Ìï®)
async function askAI(prompt: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

export default function Reports() {
  const [metrics, setMetrics] = useState<any>(null);
  const [summaries, setSummaries] = useState<{ko: string; en: string; cn: string}>({ko: "", en: "", cn: ""});
  const [urls, setUrls] = useState<{ko?: string; en?: string; cn?: string}>({});
  const [loading, setLoading] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mock ?∞Ïù¥??    const days = 7;
    const labels = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    const rand = (b:number,s:number)=>Array.from({length:days}).map(()=>b+Math.round((Math.random()-0.5)*s));
    setMetrics({
      period: labels,
      sales: rand(150,90),
      signups: rand(20,10),
      activities: rand(300,200),
      topCategories: [
        { name:"Ï∂ïÍµ¨",count:120},{name:"?çÍµ¨",count:95},{name:"Í≥®ÌîÑ",count:80},{name:"?ºÍµ¨",count:60},{name:"?åÎãà??,count:40}
      ]
    });
  }, []);

  const generateMultiLangReport = async () => {
    if (!metrics || !captureRef.current) return;
    setLoading(true);
    try {
      // 1Ô∏è‚É£ ?úÍ? ?îÏïΩ
      const promptKo = `?ÑÎûò ?∞Ïù¥?∞Î? Í∏∞Î∞ò?ºÎ°ú IR Î¶¨Ìè¨?∏Î? ?ëÏÑ±:\nÎß§Ï∂ú: ${metrics.sales.join(",")}\n?†Í∑ú?åÏõê: ${metrics.signups.join(",")}\n?úÎèô?? ${metrics.activities.join(",")}\n\n?ÑÎ¨∏ ?¨Ïûê?êÏö© IR Î¶¨Ìè¨???ïÏãù?ºÎ°ú ?ëÏÑ±?¥Ï£º?∏Ïöî.`;
      const summaryKo = await askAI(promptKo);

      // 2Ô∏è‚É£ ?ÅÏñ¥ / Ï§ëÍµ≠??Î≤àÏó≠
      const summaryEn = await askAI(`Translate the following Korean IR report into professional English:\n\n${summaryKo}`);
      const summaryCn = await askAI(`Â∞Ü‰ª•‰∏ãÈü©?áÊäïËµÑÊä•?äÁøªËØëÊàê‰∏ì‰∏ö‰∏?ñá:\n\n${summaryKo}`);

      setSummaries({ko:summaryKo, en:summaryEn, cn:summaryCn});

      // 3Ô∏è‚É£ PDF ?ùÏÑ± ?®Ïàò
      const createPDF = async (lang:string, text:string) => {
        const node = captureRef.current!;
        const canvas = await html2canvas(node, {scale:2, backgroundColor: "#ffffff"});
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({orientation: "p", unit:"pt", format:"a4"});
        const pageWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = pageWidth - 48;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.setFontSize(16);
        pdf.text(`YAGO VIBE IR Report (${lang.toUpperCase()})`, 24, 40);
        pdf.setFontSize(10);
        pdf.text(new Date().toLocaleString(), 24, 55);
        pdf.addImage(imgData, "PNG", 24, 70, imgWidth, imgHeight);
        
        // AI ?îÏïΩ Ï∂îÍ?
        const summaryY = 70 + imgHeight + 20;
        pdf.setFontSize(12);
        pdf.text("AI Summary:", 24, summaryY);
        pdf.setFontSize(10);
        const splitText = pdf.splitTextToSize(text, pageWidth - 48);
        pdf.text(splitText, 24, summaryY + 15);
        
        const dataUrl = pdf.output("datauristring");
        const fileRef = ref(storage, `ir_reports/IR_${lang}_${Date.now()}.pdf`);
        await uploadString(fileRef, dataUrl, "data_url");
        return await getDownloadURL(fileRef);
      };

      // 4Ô∏è‚É£ Í∞??∏Ïñ¥Î≥??ÖÎ°ú??      const urlKo = await createPDF("ko", summaryKo);
      const urlEn = await createPDF("en", summaryEn);
      const urlCn = await createPDF("cn", summaryCn);
      setUrls({ko:urlKo, en:urlEn, cn:urlCn});

      // 5Ô∏è‚É£ n8n Í∏ÄÎ°úÎ≤å Î©îÏùº Î∞úÏÜ°
      const investors = import.meta.env.VITE_INVESTOR_EMAILS?.split(",") || [];
      if (import.meta.env.VITE_N8N_IR_WEBHOOK) {
        await fetch(import.meta.env.VITE_N8N_IR_WEBHOOK, {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            to: investors,
            subject:`[YAGO VIBE] Global IR Report ${new Date().toLocaleDateString()}`,
            links: {ko:urlKo,en:urlEn,cn:urlCn},
            summaryKo,
            summaryEn,
            summaryCn
          })
        });
      }

      alert("???§Íµ≠??IR Î¶¨Ìè¨???ùÏÑ± Î∞?Î∞úÏÜ° ?ÑÎ£å!");
    } catch(err){
      console.error(err);
      alert("??Î¶¨Ìè¨???ùÏÑ± Ï§??§Î•ò Î∞úÏÉù");
    } finally {
      setLoading(false);
    }
  };

  if(!metrics) return <div className="p-6">Î¶¨Ìè¨??Î°úÎî© Ï§?..</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">?åç ?§Íµ≠??IR Î¶¨Ìè¨??(v4)</h1>
        <button onClick={generateMultiLangReport} disabled={loading}
          className="px-4 py-2 rounded-2xl bg-black text-white hover:opacity-80 disabled:opacity-60">
          {loading ? "?ùÏÑ± Ï§?.." : "?åê AI ?§Íµ≠??Î¶¨Ìè¨???ùÏÑ±"}
        </button>
      </div>

      {Object.values(urls).length>0 && (
        <div className="bg-green-100 p-4 rounded-xl space-y-2">
          <p className="font-semibold text-green-800">???§Íµ≠??Î¶¨Ìè¨???ÖÎ°ú???ÑÎ£å!</p>
          <div className="flex gap-4">
            <a href={urls.ko} target="_blank" rel="noopener noreferrer" 
               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              ?á∞?á∑ ?úÍµ≠??Î¶¨Ìè¨??            </a>
            <a href={urls.en} target="_blank" rel="noopener noreferrer"
               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              ?á∫?á∏ English Report
            </a>
            <a href={urls.cn} target="_blank" rel="noopener noreferrer"
               className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              ?á®?á≥ ‰∏?ñá?•Âëä
            </a>
          </div>
        </div>
      )}

      {summaries.ko && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-xl p-4 bg-white">
            <h3 className="font-bold mb-2">?á∞?á∑ ?úÍµ≠???îÏïΩ</h3>
            <p className="text-sm text-gray-700 whitespace-pre-line">{summaries.ko}</p>
          </div>
          <div className="border rounded-xl p-4 bg-white">
            <h3 className="font-bold mb-2">?á∫?á∏ English Summary</h3>
            <p className="text-sm text-gray-700 whitespace-pre-line">{summaries.en}</p>
          </div>
          <div className="border rounded-xl p-4 bg-white">
            <h3 className="font-bold mb-2">?á®?á≥ ‰∏?ñá?òË¶Å</h3>
            <p className="text-sm text-gray-700 whitespace-pre-line">{summaries.cn}</p>
          </div>
        </div>
      )}

      <div ref={captureRef} className="bg-white p-6 rounded-2xl shadow space-y-6">
        <section className="grid grid-cols-3 text-center gap-4">
          <div>
            <p className="text-gray-500 text-sm">Ï¥?Îß§Ï∂ú (7??</p>
            <p className="text-2xl font-bold">{metrics.sales.reduce((a:number,b:number)=>a+b,0).toLocaleString()}??/p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">?†Í∑ú ?åÏõê (7??</p>
            <p className="text-2xl font-bold">{metrics.signups.reduce((a:number,b:number)=>a+b,0)}Î™?/p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Ï¥??úÎèô (7??</p>
            <p className="text-2xl font-bold">{metrics.activities.reduce((a:number,b:number)=>a+b,0).toLocaleString()}Í±?/p>
          </div>
        </section>

        <section className="rounded-xl border p-4">
          <h2 className="font-semibold mb-3">Îß§Ï∂ú Ï∂îÏù¥</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.period.map((d:any,i:number)=>({day:d,sales:metrics.sales[i],signups:metrics.signups[i]}))}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="day"/>
              <YAxis/>
              <Tooltip/>
              <Line type="monotone" dataKey="sales" name="Îß§Ï∂ú" stroke="#3b82f6"/>
              <Line type="monotone" dataKey="signups" name="?†Í∑ú?åÏõê" stroke="#10b981"/>
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section className="rounded-xl border p-4">
          <h2 className="font-semibold mb-3">?ºÎ≥Ñ ?úÎèô??/h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metrics.period.map((d:any,i:number)=>({day:d,activities:metrics.activities[i]}))}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="day"/>
              <YAxis/>
              <Tooltip/>
              <Bar dataKey="activities" name="?úÎèô?? fill="#8b5cf6"/>
            </BarChart>
          </ResponsiveContainer>
        </section>

        <section className="rounded-xl border p-4">
          <h2 className="font-semibold mb-3">?∏Í∏∞ Ïπ¥ÌÖåÍ≥†Î¶¨ TOP 5</h2>
          <ul className="grid grid-cols-5 gap-3">
            {metrics.topCategories.map((c:any)=>(
              <li key={c.name} className="rounded-xl border p-3 text-center">
                <div className="text-sm text-gray-500">{c.name}</div>
                <div className="text-xl font-semibold">{c.count}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
