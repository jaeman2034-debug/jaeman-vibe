import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

interface BlogSectionProps {
  meetup: {
    id: string;
    title: string;
    blog?: {
      url: string;
      provider: string;
      providerId: string;
    };
  };
}

export default function BlogSection({ meetup }: BlogSectionProps) {
  const [creating, setCreating] = useState(false);
  const hasBlog = !!meetup.blog?.url;

  const createTeamBlog = async () => {
    if (creating) return;
    setCreating(true);
    
    try {
      const retryCall = httpsCallable(functions, 'retryCreateTeamBlog');
      const result: any = await retryCall({ meetupId: meetup.id });
      
      alert('팀 블로그가 성공적으로 생성되었습니다!');
      console.log('팀 블로그 생성 결과:', result.data);
      
      // 페이지 새로고침 또는 상태 업데이트
      window.location.reload();
    } catch (error: any) {
      console.error('팀 블로그 생성 오류:', error);
      alert(`팀 블로그 생성 실패: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
      <h3 className="font-medium mb-2">📝 팀 블로그</h3>
      
      {hasBlog ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            팀 블로그가 생성되었습니다! ({meetup.blog?.provider})
          </p>
          <a 
            href={meetup.blog?.url} 
            target="_blank" 
            rel="noreferrer"
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            팀 블로그 열기 →
          </a>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            팀 전용 블로그를 자동으로 생성할 수 있습니다.
          </p>
          <button 
            onClick={createTeamBlog}
            disabled={creating}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? '생성 중...' : '팀 블로그 만들기'}
          </button>
        </div>
      )}
    </div>
  );
}
