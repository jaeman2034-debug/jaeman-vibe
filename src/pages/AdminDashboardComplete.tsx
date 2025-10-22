import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface ApprovalItem {
  id: string;
  title: string;
  type: string;
  status: string;
  createdAt: any;
  approvedAt?: any;
  rejectedAt?: any;
  approvers: any[];
  required: number;
  rejectedReason?: string;
}

interface DailyStats {
  date: string;
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  avgApprovalTime: number;
  byType: Record<string, number>;
}

interface RealtimeStats {
  today: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    expired: number;
    partially_approved: number;
  };
  byType: Record<string, number>;
  byHour: Record<string, number>;
  queues: {
    webhook_retry: { pending: number };
    slack_update: { pending: number };
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminDashboardComplete() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [realtimeStats, setRealtimeStats] = useState<RealtimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', type: '', search: '' });
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_ADMIN_API_BASE || 'https://asia-northeast3-yagovibe.cloudfunctions.net/slack';
  const INTERNAL_KEY = import.meta.env.VITE_INTERNAL_KEY;

  useEffect(() => {
    loadData();
    const interval = setInterval(loadRealtimeStats, 30000); // 30초마다 실시간 통계 업데이트
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [approvalsRes, dailyRes, realtimeRes] = await Promise.all([
        fetch(`${API_BASE}/admin/dashboard`, {
          headers: { 'x-internal-key': INTERNAL_KEY }
        }),
        fetch(`${API_BASE}/admin/stats/daily?limit=30`, {
          headers: { 'x-internal-key': INTERNAL_KEY }
        }),
        fetch(`${API_BASE}/admin/stats/realtime`, {
          headers: { 'x-internal-key': INTERNAL_KEY }
        })
      ]);

      const [approvalsData, dailyData, realtimeData] = await Promise.all([
        approvalsRes.json(),
        dailyRes.json(),
        realtimeRes.json()
      ]);

      if (approvalsData.ok) {
        setApprovals(approvalsData.data.approvals || []);
      }
      if (dailyData.ok) {
        setDailyStats(dailyData.data || []);
      }
      if (realtimeData.ok) {
        setRealtimeStats(realtimeData.data);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRealtimeStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/stats/realtime`, {
        headers: { 'x-internal-key': INTERNAL_KEY }
      });
      const data = await res.json();
      if (data.ok) {
        setRealtimeStats(data.data);
      }
    } catch (error) {
      console.error('Failed to load realtime stats:', error);
    }
  };

  const handleAction = async (action: string, docId: string, extra?: any) => {
    try {
      setActionLoading(docId);
      const res = await fetch(`${API_BASE}/admin/${action}/${docId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': INTERNAL_KEY
        },
        body: JSON.stringify(extra || {})
      });
      
      const data = await res.json();
      if (data.ok) {
        await loadData();
        setSelectedItem(null);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredApprovals = approvals.filter(item => {
    if (filter.status && item.status !== filter.status) return false;
    if (filter.type && item.type !== filter.type) return false;
    if (filter.search && !item.title.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-gray-600 bg-gray-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'partially_approved': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('ko-KR');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Slack 승인 시스템 관리</h1>
              <p className="mt-1 text-sm text-gray-500">실시간 모니터링 및 관리 대시보드</p>
            </div>
            <button
              onClick={loadData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              새로고침
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 실시간 통계 카드 */}
        {realtimeStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">오늘 총 승인 요청</p>
                  <p className="text-2xl font-semibold text-gray-900">{realtimeStats.today.total}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">승인됨</p>
                  <p className="text-2xl font-semibold text-gray-900">{realtimeStats.today.approved}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">대기중</p>
                  <p className="text-2xl font-semibold text-gray-900">{realtimeStats.today.pending}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">반려됨</p>
                  <p className="text-2xl font-semibold text-gray-900">{realtimeStats.today.rejected}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 일일 승인 추이 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">일일 승인 추이</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="approved" stroke="#10B981" strokeWidth={2} />
                <Line type="monotone" dataKey="rejected" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 타입별 분포 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">타입별 분포</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(realtimeStats?.byType || {}).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(realtimeStats?.byType || {}).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 승인 목록 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-gray-900">승인 요청 목록</h3>
              
              {/* 필터 */}
              <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-4">
                <select
                  value={filter.status}
                  onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">모든 상태</option>
                  <option value="pending">대기중</option>
                  <option value="partially_approved">부분 승인</option>
                  <option value="approved">승인됨</option>
                  <option value="rejected">반려됨</option>
                  <option value="expired">만료됨</option>
                </select>

                <select
                  value={filter.type}
                  onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">모든 타입</option>
                  <option value="market">마켓</option>
                  <option value="meetup">모임</option>
                  <option value="job">구인구직</option>
                  <option value="event">이벤트</option>
                </select>

                <input
                  type="text"
                  placeholder="제목 검색..."
                  value={filter.search}
                  onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">타입</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">승인자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApprovals.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{item.type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.approvers.length}/{item.required}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          상세
                        </button>
                        {item.status === 'pending' && (
                          <button
                            onClick={() => handleAction('approve', item.id, { userId: 'admin', userName: 'Admin' })}
                            disabled={actionLoading === item.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            {actionLoading === item.id ? '처리중...' : '승인'}
                          </button>
                        )}
                        {item.status === 'pending' && (
                          <button
                            onClick={() => {
                              const reason = prompt('반려 사유를 입력하세요:');
                              if (reason) {
                                handleAction('reject', item.id, { userId: 'admin', userName: 'Admin', reason });
                              }
                            }}
                            disabled={actionLoading === item.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            반려
                          </button>
                        )}
                        {['rejected', 'expired'].includes(item.status) && (
                          <button
                            onClick={() => handleAction('resubmit', item.id)}
                            disabled={actionLoading === item.id}
                            className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                          >
                            재상신
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 상세 모달 */}
        {selectedItem && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">승인 상세 정보</h3>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">제목</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedItem.title}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">타입</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedItem.type}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">상태</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedItem.status)}`}>
                        {selectedItem.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">승인자</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedItem.approvers.length}/{selectedItem.required}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">생성일</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(selectedItem.createdAt)}</p>
                    </div>
                  </div>
                  
                  {selectedItem.rejectedReason && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">반려 사유</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedItem.rejectedReason}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setSelectedItem(null)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
