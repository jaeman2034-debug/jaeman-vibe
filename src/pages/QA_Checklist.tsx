// ?”¥ YAGO VIBE ?´ì˜ ??ë²„ê·¸ë°”ìš´??ì²´í¬ë¦¬ìŠ¤??(10ë¶??„ì£¼??
// ê´€ë¦¬ì??QA ?ê? ?˜ì´ì§€

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
    {
      id: "detail-3",
      category: "3ï¸âƒ£ ?í’ˆ ?ì„¸ ?˜ì´ì§€",
      item: "AI ? ë¢°???ìˆ˜ ?œì‹œ",
      expectedResult: "??'AI ? ë¢°??79?? ?œì‹œ ?•ì¸",
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
    {
      id: "status-2",
      category: "6ï¸âƒ£ ?íƒœ ë³€ê²?ë²„íŠ¼", 
      item: "?„ë£Œ ?íƒœ?ì„œ '?ë§¤ì¤? ë³µê? ê°€??,
      expectedResult: "ëª¨ë“  ?íƒœ ?œí™˜ ê²€ì¦?,
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
    {
      id: "ui-3",
      category: "7ï¸âƒ£ UI/UX ?•ì¸",
      item: "?€?œë³´??ë²„íŠ¼ ?´ë¦­",
      expectedResult: "/admin ?‘ì† ?•ìƒ",
      completed: false
    },
    {
      id: "ui-4",
      category: "7ï¸âƒ£ UI/UX ?•ì¸",
      item: "?„ë¡œ??ë²„íŠ¼ ?´ë¦­",
      expectedResult: "/profileë¡??•ìƒ ?´ë™",
      completed: false
    },
    
    // 8ï¸âƒ£ Firestore êµ¬ì¡°
    {
      id: "firestore-1",
      category: "8ï¸âƒ£ Firestore êµ¬ì¡°",
      item: "products ì»¬ë ‰??ì¡´ì¬",
      expectedResult: "ëª¨ë“  ?í’ˆ ë¬¸ì„œ ??sellerId, status, imageUrl, aiScore ?„ë“œ ?•ì¸",
      completed: false
    },
    {
      id: "firestore-2",
      category: "8ï¸âƒ£ Firestore êµ¬ì¡°",
      item: "?? œ ??Storage ?´ë?ì§€???œê±°",
      expectedResult: "Storage?ì„œ ?´ë?ì§€ ?Œì¼ ?œê±° ?•ì¸",
      completed: false
    },
    
    // 9ï¸âƒ£ ë°˜ì‘???ŒìŠ¤??    {
      id: "responsive-1",
      category: "9ï¸âƒ£ ë°˜ì‘???ŒìŠ¤??,
      item: "ëª¨ë°”??375px) UI ê¹¨ì§ ?†ìŒ",
      expectedResult: "ë²„íŠ¼ ì¤„ë°”ê¿? ?´ë?ì§€ ì¤‘ì•™ ?•ë ¬ ? ì?",
      completed: false
    },
    {
      id: "responsive-2",
      category: "9ï¸âƒ£ ë°˜ì‘???ŒìŠ¤??,
      item: "?°ìŠ¤?¬íƒ‘(1440px) UI ?•ìƒ",
      expectedResult: "?¬ë°±Â·?•ë ¬ ?´ìƒ ?†ìŒ",
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

  // ë¡œì»¬ ?¤í† ë¦¬ì??ì„œ ì²´í¬ë¦¬ìŠ¤???íƒœ ë¶ˆëŸ¬?¤ê¸°
  useEffect(() => {
    const saved = localStorage.getItem('yago-vibe-qa-checklist');
    if (saved) {
      setChecklist(JSON.parse(saved));
    }
  }, []);

  // ì²´í¬ë¦¬ìŠ¤???íƒœ ?€??  useEffect(() => {
    localStorage.setItem('yago-vibe-qa-checklist', JSON.stringify(checklist));
  }, [checklist]);

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

  // ì¹´í…Œê³ ë¦¬ë³?ì§„í–‰ë¥?  const categoryProgress = checklist.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = { total: 0, completed: 0 };
    }
    acc[item.category].total++;
    if (item.completed) {
      acc[item.category].completed++;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number }>);

  // ?„ì²´ ì´ˆê¸°??  const resetAll = () => {
    if (window.confirm("ëª¨ë“  ì²´í¬ë¦¬ìŠ¤?¸ë? ì´ˆê¸°?”í•˜?œê² ?µë‹ˆê¹?")) {
      setChecklist(prev => prev.map(item => ({ ...item, completed: false })));
    }
  };

  // ?„ë£Œ????ª©ë§?ì´ˆê¸°??  const resetCompleted = () => {
    setChecklist(prev => prev.map(item => ({ ...item, completed: false })));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* ?¤ë” */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 mb-2">
                ?? YAGO VIBE ?´ì˜ ??ë²„ê·¸ë°”ìš´??ì²´í¬ë¦¬ìŠ¤??              </h1>
              <p className="text-gray-600">10ë¶??„ì£¼??- ë°°í¬ ??QA ?ê?</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {completedCount} / {totalCount}
              </div>
              <div className="text-sm text-gray-500">?„ë£Œ????ª©</div>
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
                onClick={resetCompleted}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
              >
                ?”„ ì´ˆê¸°??              </button>
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                ?“Š ?€?œë³´?œë¡œ
              </button>
            </div>
          </div>
        </div>

        {/* ì¹´í…Œê³ ë¦¬ë³?ì§„í–‰ë¥?*/}
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
                  {categoryPercentage}% ?„ë£Œ
                </div>
              </div>
            );
          })}
        </div>

        {/* ì²´í¬ë¦¬ìŠ¤??*/}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">?“‹ ?ì„¸ ì²´í¬ë¦¬ìŠ¤??/h2>
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
                      <strong>ê¸°ë? ê²°ê³¼:</strong> {item.expectedResult}
                    </p>
                  </div>
                  {item.completed && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ???„ë£Œ
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ?„ë£Œ ?íƒœ ?œì‹œ */}
        {progressPercentage === 100 && (
          <div className="mt-6 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg p-6 text-white text-center">
            <h2 className="text-2xl font-bold mb-2">?‰ ì¶•í•˜?©ë‹ˆ??</h2>
            <p className="text-lg mb-4">ëª¨ë“  QA ì²´í¬ë¦¬ìŠ¤?¸ê? ?„ë£Œ?˜ì—ˆ?µë‹ˆ??</p>
            <p className="text-sm opacity-90">?´ì œ YAGO VIBEë¥??ˆì „?˜ê²Œ ë°°í¬?????ˆìŠµ?ˆë‹¤.</p>
          </div>
        )}

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
                <li>???ˆìƒ ?Œìš” ?œê°„: ??10ë¶?/li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
