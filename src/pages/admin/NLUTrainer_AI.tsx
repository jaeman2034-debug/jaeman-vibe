/**
 * ??NLUTrainer_AI.tsx
 * 기능:
 *  - ?�성 로그?�서 ?�못 ?�식??명령 ?�인
 *  - ?�용?��? 직접 ?�답 ?�그 ?�정
 *  - Firestore???�습 ?�이???�?? *  - NLU 모델 ?�동 개선
 */

import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

type VoiceLog = {
  id: string;
  session: string;
  text: string;
  ts?: any;
  type: string;
};

export default function NLUTrainer_AI() {
  const [logs, setLogs] = useState<VoiceLog[]>([]);
  const [selected, setSelected] = useState<VoiceLog | null>(null);
  const [correctedTags, setCorrectedTags] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  // === ?�성 로그 불러?�기 ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const sessionsRef = collection(db, "voiceSessions");
        const sessions = await getDocs(sessionsRef);
        const all: VoiceLog[] = [];
        
        for (const doc of sessions.docs) {
          const logsRef = collection(db, "voiceSessions", doc.id, "logs");
          const logsQuery = query(logsRef, orderBy("ts", "desc"));
          const snap = await getDocs(logsQuery);
          
          snap.docs.forEach((l) => {
            const data = l.data();
            if (data.type === "stt" && data.text && data.text !== "start") {
              all.push({ 
                id: l.id, 
                session: doc.id, 
                text: data.text,
                ts: data.ts,
                type: data.type
              });
            }
          });
        }
        
        // 최신???�렬
        setLogs(all.sort((a, b) => {
          const aTime = a.ts?.seconds || 0;
          const bTime = b.ts?.seconds || 0;
          return bTime - aTime;
        }));
      } catch (error) {
        console.error("로그 불러?�기 ?�류:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // === ?�터링된 로그 ===
  const filteredLogs = logs.filter(log => 
    !filter || log.text.toLowerCase().includes(filter.toLowerCase())
  );

  // === ?�정 ?�항 ?�??===
  const saveCorrection = async () => {
    if (!selected || !correctedTags.trim()) return;
    
    try {
      const tagsArr = correctedTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      
      await addDoc(collection(db, "nluCorrections"), {
        inputText: selected.text,
        correctedTags: tagsArr,
        createdAt: serverTimestamp(),
        sessionId: selected.session,
        logId: selected.id,
        originalTags: [], // 추후 ?�본 ?�그???�??가??      });
      
      setSaved(true);
      setCorrectedTags("");
      setSelected(null);
      
      // 3�????�공 메시지 ?�거
      setTimeout(() => setSaved(false), 3000);
      
    } catch (error) {
      console.error("?�정 ?�???�류:", error);
    }
  };

  // === 추천 ?�그 ?�성 ===
  const generateSuggestedTags = (text: string): string[] => {
    const words = text
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 1);
    
    const stopWords = ["근처", "주�?", "보여�?, "찾아�?, "?�고??, "??, "좀", "?�거", "?�님"];
    return words.filter(w => !stopWords.includes(w));
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* ?�더 */}
      <div className="bg-white border-b p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">?�� NLU ?�학???�널</h1>
        <p className="text-gray-600">
          ?�못 ?�식???�성 명령???�그�??�정?�면, ?�스?�이 ?�습 ?�이?�로 반영?�니??
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 좌측: 로그 목록 */}
        <div className="w-1/2 bg-white border-r overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="font-bold text-lg mb-3">?���??�성 명령 로그</h2>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="검?�어�??�터�?.."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <div className="text-sm text-gray-600 mt-2">
              {filteredLogs.length}�?로그 ?�시
            </div>
          </div>
          
          {loading ? (
            <div className="p-4 text-center text-gray-500">로딩 �?..</div>
          ) : (
            <div className="p-2">
              {filteredLogs.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  ?�성 로그가 ?�습?�다.
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 border rounded-lg cursor-pointer mb-2 transition-colors ${
                      selected?.id === log.id 
                        ? "bg-blue-100 border-blue-300" 
                        : "bg-white hover:bg-gray-50"
                    }`}
                    onClick={() => setSelected(log)}
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      {log.ts?.toDate?.().toLocaleString?.() || ""}
                    </div>
                    <div className="font-medium text-gray-800">
                      "{log.text}"
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      ?�션: {log.session.slice(-8)}...
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ?�측: ?�정 ?�널 */}
        <div className="w-1/2 bg-white overflow-y-auto">
          <div className="p-4">
            <h2 className="font-bold text-lg mb-4">?�️ ?�그 ?�정</h2>
            
            {saved && (
              <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">
                ???�정???�?�되?�습?�다! ?�음 ?�성 명령부??개선???�식???�용?�니??
              </div>
            )}

            {selected ? (
              <div className="space-y-4">
                {/* ?�택??문장 */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">?�택???�성 명령</h3>
                  <p className="text-gray-700 text-lg">"{selected.text}"</p>
                </div>

                {/* 추천 ?�그 */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">?�� 추천 ?�그</h3>
                  <div className="flex flex-wrap gap-2">
                    {generateSuggestedTags(selected.text).map((tag, i) => (
                      <span 
                        key={i}
                        className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm cursor-pointer hover:bg-blue-200"
                        onClick={() => {
                          const current = correctedTags.split(",").map(t => t.trim()).filter(Boolean);
                          const newTags = [...current, tag].filter((t, idx, arr) => arr.indexOf(t) === idx);
                          setCorrectedTags(newTags.join(", "));
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* ?�그 ?�력 */}
                <div className="p-4 bg-white border rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">?�답 ?�그 ?�력</h3>
                  <input
                    className="w-full border rounded-lg px-3 py-2 mb-3"
                    placeholder="?? 축구, ?�동?? ?�이??(?�표�?구분)"
                    value={correctedTags}
                    onChange={(e) => setCorrectedTags(e.target.value)}
                  />
                  <div className="text-sm text-gray-600 mb-3">
                    ?�� ?�표�?구분?�여 ?�러 ?�그�??�력?�세?? ?�의 추천 ?�그�??�릭?�도 추�??�니??
                  </div>
                  
                  <button
                    onClick={saveCorrection}
                    disabled={!correctedTags.trim()}
                    className="w-full bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    ?? ?�습 ?�이?�로 ?�?�하�?                  </button>
                </div>

                {/* ?�시 */}
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">?�� ?�시</h3>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <div>??"근처 축구??보여�? ??축구, ?�동??/div>
                    <div>??"?�이???�발 찾아�? ???�이?? ?�발, ?�동??/div>
                    <div>??"?�구�??�디???????�어?" ???�구, ?�구�? ?�품</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <div className="text-4xl mb-4">?�️</div>
                <h3 className="text-lg font-semibold mb-2">로그�??�택?�세??/h3>
                <p>?�쪽?�서 ?�정?�고 ?��? ?�성 명령???�택?�면 ?�기???�시?�니??</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
