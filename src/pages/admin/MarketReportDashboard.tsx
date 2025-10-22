// ??YAGO VIBE 마켓 ?�계 ?�?�보??import { useEffect, useState } from "react";
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
    // ?�시�?Firestore 구독
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
      console.log("??마켓 ?�이???�시�??�데?�트:", data.length, "�??�품");
    });

    return () => unsub();
  }, []);

  // 총합 ?�계 계산
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

  // ?�별 ?�료 ?�계 �?AI ?�균 계산
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
      거래?�료: m.sold,
      ?�균AI: m.count ? Math.round(m.avgAi / m.count) : 0,
      ?�균가�? m.count ? Math.round(m.totalPrice / m.count) : 0,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // ?�료??계산
  const completionRate = total > 0 ? Math.round((sold / total) * 100) : 0;

  // ??PDF 리포???�성 ?�수
  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // ?�더
    doc.setFontSize(20);
    doc.setTextColor(30, 64, 175); // blue-900
    doc.text("??YAGO VIBE 마켓 리포??, 15, 20);
    
    // ?�성 ?�보
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`?�� ?�성?? ${new Date().toLocaleString('ko-KR')}`, 15, 35);
    doc.text(`?�� 리포??ID: ${Date.now()}`, 15, 45);
    
    // ?�심 ?�계
    doc.setFontSize(14);
    doc.setTextColor(16, 185, 129); // green-500
    doc.text("?�� ?�심 ?�계", 15, 60);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`?�� ?�체 ?�품: ${total}�?, 15, 75);
    doc.text(`?�� ?�매�? ${open}�?, 15, 85);
    doc.text(`?�� 거래�? ${reserved}�?, 15, 95);
    doc.text(`??거래?�료: ${sold}�?, 15, 105);
    doc.text(`?�� ?�균 가�? ${avgPrice.toLocaleString()}??, 15, 115);
    doc.text(`?�� ?�균 AI ?�뢰?? ${avgAi}??, 15, 125);
    doc.text(`?�� 거래 ?�료?? ${completionRate}%`, 15, 135);
    
    // ?�별 ?�이???�이�?    if (chartData.length > 0) {
      doc.setFontSize(14);
      doc.setTextColor(139, 92, 246); // purple-500
      doc.text("?�� ?�별 거래 분석", 15, 155);
      
      const tableData = chartData.map((c) => [
        c.month,
        c.거래?�료.toString(),
        c.?�균AI.toString(),
        `${c.?�균가�?toLocaleString()}??
      ]);
      
      doc.autoTable({
        head: [["??, "거래?�료", "?�균AI", "?�균가�?]],
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
    
    // ?�약 메시지
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setTextColor(16, 185, 129); // green-500
    doc.text("?�� 분석 ?�약", 15, finalY);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`???�재 ${completionRate}%???��? 거래 ?�료?�을 보이�??�습?�다.`, 15, finalY + 10);
    doc.text(`???�균 AI ?�뢰??${avgAi}?�으�??�품 ?�질???�수?�니??`, 15, finalY + 20);
    doc.text(`???�성 거래 ${open + reserved}건이 진행 중입?�다.`, 15, finalY + 30);
    
    // ?�터
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("YAGO VIBE - 축구 중심 중고거래 ?�랫??, 15, doc.internal.pageSize.height - 10);
    doc.text("Generated by YAGO VIBE Analytics System", 15, doc.internal.pageSize.height - 5);
    
    // PDF ?�운로드
    doc.save(`YAGO_VIBE_Market_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    console.log("??PDF 리포???�성 ?�료");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">마켓 ?�이?��? 불러?�는 �?..</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* ?�더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-blue-900 flex items-center gap-3">
          <TrendingUp className="text-green-600 w-8 h-8" />
          YAGO VIBE 마켓 ?�계 ?�?�보??        </h1>
        <p className="text-gray-600">
          ?�시�?마켓 ?�이??분석 �?거래 ?�황 모니?�링
        </p>
      </div>

      {/* ?�계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">?�체 ?�품</p>
              <h2 className="text-3xl font-bold text-blue-700">{total}</h2>
            </div>
            <Package className="text-blue-500 w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">?�매�?/p>
              <h2 className="text-3xl font-bold text-green-700">{open}</h2>
            </div>
            <ShoppingBag className="text-green-500 w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">거래�?/p>
              <h2 className="text-3xl font-bold text-yellow-700">{reserved}</h2>
            </div>
            <TrendingUp className="text-yellow-500 w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-gray-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">거래?�료</p>
              <h2 className="text-3xl font-bold text-gray-700">{sold}</h2>
            </div>
            <CheckCircle2 className="text-gray-500 w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">?�균 AI ?�뢰??/p>
              <h2 className="text-3xl font-bold text-purple-700">{avgAi}</h2>
            </div>
            <Cpu className="text-purple-500 w-8 h-8" />
          </div>
        </div>
      </div>

      {/* 추�? ?�계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-indigo-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">?�균 ?�품 가�?/p>
              <h2 className="text-2xl font-bold text-indigo-700">
                {avgPrice.toLocaleString()}??              </h2>
            </div>
            <DollarSign className="text-indigo-500 w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">거래 ?�료??/p>
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
              <p className="text-sm text-gray-500 mb-1">?�성 거래</p>
              <h2 className="text-2xl font-bold text-rose-700">
                {reserved + open}
              </h2>
            </div>
            <TrendingUp className="text-rose-500 w-8 h-8" />
          </div>
        </div>
      </div>

      {/* 차트 ?�션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* ?�별 거래 ?�료 막�? 그래??*/}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShoppingBag className="text-blue-600 w-5 h-5" /> 
            ?�별 거래 ?�료 건수
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
              <Bar dataKey="거래?�료" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ?�별 ?�균 AI ?�뢰???�인 그래??*/}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Cpu className="text-purple-600 w-5 h-5" /> 
            ?�별 ?�균 AI ?�뢰??          </h3>
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
                dataKey="?�균AI" 
                stroke="#8b5cf6" 
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, stroke: '#8b5cf6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ?�별 ?�균 가�?차트 */}
      {chartData.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="text-green-600 w-5 h-5" /> 
            ?�별 ?�균 ?�품 가�?          </h3>
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
                formatter={(value) => [`${value.toLocaleString()}??, '?�균 가�?]}
              />
              <Bar dataKey="?�균가�? fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ?�약 ?�보 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border">
        <div className="flex items-center justify-center gap-4 text-center">
          <div className="flex items-center gap-2 text-green-700 font-semibold">
            <CheckCircle2 className="w-6 h-6" />
            <span className="text-lg">거래 ?�료??{completionRate}%</span>
          </div>
          <div className="text-gray-400">??/div>
          <div className="flex items-center gap-2 text-blue-700 font-semibold">
            <Cpu className="w-6 h-6" />
            <span className="text-lg">?�균 AI ?�뢰??{avgAi}??/span>
          </div>
          <div className="text-gray-400">??/div>
          <div className="flex items-center gap-2 text-purple-700 font-semibold">
            <DollarSign className="w-6 h-6" />
            <span className="text-lg">?�균 가�?{avgPrice.toLocaleString()}??/span>
          </div>
        </div>
      </div>

      {/* ?�이???�로고침 ?�보 */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>?�� ?�이?�는 ?�시간으�??�데?�트?�니????마�?�??�데?�트: {new Date().toLocaleString('ko-KR')}</p>
      </div>

      {/* PDF 리포???�성 버튼 */}
      <div className="mt-8 text-center">
        <button
          onClick={downloadPDF}
          className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 font-semibold text-lg"
        >
          <FileText className="w-6 h-6" />
          ?�� 리포??PDF ?�성
        </button>
        <p className="text-sm text-gray-500 mt-3">
          ?�재 ?�계�??�함???�세 리포?��? PDF�??�운로드?�니??        </p>
      </div>
    </div>
  );
}
