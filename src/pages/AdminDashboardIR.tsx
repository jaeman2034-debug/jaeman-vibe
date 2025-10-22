import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { collection, onSnapshot, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell } from "recharts";

// IR 모드???�계 카드 컴포?�트
const StatCard = ({ title, value, change, icon, color }: {
  title: string;
  value: string | number;
  change?: string;
  icon: string;
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`bg-white rounded-2xl p-6 shadow-lg border-l-4 ${color}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change && (
          <p className="text-sm text-green-600 mt-1">{change}</p>
        )}
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
  </motion.div>
);

// 차트 컴포?�트
const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white rounded-2xl p-6 shadow-lg"
  >
    <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
    {children}
  </motion.div>
);

export default function AdminDashboardIR() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    totalRevenue: 0,
    activeUsers: 0,
  });
  
  const [chartData, setChartData] = useState({
    dailyProducts: [],
    categoryDistribution: [],
    userGrowth: [],
    revenueTrend: [],
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ?�시�??�계 ?�집
    const unsubscribeProducts = onSnapshot(
      query(collection(db, "marketItems"), orderBy("createdAt", "desc")),
      (snapshot) => {
        const products = snapshot.docs.map(doc => doc.data());
        
        // �??�품 ??        const totalProducts = products.length;
        
        // 카테고리�?분포
        const categoryCount: { [key: string]: number } = {};
        products.forEach((product: any) => {
          const category = product.category || "기�?";
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
        
        const categoryDistribution = Object.entries(categoryCount).map(([name, value]) => ({
          name,
          value,
        }));
        
        // ?�별 ?�품 ?�록 추이 (최근 7??
        const dailyCount: { [key: string]: number } = {};
        products.forEach((product: any) => {
          if (product.createdAt?.toDate) {
            const date = product.createdAt.toDate().toISOString().split('T')[0];
            dailyCount[date] = (dailyCount[date] || 0) + 1;
          }
        });
        
        const dailyProducts = Object.entries(dailyCount)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-7)
          .map(([date, count]) => ({
            date: new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
            products: count,
          }));
        
        setStats(prev => ({ ...prev, totalProducts }));
        setChartData(prev => ({ 
          ...prev, 
          categoryDistribution,
          dailyProducts,
        }));
      }
    );

    // ?�용???�계 (?�시 ?�이??- ?�제로는 users 컬렉?�에??
    setStats(prev => ({
      ...prev,
      totalUsers: 1247,
      activeUsers: 892,
      totalRevenue: 15420000, // 1,542만원
    }));

    // ?�용???�장 추이 (?�시 ?�이??
    setChartData(prev => ({
      ...prev,
      userGrowth: [
        { date: '1??, users: 450 },
        { date: '2??, users: 520 },
        { date: '3??, users: 680 },
        { date: '4??, users: 750 },
        { date: '5??, users: 890 },
        { date: '6??, users: 1247 },
      ],
      revenueTrend: [
        { date: '1??, revenue: 1200000 },
        { date: '2??, revenue: 1800000 },
        { date: '3??, revenue: 2200000 },
        { date: '4??, revenue: 2800000 },
        { date: '5??, revenue: 3200000 },
        { date: '6??, revenue: 4200000 },
      ],
    }));

    setLoading(false);

    return () => {
      unsubscribeProducts();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg text-gray-600">?�� IR ?�?�보??로딩 �?..</h3>
        </div>
      </div>
    );
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ?�더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8"
      >
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">?�� YAGO VIBE IR ?�?�보??/h1>
          <p className="text-blue-100">?�자??�?관리자???�시�??�과 지??/p>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* ?�심 지??카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="�??�품 ??
            value={stats.totalProducts.toLocaleString()}
            change="+12% ?�번 ??
            icon="?��"
            color="border-blue-500"
          />
          <StatCard
            title="�??�용??
            value={stats.totalUsers.toLocaleString()}
            change="+8% ?�번 �?
            icon="?��"
            color="border-green-500"
          />
          <StatCard
            title="???�익"
            value={`??{(stats.totalRevenue / 10000).toLocaleString()}�?}
            change="+23% ?�월 ?��?
            icon="?��"
            color="border-yellow-500"
          />
          <StatCard
            title="?�성 ?�용??
            value={stats.activeUsers.toLocaleString()}
            change="+15% ?�번 �?
            icon="?��"
            color="border-red-500"
          />
        </div>

        {/* 차트 ?�션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ?�별 ?�품 ?�록 추이 */}
          <ChartCard title="?�� ?�별 ?�품 ?�록 추이 (최근 7??">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.dailyProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="products" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 카테고리�?분포 */}
          <ChartCard title="?�� 카테고리�??�품 분포">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* ?�용???�장 추이 */}
          <ChartCard title="?�� ?�용???�장 추이">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#10B981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* ?�익 추이 */}
          <ChartCard title="?�� ?�별 ?�익 추이">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`??{(value as number / 10000).toLocaleString()}�?, '?�익']} />
                <Line type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ?�심 ?�과 지??*/}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-lg"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">?�� ?�심 ?�과 지??(KPI)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="text-3xl font-bold text-blue-600 mb-2">94.2%</div>
              <div className="text-sm text-gray-600">?�용??만족??/div>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-xl">
              <div className="text-3xl font-bold text-green-600 mb-2">2.3�?/div>
              <div className="text-sm text-gray-600">?�균 ?�답 ?�간</div>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <div className="text-3xl font-bold text-purple-600 mb-2">87%</div>
              <div className="text-sm text-gray-600">?�랫??가?�률</div>
            </div>
          </div>
        </motion.div>

        {/* ?�자???�이?�이??*/}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold mb-4">?�� ?�자???�이?�이??/h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">?? ?�장 지??/h3>
              <ul className="space-y-2 text-purple-100">
                <li>?????�성 ?�용??23% 증�?</li>
                <li>???�품 ?�록??35% 증�?</li>
                <li>???�랫???�익 28% 증�?</li>
                <li>???�용??체류?�간 15% 증�?</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">?�� ?�후 계획</h3>
              <ul className="space-y-2 text-purple-100">
                <li>??AI ?�품 추천 ?�스???�입</li>
                <li>???�시�?채팅 기능 ?�장</li>
                <li>??모바????출시 ?�정</li>
                <li>???�국 ?�비???�장</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
