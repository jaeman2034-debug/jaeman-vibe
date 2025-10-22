// ??/src/pages/AdminVoiceStats.tsx
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#6366F1", "#EC4899"];

export default function AdminVoiceStats() {
  const [logs, setLogs] = useState<any[]>([]);
  const [voiceCount, setVoiceCount] = useState<any[]>([]);
  const [dailyPlay, setDailyPlay] = useState<any[]>([]);
  const [hourlyPlay, setHourlyPlay] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("?“Š AdminVoiceStats: ?¤ì‹œê°??µê³„ ?°ì´??êµ¬ë… ?œì‘");

    const unsub = onSnapshot(collection(db, "play_logs"), (snap) => {
      const list = snap.docs.map((d) => d.data());
      setLogs(list);
      console.log("?“Š ?¬ìƒ ë¡œê·¸ ?…ë°?´íŠ¸:", list.length, "ê°?);

      // ?™ ë³´ì´?¤ë³„ ?¬ìš© ë¹„ìœ¨ ê³„ì‚°
      const voiceMap: Record<string, number> = {};
      list.forEach((l) => {
        const v = l.voice || "ê¸°í?";
        voiceMap[v] = (voiceMap[v] || 0) + 1;
      });
      const voiceArr = Object.entries(voiceMap).map(([name, value]) => ({
        name: getVoiceLabel(name),
        value,
        originalName: name,
      }));
      setVoiceCount(voiceArr);

      // ?“… ? ì§œë³??¬ìƒ ?Ÿìˆ˜ ê³„ì‚°
      const dailyMap: Record<string, number> = {};
      list.forEach((l) => {
        const ts = l.playedAt?.seconds;
        if (!ts) return;
        const date = new Date(ts * 1000).toLocaleDateString("ko-KR");
        dailyMap[date] = (dailyMap[date] || 0) + 1;
      });
      const dailyArr = Object.entries(dailyMap).map(([date, count]) => ({
        date,
        count,
      }));
      setDailyPlay(dailyArr.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

      // ???œê°„?€ë³??¬ìƒ ?Ÿìˆ˜ ê³„ì‚° (0-23??
      const hourlyMap: Record<number, number> = {};
      list.forEach((l) => {
        const ts = l.playedAt?.seconds;
        if (!ts) return;
        const hour = new Date(ts * 1000).getHours();
        hourlyMap[hour] = (hourlyMap[hour] || 0) + 1;
      });
      const hourlyArr = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}??,
        count: hourlyMap[i] || 0,
      }));
      setHourlyPlay(hourlyArr);

      setLoading(false);
    });

    return () => {
      console.log("?“Š AdminVoiceStats: ?¤ì‹œê°?êµ¬ë… ?•ë¦¬");
      unsub();
    };
  }, []);

  const getVoiceLabel = (voice: string) => {
    const voices = {
      alloy: "?™ Alloy",
      echo: "?”Š Echo",
      fable: "?“– Fable",
      onyx: "?–¤ Onyx",
      nova: "?’¡ Nova",
      shimmer: "??Shimmer",
      ê¸°í?: "??ê¸°í?"
    };
    return voices[voice as keyof typeof voices] || voice;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
        ?µê³„ ?°ì´??ë¡œë”© ì¤?..
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">?“Š AI ë³´ì´???¬ìƒ ?µê³„</h1>
        <div className="text-sm text-gray-500">
          ì´??¬ìƒ ?Ÿìˆ˜: <span className="font-semibold text-blue-600">{logs.length}</span>??        </div>
      </div>

      {/* ?µê³„ ?”ì•½ ì¹´ë“œ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-blue-600">{logs.length}</div>
          <div className="text-sm text-gray-500">ì´??¬ìƒ ?Ÿìˆ˜</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600">{voiceCount.length}</div>
          <div className="text-sm text-gray-500">?¬ìš©???Œì„± ì¢…ë¥˜</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {voiceCount.length > 0 ? voiceCount[0].value : 0}
          </div>
          <div className="text-sm text-gray-500">ê°€???¸ê¸° ?Œì„±</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-orange-600">{dailyPlay.length}</div>
          <div className="text-sm text-gray-500">?œë™ ?¼ìˆ˜</div>
        </div>
      </div>

      {/* ??ë³´ì´?¤ë³„ ë¹„ìœ¨ (?í˜• ê·¸ë˜?? */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6">
          <h2 className="font-semibold mb-4">?™ ë³´ì´?¤ë³„ ?¬ìš© ë¹„ìœ¨</h2>
          {voiceCount.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">?“Š</div>
              <p className="text-gray-500 text-sm">?„ì§ ?¬ìƒ ë¡œê·¸ê°€ ?†ìŠµ?ˆë‹¤.</p>
              <p className="text-xs text-gray-400 mt-1">ë¸Œë¦¬?‘ì„ ?¬ìƒ?˜ë©´ ?µê³„ê°€ ?œì‹œ?©ë‹ˆ??</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={voiceCount}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}??}
                >
                  {voiceCount.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ??? ì§œë³??¬ìƒ ì¶”ì´ (ë§‰ë? ê·¸ë˜?? */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6">
          <h2 className="font-semibold mb-4">?“… ? ì§œë³??¬ìƒ ?Ÿìˆ˜</h2>
          {dailyPlay.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">?“ˆ</div>
              <p className="text-gray-500 text-sm">?„ì§ ?¬ìƒ ê¸°ë¡???†ìŠµ?ˆë‹¤.</p>
              <p className="text-xs text-gray-400 mt-1">?¼ìë³??µê³„ê°€ ?¬ê¸°???œì‹œ?©ë‹ˆ??</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyPlay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#4F46E5" barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ???œê°„?€ë³??¬ìƒ ì¶”ì´ (?¼ì¸ ê·¸ë˜?? */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6">
          <h2 className="font-semibold mb-4">???œê°„?€ë³??¬ìƒ ?¨í„´</h2>
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">?•</div>
              <p className="text-gray-500 text-sm">?„ì§ ?¬ìƒ ê¸°ë¡???†ìŠµ?ˆë‹¤.</p>
              <p className="text-xs text-gray-400 mt-1">?œê°„?€ë³??µê³„ê°€ ?¬ê¸°???œì‹œ?©ë‹ˆ??</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyPlay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ë³´ì´?¤ë³„ ?ì„¸ ?µê³„ ?Œì´ë¸?*/}
      {voiceCount.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6">
            <h2 className="font-semibold mb-4">?“‹ ë³´ì´?¤ë³„ ?ì„¸ ?µê³„</h2>
            <div className="overflow-x-auto">
              <table className="w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">?Œì„±</th>
                    <th className="p-3 text-left">?¬ìƒ ?Ÿìˆ˜</th>
                    <th className="p-3 text-left">ë¹„ìœ¨</th>
                    <th className="p-3 text-left">?¸ê¸°??/th>
                  </tr>
                </thead>
                <tbody>
                  {voiceCount
                    .sort((a, b) => b.value - a.value)
                    .map((voice, i) => (
                      <tr key={voice.originalName} className="border-t hover:bg-gray-50">
                        <td className="p-3 font-semibold">{voice.name}</td>
                        <td className="p-3">{voice.value}??/td>
                        <td className="p-3">
                          {((voice.value / logs.length) * 100).toFixed(1)}%
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${(voice.value / voiceCount[0].value) * 100}%`,
                                  backgroundColor: COLORS[i % COLORS.length],
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              #{i + 1}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ìµœê·¼ ?¬ìƒ ë¡œê·¸ */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6">
          <h2 className="font-semibold mb-4">?“ ìµœê·¼ ?¬ìƒ ë¡œê·¸ (ìµœê·¼ 10ê°?</h2>
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">?“</div>
              <p className="text-gray-500 text-sm">?„ì§ ?¬ìƒ ë¡œê·¸ê°€ ?†ìŠµ?ˆë‹¤.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs
                .sort((a, b) => b.playedAt?.seconds - a.playedAt?.seconds)
                .slice(0, 10)
                .map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{log.title}</div>
                      <div className="text-xs text-gray-500">
                        {getVoiceLabel(log.voice)} ??
                        {log.playedAt 
                          ? new Date(log.playedAt.seconds * 1000).toLocaleString("ko-KR")
                          : "?œê°„ ?•ë³´ ?†ìŒ"
                        }
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">#{i + 1}</div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
