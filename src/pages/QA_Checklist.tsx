// ?�� YAGO VIBE ?�영 ??버그바운??체크리스??(10�??�주??
// 관리자??QA ?��? ?�이지

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  expectedResult: string;
  completed: boolean;
}

export default function QA_Checklist() {
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
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
    {
      id: "detail-3",
      category: "3️⃣ ?�품 ?�세 ?�이지",
      item: "AI ?�뢰???�수 ?�시",
      expectedResult: "??'AI ?�뢰??79?? ?�시 ?�인",
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
    {
      id: "status-2",
      category: "6️⃣ ?�태 변�?버튼", 
      item: "?�료 ?�태?�서 '?�매�? 복�? 가??,
      expectedResult: "모든 ?�태 ?�환 검�?,
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
    {
      id: "ui-3",
      category: "7️⃣ UI/UX ?�인",
      item: "?�?�보??버튼 ?�릭",
      expectedResult: "/admin ?�속 ?�상",
      completed: false
    },
    {
      id: "ui-4",
      category: "7️⃣ UI/UX ?�인",
      item: "?�로??버튼 ?�릭",
      expectedResult: "/profile�??�상 ?�동",
      completed: false
    },
    
    // 8️⃣ Firestore 구조
    {
      id: "firestore-1",
      category: "8️⃣ Firestore 구조",
      item: "products 컬렉??존재",
      expectedResult: "모든 ?�품 문서 ??sellerId, status, imageUrl, aiScore ?�드 ?�인",
      completed: false
    },
    {
      id: "firestore-2",
      category: "8️⃣ Firestore 구조",
      item: "??�� ??Storage ?��?지???�거",
      expectedResult: "Storage?�서 ?��?지 ?�일 ?�거 ?�인",
      completed: false
    },
    
    // 9️⃣ 반응???�스??    {
      id: "responsive-1",
      category: "9️⃣ 반응???�스??,
      item: "모바??375px) UI 깨짐 ?�음",
      expectedResult: "버튼 줄바�? ?��?지 중앙 ?�렬 ?��?",
      completed: false
    },
    {
      id: "responsive-2",
      category: "9️⃣ 반응???�스??,
      item: "?�스?�탑(1440px) UI ?�상",
      expectedResult: "?�백·?�렬 ?�상 ?�음",
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

  // 로컬 ?�토리�??�서 체크리스???�태 불러?�기
  useEffect(() => {
    const saved = localStorage.getItem('yago-vibe-qa-checklist');
    if (saved) {
      setChecklist(JSON.parse(saved));
    }
  }, []);

  // 체크리스???�태 ?�??  useEffect(() => {
    localStorage.setItem('yago-vibe-qa-checklist', JSON.stringify(checklist));
  }, [checklist]);

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

  // 카테고리�?진행�?  const categoryProgress = checklist.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { total: 0, completed: 0 };
    }
    acc[item.category].total++;
    if (item.completed) {
      acc[item.category].completed++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  // ?�체 초기??  const resetAll = () => {
    if (window.confirm("모든 체크리스?��? 초기?�하?�겠?�니�?")) {
      setChecklist(prev => prev.map(item => ({ ...item, completed: false })));
    }
  };

  // ?�료????���?초기??  const resetCompleted = () => {
    setChecklist(prev => prev.map(item => ({ ...item, completed: false })));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* ?�더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 mb-2">
                ?? YAGO VIBE ?�영 ??버그바운??체크리스??              </h1>
              <p className="text-gray-600">10�??�주??- 배포 ??QA ?��?</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {completedCount} / {totalCount}
              </div>
              <div className="text-sm text-gray-500">?�료????��</div>
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
                onClick={resetCompleted}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
              >
                ?�� 초기??              </button>
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                ?�� ?�?�보?�로
              </button>
            </div>
          </div>
        </div>

        {/* 카테고리�?진행�?*/}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Object.entries(categoryProgress).map(([category, progress]) => {
            const categoryPercentage = Math.round((progress.completed / progress.total) * 100);
            return (
              <div key={category} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-sm">{category}</span>
                  <span className="text-sm text-gray-500">
                    {progress.completed}/{progress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${categoryPercentage}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {categoryPercentage}% ?�료
                </div>
              </div>
            );
          })}
        </div>

        {/* 체크리스??*/}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">?�� ?�세 체크리스??/h2>
          </div>
          <div className="divide-y divide-gray-200">
            {checklist.map((item, index) => (
              <div 
                key={item.id}
                className={`p-6 hover:bg-gray-50 transition-colors ${
                  item.completed ? 'bg-green-50' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => toggleCheck(item.id)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        {item.category}
                      </span>
                      <span className="text-sm text-gray-500">#{index + 1}</span>
                    </div>
                    <h3 className={`text-lg font-medium mb-2 ${
                      item.completed ? 'text-green-700 line-through' : 'text-gray-900'
                    }`}>
                      {item.item}
                    </h3>
                    <p className={`text-sm ${
                      item.completed ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      <strong>기�? 결과:</strong> {item.expectedResult}
                    </p>
                  </div>
                  {item.completed && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ???�료
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ?�료 ?�태 ?�시 */}
        {progressPercentage === 100 && (
          <div className="mt-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg p-6 text-white text-center">
            <h2 className="text-2xl font-bold mb-2">?�� 축하?�니??</h2>
            <p className="text-lg mb-4">모든 QA 체크리스?��? ?�료?�었?�니??</p>
            <p className="text-sm opacity-90">?�제 YAGO VIBE�??�전?�게 배포?????�습?�다.</p>
          </div>
        )}

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
                <li>???�상 ?�요 ?�간: ??10�?/li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
