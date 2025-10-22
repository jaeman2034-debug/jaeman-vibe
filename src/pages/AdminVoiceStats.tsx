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
    console.log("?�� AdminVoiceStats: ?�시�??�계 ?�이??구독 ?�작");

    const unsub = onSnapshot(collection(db, "play_logs"), (snap) => {
      const list = snap.docs.map((d) => d.data());
      setLogs(list);
      console.log("?�� ?�생 로그 ?�데?�트:", list.length, "�?);

      // ?�� 보이?�별 ?�용 비율 계산
      const voiceMap: Record<string, number> = {};
      list.forEach((l) => {
        const v = l.voice || "기�?";
        voiceMap[v] = (voiceMap[v] || 0) + 1;
      });
      const voiceArr = Object.entries(voiceMap).map(([name, value]) => ({
        name: getVoiceLabel(name),
        value,
        originalName: name,
      }));
      setVoiceCount(voiceArr);

      // ?�� ?�짜�??�생 ?�수 계산
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

      // ???�간?��??�생 ?�수 계산 (0-23??
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
      console.log("?�� AdminVoiceStats: ?�시�?구독 ?�리");
      unsub();
    };
  }, []);

  const getVoiceLabel = (voice: string) => {
    const voices = {
      alloy: "?�� Alloy",
      echo: "?�� Echo",
      fable: "?�� Fable",
      onyx: "?�� Onyx",
      nova: "?�� Nova",
      shimmer: "??Shimmer",
      기�?: "??기�?"
    };
    return voices[voice as keyof typeof voices] || voice;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
        ?�계 ?�이??로딩 �?..
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">?�� AI 보이???�생 ?�계</h1>
        <div className="text-sm text-gray-500">
          �??�생 ?�수: <span className="font-semibold text-blue-600">{logs.length}</span>??        </div>
      </div>

      {/* ?�계 ?�약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-blue-600">{logs.length}</div>
          <div className="text-sm text-gray-500">�??�생 ?�수</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600">{voiceCount.length}</div>
          <div className="text-sm text-gray-500">?�용???�성 종류</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {voiceCount.length > 0 ? voiceCount[0].value : 0}
          </div>
          <div className="text-sm text-gray-500">가???�기 ?�성</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-orange-600">{dailyPlay.length}</div>
          <div className="text-sm text-gray-500">?�동 ?�수</div>
        </div>
      </div>

      {/* ??보이?�별 비율 (?�형 그래?? */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6">
          <h2 className="font-semibold mb-4">?�� 보이?�별 ?�용 비율</h2>
          {voiceCount.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">?��</div>
              <p className="text-gray-500 text-sm">?�직 ?�생 로그가 ?�습?�다.</p>
              <p className="text-xs text-gray-400 mt-1">브리?�을 ?�생?�면 ?�계가 ?�시?�니??</p>
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

      {/* ???�짜�??�생 추이 (막�? 그래?? */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6">
          <h2 className="font-semibold mb-4">?�� ?�짜�??�생 ?�수</h2>
          {dailyPlay.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">?��</div>
              <p className="text-gray-500 text-sm">?�직 ?�생 기록???�습?�다.</p>
              <p className="text-xs text-gray-400 mt-1">?�자�??�계가 ?�기???�시?�니??</p>
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

      {/* ???�간?��??�생 추이 (?�인 그래?? */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6">
          <h2 className="font-semibold mb-4">???�간?��??�생 ?�턴</h2>
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">?��</div>
              <p className="text-gray-500 text-sm">?�직 ?�생 기록???�습?�다.</p>
              <p className="text-xs text-gray-400 mt-1">?�간?��??�계가 ?�기???�시?�니??</p>
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

      {/* 보이?�별 ?�세 ?�계 ?�이�?*/}
      {voiceCount.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6">
            <h2 className="font-semibold mb-4">?�� 보이?�별 ?�세 ?�계</h2>
            <div className="overflow-x-auto">
              <table className="w-full border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">?�성</th>
                    <th className="p-3 text-left">?�생 ?�수</th>
                    <th className="p-3 text-left">비율</th>
                    <th className="p-3 text-left">?�기??/th>
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

      {/* 최근 ?�생 로그 */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6">
          <h2 className="font-semibold mb-4">?�� 최근 ?�생 로그 (최근 10�?</h2>
          {logs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">?��</div>
              <p className="text-gray-500 text-sm">?�직 ?�생 로그가 ?�습?�다.</p>
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
                          : "?�간 ?�보 ?�음"
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
