import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, Users, Package, Briefcase, Clock, BarChart3 } from 'lucide-react';
import { useCategory } from '@/hooks/useCategory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CategorySideNav from '@/components/layout/CategorySideNav'; // 사이드바 경로로 수정

type TabType = 'overview' | 'groups' | 'products' | 'jobs' | 'timeslots' | 'analysis';

export default function AdminCategoryDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const navigate = useNavigate();
  const location = useLocation();
  
  const { category, stats, loading, error, refresh } = useCategory(slug || '', {
    includeStats: true,
    autoRefresh: true,
  });

  // 기본 탭 강제 설정
  const VALID_TABS = new Set(['overview', 'events', 'facilities', 'clubs', 'market', 'jobs']);
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab");
    if (!tab || !VALID_TABS.has(tab)) {
      navigate({ 
        pathname: location.pathname, 
        search: "?tab=overview" 
      }, { replace: true });
    }
  }, [location.search, location.pathname, navigate]);

  // 현재 탭 설정
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get("tab") as TabType;
    if (tab && ['overview', 'groups', 'products', 'jobs', 'timeslots', 'analysis'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Mock data for analysis chart (30 days)
  const analysisData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      bookings: Math.floor(Math.random() * 50) + 10,
      attendance: Math.floor(Math.random() * 45) + 8,
      noShows: Math.floor(Math.random() * 8) + 1,
      cancellations: Math.floor(Math.random() * 5) + 1,
    };
  });

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="h-8 bg-gray-200 animate-pulse rounded w-64" />
        <div className="h-96 bg-gray-200 animate-pulse rounded" />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-red-600 mb-2">카테고리를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-4">{error || '존재하지 않는 카테고리입니다.'}</p>
          <Button asChild>
            <Link to="/admin/categories">카테고리 목록으로</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="relative z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Button variant="ghost" size="sm" asChild className="w-full justify-start">
            <Link to="/admin/categories">
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로
            </Link>
          </Button>
        </div>
        <CategorySideNav />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                {category.emoji && <span>{category.emoji}</span>}
                {category.name}
              </h1>
              <p className="text-gray-600 mt-1">/{category.slug}</p>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">구독자</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {stats?.subscribers.toLocaleString() || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">상품</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {stats?.products.toLocaleString() || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">모임</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {stats?.groups.toLocaleString() || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">구인구직</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">
                      {stats?.jobs.toLocaleString() || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">슬롯</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {stats?.slots?.toLocaleString() || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Category Info */}
              <Card>
                <CardHeader>
                  <CardTitle>카테고리 정보</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">이름</label>
                      <p className="text-lg">{category.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">슬러그</label>
                      <p className="text-lg">/{category.slug}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">상태</label>
                      <Badge variant={category.isActive ? "default" : "secondary"}>
                        {category.isActive ? "활성" : "비활성"}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">정렬 순서</label>
                      <p className="text-lg">{category.sortOrder}</p>
                    </div>
                  </div>
                  {category.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">설명</label>
                      <p className="text-lg">{category.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Groups Tab */}
          {activeTab === 'groups' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">모임 목록</h3>
                <Button asChild>
                  <Link to={`/admin/groups/new?category=${category.id}`}>
                    <Plus className="w-4 h-4 mr-2" />
                    새 모임
                  </Link>
                </Button>
              </div>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12 text-gray-500">
                    모임 데이터를 불러오는 중...
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">상품 목록</h3>
                <Button asChild>
                  <Link to={`/admin/products/new?category=${category.id}`}>
                    <Plus className="w-4 h-4 mr-2" />
                    새 상품
                  </Link>
                </Button>
              </div>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12 text-gray-500">
                    상품 데이터를 불러오는 중...
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Jobs Tab */}
          {activeTab === 'jobs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">구인구직 목록</h3>
                <Button asChild>
                  <Link to={`/admin/jobs/new?category=${category.id}`}>
                    <Plus className="w-4 h-4 mr-2" />
                    새 구인구직
                  </Link>
                </Button>
              </div>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12 text-gray-500">
                    구인구직 데이터를 불러오는 중...
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Timeslots Tab */}
          {activeTab === 'timeslots' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">타임슬롯 목록</h3>
                <Button asChild>
                  <Link to={`/admin/slots/new?category=${category.id}`}>
                    <Plus className="w-4 h-4 mr-2" />
                    새 슬롯
                  </Link>
                </Button>
              </div>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12 text-gray-500">
                    타임슬롯 데이터를 불러오는 중...
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">최근 30일 분석</h3>
              <Card>
                <CardHeader>
                  <CardTitle>예약/출석/노쇼/취소 추이</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={analysisData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="bookings" 
                        stroke="#2563eb" 
                        name="예약" 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="attendance" 
                        stroke="#16a34a" 
                        name="출석" 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="noShows" 
                        stroke="#dc2626" 
                        name="노쇼" 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="cancellations" 
                        stroke="#9ca3af" 
                        name="취소" 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}