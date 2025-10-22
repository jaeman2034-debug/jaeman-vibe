// ??YAGO VIBE ë§ˆì¼“ ?µê³„ ?€?œë³´??import { useEffect, useState } from "react";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { TrendingUp, ShoppingBag, CheckCircle2, Cpu, Package, DollarSign, FileText } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function MarketReportDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ?¤ì‹œê°?Firestore êµ¬ë…
    const unsub = onSnapshot(collection(db, "marketItems"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt:
          d.data().createdAt?.toDate?.() ||
          new Date(d.data().createdAt || Date.now()),
      }));
      setItems(data);
      setLoading(false);
      console.log("??ë§ˆì¼“ ?°ì´???¤ì‹œê°??…ë°?´íŠ¸:", data.length, "ê°??í’ˆ");
    });

    return () => unsub();
  }, []);

  // ì´í•© ?µê³„ ê³„ì‚°
  const total = items.length;
  const sold = items.filter((i) => i.status === "sold").length;
  const reserved = items.filter((i) => i.status === "reserved").length;
  const open = items.filter((i) => i.status === "open").length;
  
  const avgPrice =
    total > 0
      ? Math.round(items.reduce((sum, i) => sum + (i.price || 0), 0) / total)
      : 0;
      
  const avgAi =
    total > 0
      ? Math.round(
          items.reduce(
            (sum, i) => sum + (i.ai?.score || 0),
            0
          ) / total
        )
      : 0;

  // ?”ë³„ ?„ë£Œ ?µê³„ ë°?AI ?‰ê·  ê³„ì‚°
  const monthly = {};
  items.forEach((i) => {
    const key = `${i.createdAt.getFullYear()}-${String(
      i.createdAt.getMonth() + 1
    ).padStart(2, "0")}`;
    
    if (!monthly[key]) {
      monthly[key] = { 
        month: key, 
        sold: 0, 
        avgAi: 0, 
        count: 0,
        totalPrice: 0
      };
    }
    
    if (i.status === "sold") monthly[key].sold += 1;
    monthly[key].avgAi += i.ai?.score || 0;
    monthly[key].totalPrice += i.price || 0;
    monthly[key].count += 1;
  });

  const chartData = Object.values(monthly)
    .map((m) => ({
      month: m.month,
      ê±°ë˜?„ë£Œ: m.sold,
      ?‰ê· AI: m.count ? Math.round(m.avgAi / m.count) : 0,
      ?‰ê· ê°€ê²? m.count ? Math.round(m.totalPrice / m.count) : 0,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // ?„ë£Œ??ê³„ì‚°
  const completionRate = total > 0 ? Math.round((sold / total) * 100) : 0;

  // ??PDF ë¦¬í¬???ì„± ?¨ìˆ˜
  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // ?¤ë”
    doc.setFontSize(20);
    doc.setTextColor(30, 64, 175); // blue-900
    doc.text("??YAGO VIBE ë§ˆì¼“ ë¦¬í¬??, 15, 20);
    
    // ?ì„± ?•ë³´
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`?“… ?ì„±?? ${new Date().toLocaleString('ko-KR')}`, 15, 35);
    doc.text(`?“Š ë¦¬í¬??ID: ${Date.now()}`, 15, 45);
    
    // ?µì‹¬ ?µê³„
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129); // green-500
    doc.text("?“ˆ ?µì‹¬ ?µê³„", 15, 60);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`?“¦ ?„ì²´ ?í’ˆ: ${total}ê°?, 15, 75);
    doc.text(`?Ÿ¢ ?ë§¤ì¤? ${open}ê°?, 15, 85);
    doc.text(`?Ÿ¡ ê±°ë˜ì¤? ${reserved}ê°?, 15, 95);
    doc.text(`??ê±°ë˜?„ë£Œ: ${sold}ê°?, 15, 105);
    doc.text(`?’° ?‰ê·  ê°€ê²? ${avgPrice.toLocaleString()}??, 15, 115);
    doc.text(`?¤– ?‰ê·  AI ? ë¢°?? ${avgAi}??, 15, 125);
    doc.text(`?“Š ê±°ë˜ ?„ë£Œ?? ${completionRate}%`, 15, 135);
    
    // ?”ë³„ ?°ì´???Œì´ë¸?    if (chartData.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(139, 92, 246); // purple-500
      doc.text("?“… ?”ë³„ ê±°ë˜ ë¶„ì„", 15, 155);
      
      const tableData = chartData.map((c) => [
        c.month,
        c.ê±°ë˜?„ë£Œ.toString(),
        c.?‰ê· AI.toString(),
        `${c.?‰ê· ê°€ê²?toLocaleString()}??
      ]);
      
      doc.autoTable({
        head: [["??, "ê±°ë˜?„ë£Œ", "?‰ê· AI", "?‰ê· ê°€ê²?]],
        body: tableData,
        startY: 165,
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [59, 130, 246], // blue-500
          textColor: [255, 255, 255],
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251], // gray-50
        },
      });
    }
    
    // ?”ì•½ ë©”ì‹œì§€
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setTextColor(16, 185, 129); // green-500
    doc.text("?¯ ë¶„ì„ ?”ì•½", 15, finalY);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`???„ì¬ ${completionRate}%???’ì? ê±°ë˜ ?„ë£Œ?¨ì„ ë³´ì´ê³??ˆìŠµ?ˆë‹¤.`, 15, finalY + 10);
    doc.text(`???‰ê·  AI ? ë¢°??${avgAi}?ìœ¼ë¡??í’ˆ ?ˆì§ˆ???°ìˆ˜?©ë‹ˆ??`, 15, finalY + 20);
    doc.text(`???œì„± ê±°ë˜ ${open + reserved}ê±´ì´ ì§„í–‰ ì¤‘ì…?ˆë‹¤.`, 15, finalY + 30);
    
    // ?¸í„°
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("YAGO VIBE - ì¶•êµ¬ ì¤‘ì‹¬ ì¤‘ê³ ê±°ë˜ ?Œë«??, 15, doc.internal.pageSize.height - 10);
    doc.text("Generated by YAGO VIBE Analytics System", 15, doc.internal.pageSize.height - 5);
    
    // PDF ?¤ìš´ë¡œë“œ
    doc.save(`YAGO_VIBE_Market_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    console.log("??PDF ë¦¬í¬???ì„± ?„ë£Œ");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">ë§ˆì¼“ ?°ì´?°ë? ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* ?¤ë” */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-blue-900 flex items-center gap-3">
          <TrendingUp className="text-green-600 w-8 h-8" />
          YAGO VIBE ë§ˆì¼“ ?µê³„ ?€?œë³´??        </h1>
        <p className="text-gray-600">
          ?¤ì‹œê°?ë§ˆì¼“ ?°ì´??ë¶„ì„ ë°?ê±°ë˜ ?„í™© ëª¨ë‹ˆ?°ë§
        </p>
      </div>

      {/* ?µê³„ ì¹´ë“œ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">?„ì²´ ?í’ˆ</p>
              <h2 className="text-3xl font-bold text-blue-700">{total}</h2>
            </div>
            <Package className="text-blue-500 w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">?ë§¤ì¤?/p>
              <h2 className="text-3xl font-bold text-green-700">{open}</h2>
            </div>
            <ShoppingBag className="text-green-500 w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">ê±°ë˜ì¤?/p>
              <h2 className="text-3xl font-bold text-yellow-700">{reserved}</h2>
            </div>
            <TrendingUp className="text-yellow-500 w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">ê±°ë˜?„ë£Œ</p>
              <h2 className="text-3xl font-bold text-gray-700">{sold}</h2>
            </div>
            <CheckCircle2 className="text-gray-500 w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">?‰ê·  AI ? ë¢°??/p>
              <h2 className="text-3xl font-bold text-purple-700">{avgAi}</h2>
            </div>
            <Cpu className="text-purple-500 w-8 h-8" />
          </div>
        </div>
      </div>

      {/* ì¶”ê? ?µê³„ ì¹´ë“œ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">?‰ê·  ?í’ˆ ê°€ê²?/p>
              <h2 className="text-2xl font-bold text-indigo-700">
                {avgPrice.toLocaleString()}??              </h2>
            </div>
            <DollarSign className="text-indigo-500 w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">ê±°ë˜ ?„ë£Œ??/p>
              <h2 className="text-2xl font-bold text-emerald-700">
                {completionRate}%
              </h2>
            </div>
            <CheckCircle2 className="text-emerald-500 w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-rose-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">?œì„± ê±°ë˜</p>
              <h2 className="text-2xl font-bold text-rose-700">
                {reserved + open}
              </h2>
            </div>
            <TrendingUp className="text-rose-500 w-8 h-8" />
          </div>
        </div>
      </div>

      {/* ì°¨íŠ¸ ?¹ì…˜ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* ?”ë³„ ê±°ë˜ ?„ë£Œ ë§‰ë? ê·¸ë˜??*/}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShoppingBag className="text-blue-600 w-5 h-5" /> 
            ?”ë³„ ê±°ë˜ ?„ë£Œ ê±´ìˆ˜
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip 
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#f9fafb', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="ê±°ë˜?„ë£Œ" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ?”ë³„ ?‰ê·  AI ? ë¢°???¼ì¸ ê·¸ë˜??*/}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Cpu className="text-purple-600 w-5 h-5" /> 
            ?”ë³„ ?‰ê·  AI ? ë¢°??          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#f9fafb', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="?‰ê· AI" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#8b5cf6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ?”ë³„ ?‰ê·  ê°€ê²?ì°¨íŠ¸ */}
      {chartData.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="text-green-600 w-5 h-5" /> 
            ?”ë³„ ?‰ê·  ?í’ˆ ê°€ê²?          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip 
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#f9fafb', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value) => [`${value.toLocaleString()}??, '?‰ê·  ê°€ê²?]}
              />
              <Bar dataKey="?‰ê· ê°€ê²? fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ?”ì•½ ?•ë³´ */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border">
        <div className="flex items-center justify-center gap-4 text-center">
          <div className="flex items-center gap-2 text-green-700 font-semibold">
            <CheckCircle2 className="w-6 h-6" />
            <span className="text-lg">ê±°ë˜ ?„ë£Œ??{completionRate}%</span>
          </div>
          <div className="text-gray-400">??/div>
          <div className="flex items-center gap-2 text-blue-700 font-semibold">
            <Cpu className="w-6 h-6" />
            <span className="text-lg">?‰ê·  AI ? ë¢°??{avgAi}??/span>
          </div>
          <div className="text-gray-400">??/div>
          <div className="flex items-center gap-2 text-purple-700 font-semibold">
            <DollarSign className="w-6 h-6" />
            <span className="text-lg">?‰ê·  ê°€ê²?{avgPrice.toLocaleString()}??/span>
          </div>
        </div>
      </div>

      {/* ?°ì´???ˆë¡œê³ ì¹¨ ?•ë³´ */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>?”„ ?°ì´?°ëŠ” ?¤ì‹œê°„ìœ¼ë¡??…ë°?´íŠ¸?©ë‹ˆ????ë§ˆì?ë§??…ë°?´íŠ¸: {new Date().toLocaleString('ko-KR')}</p>
      </div>

      {/* PDF ë¦¬í¬???ì„± ë²„íŠ¼ */}
      <div className="mt-8 text-center">
        <button
          onClick={downloadPDF}
          className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 font-semibold text-lg"
        >
          <FileText className="w-6 h-6" />
          ?“„ ë¦¬í¬??PDF ?ì„±
        </button>
        <p className="text-sm text-gray-500 mt-3">
          ?„ì¬ ?µê³„ë¥??¬í•¨???ì„¸ ë¦¬í¬?¸ë? PDFë¡??¤ìš´ë¡œë“œ?©ë‹ˆ??        </p>
      </div>
    </div>
  );
}
