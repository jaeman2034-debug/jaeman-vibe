// ??YAGO VIBE QA Î¶¨Ìè¨???Ä?úÎ≥¥??(Í¥ÄÎ¶¨Ïûê??
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function QaReportsDashboard() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // ??Firestore QA Î¶¨Ìè¨???§ÏãúÍ∞?Íµ¨ÎèÖ
  useEffect(() => {
    const q = query(collection(db, "QA_Reports"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReports(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ??Í¥ÄÎ¶¨ÏûêÎß??ëÍ∑º
  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }
    // Í∞úÎ∞ú?? Î™®Îì† ?¨Ïö©???ëÍ∑º ?àÏö© (?§Ï†ú ?¥ÏòÅ???ÑÎûò Ï£ºÏÑù ?¥Ï†ú)
    // if (currentUser.email !== "admin@yagovibe.com") {
    //   alert("Í¥ÄÎ¶¨ÏûêÎß??ëÍ∑º?????àÏäµ?àÎã§.");
    //   navigate("/");
    // }
  }, [currentUser, navigate]);

  // ?µÍ≥Ñ Í≥ÑÏÇ∞
  const totalReports = reports.length;
  const avgProgress = totalReports
    ? (reports.reduce((sum, r) => sum + (r.progress || 0), 0) / totalReports).toFixed(1)
    : 0;
  const completedCount = reports.filter((r) => r.progress === 100).length;
  const inProgressCount = reports.filter((r) => r.progress > 0 && r.progress < 100).length;
  const notStartedCount = reports.filter((r) => r.progress === 0).length;

  // Ï∞®Ìä∏ ?∞Ïù¥??Ï§ÄÎπ?  const chartData = reports.slice(0, 10).map((r, i) => ({
    name: r.email?.split("@")[0] || `?¨Ïö©??{i + 1}`,
    progress: r.progress || 0,
    completed: r.completed || 0,
    total: r.total || 0,
  }));

  // ?ÑÎ£å?®Î≥Ñ ?âÏÉÅ ?®Ïàò
  const getProgressColor = (progress) => {
    if (progress === 100) return "#10B981"; // green-500
    if (progress >= 50) return "#F59E0B"; // yellow-500
    return "#EF4444"; // red-500
  };

  // ÏµúÍ∑º ?úÎèô Í≥ÑÏÇ∞
  const recentReports = reports.slice(0, 7);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">QA Î¶¨Ìè¨?∏Î? Î∂àÎü¨?§Îäî Ï§?..</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ?§Îçî */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 mb-2">
                ?ìä YAGO VIBE QA Î¶¨Ìè¨???Ä?úÎ≥¥??              </h1>
              <p className="text-gray-600">QA Ï≤¥ÌÅ¨Î¶¨Ïä§???ÑÎ£å ?ÑÌô© Î∞??µÍ≥Ñ</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/admin/bug-bounce")}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                ??QA Ï≤¥ÌÅ¨Î¶¨Ïä§??              </button>
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                ?ìä ?ÑÏ≤¥ ?Ä?úÎ≥¥??              </button>
            </div>
          </div>
        </div>

        {/* ?µÍ≥Ñ Ïπ¥Îìú */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">?ÑÏ≤¥ Î¶¨Ìè¨??/p>
                <p className="text-3xl font-bold text-blue-700">{totalReports}</p>
              </div>
              <div className="text-blue-500 text-3xl">?ìã</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">?âÍ∑† ?ÑÎ£å??/p>
                <p className="text-3xl font-bold text-green-700">{avgProgress}%</p>
              </div>
              <div className="text-green-500 text-3xl">?ìà</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">?ÑÎ£å??Î¶¨Ìè¨??/p>
                <p className="text-3xl font-bold text-purple-700">{completedCount}</p>
              </div>
              <div className="text-purple-500 text-3xl">??/div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">ÏßÑÌñâ Ï§?/p>
                <p className="text-3xl font-bold text-yellow-700">{inProgressCount}</p>
              </div>
              <div className="text-yellow-500 text-3xl">??/div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ?ÑÎ£å??ÎßâÎ? Í∑∏Îûò??*/}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              ?ìä ?¨Ïö©?êÎ≥Ñ QA ?ÑÎ£å??            </h2>
            {chartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [`${value}%`, "?ÑÎ£å??]}
                      labelFormatter={(label) => `?¨Ïö©?? ${label}`}
                    />
                    <Bar 
                      dataKey="progress" 
                      fill="#60a5fa"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-80 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">?ìä</div>
                  <p>QA Î¶¨Ìè¨?∏Í? ?ÜÏäµ?àÎã§</p>
                </div>
              </div>
            )}
          </div>

          {/* ?ÅÌÉúÎ≥?Î∂ÑÌè¨ */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              ?ìà QA ?ÅÌÉúÎ≥?Î∂ÑÌè¨
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="font-medium">?ÑÎ£å (100%)</span>
                </div>
                <span className="font-bold text-green-600">{completedCount}Í∞?/span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span className="font-medium">ÏßÑÌñâ Ï§?(1-99%)</span>
                </div>
                <span className="font-bold text-yellow-600">{inProgressCount}Í∞?/span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                  <span className="font-medium">?úÏûë ?àÌï® (0%)</span>
                </div>
                <span className="font-bold text-gray-600">{notStartedCount}Í∞?/span>
              </div>
            </div>

            {/* ?ÑÏ≤¥ ÏßÑÌñâÎ•??êÌòï ?úÏãú */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700 mb-1">
                  ?ÑÏ≤¥ ?âÍ∑† {avgProgress}%
                </div>
                <div className="text-sm text-blue-600">
                  {totalReports}Í∞?Î¶¨Ìè¨??Í∏∞Ï?
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ÏµúÍ∑º QA Î¶¨Ìè¨???åÏù¥Î∏?*/}
        <div className="mt-8 bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800">
              ?ìã ÏµúÍ∑º QA Î¶¨Ìè¨??Î™©Î°ù
            </h2>
          </div>
          
          {recentReports.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">?ìã</div>
              <p className="text-lg mb-1">QA Î¶¨Ìè¨?∏Í? ?ÜÏäµ?àÎã§</p>
              <p className="text-sm">QA Ï≤¥ÌÅ¨Î¶¨Ïä§?∏Î? ?úÏûë?¥Î≥¥?∏Ïöî!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ?ëÏÑ±??                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ÏßÑÌñâÎ•?                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ?ÑÎ£å ??™©
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ?ëÏÑ±??                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ?ÅÌÉú
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentReports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {report.displayName || report.email || "Unknown"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {report.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 mr-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${report.progress || 0}%`,
                                  backgroundColor: getProgressColor(report.progress || 0)
                                }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {report.progress || 0}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.completed || 0} / {report.total || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {report.createdAt?.toDate 
                          ? report.createdAt.toDate().toLocaleString('ko-KR')
                          : "-"
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          report.progress === 100 
                            ? 'bg-green-100 text-green-800'
                            : report.progress > 0 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {report.progress === 100 ? '?ÑÎ£å' : report.progress > 0 ? 'ÏßÑÌñâÏ§? : '?úÏûë?àÌï®'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ?òÎã® ?îÏïΩ */}
        {reports.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg p-6 text-white text-center">
            <h3 className="text-xl font-bold mb-2">?éâ QA Î¶¨Ìè¨???ÑÌô©</h3>
            <p className="text-lg mb-1">Ï¥?{reports.length}Í∞úÏùò QA Î¶¨Ìè¨?∏Í? ?òÏßë?òÏóà?µÎãà??/p>
            <p className="text-sm opacity-90">
              ?âÍ∑† ?ÑÎ£å??{avgProgress}% | ?ÑÎ£å??Î¶¨Ìè¨??{completedCount}Í∞?            </p>
          </div>
        )}
      </div>
    </div>
  );
}
