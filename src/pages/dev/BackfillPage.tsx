import { useState } from 'react';
import { backfillThumbUrl } from '@/utils/backfillThumbUrl';

export default function BackfillPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; updated?: number; error?: any } | null>(null);

  const handleBackfill = async () => {
    if (loading) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const result = await backfillThumbUrl();
      setResult(result);
    } catch (error) {
      setResult({ success: false, error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">데이터 백필 도구</h1>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-yellow-800 mb-2">⚠️ 개발용 도구</h2>
        <p className="text-yellow-700 text-sm">
          기존 데이터에서 <code>thumbUrl</code>이 없는 문서들을 <code>images[0].url</code>에서 복사하여 채웁니다.
        </p>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleBackfill}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '백필 중...' : 'thumbUrl 백필 실행'}
        </button>

        {result && (
          <div className={`p-4 rounded-lg ${
            result.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <h3 className={`font-semibold ${
              result.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {result.success ? '✅ 백필 완료' : '❌ 백필 실패'}
            </h3>
            {result.success && (
              <p className="text-green-700 text-sm mt-1">
                {result.updated}개 문서가 업데이트되었습니다.
              </p>
            )}
            {result.error && (
              <p className="text-red-700 text-sm mt-1">
                오류: {result.error.message || result.error}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 text-sm text-gray-600">
        <h3 className="font-semibold mb-2">사용법:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>위 버튼을 클릭하여 백필을 실행하세요</li>
          <li>또는 브라우저 콘솔에서 <code>backfillThumbUrl()</code>를 실행하세요</li>
          <li>백필 완료 후 이 페이지는 삭제해도 됩니다</li>
        </ul>
      </div>
    </div>
  );
}
