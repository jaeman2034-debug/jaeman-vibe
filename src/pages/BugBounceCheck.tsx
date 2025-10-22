// ??YAGO VIBE ë²„ê·¸ë°”ìš´??QA ì²´í¬ë¦¬ìŠ¤??(Firestore ?ë™ ?€??ë²„ì „)
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";

interface CheckItem {
  id: string;
  category: string;
  item: string;
  expectedResult: string;
  completed: boolean;
}

export default function BugBounceCheck() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [reportId, setReportId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<CheckItem[]>([
    // 1ï¸âƒ£ ë¡œê·¸??/ ?¸ì¦
    {
      id: "auth-1",
      category: "1ï¸âƒ£ ë¡œê·¸??/ ?¸ì¦",
      item: "Firebase Auth ë¡œê·¸???•ìƒ ?‘ë™",
      expectedResult: "UID ?•ìƒ ì¶œë ¥??(currentUser.uid)",
      completed: false
    },
    {
      id: "auth-2", 
      category: "1ï¸âƒ£ ë¡œê·¸??/ ?¸ì¦",
      item: "ë¡œê·¸?„ì›ƒ ???˜ì´ì§€ ?‘ê·¼ ì°¨ë‹¨",
      expectedResult: "ë¹„ë¡œê·¸ì¸ ???˜ì •Â·?? œ ë²„íŠ¼ ?¨ê?",
      completed: false
    },
    
    // 2ï¸âƒ£ ?í’ˆ ?±ë¡
    {
      id: "register-1",
      category: "2ï¸âƒ£ ?í’ˆ ?±ë¡", 
      item: "?´ë?ì§€ ?…ë¡œ??+ AI ? ë¢°???ìˆ˜ ?ì„±",
      expectedResult: "Storage ?…ë¡œ????Firestore??imageUrl, aiScore ?€??,
      completed: false
    },
    {
      id: "register-2",
      category: "2ï¸âƒ£ ?í’ˆ ?±ë¡",
      item: "?±ë¡ ???ë™ ë¦¬ë‹¤?´ë ‰??, 
      expectedResult: "/market ?ëŠ” ?ì„¸ ?˜ì´ì§€ë¡??´ë™",
      completed: false
    },
    
    // 3ï¸âƒ£ ?í’ˆ ?ì„¸ ?˜ì´ì§€
    {
      id: "detail-1",
      category: "3ï¸âƒ£ ?í’ˆ ?ì„¸ ?˜ì´ì§€",
      item: "ë¡œê³  ?´ë¦­ ?????´ë™",
      expectedResult: "/ ë¡??´ë™??,
      completed: false
    },
    {
      id: "detail-2",
      category: "3ï¸âƒ£ ?í’ˆ ?ì„¸ ?˜ì´ì§€", 
      item: "?ë§¤?ë§Œ '?˜ì •/?? œ/?íƒœ ë³€ê²? ë²„íŠ¼ ?œì‹œ",
      expectedResult: "ë¹„ë¡œê·¸ì¸ ???¨ê? / ?ë§¤?ë§Œ ?œì‹œ",
      completed: false
    },
    
    // 4ï¸âƒ£ ?í’ˆ ?˜ì •
    {
      id: "edit-1",
      category: "4ï¸âƒ£ ?í’ˆ ?˜ì •",
      item: "ê¸°ì¡´ ?°ì´???ë™ ë¡œë“œ",
      expectedResult: "Firestore ê°?ë¶ˆëŸ¬?¤ê¸° ?•ìƒ",
      completed: false
    },
    {
      id: "edit-2", 
      category: "4ï¸âƒ£ ?í’ˆ ?˜ì •",
      item: "?˜ì • ???…ë°?´íŠ¸ ë°˜ì˜",
      expectedResult: "??ê°’ì´ ?ì„¸ ?˜ì´ì§€??ì¦‰ì‹œ ë°˜ì˜??,
      completed: false
    },
    
    // 5ï¸âƒ£ ?í’ˆ ?? œ
    {
      id: "delete-1",
      category: "5ï¸âƒ£ ?í’ˆ ?? œ",
      item: "?? œ ë²„íŠ¼ ?´ë¦­ ??ì¦‰ì‹œ Firestore ?œê±°",
      expectedResult: "/market?¼ë¡œ ?ë™ ë¦¬ë‹¤?´ë ‰??,
      completed: false
    },
    
    // 6ï¸âƒ£ ?íƒœ ë³€ê²?ë²„íŠ¼
    {
      id: "status-1",
      category: "6ï¸âƒ£ ?íƒœ ë³€ê²?ë²„íŠ¼",
      item: "?ë§¤ì¤???ê±°ë˜ì¤????„ë£Œ ?œí™˜",
      expectedResult: "?‰ìƒÂ·?ìŠ¤?¸Â·ìƒ?œê°’ ?„ë? ?•ìƒ ë°˜ì˜",
      completed: false
    },
    
    // 7ï¸âƒ£ UI/UX ?•ì¸
    {
      id: "ui-1",
      category: "7ï¸âƒ£ UI/UX ?•ì¸",
      item: "ë¡œê³  ?´ë¦­ ?????´ë™",
      expectedResult: "?•ìƒ ?´ë™",
      completed: false
    },
    {
      id: "ui-2",
      category: "7ï¸âƒ£ UI/UX ?•ì¸",
      item: "ë§ˆì¼“ ?„ì´ì½??´ë¦­ ??ëª©ë¡ ?´ë™", 
      expectedResult: "?•ìƒ ?´ë™",
      completed: false
    },
    
    // 8ï¸âƒ£ Firestore êµ¬ì¡°
    {
      id: "firestore-1",
      category: "8ï¸âƒ£ Firestore êµ¬ì¡°",
      item: "products ì»¬ë ‰??ì¡´ì¬",
      expectedResult: "ëª¨ë“  ?í’ˆ ë¬¸ì„œ ??sellerId, status, imageUrl ?„ë“œ ?•ì¸",
      completed: false
    },
    
    // 9ï¸âƒ£ ë°˜ì‘???ŒìŠ¤??    {
      id: "responsive-1",
      category: "9ï¸âƒ£ ë°˜ì‘???ŒìŠ¤??,
      item: "ëª¨ë°”??375px) UI ê¹¨ì§ ?†ìŒ",
      expectedResult: "ë²„íŠ¼ ì¤„ë°”ê¿? ?´ë?ì§€ ì¤‘ì•™ ?•ë ¬ ? ì?",
      completed: false
    },
    
    // ?”Ÿ PWA / ?¤ì¹˜ ë°°ë„ˆ
    {
      id: "pwa-1",
      category: "?”Ÿ PWA / ?¤ì¹˜ ë°°ë„ˆ",
      item: "???”ë©´ ì¶”ê? ë°°ë„ˆ ?¸ì¶œ ?•ì¸",
      expectedResult: "??'YAGO VIBE ?¤ì¹˜' ë°°ë„ˆ ?œì‹œ",
      completed: false
    }
  ]);

  // ??Firestore????QA ë¦¬í¬??ë¬¸ì„œ ?ì„± (ì²?ì§„ì… ??1??
  useEffect(() => {
    const createNewReport = async () => {
      if (!currentUser) {
        console.log("??ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??");
        return;
      }

      try {
        const reportRef = await addDoc(collection(db, "QA_Reports"), {
          userId: currentUser.uid,
          email: currentUser.email || "unknown",
          displayName: currentUser.displayName || "ê´€ë¦¬ì",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          progress: 0,
          completed: 0,
          total: checklist.length,
          results: checklist.map(item => item.completed),
          checklist: checklist.map(item => ({
            id: item.id,
            category: item.category,
            item: item.item,
            expectedResult: item.expectedResult,
            completed: item.completed
          }))
        });
        
        setReportId(reportRef.id);
        console.log("??QA ë¦¬í¬???ì„±??", reportRef.id);
        
        // ë¡œì»¬ ?¤í† ë¦¬ì??ë„ ?€??(ë°±ì—…??
        localStorage.setItem('yago-vibe-qa-report-id', reportRef.id);
      } catch (error) {
        console.error("??QA ë¦¬í¬???ì„± ?¤íŒ¨:", error);
      }
    };

    // ê¸°ì¡´ ë¦¬í¬??IDê°€ ?ˆëŠ”ì§€ ?•ì¸
    const existingReportId = localStorage.getItem('yago-vibe-qa-report-id');
    if (existingReportId) {
      setReportId(existingReportId);
      console.log("?“‹ ê¸°ì¡´ QA ë¦¬í¬??ë¡œë“œ:", existingReportId);
    } else {
      createNewReport();
    }
  }, [currentUser, checklist.length]);

  // ??Firestore??ì²´í¬ ë³€???¤ì‹œê°??€??  useEffect(() => {
    const saveProgress = async () => {
      if (!reportId || !currentUser) return;

      try {
        const completedCount = checklist.filter(item => item.completed).length;
        const progressPercentage = Math.round((completedCount / checklist.length) * 100);

        await updateDoc(doc(db, "QA_Reports", reportId), {
          updatedAt: serverTimestamp(),
          progress: progressPercentage,
          completed: completedCount,
          results: checklist.map(item => item.completed),
          checklist: checklist.map(item => ({
            id: item.id,
            category: item.category,
            item: item.item,
            expectedResult: item.expectedResult,
            completed: item.completed
          }))
        });

        console.log("?’¾ QA ì§„í–‰?í™© ?€?¥ë¨:", progressPercentage + "%");
      } catch (error) {
        console.error("??QA ì§„í–‰?í™© ?€???¤íŒ¨:", error);
      }
    };

    // ì´ˆê¸° ë¡œë“œê°€ ?„ë‹ ?Œë§Œ ?€??(ë¬´í•œ ë£¨í”„ ë°©ì?)
    if (reportId && checklist.some(item => item.completed)) {
      saveProgress();
    }
  }, [checklist, reportId, currentUser]);

  // ì²´í¬ë°•ìŠ¤ ? ê?
  const toggleCheck = (id: string) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  // ì§„í–‰ë¥?ê³„ì‚°
  const completedCount = checklist.filter(item => item.completed).length;
  const totalCount = checklist.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  // Recharts ?°ì´??  const COLORS = ["#10B981", "#EF4444"]; // green-500, red-500
  const chartData = [
    { name: "?„ë£Œ", value: completedCount, color: COLORS[0] },
    { name: "ë¯¸ì™„ë£?, value: totalCount - completedCount, color: COLORS[1] }
  ];

  // PDF ë³´ê³ ???¤ìš´ë¡œë“œ
  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // ?¤ë”
    doc.setFontSize(20);
    doc.setTextColor(30, 64, 175); // blue-900
    doc.text("YAGO VIBE ë²„ê·¸ë°”ìš´??QA ì²´í¬ë¦¬ìŠ¤??, 15, 20);
    
    // ?‘ì„±???•ë³´
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`?‘ì„±?? ${currentUser?.email || "Unknown"}`, 15, 35);
    doc.text(`ì§„í–‰ë¥? ${progressPercentage}% (${completedCount}/${totalCount} ?„ë£Œ)`, 15, 45);
    doc.text(`?ì„±?? ${new Date().toLocaleString('ko-KR')}`, 15, 55);
    
    // Firestore ë¦¬í¬??ID
    if (reportId) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`ë¦¬í¬??ID: ${reportId}`, 15, 65);
    }
    
    // ì²´í¬ë¦¬ìŠ¤????ª©??    let yPosition = 75;
    doc.setFontSize(12);
    
    checklist.forEach((item, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      const status = item.completed ? "???„ë£Œ" : "??ë¯¸ì™„ë£?;
      const statusColor = item.completed ? [16, 185, 129] : [239, 68, 68]; // green-500 or red-500
      
      doc.setTextColor(0, 0, 0);
      doc.text(`${index + 1}. ${item.item}`, 15, yPosition);
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(status, 15, yPosition + 8);
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.text(`   ê¸°ë? ê²°ê³¼: ${item.expectedResult}`, 15, yPosition + 16);
      
      doc.setFontSize(12);
      yPosition += 30;
    });
    
    // ?„ë£Œ ë©”ì‹œì§€
    if (progressPercentage === 100) {
      doc.addPage();
      doc.setFontSize(18);
      doc.setTextColor(16, 185, 129); // green-500
      doc.text("?‰ ì¶•í•˜?©ë‹ˆ??", 15, 50);
      doc.setTextColor(0, 0, 0);
      doc.text("ëª¨ë“  QA ì²´í¬ë¦¬ìŠ¤?¸ê? ?„ë£Œ?˜ì—ˆ?µë‹ˆ??", 15, 70);
      doc.text("?´ì œ YAGO VIBEë¥??ˆì „?˜ê²Œ ë°°í¬?????ˆìŠµ?ˆë‹¤.", 15, 90);
    }
    
    doc.save(`YAGO_VIBE_QA_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // ?„ì²´ ì´ˆê¸°??  const resetAll = () => {
    if (window.confirm("ëª¨ë“  ì²´í¬ë¦¬ìŠ¤?¸ë? ì´ˆê¸°?”í•˜?œê² ?µë‹ˆê¹?")) {
      setChecklist(prev => prev.map(item => ({ ...item, completed: false })));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* ?¤ë” */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 mb-2">
                ?? YAGO VIBE ë²„ê·¸ë°”ìš´??QA ì²´í¬ë¦¬ìŠ¤??              </h1>
              <p className="text-gray-600">ê´€ë¦¬ì??- ë°°í¬ ??QA ?ê? (10ë¶??„ì£¼??</p>
              {reportId && (
                <p className="text-xs text-gray-500 mt-1">
                  ?’¾ Firestore ?ë™ ?€???œì„±??| ë¦¬í¬??ID: {reportId.slice(0, 8)}...
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {completedCount} / {totalCount}
              </div>
              <div className="text-sm text-gray-500">?„ë£Œ????ª©</div>
              {currentUser && (
                <div className="text-xs text-gray-400 mt-1">
                  ?‘¤ {currentUser.email}
                </div>
              )}
            </div>
          </div>

          {/* ?„ì²´ ì§„í–‰ë¥?ë°?*/}
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-700">
              ?„ì²´ ì§„í–‰ë¥? {progressPercentage}%
            </span>
            <div className="flex gap-2">
              <button
                onClick={resetAll}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
              >
                ?”„ ì´ˆê¸°??              </button>
              <button
                onClick={downloadPDF}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                ?“„ PDF ë³´ê³ ???¤ìš´ë¡œë“œ
              </button>
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                ?“Š ?€?œë³´?œë¡œ
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ì²´í¬ë¦¬ìŠ¤??*/}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">?“‹ ?ì„¸ ì²´í¬ë¦¬ìŠ¤??/h2>
            </div>
            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {checklist.map((item, index) => (
                <div 
                  key={item.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    item.completed ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => toggleCheck(item.id)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                          {item.category}
                        </span>
                        <span className="text-xs text-gray-500">#{index + 1}</span>
                      </div>
                      <h3 className={`text-sm font-medium mb-1 ${
                        item.completed ? 'text-green-700 line-through' : 'text-gray-900'
                      }`}>
                        {item.item}
                      </h3>
                      <p className={`text-xs ${
                        item.completed ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        <strong>ê¸°ë? ê²°ê³¼:</strong> {item.expectedResult}
                      </p>
                    </div>
                    {item.completed && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ??                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ì°¨íŠ¸ ë°??µê³„ */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">?“Š ì§„í–‰ë¥??µê³„</h2>
            </div>
            <div className="p-6">
              {/* ?Œì´ì°¨íŠ¸ */}
              <div className="h-64 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [`${value}ê°?, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* ë²”ë? */}
              <div className="flex justify-center gap-6 mb-6">
                {chartData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-600">{item.name}: {item.value}ê°?/span>
                  </div>
                ))}
              </div>

              {/* ?„ë£Œ ?íƒœ ?œì‹œ */}
              {progressPercentage === 100 && (
                <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-lg p-4 text-white text-center">
                  <h3 className="text-lg font-bold mb-1">?‰ ì¶•í•˜?©ë‹ˆ??</h3>
                  <p className="text-sm opacity-90">ëª¨ë“  QA ì²´í¬ë¦¬ìŠ¤?¸ê? ?„ë£Œ?˜ì—ˆ?µë‹ˆ??</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ?˜ë‹¨ ?ˆë‚´ */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-yellow-600 text-xl">? ï¸</span>
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1">QA ?ê? ?ˆë‚´</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>??ê°???ª©???¤ì œë¡??ŒìŠ¤?¸í•œ ??ì²´í¬?˜ì„¸??/li>
                <li>??ëª¨ë“  ì²´í¬ë¦¬ìŠ¤?¸ê? ?„ë£Œ?˜ë©´ ?´ì˜ ?¹ì¸ ê°€?¥í•©?ˆë‹¤</li>
                <li>??ì²´í¬ë¦¬ìŠ¤???íƒœ??ë¸Œë¼?°ì????ë™ ?€?¥ë©?ˆë‹¤</li>
                <li>??PDF ë³´ê³ ?œë¡œ ?ê? ê²°ê³¼ë¥??€?¥í•  ???ˆìŠµ?ˆë‹¤</li>
                <li>???ˆìƒ ?Œìš” ?œê°„: ??10ë¶?/li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
