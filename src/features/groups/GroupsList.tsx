import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listGroups } from '@/features/groups/services/groupService';
import type { Group } from '@/shared/types/product';
import { useAuth } from '@/features/auth/AuthContext';

export default function GroupsList() {
  const [items, setItems] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDong, setSelectedDong] = useState('');
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    listGroups(120).then(setItems).catch(console.error);
  }, []);

  // 필터링된 모임 목록
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // 검색어 필터
      if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !(item.desc?.toLowerCase().includes(searchTerm.toLowerCase()))) {
        return false;
      }
      
      // 카테고리 필터
      if (selectedCategory && item.category !== selectedCategory) {
        return false;
      }
      
      // 동네 필터
      if (selectedDong && item.dong !== selectedDong) {
        return false;
      }
      
      return true;
    });
  }, [items, searchTerm, selectedCategory, selectedDong]);

  // 고유한 카테고리와 동네 목록 추출
  const categories = useMemo(() => {
    const cats = [...new Set(items.map(item => item.category).filter(Boolean))];
    return cats.sort();
  }, [items]);

  const dongs = useMemo(() => {
    const dongList = [...new Set(items.map(item => item.dong).filter(Boolean))];
    return dongList.sort();
  }, [items]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedDong('');
  };

  return (
    <main style={{ padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>모임</h1>
        <button 
          data-voice-action="create-group" 
          onClick={() => nav('/groups/new')} 
          disabled={!user}
          style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: 6 }}
        >
          + 새 모임 만들기
        </button>
      </header>

      {/* 검색 필터 */}
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
          {/* 카테고리 필터 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <label style={{ fontSize: 14, fontWeight: 500 }}>카테고리:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd' }}
            >
              <option value="">전체</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* 동네 필터 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <label style={{ fontSize: 14, fontWeight: 500 }}>동네:</label>
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
          {(searchTerm || selectedCategory || selectedDong) && (
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
          총 {filteredItems.length}개 모임 (전체 {items.length}개)
        </div>
      </div>

      {/* 모임 목록 */}
      {filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          {items.length === 0 ? '등록된 모임이 없습니다.' : '검색 조건에 맞는 모임이 없습니다.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {filteredItems.map(g => (
            <Link key={g.id} to={`/groups/${g.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
                <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 18 }}>{g.title}</div>
                {g.category && <div style={{ color: '#666', marginBottom: 4 }}>카테고리: {g.category}</div>}
                {g.maxMembers && (
                  <div style={{ color: '#444', marginBottom: 4 }}>
                    멤버: {g.currentMembers || 0}/{g.maxMembers}명
                  </div>
                )}
                {g.dong && <div style={{ color: '#777', fontSize: 12 }}>{g.dong}</div>}
                {g.desc && (
                  <div style={{ color: '#555', fontSize: 14, marginTop: 8, lineHeight: 1.4 }}>
                    {g.desc.length > 100 ? `${g.desc.substring(0, 100)}...` : g.desc}
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