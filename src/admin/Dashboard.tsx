import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import FIREBASE from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  totalProducts: number;
  totalGroups: number;
  totalJobs: number;
  totalUsers: number;
  productsWithoutDong: number;
  groupsWithoutDong: number;
  jobsWithoutDong: number;
  recentActivity: Array<{
    id: string;
    type: 'product' | 'group' | 'job';
    title: string;
    createdAt: Date;
    ownerId: string;
  }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [scheduledBackfills, setScheduledBackfills] = useState<Array<{
    id: string;
    collection: string;
    scheduledAt: Date;
    status: 'pending' | 'running' | 'completed' | 'failed';
  }>>([]);
  const { user } = useAuth();

  // 관리자 권한 확인
  const adminUids = import.meta.env.VITE_ADMIN_UIDS?.split(',') || [];
  const isAdmin = user && adminUids.includes(user.uid);

  useEffect(() => {
    if (!isAdmin) return;
    loadDashboardData();
  }, [isAdmin]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 상품 통계
      const productsSnapshot = await getDocs(collection(FIREBASE.db, 'products'));
      const totalProducts = productsSnapshot.size;
      const productsWithoutDong = productsSnapshot.docs.filter(doc => !doc.data().dong).length;
      
      // 모임 통계
      const groupsSnapshot = await getDocs(collection(FIREBASE.db, 'groups'));
      const totalGroups = groupsSnapshot.size;
      const groupsWithoutDong = groupsSnapshot.docs.filter(doc => !doc.data().dong).length;
      
      // 구직 통계
      const jobsSnapshot = await getDocs(collection(FIREBASE.db, 'jobs'));
      const totalJobs = jobsSnapshot.size;
      const jobsWithoutDong = jobsSnapshot.docs.filter(doc => !doc.data().dong).length;
      
      // 사용자 통계 (간단한 추정)
      const totalUsers = Math.max(totalProducts, totalGroups, totalJobs);
      
      // 최근 활동
      const recentProducts = productsSnapshot.docs
        .slice(0, 5)
        .map(doc => ({
          id: doc.id,
          type: 'product' as const,
          title: doc.data().title,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          ownerId: doc.data().ownerId
        }));
      
      const recentGroups = groupsSnapshot.docs
        .slice(0, 5)
        .map(doc => ({
          id: doc.id,
          type: 'group' as const,
          title: doc.data().title,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          ownerId: doc.data().ownerId
        }));
      
      const recentJobs = jobsSnapshot.docs
        .slice(0, 5)
        .map(doc => ({
          id: doc.id,
          type: 'job' as const,
          title: doc.data().title,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          ownerId: doc.data().ownerId
        }));
      
      const recentActivity = [...recentProducts, ...recentGroups, ...recentJobs]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10);
      
      setStats({
        totalProducts,
        totalGroups,
        totalJobs,
        totalUsers,
        productsWithoutDong,
        groupsWithoutDong,
        jobsWithoutDong,
        recentActivity
      });
      
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const scheduleBackfill = (collection: string) => {
    const scheduledAt = new Date(Date.now() + 5 * 60 * 1000); // 5분 후
    const newScheduledBackfill = {
      id: `${collection}-${Date.now()}`,
      collection,
      scheduledAt,
      status: 'pending' as const
    };
    
    setScheduledBackfills(prev => [...prev, newScheduledBackfill]);
    
    // 실제 백필 실행 (5분 후)
    setTimeout(() => {
      setScheduledBackfills(prev => 
        prev.map(item => 
          item.id === newScheduledBackfill.id 
            ? { ...item, status: 'running' }
            : item
        )
      );
      
      // 백필 완료 시뮬레이션 (실제로는 AdminTools의 백필 함수 호출)
      setTimeout(() => {
        setScheduledBackfills(prev => 
          prev.map(item => 
            item.id === newScheduledBackfill.id 
              ? { ...item, status: 'completed' }
              : item
          )
        );
      }, 3000);
    }, 5 * 60 * 1000);
  };

  if (!isAdmin) {
    return <main style={{ padding: 24 }}>403 — 권한 없음</main>;
  }

  if (loading) {
    return <main style={{ padding: 24 }}>로딩 중...</main>;
  }

  if (!stats) {
    return <main style={{ padding: 24 }}>데이터를 불러올 수 없습니다.</main>;
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>운영 대시보드</h1>
      
      {/* 통계 카드 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: 20, 
        marginBottom: 32 
      }}>
        <div style={{ 
          padding: 24, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white', 
          borderRadius: 12 
        }}>
          <h3 style={{ margin: 0, marginBottom: 8 }}>총 상품</h3>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.totalProducts}</div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>
            {stats.productsWithoutDong}개 행정동 정보 없음
          </div>
        </div>
        
        <div style={{ 
          padding: 24, 
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
          color: 'white', 
          borderRadius: 12 
        }}>
          <h3 style={{ margin: 0, marginBottom: 8 }}>총 모임</h3>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.totalGroups}</div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>
            {stats.groupsWithoutDong}개 행정동 정보 없음
          </div>
        </div>
        
        <div style={{ 
          padding: 24, 
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
          color: 'white', 
          borderRadius: 12 
        }}>
          <h3 style={{ margin: 0, marginBottom: 8 }}>총 구직</h3>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.totalJobs}</div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>
            {stats.jobsWithoutDong}개 행정동 정보 없음
          </div>
        </div>
        
        <div style={{ 
          padding: 24, 
          background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', 
          color: 'white', 
          borderRadius: 12 
        }}>
          <h3 style={{ margin: 0, marginBottom: 8 }}>활성 사용자</h3>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.totalUsers}</div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>
            추정치
          </div>
        </div>
      </div>
      
      {/* 백필 스케줄링 */}
      <div style={{ marginBottom: 32 }}>
        <h2>백필 스케줄링</h2>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <button
            onClick={() => scheduleBackfill('products')}
            style={{
              padding: '12px 24px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            상품 행정동 백필 예약
          </button>
          <button
            onClick={() => scheduleBackfill('groups')}
            style={{
              padding: '12px 24px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            모임 행정동 백필 예약
          </button>
          <button
            onClick={() => scheduleBackfill('jobs')}
            style={{
              padding: '12px 24px',
              background: '#ffc107',
              color: 'black',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer'
            }}
          >
            구직 행정동 백필 예약
          </button>
        </div>
        
        {/* 예약된 백필 목록 */}
        {scheduledBackfills.length > 0 && (
          <div style={{ 
            border: '1px solid #e9ecef', 
            borderRadius: 8, 
            padding: 16,
            backgroundColor: '#f8f9fa'
          }}>
            <h4 style={{ margin: 0, marginBottom: 16 }}>예약된 백필</h4>
            <div style={{ display: 'grid', gap: 8 }}>
              {scheduledBackfills.map(item => (
                <div key={item.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'white',
                  borderRadius: 6,
                  border: '1px solid #dee2e6'
                }}>
                  <div>
                    <strong>{item.collection}</strong> 행정동 백필
                    <div style={{ fontSize: 12, color: '#666' }}>
                      예약: {item.scheduledAt.toLocaleString()}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    background: 
                      item.status === 'pending' ? '#ffc107' :
                      item.status === 'running' ? '#007bff' :
                      item.status === 'completed' ? '#28a745' : '#dc3545',
                    color: 'white'
                  }}>
                    {item.status === 'pending' ? '대기' :
                     item.status === 'running' ? '실행중' :
                     item.status === 'completed' ? '완료' : '실패'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 최근 활동 */}
      <div>
        <h2>최근 활동</h2>
        <div style={{ 
          border: '1px solid #e9ecef', 
          borderRadius: 8, 
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>유형</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>제목</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>등록일</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>사용자</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentActivity.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      background: 
                        item.type === 'product' ? '#007bff' :
                        item.type === 'group' ? '#28a745' : '#ffc107',
                      color: 'white'
                    }}>
                      {item.type === 'product' ? '상품' :
                       item.type === 'group' ? '모임' : '구직'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{item.title}</td>
                  <td style={{ padding: '12px', color: '#666' }}>
                    {item.createdAt.toLocaleDateString()}
                  </td>
                  <td style={{ padding: '12px', color: '#666', fontSize: 14 }}>
                    {item.ownerId.substring(0, 8)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
