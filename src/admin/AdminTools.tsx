import { useEffect, useState } from 'react';
import { listProducts } from '@/features/market/services/productService';
import { listGroups } from '@/features/groups/services/groupService';
import { listJobs } from '@/features/jobs/services/jobService';
import { autoCorrectDong } from '@/features/location/services/locationService';
import type { Product, Group, Job } from '@/shared/types/product';
import { useAuth } from '@/contexts/AuthContext';

type TabType = 'products' | 'groups' | 'jobs';

export default function AdminTools() {
  const [activeTab, setActiveTab] = useState<TabType>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => { 
    listProducts(120).then(setProducts).catch(console.error); 
  }, []);

  useEffect(() => { 
    listGroups(120).then(setGroups).catch(console.error); 
  }, []);

  useEffect(() => { 
    listJobs(120).then(setJobs).catch(console.error); 
  }, []);

  // 관리자 권한 확인
  const adminUids = import.meta.env.VITE_ADMIN_UIDS?.split(',') || [];
  const allow = user && adminUids.includes(user.uid);

  if (!allow) return <main style={{ padding: 24 }}>403 — 권한 없음</main>;

  const push = (s: string) => setLog(prev => [s, ...prev].slice(0, 200));

  const getCurrentItems = () => {
    switch (activeTab) {
      case 'products': return products;
      case 'groups': return groups;
      case 'jobs': return jobs;
      default: return [];
    }
  };

  const getCurrentCollection = () => {
    switch (activeTab) {
      case 'products': return 'products';
      case 'groups': return 'groups';
      case 'jobs': return 'jobs';
      default: return 'products';
    }
  };

  const runBackfillDongCurrent = async () => {
    const items = getCurrentItems();
    const collection = getCurrentCollection();
    
    push(`${collection} 행정동 백필 시작`);
    
    for (const item of items) {
      if (!item.dong && item.loc) { 
        await autoCorrectDong(collection, item.id, item.loc); 
        push(`dong 채움 시도: ${item.id}`);
        
        // 350ms 간격으로 실행
        await new Promise(resolve => setTimeout(resolve, 350));
      }
    }
    push(`${collection} 행정동 백필 완료`);
  };

  const renderItems = () => {
    const items = getCurrentItems();
    
    return (
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {items.map(item => (
          <div key={item.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12 }}>
            <div style={{ fontWeight: 600 }}>{item.title}</div>
            <div style={{ color: '#777', fontSize: 12 }}>{item.id}</div>
            <div style={{ color: '#555' }}>{item.dong ?? 'dong 없음'}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <main style={{ padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Admin Tools</h1>
        <Link 
          to="/admin/dashboard" 
          style={{
            padding: '8px 16px',
            background: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: 6,
            fontSize: 14
          }}
        >
          대시보드
        </Link>
      </header>
      
      {/* 탭 시스템 */}
      <div style={{ display: 'flex', gap: 8, margin: '12px 0', borderBottom: '1px solid #eee' }}>
        <button 
          onClick={() => setActiveTab('products')}
          style={{ 
            padding: '8px 16px', 
            background: activeTab === 'products' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'products' ? 'white' : '#333',
            border: '1px solid #dee2e6',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer'
          }}
        >
          상품 ({products.length})
        </button>
        <button 
          onClick={() => setActiveTab('groups')}
          style={{ 
            padding: '8px 16px', 
            background: activeTab === 'groups' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'groups' ? 'white' : '#333',
            border: '1px solid #dee2e6',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer'
          }}
        >
          모임 ({groups.length})
        </button>
        <button 
          onClick={() => setActiveTab('jobs')}
          style={{ 
            padding: '8px 16px', 
            background: activeTab === 'jobs' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'jobs' ? 'white' : '#333',
            border: '1px solid #dee2e6',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer'
          }}
        >
          구직 ({jobs.length})
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <button onClick={runBackfillDongCurrent}>
          현재 탭 행정동 백필
        </button>
        <button onClick={() => navigator.clipboard.writeText(JSON.stringify(getCurrentItems().map(i => i.id)))}>
          현재 탭 ID 복사
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <div>
          <h3>{activeTab === 'products' ? '상품' : activeTab === 'groups' ? '모임' : '구직'} 미리보기({getCurrentItems().length})</h3>
          {renderItems()}
        </div>
        
        <div>
          <h3>로그</h3>
          <pre style={{ background: '#111', color: '#0f0', minHeight: 200, padding: 12, borderRadius: 8 }}>
            {log.join('\n')}
          </pre>
        </div>
      </div>
    </main>
  );
}
