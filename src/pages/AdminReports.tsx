import React, { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  TrendingUp, 
  MapPin, 
  DollarSign, 
  Calendar,
  Activity,
  Users,
  ShoppingCart
} from "lucide-react";

interface NotificationLog {
  id: string;
  title: string;
  price: number;
  address: string;
  distance_m: number;
  timestamp: string;
  category: string;
  condition: string;
  source: string;
  location: {
    lat: number;
    lng: number;
  };
}

interface ChartData {
  date: string;
  count: number;
  totalPrice: number;
  avgDistance: number;
}

interface CategoryData {
  name: string;
  value: number;
  count: number;
}

export default function AdminReports() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [stats, setStats] = useState({
    totalNotifications: 0,
    totalValue: 0,
    avgDistance: 0,
    todayCount: 0
  });

  // ?�� 차트 ?�상 ?�레??  const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#ea580c', '#7c3aed', '#0891b2'];

  useEffect(() => {
    // ?�� ?�시�?notification_logs 구독
    const unsub = onSnapshot(
      query(collection(db, "notification_logs"), orderBy("timestamp", "desc")),
      (snapshot) => {
        const notificationList: NotificationLog[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          notificationList.push({
            id: doc.id,
            title: data.title || "?�목 ?�음",
            price: data.price || 0,
            address: data.address || "주소 미등�?,
            distance_m: data.distance_m || 0,
            timestamp: data.timestamp?.toDate?.() ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
            category: data.category || "기�?",
            condition: data.condition || "중고",
            source: data.source || "unknown",
            location: data.location || { lat: 0, lng: 0 }
          });
        });

        setLogs(notificationList);

        // ?�� ?�자�??�계 계산
        const today = new Date().toDateString();
        const grouped = notificationList.reduce((acc: any, cur) => {
          const date = new Date(cur.timestamp).toDateString();
          if (!acc[date]) {
            acc[date] = { count: 0, totalPrice: 0, distances: [] };
          }
          acc[date].count += 1;
          acc[date].totalPrice += cur.price;
          acc[date].distances.push(cur.distance_m);
          return acc;
        }, {});

        const chartDataArray = Object.entries(grouped)
          .map(([date, data]: [string, any]) => ({
            date: new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
            count: data.count,
            totalPrice: data.totalPrice,
            avgDistance: Math.round(data.distances.reduce((a: number, b: number) => a + b, 0) / data.distances.length)
          }))
          .slice(0, 7) // 최근 7??          .reverse();

        setChartData(chartDataArray);

        // ?���?카테고리�??�계
        const categoryStats = notificationList.reduce((acc: any, cur) => {
          const category = cur.category || "기�?";
          if (!acc[category]) {
            acc[category] = { count: 0, totalValue: 0 };
          }
          acc[category].count += 1;
          acc[category].totalValue += cur.price;
          return acc;
        }, {});

        const categoryDataArray = Object.entries(categoryStats)
          .map(([name, data]: [string, any]) => ({
            name,
            value: data.totalValue,
            count: data.count
          }))
          .sort((a, b) => b.value - a.value);

        setCategoryData(categoryDataArray);

        // ?�� ?�체 ?�계
        const totalNotifications = notificationList.length;
        const totalValue = notificationList.reduce((sum, log) => sum + log.price, 0);
        const avgDistance = notificationList.length > 0 
          ? Math.round(notificationList.reduce((sum, log) => sum + log.distance_m, 0) / notificationList.length)
          : 0;
        const todayCount = notificationList.filter(log => 
          new Date(log.timestamp).toDateString() === today
        ).length;

        setStats({
          totalNotifications,
          totalValue,
          avgDistance,
          todayCount
        });
      }
    );

    return () => unsub();
  }, []);

  // ?�� 거리 ?�맷???�수
  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  // ?�� 가�??�맷???�수
  const formatPrice = (price: number) => {
    return price.toLocaleString() + '??;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ?�더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          ?�� YAGO VIBE ?�림 ?�계 ?�?�보??        </h1>
        <p className="text-gray-600 mt-2">?�시�?거래 ?�림 로그 �?분석 리포??/p>
      </div>

      {/* ?�� ?�계 카드??*/}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">�??�림 ??/p>
                <p className="text-3xl font-bold">{stats.totalNotifications}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">�?거래 가�?/p>
                <p className="text-3xl font-bold">{formatPrice(stats.totalValue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">?�균 거리</p>
                <p className="text-3xl font-bold">{formatDistance(stats.avgDistance)}</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">?�늘 ?�림</p>
                <p className="text-3xl font-bold">{stats.todayCount}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ?�� 차트 ?�션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* ?�자�??�림 ??차트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              ?�자�??�림 ??추이
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'count' ? `${value}�? : formatPrice(value),
                      name === 'count' ? '?�림 ?? : '�?거래??
                    ]}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 카테고리�?거래???�이차트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              카테고리�?거래??분포
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [formatPrice(value), '거래??]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ?�� 최근 ?�림 로그 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            최근 거래 ?�림 로그
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logs.slice(0, 20).map((log, index) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{log.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {log.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {log.condition}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {log.address}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {formatDistance(log.distance_m)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString('ko-KR')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600 text-lg">
                    {formatPrice(log.price)}
                  </p>
                  <p className="text-xs text-gray-500">#{index + 1}</p>
                </div>
              </div>
            ))}
            
            {logs.length === 0 && (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">?�직 ?�림 로그가 ?�습?�다.</p>
                <p className="text-sm text-gray-400">??거래가 ?�록?�면 ?�기???�시?�니??</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ?�� ?�시�??�데?�트 ?�시 */}
      <div className="fixed bottom-4 right-4">
        <div className="bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">?�시�??�데?�트</span>
        </div>
      </div>
    </div>
  );
}
