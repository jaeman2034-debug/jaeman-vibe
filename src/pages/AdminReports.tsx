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

  // ?é® Ï∞®Ìä∏ ?âÏÉÅ ?îÎ†à??  const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#ea580c', '#7c3aed', '#0891b2'];

  useEffect(() => {
    // ?ìä ?§ÏãúÍ∞?notification_logs Íµ¨ÎèÖ
    const unsub = onSnapshot(
      query(collection(db, "notification_logs"), orderBy("timestamp", "desc")),
      (snapshot) => {
        const notificationList: NotificationLog[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          notificationList.push({
            id: doc.id,
            title: data.title || "?úÎ™© ?ÜÏùå",
            price: data.price || 0,
            address: data.address || "Ï£ºÏÜå ÎØ∏Îì±Î°?,
            distance_m: data.distance_m || 0,
            timestamp: data.timestamp?.toDate?.() ? data.timestamp.toDate().toISOString() : new Date().toISOString(),
            category: data.category || "Í∏∞Ì?",
            condition: data.condition || "Ï§ëÍ≥†",
            source: data.source || "unknown",
            location: data.location || { lat: 0, lng: 0 }
          });
        });

        setLogs(notificationList);

        // ?ìà ?ºÏûêÎ≥??µÍ≥Ñ Í≥ÑÏÇ∞
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
          .slice(0, 7) // ÏµúÍ∑º 7??          .reverse();

        setChartData(chartDataArray);

        // ?è∑Ô∏?Ïπ¥ÌÖåÍ≥†Î¶¨Î≥??µÍ≥Ñ
        const categoryStats = notificationList.reduce((acc: any, cur) => {
          const category = cur.category || "Í∏∞Ì?";
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

        // ?ìä ?ÑÏ≤¥ ?µÍ≥Ñ
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

  // ?éØ Í±∞Î¶¨ ?¨Îß∑???®Ïàò
  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  // ?í∞ Í∞ÄÍ≤??¨Îß∑???®Ïàò
  const formatPrice = (price: number) => {
    return price.toLocaleString() + '??;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ?§Îçî */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          ?ìä YAGO VIBE ?åÎ¶º ?µÍ≥Ñ ?Ä?úÎ≥¥??        </h1>
        <p className="text-gray-600 mt-2">?§ÏãúÍ∞?Í±∞Îûò ?åÎ¶º Î°úÍ∑∏ Î∞?Î∂ÑÏÑù Î¶¨Ìè¨??/p>
      </div>

      {/* ?ìä ?µÍ≥Ñ Ïπ¥Îìú??*/}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Ï¥??åÎ¶º ??/p>
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
                <p className="text-green-100 text-sm">Ï¥?Í±∞Îûò Í∞ÄÏπ?/p>
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
                <p className="text-purple-100 text-sm">?âÍ∑† Í±∞Î¶¨</p>
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
                <p className="text-orange-100 text-sm">?§Îäò ?åÎ¶º</p>
                <p className="text-3xl font-bold">{stats.todayCount}</p>
              </div>
              <Activity className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ?ìà Ï∞®Ìä∏ ?πÏÖò */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* ?ºÏûêÎ≥??åÎ¶º ??Ï∞®Ìä∏ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              ?ºÏûêÎ≥??åÎ¶º ??Ï∂îÏù¥
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
                      name === 'count' ? `${value}Í±? : formatPrice(value),
                      name === 'count' ? '?åÎ¶º ?? : 'Ï¥?Í±∞Îûò??
                    ]}
                  />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Ïπ¥ÌÖåÍ≥†Î¶¨Î≥?Í±∞Îûò???åÏù¥Ï∞®Ìä∏ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Ïπ¥ÌÖåÍ≥†Î¶¨Î≥?Í±∞Îûò??Î∂ÑÌè¨
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
                  <Tooltip formatter={(value: any) => [formatPrice(value), 'Í±∞Îûò??]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ?ì¨ ÏµúÍ∑º ?åÎ¶º Î°úÍ∑∏ */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            ÏµúÍ∑º Í±∞Îûò ?åÎ¶º Î°úÍ∑∏
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
                <p className="text-gray-500">?ÑÏßÅ ?åÎ¶º Î°úÍ∑∏Í∞Ä ?ÜÏäµ?àÎã§.</p>
                <p className="text-sm text-gray-400">??Í±∞ÎûòÍ∞Ä ?±Î°ù?òÎ©¥ ?¨Í∏∞???úÏãú?©Îãà??</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ?ì± ?§ÏãúÍ∞??ÖÎç∞?¥Ìä∏ ?úÏãú */}
      <div className="fixed bottom-4 right-4">
        <div className="bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">?§ÏãúÍ∞??ÖÎç∞?¥Ìä∏</span>
        </div>
      </div>
    </div>
  );
}
