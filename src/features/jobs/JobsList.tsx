import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listJobs } from '@/features/jobs/services/jobService';
import type { Job } from '@/shared/types/product';
import { useAuth } from '@/contexts/AuthContext';

export default function JobsList() {
  const [items, setItems] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedDong, setSelectedDong] = useState('');
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    listJobs(120).then(setItems).catch(console.error);
  }, []);

  // 필터링된 구직 목록
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 검색어 필터
      if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !(item.desc?.toLowerCase().includes(searchTerm.toLowerCase()))) {
        return false;
      }
      
      // 유형 필터
      if (selectedType && item.type !== selectedType) {
        return false;
      }
      
      // 행정동 필터
      if (selectedDong && item.dong !== selectedDong) {
        return false;
      }
      
      return true;
    });
  }, [items, searchTerm, selectedType, selectedDong]);

  // 고유한 유형과 행정동 목록 추출
  const types = useMemo(() => {
    const typeList = [...new Set(items.map(item => item.type))];
    return typeList.sort();
  }, [items]);

  const dongs = useMemo(() => {
    const dongList = [...new Set(items.map(item => item.dong).filter(Boolean))];
    return dongList.sort();
  }, [items]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedDong('');
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      fulltime: '정규',
      parttime: '파트',
      coach: '코치',
      etc: '기타'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <main style={{ padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>구직</h1>
        <button data-voice-action="create-job" onClick={() => nav('/jobs/new')} disabled={!user}>+ 구인 등록</button>
      </header>

      {/* 검색 및 필터 */}
      <div style={{ marginBottom: 24, display: 'grid', gap: 12 }}>
        {/* 검색바 */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="검색어"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          />
          <button 
            data-voice-action="search"
            onClick={() => {/* 검색 실행 */}}
            style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: 6 }}
          >
            검색
          </button>
        </div>

        {/* 필터 옵션들 */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* 유형 필터 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <label style={{ fontSize: 14, fontWeight: 500 }}>유형:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd' }}
            >
              <option value="">전체</option>
              {types.map(type => (
                <option key={type} value={type}>{getTypeLabel(type)}</option>
              ))}
            </select>
          </div>

          {/* 행정동 필터 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <label style={{ fontSize: 14, fontWeight: 500 }}>행정동:</label>
            <select
              value={selectedDong}
              onChange={(e) => setSelectedDong(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd' }}
            >
              <option value="">전체</option>
              {dongs.map(dong => (
                <option key={dong} value={dong}>{dong}</option>
              ))}
            </select>
          </div>

          {/* 필터 초기화 */}
          {(searchTerm || selectedType || selectedDong) && (
            <button
              onClick={clearFilters}
              style={{ padding: '4px 12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 4, fontSize: 12 }}
            >
              필터 초기화
            </button>
          )}
        </div>

        {/* 결과 개수 표시 */}
        <div style={{ fontSize: 14, color: '#666' }}>
          총 {filteredItems.length}개 구인 (전체 {items.length}개)
        </div>
      </div>

      {/* 구직 목록 */}
      {filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          {items.length === 0 ? '등록된 구인 정보가 없습니다.' : '검색 조건에 맞는 구인 정보가 없습니다.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {filteredItems.map(j => (
            <Link key={j.id} to={`/jobs/${j.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
                <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 18 }}>{j.title}</div>
                {j.company && <div style={{ color: '#666', marginBottom: 4 }}>회사: {j.company}</div>}
                <div style={{ color: '#444', marginBottom: 4 }}>유형: {getTypeLabel(j.type)}</div>
                {(j.salaryMin || j.salaryMax) && (
                  <div style={{ color: '#444', marginBottom: 4 }}>
                    급여: {j.salaryMin ? `${j.salaryMin.toLocaleString()}원` : ''}
                    {j.salaryMin && j.salaryMax ? ' ~ ' : ''}
                    {j.salaryMax ? `${j.salaryMax.toLocaleString()}원` : ''}
                  </div>
                )}
                {j.dong && <div style={{ color: '#777', fontSize: 12 }}>{j.dong}</div>}
                {j.desc && (
                  <div style={{ color: '#555', fontSize: 14, marginTop: 8, lineHeight: 1.4 }}>
                    {j.desc.length > 100 ? `${j.desc.substring(0, 100)}...` : j.desc}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
