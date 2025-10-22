import { useEffect, useState } from 'react';

export default function DivisionTablePage() {
  const clubId = location.pathname.split('/')[2];
  const div = location.pathname.split('/')[4];
  const [rows, setRows] = useState<any[]>([]);
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [clubId, div]);

  async function loadData() {
    try {
      setLoading(true);
      
      // 순위표 조회
      const tableRes = await fetch(`/api/clubs/${clubId}/divisions/${div}/table`);
      const tableData = await tableRes.json();
      setRows(tableData?.items || []);
      
      // Elo 레이팅 조회
      const ratingsRes = await fetch(`/api/clubs/${clubId}/divisions/${div}/ratings`);
      const ratingsData = await ratingsRes.json();
      setRatings(ratingsData?.items || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getRating(teamId: string) {
    const rating = ratings.find((x: any) => x.teamId === teamId);
    return rating ? rating.rating : '-';
  }

  function getRatingChange(teamId: string) {
    const rating = ratings.find((x: any) => x.teamId === teamId);
    return rating ? rating.updatedAt : null;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Division Table</h1>
        <div className="flex gap-2">
          <a
            href={`/clubs/${clubId}/divisions/${div}/table.csv`}
            className="px-4 py-2 rounded-xl border hover:bg-gray-50"
          >
            CSV 다운로드
          </a>
          <button
            className="px-4 py-2 rounded-xl border hover:bg-gray-50"
            onClick={loadData}
          >
            새로고침
          </button>
        </div>
      </div>

      <div className="text-sm text-zinc-500">
        디비전: {div}
      </div>

      {/* 순위표 */}
      <div className="rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-900">
            <tr>
              <th className="p-3 text-left">순위</th>
              <th className="p-3 text-left">팀</th>
              <th className="p-3 text-center">경기</th>
              <th className="p-3 text-center">승</th>
              <th className="p-3 text-center">무</th>
              <th className="p-3 text-center">패</th>
              <th className="p-3 text-center">득점</th>
              <th className="p-3 text-center">실점</th>
              <th className="p-3 text-center">득실차</th>
              <th className="p-3 text-center font-bold">승점</th>
              <th className="p-3 text-center">Elo</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-8 text-center text-zinc-500">
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((row: any, index: number) => (
                <tr key={row.teamId} className="border-t hover:bg-gray-50 dark:hover:bg-zinc-800">
                  <td className="p-3 text-left font-bold">
                    {index + 1}
                  </td>
                  <td className="p-3 text-left font-medium">
                    {row.teamId}
                  </td>
                  <td className="p-3 text-center">
                    {row.played}
                  </td>
                  <td className="p-3 text-center text-green-600">
                    {row.win}
                  </td>
                  <td className="p-3 text-center text-yellow-600">
                    {row.draw}
                  </td>
                  <td className="p-3 text-center text-red-600">
                    {row.loss}
                  </td>
                  <td className="p-3 text-center">
                    {row.gf}
                  </td>
                  <td className="p-3 text-center">
                    {row.ga}
                  </td>
                  <td className={`p-3 text-center font-medium ${
                    row.gd > 0 ? 'text-green-600' : 
                    row.gd < 0 ? 'text-red-600' : 'text-zinc-600'
                  }`}>
                    {row.gd > 0 ? '+' : ''}{row.gd}
                  </td>
                  <td className="p-3 text-center font-bold text-lg">
                    {row.pts}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-medium">{getRating(row.teamId)}</span>
                      {getRatingChange(row.teamId) && (
                        <span className="text-xs text-zinc-400">
                          {new Date(getRatingChange(row.teamId)).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 통계 요약 */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {rows.length}
            </div>
            <div className="text-sm text-zinc-500">참가팀</div>
          </div>
          <div className="rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {rows.reduce((sum, row) => sum + row.played, 0)}
            </div>
            <div className="text-sm text-zinc-500">총 경기</div>
          </div>
          <div className="rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {rows.reduce((sum, row) => sum + row.gf, 0)}
            </div>
            <div className="text-sm text-zinc-500">총 득점</div>
          </div>
          <div className="rounded-xl border p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length) || 0}
            </div>
            <div className="text-sm text-zinc-500">평균 Elo</div>
          </div>
        </div>
      )}

      {/* Elo 레이팅 상세 */}
      {ratings.length > 0 && (
        <div className="rounded-2xl border p-4">
          <h3 className="text-lg font-semibold mb-3">Elo 레이팅</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {ratings
              .sort((a, b) => b.rating - a.rating)
              .map((rating: any) => (
                <div key={rating.teamId} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <span className="font-medium">{rating.teamId}</span>
                  <span className="text-sm text-zinc-600">{rating.rating}</span>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
