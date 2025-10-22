import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

export default function NotificationPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [timelineStats, setTimelineStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    console.log("?” ?Œë¦¼ ?€?œë³´??ì´ˆê¸°??", user.uid);

    const q = query(
      collection(db, "notifications", user.uid, "items"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      console.log("?“Š ?Œë¦¼ ?°ì´???…ë°?´íŠ¸:", snapshot.docs.length, "ê°?);
      
      const items = snapshot.docs.map((d) => ({ 
        id: d.id, 
        ...d.data(),
        timestamp: d.data().createdAt || d.data().timestamp
      }));
      
      setLogs(items);

      // ì±„ë„ë³??µê³„
      const channelStats = items.reduce((acc: any, cur: any) => {
        const channel = cur.type || cur.channel || "system";
        acc[channel] = (acc[channel] || 0) + 1;
        return acc;
      }, {});

      const chartData = Object.keys(channelStats).map((key) => ({
        name: key,
        count: channelStats[key],
        fill: getChannelColor(key)
      }));

      setStats(chartData);

      // ?œê°„?€ë³??µê³„ (ìµœê·¼ 7??
      const timelineData = generateTimelineStats(items);
      setTimelineStats(timelineData);

      setLoading(false);
    }, (error) => {
      console.error("???Œë¦¼ ?°ì´??ë¡œë“œ ?¤íŒ¨:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const getChannelColor = (channel: string) => {
    const colors: { [key: string]: string } = {
      message: "#3B82F6", // blue
      comment: "#10B981", // green
      market: "#F59E0B", // yellow
      system: "#8B5CF6", // purple
      FCM: "#EF4444", // red
      Slack: "#4ADE80", // green
      Kakao: "#FBBF24", // yellow
      default: "#6B7280" // gray
    };
    return colors[channel] || colors.default;
  };

  const generateTimelineStats = (items: any[]) => {
    const now = new Date();
    const days = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayItems = items.filter(item => {
        const itemDate = item.timestamp?.toDate?.() || new Date(item.timestamp);
        return itemDate.toISOString().split('T')[0] === dateStr;
      });

      days.push({
        date: dateStr,
        count: dayItems.length,
        message: dayItems.filter(item => item.type === 'message').length,
        comment: dayItems.filter(item => item.type === 'comment').length,
        market: dayItems.filter(item => item.type === 'market').length,
        system: dayItems.filter(item => item.type === 'system').length,
      });
    }

    return days;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">?Œë¦¼ ?°ì´?°ë? ë¶ˆëŸ¬?¤ëŠ” ì¤?..</p>
        </div>
      </div>
    );
  }

  if (!auth.currentUser) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 text-center">
        <div className="text-6xl mb-4">?””</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">?Œë¦¼ ë¡œê·¸ ?€?œë³´??/h1>
        <p className="text-gray-600 mb-6">ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??/p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          ?ˆìœ¼ë¡??Œì•„ê°€ê¸?        </button>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-7xl mx-auto py-8 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* ?¤ë” */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">?”” ?Œë¦¼ ë¡œê·¸ ?€?œë³´??/h1>
        <p className="text-gray-500 text-lg">?¤ì‹œê°?FCM / Slack / Kakao ?Œë¦¼ ?„í™© ë°?ë¶„ì„</p>
      </div>

      {/* ?µê³„ ì¹´ë“œ */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">ì´??Œë¦¼ ??/p>
              <p className="text-3xl font-bold text-blue-600">{logs.length}</p>
            </div>
            <div className="text-4xl">?“Š</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">?½ì? ?Šì? ?Œë¦¼</p>
              <p className="text-3xl font-bold text-red-600">{logs.filter(l => !l.read).length}</p>
            </div>
            <div className="text-4xl">?”´</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">?¤ëŠ˜ ?Œë¦¼</p>
              <p className="text-3xl font-bold text-green-600">
                {logs.filter(l => {
                  const today = new Date().toDateString();
                  const itemDate = l.timestamp?.toDate?.() || new Date(l.timestamp);
                  return itemDate.toDateString() === today;
                }).length}
              </p>
            </div>
            <div className="text-4xl">?“…</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">?œì„± ì±„ë„</p>
              <p className="text-3xl font-bold text-purple-600">{stats.length}</p>
            </div>
            <div className="text-4xl">?“¡</div>
          </div>
        </motion.div>
      </div>

      {/* ì°¨íŠ¸ ?¹ì…˜ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* ì±„ë„ë³??µê³„ (ë°?ì°¨íŠ¸) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
        >
          <h2 className="text-xl font-semibold mb-6 text-gray-800">?“Š ì±„ë„ë³??Œë¦¼ ?µê³„</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="count" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* ì±„ë„ë³?ë¶„í¬ (?Œì´ ì°¨íŠ¸) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
        >
          <h2 className="text-xl font-semibold mb-6 text-gray-800">?¥§ ?Œë¦¼ ë¶„í¬</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="count"
              >
                {stats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ?œê°„?€ë³??¸ë Œ??*/}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-8"
      >
        <h2 className="text-xl font-semibold mb-6 text-gray-800">?“ˆ ìµœê·¼ 7???Œë¦¼ ?¸ë Œ??/h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={timelineStats}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={3} dot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ?Œë¦¼ ë¡œê·¸ ë¦¬ìŠ¤??*/}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">?“œ ìµœê·¼ ?Œë¦¼ ?´ì—­</h2>
          <span className="text-sm text-gray-500">{logs.length}ê°?/span>
        </div>
        
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">?“­</div>
            <p className="text-gray-400 text-lg">?„ì§ ?Œë¦¼ ê¸°ë¡???†ìŠµ?ˆë‹¤</p>
            <p className="text-gray-400 text-sm mt-2">
              <a href="/notification-test" className="text-blue-600 hover:underline">
                ?ŒìŠ¤???˜ì´ì§€
              </a>?ì„œ ?Œë¦¼???ì„±?´ë³´?¸ìš”
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`border rounded-xl p-4 flex justify-between items-center transition-all hover:shadow-md ${
                  log.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-800">{log.title}</h3>
                    {!log.read && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{log.body}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(log.timestamp?.toDate?.() || log.timestamp).toLocaleString("ko-KR")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium ${
                      log.type === "message"
                        ? "bg-blue-100 text-blue-700"
                        : log.type === "comment"
                        ? "bg-green-100 text-green-700"
                        : log.type === "market"
                        ? "bg-yellow-100 text-yellow-700"
                        : log.type === "system"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {log.type || "system"}
                  </span>
                  <div className="text-2xl">
                    {log.type === "message" ? "?’¬" :
                     log.type === "comment" ? "?’­" :
                     log.type === "market" ? "?›’" :
                     log.type === "system" ? "?””" : "?“¢"}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ?¸í„° */}
      <div className="text-center mt-8 text-gray-400 text-sm">
        <p>?’¡ ?¤ì‹œê°??°ì´?°ëŠ” Firestore?ì„œ ?ë™?¼ë¡œ ?™ê¸°?”ë©?ˆë‹¤</p>
      </div>
    </motion.div>
  );
}
