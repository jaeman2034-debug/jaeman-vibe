import { useEffect, useState } from 'react';
import { RequireRole } from '../../components/auth/RequireRole';

export default function PayoutsPage() {
  const clubId = location.pathname.split('/')[2];
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutRules, setPayoutRules] = useState<any[]>([]);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    loadPayouts();
    loadPayoutRules();
  }, [clubId]);

  async function loadPayouts() {
    try {
      setLoading(true);
      const q = new URLSearchParams();
      if (from) q.set('from', String(new Date(from).getTime()));
      if (to) q.set('to', String(new Date(to).getTime()));
      
      const res = await fetch(`/admin/clubs/${clubId}/payouts?${q.toString()}`);
      const data = await res.json();
      setRows(data.summary || []);
    } catch (error) {
      console.error('Failed to load payouts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadPayoutRules() {
    try {
      const res = await fetch(`/api/clubs/${clubId}/payout-rules`);
      const data = await res.json();
      setPayoutRules(data.items || []);
    } catch (error) {
      console.error('Failed to load payout rules:', error);
    }
  }

  async function savePayoutRules() {
    try {
      await fetch(`/api/clubs/${clubId}/payout-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: payoutRules })
      });
      alert('수당 규칙이 저장되었습니다');
    } catch (error) {
      alert('저장 실패');
    }
  }

  function updateRule(index: number, field: string, value: any) {
    setPayoutRules(prev => {
      const newRules = [...prev];
      newRules[index] = { ...newRules[index], [field]: value };
      return newRules;
    });
  }

  function addRule() {
    setPayoutRules(prev => [...prev, { role: '', amountKRW: 0 }]);
  }

  function removeRule(index: number) {
    setPayoutRules(prev => prev.filter((_, i) => i !== index));
  }

  function getCsvUrl() {
    const q = new URLSearchParams();
    if (from) q.set('from', String(new Date(from).getTime()));
    if (to) q.set('to', String(new Date(to).getTime()));
    return `/admin/clubs/${clubId}/payouts.csv?${q.toString()}`;
  }

  const totalAmount = rows.reduce((sum, row) => sum + row.total, 0);
  const totalMatches = rows.reduce((sum, row) => sum + row.matches, 0);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <RequireRole clubId={clubId} roles={['owner', 'manager', 'assignor']}>
      <div className="mx-auto max-w-6xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">심판 수당 정산</h1>
          <button
            className="px-4 py-2 rounded-xl border hover:bg-gray-50"
            onClick={() => setShowRules(!showRules)}
          >
            {showRules ? '정산 보기' : '수당 규칙 설정'}
          </button>
        </div>

        {!showRules ? (
          <>
            {/* 기간 선택 */}
            <div className="rounded-xl border p-4 bg-gray-50">
              <div className="flex gap-4 items-end">
                <div>
                  <div className="text-sm text-zinc-500 mb-1">시작일</div>
                  <input
                    type="date"
                    className="px-3 py-2 rounded-lg border"
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                  />
                </div>
                <div>
                  <div className="text-sm text-zinc-500 mb-1">종료일</div>
                  <input
                    type="date"
                    className="px-3 py-2 rounded-lg border"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                  />
                </div>
                <button
                  className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800"
                  onClick={loadPayouts}
                >
                  조회
                </button>
                <a
                  className="px-4 py-2 rounded-xl border hover:bg-gray-50"
                  href={getCsvUrl()}
                  download
                >
                  CSV 다운로드
                </a>
              </div>
            </div>

            {/* 요약 통계 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-xl border p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {rows.length}
                </div>
                <div className="text-sm text-zinc-500">심판 수</div>
              </div>
              <div className="rounded-xl border p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {totalMatches}
                </div>
                <div className="text-sm text-zinc-500">총 경기 수</div>
              </div>
              <div className="rounded-xl border p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  ₩{totalAmount.toLocaleString()}
                </div>
                <div className="text-sm text-zinc-500">총 수당</div>
              </div>
              <div className="rounded-xl border p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  ₩{rows.length > 0 ? Math.round(totalAmount / rows.length).toLocaleString() : 0}
                </div>
                <div className="text-sm text-zinc-500">평균 수당</div>
              </div>
            </div>

            {/* 정산 테이블 */}
            <div className="rounded-2xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900">
                  <tr>
                    <th className="p-3 text-left">심판 ID</th>
                    <th className="p-3 text-right">경기 수</th>
                    <th className="p-3 text-right">총 수당</th>
                    <th className="p-3 text-right">평균 수당</th>
                    <th className="p-3 text-left">역할별 분포</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-zinc-500">
                        데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    rows
                      .sort((a, b) => b.total - a.total)
                      .map((row: any) => (
                        <tr key={row.uid} className="border-t hover:bg-gray-50 dark:hover:bg-zinc-800">
                          <td className="p-3 font-medium">{row.uid}</td>
                          <td className="p-3 text-right">{row.matches}</td>
                          <td className="p-3 text-right font-bold">
                            ₩{Number(row.total).toLocaleString()}
                          </td>
                          <td className="p-3 text-right">
                            ₩{Math.round(Number(row.total) / row.matches).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(row.roles || {}).map(([role, count]: [string, any]) => (
                                <span
                                  key={role}
                                  className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                                >
                                  {role === 'referee' ? '주심' :
                                   role === 'ar1' ? '부심1' :
                                   role === 'ar2' ? '부심2' :
                                   role === 'table' ? '기록원' :
                                   role === 'umpire' ? '심판' : role}: {count}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* 수당 규칙 설정 */
          <div className="space-y-4">
            <div className="rounded-xl border p-4">
              <h3 className="text-lg font-semibold mb-4">수당 규칙 설정</h3>
              <div className="space-y-3">
                {payoutRules.map((rule: any, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg border">
                    <input
                      className="px-3 py-2 rounded-lg border flex-1"
                      placeholder="역할 (예: referee, ar1, ar2, table, umpire)"
                      value={rule.role}
                      onChange={e => updateRule(index, 'role', e.target.value)}
                    />
                    <input
                      type="number"
                      className="px-3 py-2 rounded-lg border w-32"
                      placeholder="금액 (원)"
                      value={rule.amountKRW}
                      onChange={e => updateRule(index, 'amountKRW', Number(e.target.value || 0))}
                    />
                    <button
                      className="px-3 py-2 rounded-lg border text-red-600 hover:bg-red-50"
                      onClick={() => removeRule(index)}
                    >
                      삭제
                    </button>
                  </div>
                ))}
                <button
                  className="w-full px-4 py-2 rounded-lg border border-dashed border-gray-300 hover:bg-gray-50"
                  onClick={addRule}
                >
                  + 규칙 추가
                </button>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800"
                  onClick={savePayoutRules}
                >
                  저장
                </button>
                <button
                  className="px-4 py-2 rounded-xl border hover:bg-gray-50"
                  onClick={loadPayoutRules}
                >
                  새로고침
                </button>
              </div>
            </div>

            {/* 현재 규칙 미리보기 */}
            <div className="rounded-xl border p-4">
              <h4 className="font-medium mb-3">현재 규칙</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {payoutRules.map((rule: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                    <span className="text-sm font-medium">
                      {rule.role === 'referee' ? '주심' :
                       rule.role === 'ar1' ? '부심1' :
                       rule.role === 'ar2' ? '부심2' :
                       rule.role === 'table' ? '기록원' :
                       rule.role === 'umpire' ? '심판' : rule.role}
                    </span>
                    <span className="text-sm text-zinc-600">
                      ₩{Number(rule.amountKRW).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireRole>
  );
}
