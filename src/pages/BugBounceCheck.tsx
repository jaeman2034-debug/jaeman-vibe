// ??YAGO VIBE 버그바운??QA 체크리스??(Firestore ?�동 ?�??버전)
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
    // 1️⃣ 로그??/ ?�증
    {
      id: "auth-1",
      category: "1️⃣ 로그??/ ?�증",
      item: "Firebase Auth 로그???�상 ?�동",
      expectedResult: "UID ?�상 출력??(currentUser.uid)",
      completed: false
    },
    {
      id: "auth-2", 
      category: "1️⃣ 로그??/ ?�증",
      item: "로그?�웃 ???�이지 ?�근 차단",
      expectedResult: "비로그인 ???�정·??�� 버튼 ?��?",
      completed: false
    },
    
    // 2️⃣ ?�품 ?�록
    {
      id: "register-1",
      category: "2️⃣ ?�품 ?�록", 
      item: "?��?지 ?�로??+ AI ?�뢰???�수 ?�성",
      expectedResult: "Storage ?�로????Firestore??imageUrl, aiScore ?�??,
      completed: false
    },
    {
      id: "register-2",
      category: "2️⃣ ?�품 ?�록",
      item: "?�록 ???�동 리다?�렉??, 
      expectedResult: "/market ?�는 ?�세 ?�이지�??�동",
      completed: false
    },
    
    // 3️⃣ ?�품 ?�세 ?�이지
    {
      id: "detail-1",
      category: "3️⃣ ?�품 ?�세 ?�이지",
      item: "로고 ?�릭 ?????�동",
      expectedResult: "/ �??�동??,
      completed: false
    },
    {
      id: "detail-2",
      category: "3️⃣ ?�품 ?�세 ?�이지", 
      item: "?�매?�만 '?�정/??��/?�태 변�? 버튼 ?�시",
      expectedResult: "비로그인 ???��? / ?�매?�만 ?�시",
      completed: false
    },
    
    // 4️⃣ ?�품 ?�정
    {
      id: "edit-1",
      category: "4️⃣ ?�품 ?�정",
      item: "기존 ?�이???�동 로드",
      expectedResult: "Firestore �?불러?�기 ?�상",
      completed: false
    },
    {
      id: "edit-2", 
      category: "4️⃣ ?�품 ?�정",
      item: "?�정 ???�데?�트 반영",
      expectedResult: "??값이 ?�세 ?�이지??즉시 반영??,
      completed: false
    },
    
    // 5️⃣ ?�품 ??��
    {
      id: "delete-1",
      category: "5️⃣ ?�품 ??��",
      item: "??�� 버튼 ?�릭 ??즉시 Firestore ?�거",
      expectedResult: "/market?�로 ?�동 리다?�렉??,
      completed: false
    },
    
    // 6️⃣ ?�태 변�?버튼
    {
      id: "status-1",
      category: "6️⃣ ?�태 변�?버튼",
      item: "?�매�???거래�????�료 ?�환",
      expectedResult: "?�상·?�스?�·상?�값 ?��? ?�상 반영",
      completed: false
    },
    
    // 7️⃣ UI/UX ?�인
    {
      id: "ui-1",
      category: "7️⃣ UI/UX ?�인",
      item: "로고 ?�릭 ?????�동",
      expectedResult: "?�상 ?�동",
      completed: false
    },
    {
      id: "ui-2",
      category: "7️⃣ UI/UX ?�인",
      item: "마켓 ?�이�??�릭 ??목록 ?�동", 
      expectedResult: "?�상 ?�동",
      completed: false
    },
    
    // 8️⃣ Firestore 구조
    {
      id: "firestore-1",
      category: "8️⃣ Firestore 구조",
      item: "products 컬렉??존재",
      expectedResult: "모든 ?�품 문서 ??sellerId, status, imageUrl ?�드 ?�인",
      completed: false
    },
    
    // 9️⃣ 반응???�스??    {
      id: "responsive-1",
      category: "9️⃣ 반응???�스??,
      item: "모바??375px) UI 깨짐 ?�음",
      expectedResult: "버튼 줄바�? ?��?지 중앙 ?�렬 ?��?",
      completed: false
    },
    
    // ?�� PWA / ?�치 배너
    {
      id: "pwa-1",
      category: "?�� PWA / ?�치 배너",
      item: "???�면 추�? 배너 ?�출 ?�인",
      expectedResult: "??'YAGO VIBE ?�치' 배너 ?�시",
      completed: false
    }
  ]);

  // ??Firestore????QA 리포??문서 ?�성 (�?진입 ??1??
  useEffect(() => {
    const createNewReport = async () => {
      if (!currentUser) {
        console.log("??로그?�이 ?�요?�니??");
        return;
      }

      try {
        const reportRef = await addDoc(collection(db, "QA_Reports"), {
          userId: currentUser.uid,
          email: currentUser.email || "unknown",
          displayName: currentUser.displayName || "관리자",
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
        console.log("??QA 리포???�성??", reportRef.id);
        
        // 로컬 ?�토리�??�도 ?�??(백업??
        localStorage.setItem('yago-vibe-qa-report-id', reportRef.id);
      } catch (error) {
        console.error("??QA 리포???�성 ?�패:", error);
      }
    };

    // 기존 리포??ID가 ?�는지 ?�인
    const existingReportId = localStorage.getItem('yago-vibe-qa-report-id');
    if (existingReportId) {
      setReportId(existingReportId);
      console.log("?�� 기존 QA 리포??로드:", existingReportId);
    } else {
      createNewReport();
    }
  }, [currentUser, checklist.length]);

  // ??Firestore??체크 변???�시�??�??  useEffect(() => {
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

        console.log("?�� QA 진행?�황 ?�?�됨:", progressPercentage + "%");
      } catch (error) {
        console.error("??QA 진행?�황 ?�???�패:", error);
      }
    };

    // 초기 로드가 ?�닐 ?�만 ?�??(무한 루프 방�?)
    if (reportId && checklist.some(item => item.completed)) {
      saveProgress();
    }
  }, [checklist, reportId, currentUser]);

  // 체크박스 ?��?
  const toggleCheck = (id: string) => {
    setChecklist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  // 진행�?계산
  const completedCount = checklist.filter(item => item.completed).length;
  const totalCount = checklist.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  // Recharts ?�이??  const COLORS = ["#10B981", "#EF4444"]; // green-500, red-500
  const chartData = [
    { name: "?�료", value: completedCount, color: COLORS[0] },
    { name: "미완�?, value: totalCount - completedCount, color: COLORS[1] }
  ];

  // PDF 보고???�운로드
  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // ?�더
    doc.setFontSize(20);
    doc.setTextColor(30, 64, 175); // blue-900
    doc.text("YAGO VIBE 버그바운??QA 체크리스??, 15, 20);
    
    // ?�성???�보
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`?�성?? ${currentUser?.email || "Unknown"}`, 15, 35);
    doc.text(`진행�? ${progressPercentage}% (${completedCount}/${totalCount} ?�료)`, 15, 45);
    doc.text(`?�성?? ${new Date().toLocaleString('ko-KR')}`, 15, 55);
    
    // Firestore 리포??ID
    if (reportId) {
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`리포??ID: ${reportId}`, 15, 65);
    }
    
    // 체크리스????��??    let yPosition = 75;
    doc.setFontSize(12);
    
    checklist.forEach((item, index) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      const status = item.completed ? "???�료" : "??미완�?;
      const statusColor = item.completed ? [16, 185, 129] : [239, 68, 68]; // green-500 or red-500
      
      doc.setTextColor(0, 0, 0);
      doc.text(`${index + 1}. ${item.item}`, 15, yPosition);
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(status, 15, yPosition + 8);
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.text(`   기�? 결과: ${item.expectedResult}`, 15, yPosition + 16);
      
      doc.setFontSize(12);
      yPosition += 30;
    });
    
    // ?�료 메시지
    if (progressPercentage === 100) {
      doc.addPage();
      doc.setFontSize(18);
      doc.setTextColor(16, 185, 129); // green-500
      doc.text("?�� 축하?�니??", 15, 50);
      doc.setTextColor(0, 0, 0);
      doc.text("모든 QA 체크리스?��? ?�료?�었?�니??", 15, 70);
      doc.text("?�제 YAGO VIBE�??�전?�게 배포?????�습?�다.", 15, 90);
    }
    
    doc.save(`YAGO_VIBE_QA_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // ?�체 초기??  const resetAll = () => {
    if (window.confirm("모든 체크리스?��? 초기?�하?�겠?�니�?")) {
      setChecklist(prev => prev.map(item => ({ ...item, completed: false })));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* ?�더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 mb-2">
                ?? YAGO VIBE 버그바운??QA 체크리스??              </h1>
              <p className="text-gray-600">관리자??- 배포 ??QA ?��? (10�??�주??</p>
              {reportId && (
                <p className="text-xs text-gray-500 mt-1">
                  ?�� Firestore ?�동 ?�???�성??| 리포??ID: {reportId.slice(0, 8)}...
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {completedCount} / {totalCount}
              </div>
              <div className="text-sm text-gray-500">?�료????��</div>
              {currentUser && (
                <div className="text-xs text-gray-400 mt-1">
                  ?�� {currentUser.email}
                </div>
              )}
            </div>
          </div>

          {/* ?�체 진행�?�?*/}
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-700">
              ?�체 진행�? {progressPercentage}%
            </span>
            <div className="flex gap-2">
              <button
                onClick={resetAll}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
              >
                ?�� 초기??              </button>
              <button
                onClick={downloadPDF}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                ?�� PDF 보고???�운로드
              </button>
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                ?�� ?�?�보?�로
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 체크리스??*/}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">?�� ?�세 체크리스??/h2>
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
                        <strong>기�? 결과:</strong> {item.expectedResult}
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

          {/* 차트 �??�계 */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">?�� 진행�??�계</h2>
            </div>
            <div className="p-6">
              {/* ?�이차트 */}
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
                      formatter={(value: number, name: string) => [`${value}�?, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* 범�? */}
              <div className="flex justify-center gap-6 mb-6">
                {chartData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-600">{item.name}: {item.value}�?/span>
                  </div>
                ))}
              </div>

              {/* ?�료 ?�태 ?�시 */}
              {progressPercentage === 100 && (
                <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-lg p-4 text-white text-center">
                  <h3 className="text-lg font-bold mb-1">?�� 축하?�니??</h3>
                  <p className="text-sm opacity-90">모든 QA 체크리스?��? ?�료?�었?�니??</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ?�단 ?�내 */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-yellow-600 text-xl">?�️</span>
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1">QA ?��? ?�내</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>??�???��???�제�??�스?�한 ??체크?�세??/li>
                <li>??모든 체크리스?��? ?�료?�면 ?�영 ?�인 가?�합?�다</li>
                <li>??체크리스???�태??브라?��????�동 ?�?�됩?�다</li>
                <li>??PDF 보고?�로 ?��? 결과�??�?�할 ???�습?�다</li>
                <li>???�상 ?�요 ?�간: ??10�?/li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
