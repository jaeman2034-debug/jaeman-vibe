/**
 * ??VoiceConsole_AI.tsx
 * 기능:
 *  - ?�성 ?�션 목록 ?�시
 *  - ?�시�?로그 ?�트�?모니?�링
 *  - ?�터�?�?CSV ?�보?�기
 *  - ?�학?�용 ?�이???�집
 */

import React, { useEffect, useMemo, useState } from "react";
import { collection, getDocs, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

type Log = {
  ts?: any; 
  type: string; 
  text?: string; 
  tags?: string[]; 
  resultCount?: number;
  geo?: { lat: number; lng: number }; 
  meta?: any;
  _id?: string;
};

type Session = {
  id: string;
  createdAt?: any;
  createdBy?: string;
  ua?: string;
  device?: string;
};

export default function VoiceConsole_AI() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [current, setCurrent] = useState<Session | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // === ?�션 목록 불러?�기 ===
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(
          query(collection(db, "voiceSessions"), orderBy("createdAt", "desc"))
        );
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Session)));
      } catch (error) {
        console.error("?�션 목록 로딩 ?�류:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // === ?�시�?로그 ?�트�?===
  useEffect(() => {
    if (!current) return;
    
    const ref = query(
      collection(db, "voiceSessions", current.id, "logs"), 
      orderBy("ts", "asc")
    );
    
    const unsub = onSnapshot(ref, (snap) => {
      setLogs(snap.docs.map(d => ({ _id: d.id, ...d.data() } as Log)));
    });
    
    return () => unsub();
  }, [current]);

  // === 로그 ?�터�?===
  const filtered = useMemo(() => {
    if (!filter) return logs;
    const f = filter.toLowerCase();
    return logs.filter(l =>
      (l.type?.toLowerCase().includes(f)) ||
      (l.text?.toLowerCase().includes(f)) ||
      (l.tags || []).some(t => t.toLowerCase().includes(f))
    );
  }, [logs, filter]);

  // === CSV ?�보?�기 ===
  const exportCSV = () => {
    const rows = [["timestamp", "type", "text", "tags", "resultCount", "geo", "meta"]];
    filtered.forEach(l => {
      rows.push([
        l.ts?.toDate ? l.ts.toDate().toISOString() : "",
        l.type || "",
        (l.text || "").replace(/\n/g, " "),
        (l.tags || []).join("|"),
        String(l.resultCount ?? ""),
        l.geo ? `${l.geo.lat},${l.geo.lng}` : "",
        l.meta ? JSON.stringify(l.meta) : ""
      ]);
    });
    
    const csv = rows.map(r => 
      r.map(v => `"${(v || "").replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voice-logs-${current?.id || "all"}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // === 로그 ?�?�별 ?�상 ===
  const getLogTypeColor = (type: string) => {
    switch (type) {
      case "start": return "bg-blue-100 text-blue-800";
      case "stt": return "bg-green-100 text-green-800";
      case "nlu": return "bg-purple-100 text-purple-800";
      case "query": return "bg-yellow-100 text-yellow-800";
      case "results": return "bg-indigo-100 text-indigo-800";
      case "tts": return "bg-pink-100 text-pink-800";
      case "map": return "bg-orange-100 text-orange-800";
      case "error": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* ?�더 */}
      <div className="bg-white border-b p-4">
        <h1 className="text-2xl font-bold text-gray-800">?���??�성 로그 콘솔</h1>
        <p className="text-gray-600">?�시�??�성 ?�??모니?�링 �??�학?�용 ?�이???�집</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 좌측: ?�션 목록 */}
        <aside className="w-80 bg-white border-r overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="font-bold text-lg mb-3">?�� ?�션 목록</h2>
            <div className="text-sm text-gray-600">
              �?{sessions.length}�??�션
            </div>
          </div>
          
          {loading ? (
            <div className="p-4 text-center text-gray-500">로딩 �?..</div>
          ) : (
            <div className="p-2">
              {sessions.map(s => (
                <button
                  key={s.id}
                  className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                    current?.id === s.id 
                      ? "bg-black text-white" 
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                  onClick={() => setCurrent(s)}
                >
                  <div className="text-sm font-semibold truncate">
                    {s.id}
                  </div>
                  <div className="text-xs opacity-80 mt-1">
                    {s.createdAt?.toDate ? s.createdAt.toDate().toLocaleString() : ""}
                  </div>
                  <div className="text-xs opacity-60 mt-1">
                    {s.createdBy || "anonymous"}
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* ?�측: 로그 ?�트�?*/}
        <main className="flex-1 flex flex-col">
          {/* 컨트�?*/}
          <div className="bg-white border-b p-4">
            <div className="flex items-center gap-3">
              <input
                className="border rounded-lg px-3 py-2 flex-1"
                placeholder="?�터: type/text/tag??(?? stt, 축구?? error)"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <button 
                className="rounded-lg bg-black text-white px-4 py-2 hover:bg-gray-800 transition-colors"
                onClick={exportCSV}
              >
                ?�� CSV ?�보?�기
              </button>
              <div className="text-sm text-gray-600">
                {filtered.length}�?로그
              </div>
            </div>
          </div>

          {/* 로그 ?�시 */}
          <div className="flex-1 overflow-y-auto p-4">
            {!current ? (
              <div className="text-center text-gray-600 py-12">
                <div className="text-4xl mb-4">?��</div>
                <h3 className="text-lg font-semibold mb-2">?�션???�택?�세??/h3>
                <p>?�쪽?�서 ?�성 ?�션???�택?�면 ?�시�?로그�?�????�습?�다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    로그가 ?�습?�다.
                  </div>
                ) : (
                  filtered.map((l) => (
                    <div key={l._id} className="bg-white border rounded-lg p-4 shadow-sm">
                      {/* ?�더 */}
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getLogTypeColor(l.type)}`}>
                          {l.type}
                        </span>
                        <div className="text-xs text-gray-500">
                          {l.ts?.toDate ? l.ts.toDate().toLocaleString() : ""}
                        </div>
                      </div>

                      {/* ?�용 */}
                      {l.text && (
                        <div className="text-sm text-gray-800 mb-2">
                          {l.text}
                        </div>
                      )}

                      {/* ?�그 */}
                      {l.tags && l.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {l.tags.map((t, i) => (
                            <span key={i} className="text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-1">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 메�? ?�보 */}
                      <div className="text-xs text-gray-600 space-y-1">
                        {typeof l.resultCount === "number" && (
                          <div>결과: {l.resultCount}�?/div>
                        )}
                        {l.geo && (
                          <div>?�치: {l.geo.lat.toFixed(4)}, {l.geo.lng.toFixed(4)}</div>
                        )}
                        {l.meta && (
                          <div className="font-mono text-xs bg-gray-100 p-2 rounded">
                            {JSON.stringify(l.meta, null, 2)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
