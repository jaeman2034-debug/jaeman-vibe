import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Timestamp, collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useIsStaff } from '@/hooks/useIsStaff';

type Row = { 
  id: string; 
  at?: any; 
  actorId?: string; 
  action?: string; 
  meta?: any; 
};

export default function LogsDashboard() {
  const { id: eventId } = useParams();
  const isStaff = useIsStaff(eventId);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState<string>(''); // YYYY-MM-DD
  const [to, setTo] = useState<string>('');
  const [action, setAction] = useState<string>(''); // 부분 문자열
  const [actor, setActor] = useState<string>('');

  const load = async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      let q = query(
        collection(db, 'events', eventId, 'logs'), 
        orderBy('at', 'desc'), 
        limit(500)
      );
      
      const filters: any[] = [];
      if (from) { 
        const d = new Date(from + 'T00:00:00'); 
        filters.push(where('at', '>=', Timestamp.fromDate(d))); 
      }
      if (to) { 
        const d = new Date(to + 'T23:59:59'); 
        filters.push(where('at', '<=', Timestamp.fromDate(d))); 
      }
      
      if (filters.length) { 
        q = query(
          collection(db, 'events', eventId, 'logs'), 
          ...filters, 
          orderBy('at', 'desc'), 
          limit(500)
        ); 
      }
      
      const snap = await getDocs(q);
      let arr = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Row[];
      
      if (action) arr = arr.filter(r => (r.action || '').includes(action));
      if (actor) arr = arr.filter(r => (r.actorId || '').includes(actor));
      
      setRows(arr);
    } catch (error) {
      console.error('로그 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(); 
    // eslint-disable-next-line 
  }, [eventId]);

  const toCSV = () => {
    const header = ['at', 'actorId', 'action', 'meta'];
    const body = rows.map(r => [
      r.at?.toDate ? r.at.toDate().toISOString() : '',
      r.actorId || '',
      r.action || '',
      JSON.stringify(r.meta || {})
    ].map(v => `"${String(v).replaceAll('"', '""')}"`).join(','));
    
    const csvContent = [header.join(','), ...body].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(blob); 
    a.download = `logs_${eventId}.csv`; 
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('ko-KR');
    } catch {
      return '';
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('join')) return 'text-green-600';
    if (action.includes('delete') || action.includes('leave') || action.includes('kick')) return 'text-red-600';
    if (action.includes('update') || action.includes('pin')) return 'text-blue-600';
    if (action.includes('payment')) return 'text-purple-600';
    if (action.includes('announce')) return 'text-orange-600';
    return 'text-gray-600';
  };

  if (!isStaff) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-600 mb-4">권한이 없습니다</h1>
          <p className="text-gray-600 mb-4">이 페이지는 스태프만 접근할 수 있습니다.</p>
          <Link 
            to={`/events/${eventId}`} 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            이벤트로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">감사 로그 대시보드</h1>
          <p className="text-gray-600">이벤트 ID: {eventId}</p>
        </div>
        <Link 
          to={`/events/${eventId}`} 
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          이벤트로 돌아가기
        </Link>
      </div>

      {/* 필터 */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <h2 className="text-lg font-medium mb-4">필터</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작 날짜</label>
            <input 
              className="w-full border rounded-lg p-2 text-sm" 
              type="date" 
              value={from} 
              onChange={e => setFrom(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료 날짜</label>
            <input 
              className="w-full border rounded-lg p-2 text-sm" 
              type="date" 
              value={to} 
              onChange={e => setTo(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">액션 검색</label>
            <input 
              className="w-full border rounded-lg p-2 text-sm" 
              placeholder="action 포함 검색" 
              value={action} 
              onChange={e => setAction(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사용자 검색</label>
            <input 
              className="w-full border rounded-lg p-2 text-sm" 
              placeholder="actorId 포함 검색" 
              value={actor} 
              onChange={e => setActor(e.target.value)} 
            />
          </div>
          <div className="flex items-end gap-2">
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50" 
              onClick={load}
              disabled={loading}
            >
              {loading ? '조회 중...' : '조회'}
            </button>
            <button 
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors" 
              onClick={toCSV}
              disabled={rows.length === 0}
            >
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{rows.length}</div>
          <div className="text-sm text-gray-600">총 로그 수</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-green-600">
            {rows.filter(r => r.action?.includes('create') || r.action?.includes('join')).length}
          </div>
          <div className="text-sm text-gray-600">생성/참가</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-red-600">
            {rows.filter(r => r.action?.includes('delete') || r.action?.includes('leave')).length}
          </div>
          <div className="text-sm text-gray-600">삭제/탈퇴</div>
        </div>
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="text-2xl font-bold text-purple-600">
            {rows.filter(r => r.action?.includes('payment')).length}
          </div>
          <div className="text-sm text-gray-600">결제 관련</div>
        </div>
      </div>

      {/* 로그 테이블 */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left font-medium text-gray-700 w-48">시간</th>
                <th className="p-3 text-left font-medium text-gray-700 w-40">사용자</th>
                <th className="p-3 text-left font-medium text-gray-700 w-56">액션</th>
                <th className="p-3 text-left font-medium text-gray-700">메타데이터</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 text-gray-600">
                    {formatDate(r.at)}
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                      {r.actorId || 'system'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`font-medium ${getActionColor(r.action || '')}`}>
                      {r.action || 'unknown'}
                    </span>
                  </td>
                  <td className="p-3">
                    <code className="text-xs break-all text-gray-600 bg-gray-50 p-2 rounded block">
                      {JSON.stringify(r.meta || {}, null, 2)}
                    </code>
                  </td>
                </tr>
              ))}
              {!rows.length && !loading && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    로그가 없습니다
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
