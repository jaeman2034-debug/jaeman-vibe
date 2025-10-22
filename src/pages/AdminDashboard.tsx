import React, { useState, useEffect } from 'react';

interface DashboardData {
  approvals: any[];
  metrics: any;
  throttleStats: any[];
  queueStats: {
    webhook_retry: { pending: number; failed: number };
    slack_update: { pending: number; failed: number };
  };
  timestamp: string;
}

interface ThrottleConfig {
  capacity: number;
  refillPerSec: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [throttleConfigs, setThrottleConfigs] = useState<Record<string, ThrottleConfig>>({});

  const API_BASE = 'https://asia-northeast3-<PROJECT>.cloudfunctions.net/slack';
  const INTERNAL_KEY = import.meta.env.VITE_INTERNAL_KEY;

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin/dashboard`, {
        headers: {
          'x-internal-key': INTERNAL_KEY,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateThrottleConfig = async (channel: string, config: ThrottleConfig) => {
    try {
      const response = await fetch(`${API_BASE}/admin/throttle/${channel}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': INTERNAL_KEY,
        },
        body: JSON.stringify(config),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update throttle config');
      }
      
      setThrottleConfigs(prev => ({ ...prev, [channel]: config }));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update throttle config');
    }
  };

  const retryQueue = async (queue: string, limit: number = 10) => {
    try {
      const response = await fetch(`${API_BASE}/admin/retry/${queue}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': INTERNAL_KEY,
        },
        body: JSON.stringify({ limit }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to retry queue');
      }
      
      const result = await response.json();
      alert(`Queue retry completed: ${result.processed}/${result.total} processed`);
      fetchDashboard(); // 새로고침
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to retry queue');
    }
  };

  const reopenItem = async (docId: string) => {
    if (!confirm('이 항목을 재오픈하시겠습니까?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/admin/reopen/${docId}`, {
        method: 'POST',
        headers: {
          'x-internal-key': INTERNAL_KEY,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to reopen item');
      }
      
      alert('항목이 성공적으로 재오픈되었습니다');
      fetchDashboard(); // 새로고침
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reopen item');
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000); // 30초마다 새로고침
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">오류: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">데이터를 불러올 수 없습니다</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Slack 승인 시스템 운영 대시보드</h1>
          <p className="text-gray-600 mt-2">
            마지막 업데이트: {new Date(data.timestamp).toLocaleString()}
          </p>
        </div>

        {/* 메트릭 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">총 승인 요청</h3>
            <p className="text-3xl font-bold text-blue-600">{data.approvals.length}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">성공률</h3>
            <p className="text-3xl font-bold text-green-600">
              {data.metrics.okCount && data.metrics.errCount 
                ? Math.round((data.metrics.okCount / (data.metrics.okCount + data.metrics.errCount)) * 100)
                : 0}%
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">웹훅 재시도 대기</h3>
            <p className="text-3xl font-bold text-yellow-600">{data.queueStats.webhook_retry.pending}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900">Slack 업데이트 대기</h3>
            <p className="text-3xl font-bold text-purple-600">{data.queueStats.slack_update.pending}</p>
          </div>
        </div>

        {/* 큐 관리 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">웹훅 재시도 큐</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>대기 중:</span>
                <span className="font-semibold">{data.queueStats.webhook_retry.pending}</span>
              </div>
              <div className="flex justify-between">
                <span>실패:</span>
                <span className="font-semibold text-red-600">{data.queueStats.webhook_retry.failed}</span>
              </div>
              <button
                onClick={() => retryQueue('webhook_retry')}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                재시도 실행
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Slack 업데이트 큐</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>대기 중:</span>
                <span className="font-semibold">{data.queueStats.slack_update.pending}</span>
              </div>
              <div className="flex justify-between">
                <span>실패:</span>
                <span className="font-semibold text-red-600">{data.queueStats.slack_update.failed}</span>
              </div>
              <button
                onClick={() => retryQueue('slack_update')}
                className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                재시도 실행
              </button>
            </div>
          </div>
        </div>

        {/* 채널별 스로틀링 설정 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">채널별 스로틀링 설정</h3>
          <div className="space-y-4">
            {data.throttleStats.map((throttle) => (
              <div key={throttle.channel} className="flex items-center space-x-4 p-4 border rounded">
                <div className="flex-1">
                  <span className="font-medium">{throttle.channel}</span>
                  <div className="text-sm text-gray-600">
                    현재: {throttle.tokens || 0}/{throttle.capacity || 0} 토큰
                  </div>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="용량"
                    defaultValue={throttle.capacity || 5}
                    className="w-20 px-2 py-1 border rounded"
                    onChange={(e) => {
                      const channel = throttle.channel;
                      const capacity = Number(e.target.value);
                      const refillPerSec = throttleConfigs[channel]?.refillPerSec || throttle.refillPerSec || 1;
                      setThrottleConfigs(prev => ({
                        ...prev,
                        [channel]: { capacity, refillPerSec }
                      }));
                    }}
                  />
                  <input
                    type="number"
                    placeholder="재충전/초"
                    defaultValue={throttle.refillPerSec || 1}
                    step="0.1"
                    className="w-20 px-2 py-1 border rounded"
                    onChange={(e) => {
                      const channel = throttle.channel;
                      const refillPerSec = Number(e.target.value);
                      const capacity = throttleConfigs[channel]?.capacity || throttle.capacity || 5;
                      setThrottleConfigs(prev => ({
                        ...prev,
                        [channel]: { capacity, refillPerSec }
                      }));
                    }}
                  />
                  <button
                    onClick={() => {
                      const config = throttleConfigs[throttle.channel];
                      if (config) {
                        updateThrottleConfig(throttle.channel, config);
                      }
                    }}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    업데이트
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 최근 승인 현황 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">최근 승인 현황</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제목
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    타입
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    진행률
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    생성일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.approvals.map((approval) => (
                  <tr key={approval.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{approval.title}</div>
                      <div className="text-sm text-gray-500">{approval.summary}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {approval.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        approval.status === 'approved' ? 'bg-green-100 text-green-800' :
                        approval.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        approval.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {approval.status === 'approved' ? '승인됨' :
                         approval.status === 'rejected' ? '반려됨' :
                         approval.status === 'expired' ? '만료됨' :
                         approval.status === 'partially_approved' ? '진행중' : '대기중'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {approval.approvers?.length || 0}/{approval.required || 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {approval.createdAt?.toDate?.()?.toLocaleString() || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {(['rejected', 'expired'].includes(approval.status)) && (
                        <button
                          onClick={() => reopenItem(approval.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          재오픈
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
