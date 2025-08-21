// src/components/AuthErrorHandler.tsx
// Firebase 인증 오류 처리 및 사용자 안내 컴포넌트

import { useState } from 'react';
import { 
  signInWithEmail, 
  registerWithEmail, 
  formatAuthErrorForUser,
  logAuthError 
} from '../features/auth/authService';

// 사람친화적인 인증 오류 메시지 매핑
const AUTH_MSG: Record<string, string> = {
  'auth/user-not-found': '가입되지 않은 이메일입니다.',
  'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
  'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다.',
  'auth/too-many-requests': '요청이 많습니다. 잠시 후 다시 시도하세요.',
  'auth/network-request-failed': '네트워크 오류입니다. 인터넷 연결을 확인해주세요.',
  'auth/invalid-email': '올바른 이메일 형식이 아닙니다.',
  'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
  'auth/weak-password': '비밀번호가 너무 약합니다. 8자 이상으로 설정해주세요.',
  default: '인증에 실패했습니다. 잠시 후 다시 시도하세요.',
};

function humanize(code?: string) {
  return (code && AUTH_MSG[code]) || `${AUTH_MSG.default}${code ? ` (${code})` : ''}`;
}

export default function AuthErrorHandler() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string>('');
  const [solution, setSolution] = useState<string>('');
  const [severity, setSeverity] = useState<'info' | 'warning' | 'error'>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSolution('');
    setSuccess('');

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
        setSuccess('로그인에 성공했습니다!');
      } else {
        await registerWithEmail(email, password);
        setSuccess('회원가입에 성공했습니다!');
      }
    } catch (error) {
      console.error('[AUTH] Operation failed:', error);
      
      // 상세한 오류 로깅
      logAuthError(isLogin ? 'Email Login' : 'Email Registration', error, { 
        email, 
        isLogin,
        timestamp: new Date().toISOString() 
      });

      // 사용자 친화적 오류 메시지 생성
      const userError = formatAuthErrorForUser(error);
      setError(userError.message);
      setSolution(userError.solution);
      setSeverity(userError.severity);
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorStyle = (severity: 'info' | 'warning' | 'error') => {
    switch (severity) {
      case 'info':
        return { 
          background: '#dbeafe', 
          color: '#1e40af', 
          border: '1px solid #93c5fd',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px'
        };
      case 'warning':
        return { 
          background: '#fef3c7', 
          color: '#92400e', 
          border: '1px solid #fbbf24',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px'
        };
      case 'error':
        return { 
          background: '#fee2e2', 
          color: '#991b1b', 
          border: '1px solid #f87171',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px'
        };
      default:
        return { 
          background: '#f3f4f6', 
          color: '#374151', 
          border: '1px solid #d1d5db',
          padding: '12px',
          borderRadius: '8px',
          marginBottom: '16px'
        };
    }
  };

  const getSuccessStyle = () => ({
    background: '#dcfce7',
    color: '#166534',
    border: '1px solid #86efac',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px'
  });

  return (
    <div style={{
      maxWidth: '400px',
      margin: '0 auto',
      padding: '20px',
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      background: '#fff'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '24px', color: '#374151' }}>
        {isLogin ? '🔐 로그인' : '📝 회원가입'}
      </h2>

      {/* 성공 메시지 */}
      {success && (
        <div style={getSuccessStyle()}>
          ✅ {success}
        </div>
      )}

      {/* 오류 메시지 */}
      {error && (
        <div style={getErrorStyle(severity)}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            {severity === 'info' && 'ℹ️ 정보'}
            {severity === 'warning' && '⚠️ 주의'}
            {severity === 'error' && '❌ 오류'}
            {' '}{error}
          </div>
          {solution && (
            <div style={{ fontSize: '14px', opacity: 0.8 }}>
              💡 {solution}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            이메일
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
            비밀번호
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8자 이상 입력"
            required
            minLength={8}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '14px',
            background: isLoading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            marginBottom: '16px'
          }}
        >
          {isLoading ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
        </button>
      </form>

      {/* 모드 전환 */}
      <div style={{ textAlign: 'center' }}>
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
            setSolution('');
            setSuccess('');
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            cursor: 'pointer',
            textDecoration: 'underline',
            fontSize: '14px'
          }}
        >
          {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
        </button>
      </div>

      {/* 디버깅 정보 */}
      <details style={{ marginTop: '20px', fontSize: '12px', color: '#6b7280' }}>
        <summary style={{ cursor: 'pointer' }}>🔍 디버깅 정보</summary>
        <div style={{ marginTop: '8px', padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
          <div>이메일: {email || '(입력되지 않음)'}</div>
          <div>비밀번호 길이: {password?.length || 0}</div>
          <div>모드: {isLogin ? '로그인' : '회원가입'}</div>
          <div>로딩 상태: {isLoading ? '예' : '아니오'}</div>
          <div>오류 상태: {error ? '예' : '아니오'}</div>
        </div>
      </details>
    </div>
  );
} 