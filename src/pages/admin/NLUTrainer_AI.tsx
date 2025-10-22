/**
 * ??NLUTrainer_AI.tsx
 * ê¸°ëŠ¥:
 *  - ?Œì„± ë¡œê·¸?ì„œ ?˜ëª» ?¸ì‹??ëª…ë ¹ ?•ì¸
 *  - ?¬ìš©?ê? ì§ì ‘ ?•ë‹µ ?œê·¸ ?˜ì •
 *  - Firestore???™ìŠµ ?°ì´???€?? *  - NLU ëª¨ë¸ ?ë™ ê°œì„ 
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

  // === ?Œì„± ë¡œê·¸ ë¶ˆëŸ¬?¤ê¸° ===
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
        
        // ìµœì‹ ???•ë ¬
        setLogs(all.sort((a, b) => {
          const aTime = a.ts?.seconds || 0;
          const bTime = b.ts?.seconds || 0;
          return bTime - aTime;
        }));
      } catch (error) {
        console.error("ë¡œê·¸ ë¶ˆëŸ¬?¤ê¸° ?¤ë¥˜:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // === ?„í„°ë§ëœ ë¡œê·¸ ===
  const filteredLogs = logs.filter(log => 
    !filter || log.text.toLowerCase().includes(filter.toLowerCase())
  );

  // === ?˜ì • ?¬í•­ ?€??===
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
        originalTags: [], // ì¶”í›„ ?ë³¸ ?œê·¸???€??ê°€??      });
      
      setSaved(true);
      setCorrectedTags("");
      setSelected(null);
      
      // 3ì´????±ê³µ ë©”ì‹œì§€ ?œê±°
      setTimeout(() => setSaved(false), 3000);
      
    } catch (error) {
      console.error("?˜ì • ?€???¤ë¥˜:", error);
    }
  };

  // === ì¶”ì²œ ?œê·¸ ?ì„± ===
  const generateSuggestedTags = (text: string): string[] => {
    const words = text
      .replace(/[^\p{L}\p{N}\s]/gu, "")
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 1);
    
    const stopWords = ["ê·¼ì²˜", "ì£¼ë?", "ë³´ì—¬ì¤?, "ì°¾ì•„ì¤?, "?¼ê³ ??, "??, "ì¢€", "?´ê±°", "?•ë‹˜"];
    return words.filter(w => !stopWords.includes(w));
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* ?¤ë” */}
      <div className="bg-white border-b p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">?§  NLU ?¬í•™???¨ë„</h1>
        <p className="text-gray-600">
          ?˜ëª» ?¸ì‹???Œì„± ëª…ë ¹???œê·¸ë¥??˜ì •?˜ë©´, ?œìŠ¤?œì´ ?™ìŠµ ?°ì´?°ë¡œ ë°˜ì˜?©ë‹ˆ??
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ì¢Œì¸¡: ë¡œê·¸ ëª©ë¡ */}
        <div className="w-1/2 bg-white border-r overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="font-bold text-lg mb-3">?™ï¸??Œì„± ëª…ë ¹ ë¡œê·¸</h2>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm"
              placeholder="ê²€?‰ì–´ë¡??„í„°ë§?.."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <div className="text-sm text-gray-600 mt-2">
              {filteredLogs.length}ê°?ë¡œê·¸ ?œì‹œ
            </div>
          </div>
          
          {loading ? (
            <div className="p-4 text-center text-gray-500">ë¡œë”© ì¤?..</div>
          ) : (
            <div className="p-2">
              {filteredLogs.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  ?Œì„± ë¡œê·¸ê°€ ?†ìŠµ?ˆë‹¤.
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
                      ?¸ì…˜: {log.session.slice(-8)}...
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ?°ì¸¡: ?˜ì • ?¨ë„ */}
        <div className="w-1/2 bg-white overflow-y-auto">
          <div className="p-4">
            <h2 className="font-bold text-lg mb-4">?ï¸ ?œê·¸ ?˜ì •</h2>
            
            {saved && (
              <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-4">
                ???˜ì •???€?¥ë˜?ˆìŠµ?ˆë‹¤! ?¤ìŒ ?Œì„± ëª…ë ¹ë¶€??ê°œì„ ???¸ì‹???¬ìš©?©ë‹ˆ??
              </div>
            )}

            {selected ? (
              <div className="space-y-4">
                {/* ? íƒ??ë¬¸ì¥ */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">? íƒ???Œì„± ëª…ë ¹</h3>
                  <p className="text-gray-700 text-lg">"{selected.text}"</p>
                </div>

                {/* ì¶”ì²œ ?œê·¸ */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">?’¡ ì¶”ì²œ ?œê·¸</h3>
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

                {/* ?œê·¸ ?…ë ¥ */}
                <div className="p-4 bg-white border rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-2">?•ë‹µ ?œê·¸ ?…ë ¥</h3>
                  <input
                    className="w-full border rounded-lg px-3 py-2 mb-3"
                    placeholder="?? ì¶•êµ¬, ?´ë™?? ?˜ì´??(?¼í‘œë¡?êµ¬ë¶„)"
                    value={correctedTags}
                    onChange={(e) => setCorrectedTags(e.target.value)}
                  />
                  <div className="text-sm text-gray-600 mb-3">
                    ?’¡ ?¼í‘œë¡?êµ¬ë¶„?˜ì—¬ ?¬ëŸ¬ ?œê·¸ë¥??…ë ¥?˜ì„¸?? ?„ì˜ ì¶”ì²œ ?œê·¸ë¥??´ë¦­?´ë„ ì¶”ê??©ë‹ˆ??
                  </div>
                  
                  <button
                    onClick={saveCorrection}
                    disabled={!correctedTags.trim()}
                    className="w-full bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    ?? ?™ìŠµ ?°ì´?°ë¡œ ?€?¥í•˜ê¸?                  </button>
                </div>

                {/* ?ˆì‹œ */}
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">?“ ?ˆì‹œ</h3>
                  <div className="text-sm text-yellow-700 space-y-1">
                    <div>??"ê·¼ì²˜ ì¶•êµ¬??ë³´ì—¬ì¤? ??ì¶•êµ¬, ?´ë™??/div>
                    <div>??"?˜ì´??? ë°œ ì°¾ì•„ì¤? ???˜ì´?? ? ë°œ, ?´ë™??/div>
                    <div>??"?êµ¬ê³??´ë””???????ˆì–´?" ???êµ¬, ?êµ¬ê³? ?©í’ˆ</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-12">
                <div className="text-4xl mb-4">?ï¸</div>
                <h3 className="text-lg font-semibold mb-2">ë¡œê·¸ë¥?? íƒ?˜ì„¸??/h3>
                <p>?¼ìª½?ì„œ ?˜ì •?˜ê³  ?¶ì? ?Œì„± ëª…ë ¹??? íƒ?˜ë©´ ?¬ê¸°???œì‹œ?©ë‹ˆ??</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
