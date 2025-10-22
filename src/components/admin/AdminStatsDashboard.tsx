import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, Timestamp, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase"; // ???®Ïùº ÏßÑÏûÖ???¨Ïö©
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar, TrendingUp, Users, Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

// db???¥Î? import??
// Enhanced data types for comprehensive analytics
type DailyAgg = { 
  date: string; 
  total: number; 
  active: number; 
  canceled: number; 
  no_show: number; 
  attended: number;
  revenue: number;
  occupancy: number;
};

type TrustBucket = { 
  range: string; 
  count: number; 
  percentage: number;
  avgBookings: number;
};

type TimeSlotStats = {
  time: string;
  bookings: number;
  revenue: number;
  occupancy: number;
  popularity: number;
};

type FacilityPerformance = {
  facilityId: string;
  facilityName: string;
  totalBookings: number;
  totalRevenue: number;
  avgRating: number;
  occupancyRate: number;
  trustScore: number;
};

type MLRecommendationStats = {
  date: string;
  recommendationsGenerated: number;
  bookingsFromML: number;
  conversionRate: number;
  avgScore: number;
  topFactors: string[];
};

export function AdminStatsDashboard() {
  const [facilityId, setFacilityId] = useState("demo-fac-1");
  const [facilities, setFacilities] = useState<Array<{id: string, name: string}>>([]);
  const today = new Date();
  const [from, setFrom] = useState(dateKeyOf(addDays(today, -30)));
  const [to, setTo] = useState(dateKeyOf(today));
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DailyAgg[]>([]);
  const [trustDist, setTrustDist] = useState<TrustBucket[]>([]);
  const [timeSlotStats, setTimeSlotStats] = useState<TimeSlotStats[]>([]);
  const [facilityPerformance, setFacilityPerformance] = useState<FacilityPerformance[]>([]);
  const [mlStats, setMlStats] = useState<MLRecommendationStats[]>([]);
  const [overview, setOverview] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    activeReservations: 0,
    avgTrustScore: 0,
    mlConversionRate: 0
  });

  // Utility functions
  function dateKeyOf(d: Date) { return d.toISOString().slice(0,10); }
  function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x; }

  useEffect(() => {
    loadFacilities();
    fetchStats();
  }, [facilityId, from, to]);

  async function loadFacilities() {
    try {
      const facilitiesQuery = query(collection(db, "facilities"), where("status", "==", "active"));
      const snapshot = await getDocs(facilitiesQuery);
      const facilitiesList = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setFacilities(facilitiesList);
      if (facilitiesList.length > 0 && !facilitiesList.find(f => f.id === facilityId)) {
        setFacilityId(facilitiesList[0].id);
      }
    } catch (error) {
      console.error("?úÏÑ§ Î™©Î°ù Î°úÎìú ?§Ìå®:", error);
    }
  }

  async function fetchStats() {
    setLoading(true);
    try {
      const start = new Date(from + 'T00:00:00');
      const end = new Date(to + 'T23:59:59');

      // 1. Daily statistics
      const dailyStats = await fetchDailyStats(start, end);
      setStats(dailyStats);

      // 2. Trust distribution
      const trustData = await fetchTrustDistribution();
      setTrustDist(trustData);

      // 3. Time slot statistics
      const timeStats = await fetchTimeSlotStats(start, end);
      setTimeSlotStats(timeStats);

      // 4. Facility performance comparison
      const facilityStats = await fetchFacilityPerformance();
      setFacilityPerformance(facilityStats);

      // 5. ML recommendation statistics
      const mlData = await fetchMLStats(start, end);
      setMlStats(mlData);

      // 6. Overview metrics
      const overviewData = await fetchOverviewMetrics();
      setOverview(overviewData);

    } catch (error) {
      console.error("?µÍ≥Ñ ?∞Ïù¥??Î°úÎìú ?§Ìå®:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDailyStats(start: Date, end: Date): Promise<DailyAgg[]> {
    try {
      const reservationsQuery = query(
        collection(db, "reservations"),
        where("facilityId", "==", facilityId),
        where("createdAt", ">=", Timestamp.fromDate(start)),
        where("createdAt", "<=", Timestamp.fromDate(end)),
        orderBy("createdAt", "asc")
      );

      const snapshot = await getDocs(reservationsQuery);
      const reservations = snapshot.docs.map(doc => doc.data());

      // Group by date and calculate metrics
      const dailyMap = new Map<string, DailyAgg>();
      
      reservations.forEach(reservation => {
        const date = dateKeyOf(reservation.createdAt.toDate());
        const existing = dailyMap.get(date) || {
          date,
          total: 0,
          active: 0,
          canceled: 0,
          no_show: 0,
          attended: 0,
          revenue: 0,
          occupancy: 0
        };

        existing.total++;
        existing.revenue += reservation.price || 0;

        switch (reservation.status) {
            case 'active':
            existing.active++;
              break;
            case 'canceled':
            existing.canceled++;
              break;
            case 'no_show':
            existing.no_show++;
              break;
            case 'attended':
            existing.attended++;
              break;
        }

        dailyMap.set(date, existing);
      });

      // Fill missing dates with zeros
      const result: DailyAgg[] = [];
      const current = new Date(start);
      while (current <= end) {
        const dateKey = dateKeyOf(current);
        const existing = dailyMap.get(dateKey);
        result.push(existing || {
          date: dateKey,
          total: 0,
          active: 0,
          canceled: 0,
          no_show: 0,
          attended: 0,
          revenue: 0,
          occupancy: 0
        });
        current.setDate(current.getDate() + 1);
      }

      return result;
    } catch (error) {
      console.error("?ºÎ≥Ñ ?µÍ≥Ñ Ï°∞Ìöå ?§Ìå®:", error);
      return [];
    }
  }

  async function fetchTrustDistribution(): Promise<TrustBucket[]> {
    try {
      const trustQuery = query(collection(db, "user_trust_stats"), limit(1000));
      const snapshot = await getDocs(trustQuery);
      const trustData = snapshot.docs.map(doc => doc.data());

      // Group into trust score buckets
      const buckets = [
        { min: 0, max: 20, label: "0-20 (F)" },
        { min: 21, max: 40, label: "21-40 (D)" },
        { min: 41, max: 60, label: "41-60 (C)" },
        { min: 61, max: 80, label: "61-80 (B)" },
        { min: 81, max: 100, label: "81-100 (A)" }
      ];

      const result: TrustBucket[] = buckets.map(bucket => {
        const usersInBucket = trustData.filter(user => 
          user.trustScore >= bucket.min && user.trustScore <= bucket.max
        );
        
        const totalUsers = trustData.length;
        const percentage = totalUsers > 0 ? (usersInBucket.length / totalUsers) * 100 : 0;
        const avgBookings = usersInBucket.length > 0 
          ? usersInBucket.reduce((sum, user) => sum + (user.total || 0), 0) / usersInBucket.length 
          : 0;

        return {
          range: bucket.label,
          count: usersInBucket.length,
          percentage: Math.round(percentage * 100) / 100,
          avgBookings: Math.round(avgBookings * 100) / 100
        };
      });

      return result;
    } catch (error) {
      console.error("?†Î¢∞??Î∂ÑÌè¨ Ï°∞Ìöå ?§Ìå®:", error);
      return [];
    }
  }

  async function fetchTimeSlotStats(start: Date, end: Date): Promise<TimeSlotStats[]> {
    try {
      const slotsQuery = query(
        collection(db, "facility_slots"),
        where("facilityId", "==", facilityId),
        where("startAt", ">=", Timestamp.fromDate(start)),
        where("startAt", "<=", Timestamp.fromDate(end))
      );

      const snapshot = await getDocs(slotsQuery);
      const slots = snapshot.docs.map(doc => doc.data());

      // Group by time slot
      const timeMap = new Map<string, TimeSlotStats>();
      
      slots.forEach(slot => {
        const startTime = slot.startAt.toDate();
        const timeKey = startTime.toTimeString().slice(0, 5); // HH:MM format
        
        const existing = timeMap.get(timeKey) || {
          time: timeKey,
          bookings: 0,
          revenue: 0,
          occupancy: 0,
          popularity: 0
        };

        existing.bookings += slot.reserved || 0;
        existing.revenue += (slot.price || 0) * (slot.reserved || 0);
        existing.occupancy += (slot.reserved || 0) / (slot.maxCapacity || 1);
        existing.popularity += 1;

        timeMap.set(timeKey, existing);
      });

      // Convert to array and calculate averages
      const result = Array.from(timeMap.values()).map(stat => ({
        ...stat,
        occupancy: Math.round((stat.occupancy / stat.popularity) * 100) / 100,
        popularity: stat.popularity
      }));

      return result.sort((a, b) => a.time.localeCompare(b.time));
    } catch (error) {
      console.error("?úÍ∞Ñ?ÄÎ≥??µÍ≥Ñ Ï°∞Ìöå ?§Ìå®:", error);
      return [];
    }
  }

  async function fetchFacilityPerformance(): Promise<FacilityPerformance[]> {
    try {
      const facilitiesQuery = query(collection(db, "facilities"), where("status", "==", "active"));
      const snapshot = await getDocs(facilitiesQuery);
      const facilities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const result: FacilityPerformance[] = [];

      for (const facility of facilities) {
        // Get reservations for this facility
        const reservationsQuery = query(
          collection(db, "reservations"),
          where("facilityId", "==", facility.id),
          where("createdAt", ">=", Timestamp.fromDate(addDays(today, -30)))
        );
        const resvSnapshot = await getDocs(reservationsQuery);
        const reservations = resvSnapshot.docs.map(doc => doc.data());

        const totalBookings = reservations.length;
        const totalRevenue = reservations.reduce((sum, resv) => sum + (resv.price || 0), 0);
        const activeReservations = reservations.filter(resv => resv.status === 'active').length;
        
        // Calculate average trust score of users who booked this facility
        const userIds = [...new Set(reservations.map(resv => resv.userId))];
        let avgTrustScore = 0;
        if (userIds.length > 0) {
          const trustScores = await Promise.all(
            userIds.map(async (userId) => {
              try {
                const userTrustDoc = await getDocs(query(
                  collection(db, "user_trust_stats"),
                  where("userId", "==", userId)
                ));
                return userTrustDoc.docs[0]?.data()?.trustScore || 50;
              } catch {
                return 50;
              }
            })
          );
          avgTrustScore = trustScores.reduce((sum, score) => sum + score, 0) / trustScores.length;
        }

        result.push({
          facilityId: facility.id,
          facilityName: facility.name,
          totalBookings,
          totalRevenue,
          avgRating: facility.averageRating || 0,
          occupancyRate: activeReservations / Math.max(totalBookings, 1),
          trustScore: Math.round(avgTrustScore * 100) / 100
        });
      }

      return result.sort((a, b) => b.totalBookings - a.totalBookings);
    } catch (error) {
      console.error("?úÏÑ§ ?±Í≥º Ï°∞Ìöå ?§Ìå®:", error);
      return [];
    }
  }

  async function fetchMLStats(start: Date, end: Date): Promise<MLRecommendationStats[]> {
    try {
      // This would typically come from ML service logs or analytics
      // For now, we'll create mock data based on actual bookings
      const reservationsQuery = query(
        collection(db, "reservations"),
        where("facilityId", "==", facilityId),
        where("createdAt", ">=", Timestamp.fromDate(start)),
        where("createdAt", "<=", Timestamp.fromDate(end)),
        orderBy("createdAt", "asc")
      );

      const snapshot = await getDocs(reservationsQuery);
      const reservations = snapshot.docs.map(doc => doc.data());

      // Group by date and simulate ML stats
      const dailyMap = new Map<string, MLRecommendationStats>();
      
      reservations.forEach(reservation => {
        const date = dateKeyOf(reservation.createdAt.toDate());
        const existing = dailyMap.get(date) || {
          date,
          recommendationsGenerated: 0,
          bookingsFromML: 0,
          conversionRate: 0,
          avgScore: 0,
          topFactors: []
        };

        // Simulate ML recommendations (in real app, this would come from ML service)
        const recommendations = Math.floor(Math.random() * 20) + 10;
        const mlBookings = Math.floor(Math.random() * recommendations * 0.3);
        const avgScore = Math.random() * 40 + 60; // 60-100 range

        existing.recommendationsGenerated += recommendations;
        existing.bookingsFromML += mlBookings;
        existing.avgScore = (existing.avgScore + avgScore) / 2;
        existing.topFactors = ['timeConvenience', 'popularity', 'priceValue'];

        dailyMap.set(date, existing);
      });

      // Calculate conversion rates
      const result = Array.from(dailyMap.values()).map(stat => ({
        ...stat,
        conversionRate: stat.recommendationsGenerated > 0 
          ? Math.round((stat.bookingsFromML / stat.recommendationsGenerated) * 100 * 100) / 100
          : 0,
        avgScore: Math.round(stat.avgScore * 100) / 100
      }));

      return result;
    } catch (error) {
      console.error("ML ?µÍ≥Ñ Ï°∞Ìöå ?§Ìå®:", error);
      return [];
    }
  }

  async function fetchOverviewMetrics() {
    try {
      const reservationsQuery = query(
        collection(db, "reservations"),
        where("facilityId", "==", facilityId),
        where("createdAt", ">=", Timestamp.fromDate(addDays(today, -30)))
      );

      const snapshot = await getDocs(reservationsQuery);
      const reservations = snapshot.docs.map(doc => doc.data());

      const totalBookings = reservations.length;
      const totalRevenue = reservations.reduce((sum, resv) => sum + (resv.price || 0), 0);
      const activeReservations = reservations.filter(resv => resv.status === 'active').length;

      // Calculate average trust score
      const userIds = [...new Set(reservations.map(resv => resv.userId))];
      let avgTrustScore = 0;
      if (userIds.length > 0) {
        const trustScores = await Promise.all(
          userIds.map(async (userId) => {
            try {
              const userTrustDoc = await getDocs(query(
                collection(db, "user_trust_stats"),
                where("userId", "==", userId)
              ));
              return userTrustDoc.docs[0]?.data()?.trustScore || 50;
            } catch {
              return 50;
            }
          })
        );
        avgTrustScore = trustScores.reduce((sum, score) => sum + score, 0) / trustScores.length;
      }

      // ML conversion rate (from ML stats)
      const mlConversionRate = mlStats.length > 0 
        ? mlStats.reduce((sum, stat) => sum + stat.conversionRate, 0) / mlStats.length
        : 0;

      return {
        totalBookings,
        totalRevenue,
        activeReservations,
        avgTrustScore: Math.round(avgTrustScore * 100) / 100,
        mlConversionRate: Math.round(mlConversionRate * 100) / 100
      };
    } catch (error) {
      console.error("Í∞úÏöî Î©îÌä∏Î¶?Ï°∞Ìöå ?§Ìå®:", error);
      return {
        totalBookings: 0,
        totalRevenue: 0,
        activeReservations: 0,
        avgTrustScore: 0,
        mlConversionRate: 0
      };
    }
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">?¥ÏòÅ ?µÍ≥Ñ ?Ä?úÎ≥¥??/h1>
          <p className="text-gray-600 mt-2">?úÏÑ§ ?àÏïΩ Î∞??¨Ïö©???âÎèô Î∂ÑÏÑù</p>
          </div>
        <div className="flex gap-4">
          <Select value={facilityId} onValueChange={setFacilityId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="?úÏÑ§ ?†ÌÉù" />
            </SelectTrigger>
            <SelectContent>
              {facilities.map(facility => (
                <SelectItem key={facility.id} value={facility.id}>
                  {facility.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-40"
            />
            <span className="text-gray-500 self-center">~</span>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-40"
            />
            <Button onClick={fetchStats} variant="outline">
              ?àÎ°úÍ≥†Ïπ®
            </Button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ï¥??àÏïΩ</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalBookings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ?úÏÑ± ?àÏïΩ: {overview.activeReservations}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ï¥??òÏùµ</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">??overview.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ?àÏïΩ???âÍ∑†: ??overview.totalBookings > 0 ? Math.round(overview.totalRevenue / overview.totalBookings).toLocaleString() : 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">?âÍ∑† ?†Î¢∞??/CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.avgTrustScore}</div>
            <p className="text-xs text-muted-foreground">
              {overview.avgTrustScore >= 80 ? '?∞Ïàò' : overview.avgTrustScore >= 60 ? '?ëÌò∏' : 'Í∞úÏÑ† ?ÑÏöî'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ML ?ÑÌôò??/CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.mlConversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              AI Ï∂îÏ≤ú ???àÏïΩ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Í∏∞Í∞Ñ</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24))}??            </div>
            <p className="text-xs text-muted-foreground">
              {from} ~ {to}
            </p>
          </CardContent>
        </Card>
          </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily Trends */}
        <Card>
          <CardHeader>
            <CardTitle>?ºÎ≥Ñ ?àÏïΩ ?ÅÌÉú Ï∂îÏù¥</CardTitle>
          </CardHeader>
          <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="active" stroke="#2563eb" name="?àÏïΩÏ§? strokeWidth={2} />
              <Line type="monotone" dataKey="canceled" stroke="#9ca3af" name="Ï∑®ÏÜå" strokeWidth={2} />
              <Line type="monotone" dataKey="no_show" stroke="#dc2626" name="?∏Ïáº" strokeWidth={2} />
              <Line type="monotone" dataKey="attended" stroke="#16a34a" name="Ï∂úÏÑù" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>?ºÎ≥Ñ ?òÏùµ Ï∂îÏù¥</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`??{value.toLocaleString()}`, '?òÏùµ']} />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trust Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>?¨Ïö©???†Î¢∞??Î∂ÑÌè¨</CardTitle>
          </CardHeader>
          <CardContent>
        <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trustDist}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
                <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              {trustDist.map((bucket, index) => (
                <div key={index} className="flex justify-between">
                  <span>{bucket.range}</span>
                  <span className="font-medium">{bucket.percentage}% ({bucket.count}Î™?</span>
                  </div>
                ))}
              </div>
          </CardContent>
        </Card>

        {/* Time Slot Popularity */}
        <Card>
          <CardHeader>
            <CardTitle>?úÍ∞Ñ?ÄÎ≥??∏Í∏∞??/CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeSlotStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bookings" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ML Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>AI Ï∂îÏ≤ú ?úÏä§???±Í≥º</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mlStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="recommendationsGenerated" stroke="#8b5cf6" name="?ùÏÑ±??Ï∂îÏ≤ú" />
              <Line type="monotone" dataKey="bookingsFromML" stroke="#06b6d4" name="ML Í∏∞Î∞ò ?àÏïΩ" />
              <Line type="monotone" dataKey="conversionRate" stroke="#f59e0b" name="?ÑÌôò??(%)" yAxisId={1} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Facility Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>?úÏÑ§Î≥??±Í≥º ÎπÑÍµê</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">?úÏÑ§Î™?/th>
                  <th className="text-right p-2">Ï¥??àÏïΩ</th>
                  <th className="text-right p-2">Ï¥??òÏùµ</th>
                  <th className="text-right p-2">?âÍ∑† ?âÏ†ê</th>
                  <th className="text-right p-2">?êÏú†??/th>
                  <th className="text-right p-2">?âÍ∑† ?†Î¢∞??/th>
                </tr>
              </thead>
              <tbody>
                {facilityPerformance.map((facility, index) => (
                  <tr key={facility.facilityId} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{facility.facilityName}</td>
                    <td className="p-2 text-right">{facility.totalBookings.toLocaleString()}</td>
                    <td className="p-2 text-right">??facility.totalRevenue.toLocaleString()}</td>
                    <td className="p-2 text-right">
                      <Badge variant={facility.avgRating >= 4.5 ? "default" : facility.avgRating >= 4.0 ? "secondary" : "destructive"}>
                        {facility.avgRating.toFixed(1)}
                      </Badge>
                    </td>
                    <td className="p-2 text-right">{(facility.occupancyRate * 100).toFixed(1)}%</td>
                    <td className="p-2 text-right">
                      <Badge variant={facility.trustScore >= 80 ? "default" : facility.trustScore >= 60 ? "secondary" : "destructive"}>
                        {facility.trustScore}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
        </CardContent>
      </Card>

      {/* Trust Policy Insights */}
      <Card>
        <CardHeader>
          <CardTitle>?†Î¢∞???ïÏ±Ö ?∏ÏÇ¨?¥Ìä∏</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {trustDist.find(b => b.range.includes('A'))?.count || 0}
          </div>
              <div className="text-sm text-gray-600">A?±Í∏â ?¨Ïö©??/div>
              <div className="text-xs text-gray-500 mt-1">
                {trustDist.find(b => b.range.includes('A'))?.percentage || 0}% ÎπÑÏú®
        </div>
      </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {trustDist.find(b => b.range.includes('C'))?.count || 0}
          </div>
              <div className="text-sm text-gray-600">C?±Í∏â ?¨Ïö©??/div>
              <div className="text-xs text-gray-500 mt-1">
                Í∞úÏÑ† ?ÑÏöî Í∑∏Î£π
        </div>
          </div>
            
            <div className="text-center p-4 border rounded-lg">
          <div className="text-2xl font-bold text-red-600">
                {trustDist.find(b => b.range.includes('F'))?.count || 0}
          </div>
              <div className="text-sm text-gray-600">F?±Í∏â ?¨Ïö©??/div>
              <div className="text-xs text-gray-500 mt-1">
                ?úÌïú ?Ä??Í∑∏Î£π
        </div>
      </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
