import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileEditPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    gender: '',
    birthdate: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 기존 프로필 로드
    if (user) {
      // Firebase에서 사용자 프로필 로드
      // 실제 구현에서는 Firebase SDK를 사용하여 로드
      setLoading(false);
    }
  }, [user]);

  async function save() {
    if (!user) return;
    setSaving(true);
    try {
      const idToken = await user.getIdToken();
      const response = await fetch('/api/me/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify(profile)
      });
      
      if (response.ok) {
        alert('프로필이 저장되었습니다');
      } else {
        alert('저장에 실패했습니다');
      }
    } catch (error) {
      console.error('Profile save error:', error);
      alert('저장 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-4">로딩 중...</div>;
  }

  return (
    <div className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-2xl font-bold">프로필 편집</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">성별</label>
          <select
            className="w-full px-3 py-2 border rounded-lg"
            value={profile.gender}
            onChange={e => setProfile(prev => ({ ...prev, gender: e.target.value }))}
          >
            <option value="">선택하세요</option>
            <option value="female">여성</option>
            <option value="male">남성</option>
            <option value="other">기타</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">생년월일</label>
          <input
            type="date"
            className="w-full px-3 py-2 border rounded-lg"
            value={profile.birthdate}
            onChange={e => setProfile(prev => ({ ...prev, birthdate: e.target.value }))}
          />
          <p className="text-xs text-gray-500 mt-1">
            일부 모임의 참가 자격 확인에 사용됩니다
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:opacity-90 disabled:opacity-50"
          onClick={save}
          disabled={saving}
        >
          {saving ? '저장 중...' : '저장'}
        </button>
        <button
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          onClick={() => window.history.back()}
        >
          취소
        </button>
      </div>
    </div>
  );
}
