// src/components/ProxyTest.tsx
// Vite 프록시 연결 테스트 컴포넌트

import { useState } from 'react';
import { apiClient } from '../lib/apiClient';

export default function ProxyTest() {
  const [testResults, setTestResults] = useState<{
    health: any;
    proxy: any;
    timestamp: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    setTestResults(null);

    try {
      // Health 체크 테스트
      const healthResult = await apiClient.health();
      
      // 프록시 연결 테스트 (커스텀 엔드포인트)
      const proxyResult = await apiClient.get('/test-proxy');

      setTestResults({
        health: healthResult,
        proxy: proxyResult,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('프록시 테스트 에러:', error);
      setTestResults({
        health: { error: 'Health check failed', status: 500 },
        proxy: { error: 'Proxy test failed', status: 500 },
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      padding: '20px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      background: '#f9fafb',
      margin: '20px 0'
    }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#374151' }}>
        🔗 Vite 프록시 연결 테스트
      </h3>
      
      <button
        onClick={runTests}
        disabled={isLoading}
        style={{
          padding: '8px 16px',
          background: isLoading ? '#9ca3af' : '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          marginBottom: '16px'
        }}
      >
        {isLoading ? '테스트 중...' : '프록시 테스트 실행'}
      </button>

      {testResults && (
        <div style={{ fontSize: '14px' }}>
          <div style={{ marginBottom: '12px' }}>
            <strong>테스트 시간:</strong> {testResults.timestamp}
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <strong>Health 체크 결과:</strong>
            <pre style={{
              background: '#f3f4f6',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px',
              margin: '4px 0 0 0'
            }}>
              {JSON.stringify(testResults.health, null, 2)}
            </pre>
          </div>
          
          <div>
            <strong>프록시 연결 결과:</strong>
            <pre style={{
              background: '#f3f4f6',
              padding: '8px',
              borderRadius: '4px',
              fontSize: '12px',
              margin: '4px 0 0 0'
            }}>
              {JSON.stringify(testResults.proxy, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        background: '#eff6ff', 
        borderRadius: '6px',
        fontSize: '12px',
        color: '#1e40af'
      }}>
        <strong>프록시 설정:</strong>
        <br />
        • API: /api → {process.env.VITE_API_PROXY || 'http://127.0.0.1:3000'}
        <br />
        • Functions: /functions → {process.env.VITE_FUNCTIONS_PROXY || 'http://127.0.0.1:5001'}
        <br />
        • 개발 서버: {process.env.VITE_DEV_PORT || '5173'}
      </div>
    </div>
  );
} 