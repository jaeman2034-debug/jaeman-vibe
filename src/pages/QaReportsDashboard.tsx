// ??YAGO VIBE QA 리포???�?�보??(관리자??
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

  // ??Firestore QA 리포???�시�?구독
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

  // ??관리자�??�근
  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }
    // 개발?? 모든 ?�용???�근 ?�용 (?�제 ?�영???�래 주석 ?�제)
    // if (currentUser.email !== "admin@yagovibe.com") {
    //   alert("관리자�??�근?????�습?�다.");
    //   navigate("/");
    // }
  }, [currentUser, navigate]);

  // ?�계 계산
  const totalReports = reports.length;
  const avgProgress = totalReports
    ? (reports.reduce((sum, r) => sum + (r.progress || 0), 0) / totalReports).toFixed(1)
    : 0;
  const completedCount = reports.filter((r) => r.progress === 100).length;
  const inProgressCount = reports.filter((r) => r.progress > 0 && r.progress < 100).length;
  const notStartedCount = reports.filter((r) => r.progress === 0).length;

  // 차트 ?�이??준�?  const chartData = reports.slice(0, 10).map((r, i) => ({
    name: r.email?.split("@")[0] || `?�용??{i + 1}`,
    progress: r.progress || 0,
    completed: r.completed || 0,
    total: r.total || 0,
  }));

  // ?�료?�별 ?�상 ?�수
  const getProgressColor = (progress) => {
    if (progress === 100) return "#10B981"; // green-500
    if (progress >= 50) return "#F59E0B"; // yellow-500
    return "#EF4444"; // red-500
  };

  // 최근 ?�동 계산
  const recentReports = reports.slice(0, 7);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">QA 리포?��? 불러?�는 �?..</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ?�더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 mb-2">
                ?�� YAGO VIBE QA 리포???�?�보??              </h1>
              <p className="text-gray-600">QA 체크리스???�료 ?�황 �??�계</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/admin/bug-bounce")}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                ??QA 체크리스??              </button>
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
              >
                ?�� ?�체 ?�?�보??              </button>
            </div>
          </div>
        </div>

        {/* ?�계 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">?�체 리포??/p>
                <p className="text-3xl font-bold text-blue-700">{totalReports}</p>
              </div>
              <div className="text-blue-500 text-3xl">?��</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">?�균 ?�료??/p>
                <p className="text-3xl font-bold text-green-700">{avgProgress}%</p>
              </div>
              <div className="text-green-500 text-3xl">?��</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">?�료??리포??/p>
                <p className="text-3xl font-bold text-purple-700">{completedCount}</p>
              </div>
              <div className="text-purple-500 text-3xl">??/div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">진행 �?/p>
                <p className="text-3xl font-bold text-yellow-700">{inProgressCount}</p>
              </div>
              <div className="text-yellow-500 text-3xl">??/div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ?�료??막�? 그래??*/}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              ?�� ?�용?�별 QA ?�료??            </h2>
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
                      formatter={(value: number, name: string) => [`${value}%`, "?�료??]}
                      labelFormatter={(label) => `?�용?? ${label}`}
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
                  <div className="text-4xl mb-2">?��</div>
                  <p>QA 리포?��? ?�습?�다</p>
                </div>
              </div>
            )}
          </div>

          {/* ?�태�?분포 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              ?�� QA ?�태�?분포
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="font-medium">?�료 (100%)</span>
                </div>
                <span className="font-bold text-green-600">{completedCount}�?/span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <span className="font-medium">진행 �?(1-99%)</span>
                </div>
                <span className="font-bold text-yellow-600">{inProgressCount}�?/span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                  <span className="font-medium">?�작 ?�함 (0%)</span>
                </div>
                <span className="font-bold text-gray-600">{notStartedCount}�?/span>
              </div>
            </div>

            {/* ?�체 진행�??�형 ?�시 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700 mb-1">
                  ?�체 ?�균 {avgProgress}%
                </div>
                <div className="text-sm text-blue-600">
                  {totalReports}�?리포??기�?
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 최근 QA 리포???�이�?*/}
        <div className="mt-8 bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-800">
              ?�� 최근 QA 리포??목록
            </h2>
          </div>
          
          {recentReports.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">?��</div>
              <p className="text-lg mb-1">QA 리포?��? ?�습?�다</p>
              <p className="text-sm">QA 체크리스?��? ?�작?�보?�요!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ?�성??                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      진행�?                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ?�료 ??��
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ?�성??                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ?�태
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
                          {report.progress === 100 ? '?�료' : report.progress > 0 ? '진행�? : '?�작?�함'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ?�단 ?�약 */}
        {reports.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg p-6 text-white text-center">
            <h3 className="text-xl font-bold mb-2">?�� QA 리포???�황</h3>
            <p className="text-lg mb-1">�?{reports.length}개의 QA 리포?��? ?�집?�었?�니??/p>
            <p className="text-sm opacity-90">
              ?�균 ?�료??{avgProgress}% | ?�료??리포??{completedCount}�?            </p>
          </div>
        )}
      </div>
    </div>
  );
}
