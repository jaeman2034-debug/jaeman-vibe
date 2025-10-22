import React, { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query, limit, addDoc } from "firebase/firestore";
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
  Cell,
  AreaChart,
  Area
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  TrendingUp, 
  Brain, 
  Download,
  Calendar,
  Activity,
  Users,
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  Volume2,
  Play,
  Pause
} from "lucide-react";

interface AIReport {
  id: string;
  reportDate: string;
  totalTransactions: number;
  totalValue: number;
  avgDistance: number;
  pdfUrl?: string;
  audioUrl?: string;
  ttsSummary?: string;
  createdAt: string;
  status: 'success' | 'error' | 'processing';
  aiSummary?: string;
  regionStats?: any;
  categoryStats?: any;
}

interface ReportStats {
  totalReports: number;
  avgTransactions: number;
  avgValue: number;
  lastReportDate: string;
  successRate: number;
}

export default function AIReportDashboard() {
  const [reports, setReports] = useState<AIReport[]>([]);
  const [reportStats, setReportStats] = useState<ReportStats>({
    totalReports: 0,
    avgTransactions: 0,
    avgValue: 0,
    lastReportDate: '',
    successRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioRefs, setAudioRefs] = useState<{ [key: string]: HTMLAudioElement }>({});

  // ?�� 차트 ?�상 ?�레??  const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#ea580c', '#7c3aed', '#0891b2'];

  useEffect(() => {
    // ?�� ?�시�?AI 리포??구독
    const unsub = onSnapshot(
      query(collection(db, "ai_reports"), orderBy("createdAt", "desc"), limit(30)),
      (snapshot) => {
        const reportList: AIReport[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          reportList.push({
            id: doc.id,
            reportDate: data.reportDate || "?�짜 ?�음",
            totalTransactions: data.totalTransactions || 0,
            totalValue: data.totalValue || 0,
            avgDistance: data.avgDistance || 0,
            pdfUrl: data.pdfUrl || null,
            audioUrl: data.audioUrl || null,
            ttsSummary: data.ttsSummary || '',
            createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            status: data.status || 'success',
            aiSummary: data.aiSummary || '',
            regionStats: data.regionStats || {},
            categoryStats: data.categoryStats || {}
          });
        });

        setReports(reportList);

        // ?�� 리포???�계 계산
        const totalReports = reportList.length;
        const avgTransactions = totalReports > 0 
          ? Math.round(reportList.reduce((sum, report) => sum + report.totalTransactions, 0) / totalReports)
          : 0;
        const avgValue = totalReports > 0 
          ? Math.round(reportList.reduce((sum, report) => sum + report.totalValue, 0) / totalReports)
          : 0;
        const lastReportDate = totalReports > 0 ? reportList[0].reportDate : '';
        const successRate = totalReports > 0 
          ? Math.round((reportList.filter(report => report.status === 'success').length / totalReports) * 100)
          : 0;

        setReportStats({
          totalReports,
          avgTransactions,
          avgValue,
          lastReportDate,
          successRate
        });

        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  // ?�� ?�성 ?�생 ?�수
  const playAudio = (reportId: string, audioUrl: string) => {
    // 기존 ?�생 중인 ?�성 ?��?
    if (playingAudio && audioRefs[playingAudio]) {
      audioRefs[playingAudio].pause();
      audioRefs[playingAudio].currentTime = 0;
    }

    // ???�성 ?�생
    if (!audioRefs[reportId]) {
      const audio = new Audio(audioUrl);
      audioRefs[reportId] = audio;
      
      audio.onended = () => {
        setPlayingAudio(null);
      };
      
      audio.onerror = () => {
        console.error('?�성 ?�생 ?�패:', audioUrl);
        setPlayingAudio(null);
      };
    }

    if (playingAudio === reportId) {
      // ?�재 ?�생 중인 ?�성 ?��?
      audioRefs[reportId].pause();
      setPlayingAudio(null);
    } else {
      // ???�성 ?�생
      setPlayingAudio(reportId);
      audioRefs[reportId].play();
    }
  };

  // ?? ?�동 리포???�리�?(?�스?�용)
  const triggerManualReport = async () => {
    setTriggering(true);
    try {
      // n8n ?�훅 URL�??�동 ?�리�??�청
      const webhookUrl = import.meta.env.VITE_N8N_REPORT_WEBHOOK_URL;
      if (webhookUrl) {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trigger: 'manual', timestamp: new Date().toISOString() })
        });
        
        if (response.ok) {
          console.log('???�동 리포???�리�??�공');
        }
      }
    } catch (error) {
      console.error('???�동 리포???�리�??�패:', error);
    } finally {
      setTriggering(false);
    }
  };

  // ?�� 차트 ?�이??준�?  const chartData = reports.slice(0, 7).reverse().map(report => ({
    date: new Date(report.reportDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
    transactions: report.totalTransactions,
    value: report.totalValue,
    distance: report.avgDistance
  }));

  const categoryData = reports.length > 0 ? 
    Object.entries(reports[0].categoryStats || {})
      .map(([name, stats]: [string, any]) => ({
        name,
        value: stats.totalValue || 0,
        count: stats.count || 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5) : [];

  // ?�� 가�??�맷??  const formatPrice = (price: number) => {
    return price.toLocaleString() + '??;
  };

  // ?�� ?�태 ?�이�?  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  // ?�� ?�태 배�?
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">?�공</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">?�패</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-800">처리�?/Badge>;
      default:
        return <Badge variant="secondary">?????�음</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ?�더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          ?�� YAGO VIBE AI ?�성 리포???�?�보??        </h1>
        <p className="text-gray-600 mt-2">AI 기반 ?�동 ?�성 거래 리포???�성 �?분석</p>
      </div>

      {/* ?�� ?�계 카드??*/}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">�?리포????/p>
                <p className="text-3xl font-bold">{reportStats.totalReports}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">?�균 거래 ??/p>
                <p className="text-3xl font-bold">{reportStats.avgTransactions}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">?�균 거래??/p>
                <p className="text-3xl font-bold">{formatPrice(reportStats.avgValue)}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">?�공�?/p>
                <p className="text-3xl font-bold">{reportStats.successRate}%</p>
              </div>
              <Activity className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm">최근 리포??/p>
                <p className="text-lg font-bold">{reportStats.lastReportDate}</p>
              </div>
              <Calendar className="h-8 w-8 text-indigo-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ?�� 컨트�??�널 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            AI ?�성 리포??컨트�?          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={triggerManualReport}
              disabled={triggering}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {triggering ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ?�성 리포???�성 �?..
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  ?�동 ?�성 리포???�성
                </>
              )}
            </Button>
            <div className="text-sm text-gray-600">
              ?�� 매일 00:00??AI가 ?�동?�로 ?�성 리포?��? ?�성?�니??            </div>
          </div>
        </CardContent>
      </Card>

      {/* ?�� 차트 ?�션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* ?�자�?리포???�렌??*/}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              리포???�렌??(최근 7??
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'transactions' ? `${value}�? : formatPrice(value),
                      name === 'transactions' ? '거래 ?? : '거래??
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="transactions" 
                    stroke="#2563eb" 
                    fill="#2563eb" 
                    fillOpacity={0.3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#16a34a" 
                    fill="#16a34a" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 카테고리�?분포 */}
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

      {/* ?�� 최근 AI 리포??목록 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            최근 AI ?�성 리포??목록
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-500">리포?��? 불러?�는 �?..</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12">
                <Volume2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">?�직 ?�성??AI ?�성 리포?��? ?�습?�다.</p>
                <p className="text-sm text-gray-400">?�동 ?�성 버튼???�러 ?�스?�해보세??</p>
              </div>
            ) : (
              reports.slice(0, 10).map((report, index) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        ?�� AI ?�성 리포??- {report.reportDate}
                      </h3>
                      {getStatusIcon(report.status)}
                      {getStatusBadge(report.status)}
                      {report.audioUrl && (
                        <Badge className="bg-green-100 text-green-800">
                          ?�� ?�성 ?�함
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <ShoppingCart className="h-3 w-3" />
                        {report.totalTransactions}�?                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {formatPrice(report.totalValue)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        ?�균 {report.avgDistance}m
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(report.createdAt).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    {report.aiSummary && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                        {report.aiSummary.substring(0, 150)}...
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex flex-col gap-2">
                      {report.pdfUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(report.pdfUrl, '_blank')}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          PDF ?�운로드
                        </Button>
                      )}
                      {report.audioUrl && (
                        <Button
                          size="sm"
                          variant={playingAudio === report.id ? "default" : "outline"}
                          onClick={() => playAudio(report.id, report.audioUrl!)}
                          className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                        >
                          {playingAudio === report.id ? (
                            <Pause className="h-3 w-3 mr-1" />
                          ) : (
                            <Play className="h-3 w-3 mr-1" />
                          )}
                          {playingAudio === report.id ? '?��?' : '?�기'}
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">#{index + 1}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* ?�� ?�시�??�데?�트 ?�시 */}
      <div className="fixed bottom-4 right-4">
        <div className="bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">?�� AI ?�성 리포???�시�??�데?�트</span>
        </div>
      </div>
    </div>
  );
}
