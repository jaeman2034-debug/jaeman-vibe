// src/blog/NaverCrossPost.tsx
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

function NaverCrossPost({ clubId, postId }: { clubId: string, postId: string }) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryNo, setSelectedCategoryNo] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // 네이버 연동 상태 확인
  useEffect(() => {
    checkNaverConnection();
  }, []);

  const checkNaverConnection = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      
      const response = await fetch(`/api/naver/categories?u=${uid}`);
      if (response.ok) {
        setIsConnected(true);
        const data = await response.json();
        setCategories(data.categoryList || []);
      }
    } catch (error) {
      console.log('네이버 연동 상태 확인 실패:', error);
    }
  };

  const handleNaverLogin = () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert('로그인이 필요합니다.');
      return;
    }
    window.location.href = `/api/naver/login?u=${uid}`;
  };

  const handleCrossPost = async () => {
    if (!isConnected) {
      alert('먼저 네이버 블로그에 연동해주세요.');
      return;
    }
    if (!confirm('네이버 블로그에 이 글을 발행할까요?')) return;

    setLoading(true);
    try {
      const postSnap = await getDoc(doc(db, `clubs/${clubId}/blog/${postId}`));
      if (!postSnap.exists) {
        alert('블로그 글을 찾을 수 없습니다.');
        setLoading(false);
        return;
      }
      const postData = postSnap.data();
      const uid = auth.currentUser?.uid;
      if (!uid) {
        alert('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/naver/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          u: uid,
          title: postData?.title,
          html: postData?.content, // AI 이미지/영상 링크 포함된 HTML
          categoryNo: selectedCategoryNo || undefined
        })
      });

      const result = await response.json();
      if (response.ok) {
        alert('네이버 블로그에 성공적으로 발행되었습니다!');
      } else {
        throw new Error(result.message || '발행 실패');
      }
    } catch (error: any) {
      console.error('네이버 크로스포스트 오류:', error);
      alert(`네이버 크로스포스트 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded bg-green-50 space-y-3">
      <h3 className="font-bold text-lg">네이버 블로그로 크로스포스트</h3>
      
      {!isConnected ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            네이버 블로그에 연동하여 글을 자동으로 발행할 수 있습니다.
          </p>
          <button
            onClick={handleNaverLogin}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            네이버 블로그 연동하기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-green-600 font-medium">
            ✅ 네이버 블로그에 연동되었습니다.
          </p>
          
          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">카테고리 선택 (선택사항)</label>
              <select
                value={selectedCategoryNo}
                onChange={(e) => setSelectedCategoryNo(e.target.value)}
                className="w-full px-3 py-2 border rounded mt-1"
                disabled={loading}
              >
                <option value="">카테고리 없음</option>
                {categories.map((cat: any) => (
                  <option key={cat.categoryNo} value={cat.categoryNo}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <button
            onClick={handleCrossPost}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? '발행 중...' : '네이버 블로그에 발행'}
          </button>
        </div>
      )}
    </div>
  );
}

export default NaverCrossPost;