import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listJobs } from '@/features/jobs/services/jobService';
import type { Job } from '@/shared/types/product';
import { useAuth } from '@/features/auth/AuthContext';

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

  // ?�터링된 구직 목록
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 검?�어 ?�터
      if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !(item.desc?.toLowerCase().includes(searchTerm.toLowerCase()))) {
        return false;
      }
      
      // ?�형 ?�터
      if (selectedType && item.type !== selectedType) {
        return false;
      }
      
      // ?�정???�터
      if (selectedDong && item.dong !== selectedDong) {
        return false;
      }
      
      return true;
    });
  }, [items, searchTerm, selectedType, selectedDong]);

  // 고유???�형�??�정??목록 추출
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
      fulltime: '?�규',
      parttime: '?�트',
      coach: '코치',
      etc: '기�?'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <main style={{ padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>구직</h1>
        <button data-voice-action="create-job" onClick={() => nav('/jobs/new')} disabled={!user}>+ 구인 ?�록</button>
      </header>

      {/* 검??�??�터 */}
      <div style={{ marginBottom: 24, display: 'grid', gap: 12 }}>
        {/* 검?�바 */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="검?�어"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' }}
          />
          <button 
            data-voice-action="search"
            onClick={() => {/* 검???�행 */}}
            style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: 6 }}
          >
            검??
          </button>
        </div>

        {/* ?�터 ?�션??*/}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* ?�형 ?�터 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <label style={{ fontSize: 14, fontWeight: 500 }}>?�형:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd' }}
            >
              <option value="">?�체</option>
              {types.map(type => (
                <option key={type} value={type}>{getTypeLabel(type)}</option>
              ))}
            </select>
          </div>

          {/* ?�정???�터 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <label style={{ fontSize: 14, fontWeight: 500 }}>?�정??</label>
            <select
              value={selectedDong}
              onChange={(e) => setSelectedDong(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd' }}
            >
              <option value="">?�체</option>
              {dongs.map(dong => (
                <option key={dong} value={dong}>{dong}</option>
              ))}
            </select>
          </div>

          {/* ?�터 초기??*/}
          {(searchTerm || selectedType || selectedDong) && (
            <button
              onClick={clearFilters}
              style={{ padding: '4px 12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 4, fontSize: 12 }}
            >
              ?�터 초기??
            </button>
          )}
        </div>

        {/* 결과 개수 ?�시 */}
        <div style={{ fontSize: 14, color: '#666' }}>
          �?{filteredItems.length}�?구인 (?�체 {items.length}�?
        </div>
      </div>

      {/* 구직 목록 */}
      {filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          {items.length === 0 ? '?�록??구인 ?�보가 ?�습?�다.' : '검??조건??맞는 구인 ?�보가 ?�습?�다.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {filteredItems.map(j => (
            <Link key={j.id} to={`/jobs/${j.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
                <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 18 }}>{j.title}</div>
                {j.company && <div style={{ color: '#666', marginBottom: 4 }}>?�사: {j.company}</div>}
                <div style={{ color: '#444', marginBottom: 4 }}>?�형: {getTypeLabel(j.type)}</div>
                {(j.salaryMin || j.salaryMax) && (
                  <div style={{ color: '#444', marginBottom: 4 }}>
                    급여: {j.salaryMin ? `${j.salaryMin.toLocaleString()}?? : ''}
                    {j.salaryMin && j.salaryMax ? ' ~ ' : ''}
                    {j.salaryMax ? `${j.salaryMax.toLocaleString()}?? : ''}
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
