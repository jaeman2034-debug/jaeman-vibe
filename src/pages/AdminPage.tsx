import React, { useEffect, useState } from 'react';
import { isAdmin, requireAdmin } from '@/lib/adminGuard';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [targetUid, setTargetUid] = useState('');
  const [targetRole, setTargetRole] = useState('admin');
  const [result, setResult] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);
  
  const navigate = useNavigate();
  const auth = getAuth();
  const functions = getFunctions();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const adminStatus = await isAdmin();
      setIsAdminUser(adminStatus);
      
      if (adminStatus) {
        const user = auth.currentUser;
        if (user) {
          setUserInfo({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
          });
        }
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Admin check failed:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const grantRole = async () => {
    try {
      await requireAdmin();
      const grantRoleFn = httpsCallable(functions, 'grantRole');
      const result = await grantRoleFn({ uid: targetUid, role: targetRole });
      setResult(JSON.stringify(result.data, null, 2));
    } catch (error: any) {
      setResult(`Error: ${error.message || error}`);
    }
  };

  const revokeRole = async () => {
    try {
      await requireAdmin();
      const revokeRoleFn = httpsCallable(functions, 'revokeRole');
      const result = await revokeRoleFn({ uid: targetUid, role: targetRole });
      setResult(JSON.stringify(result.data, null, 2));
    } catch (error: any) {
      setResult(`Error: ${error.message || error}`);
    }
  };

  const checkUserClaims = async () => {
    try {
      await requireAdmin();
      const getUserClaimsFn = httpsCallable(functions, 'getUserClaims');
      const result = await getUserClaimsFn({ uid: targetUid });
      setResult(JSON.stringify(result.data, null, 2));
    } catch (error: any) {
      setResult(`Error: ${error.message || error}`);
    }
  };

  const getMyRoles = async () => {
    try {
      const getRolesFn = httpsCallable(functions, 'getRoles');
      const result = await getRolesFn();
      setResult(JSON.stringify(result.data, null, 2));
    } catch (error: any) {
      setResult(`Error: ${error.message || error}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">권한 확인 중...</p>
        </div>
      </div>
    );
  }

  if (!isAdminUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">접근 권한 없음</h1>
          <p className="text-gray-600">이 페이지는 관리자만 접근할 수 있습니다.</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">관리자 대시보드</h1>
          
          {userInfo && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">현재 사용자 정보</h2>
              <p><strong>UID:</strong> {userInfo.uid}</p>
              <p><strong>Email:</strong> {userInfo.email || 'N/A'}</p>
              <p><strong>Display Name:</strong> {userInfo.displayName || 'N/A'}</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">역할 관리</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  대상 사용자 UID
                </label>
                <input
                  type="text"
                  value={targetUid}
                  onChange={(e) => setTargetUid(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="사용자 UID 입력"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  역할
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="admin">admin</option>
                  <option value="moderator">moderator</option>
                  <option value="staff">staff</option>
                </select>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={grantRole}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  역할 부여
                </button>
                <button
                  onClick={revokeRole}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  역할 회수
                </button>
                <button
                  onClick={checkUserClaims}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  사용자 정보 조회
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">시스템 정보</h2>
              
              <button
                onClick={getMyRoles}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                내 역할 조회
              </button>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">부트스트랩 가이드</h3>
                <p className="text-sm text-yellow-700 mb-2">
                  최초 관리자 설정을 위해서는 다음 명령어를 사용하세요:
                </p>
                <code className="block bg-yellow-100 p-2 rounded text-xs">
                  {`curl -XPOST $FN/bootstrapAdmin \\
                  &nbsp;&nbsp;-H "x-internal-key: $INTERNAL_KEY" \\
                  &nbsp;&nbsp;-H "Content-Type: application/json" \\
                  &nbsp;&nbsp;-d '{"uid":"YOUR_UID"}'`}
                </code>
              </div>
            </div>
          </div>

          {result && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">결과</h3>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                {result}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}