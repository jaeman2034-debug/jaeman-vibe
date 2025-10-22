import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listProducts, filterProducts } from '@/features/market/services/productService';
import type { Product } from '@/shared/types/product';
import { useAuth } from '@/features/auth/AuthContext';
import AdvancedFilters, { FilterOptions } from '@/features/search/components/AdvancedFilters';

export default function Market() {
  const [items, setItems] = useState<Product[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    category: '',
    dong: '',
    priceMin: undefined,
    priceMax: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    listProducts(120).then(setItems).catch(console.error);
  }, []);

  // ?„í„°ë§ëœ ?í’ˆ ëª©ë¡
  const filteredItems = useMemo(() => {
    let filtered = filterProducts(items, {
      searchTerm: filters.searchTerm,
      category: filters.category,
      dong: filters.dong
    });
    
    // ê°€ê²?ë²”ìœ„ ?„í„°
    if (filters.priceMin !== undefined) {
      filtered = filtered.filter(item => item.price && item.price >= filters.priceMin!);
    }
    if (filters.priceMax !== undefined) {
      filtered = filtered.filter(item => item.price && item.price <= filters.priceMax!);
    }
    
    // ? ì§œ ë²”ìœ„ ?„í„°
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(item => {
        const itemDate = item.createdAt?.toDate?.() || new Date(item.createdAt);
        return itemDate >= fromDate;
      });
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filtered = filtered.filter(item => {
        const itemDate = item.createdAt?.toDate?.() || new Date(item.createdAt);
        return itemDate <= toDate;
      });
    }
    
    // ?•ë ¬
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'price':
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        default: // createdAt
          aValue = a.createdAt?.toDate?.() || new Date(a.createdAt);
          bValue = b.createdAt?.toDate?.() || new Date(b.createdAt);
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [items, filters]);

  // ê³ ìœ ??ì¹´í…Œê³ ë¦¬?€ ?‰ì •??ëª©ë¡ ì¶”ì¶œ
  const categories = useMemo(() => {
    const cats = [...new Set(items.map(item => item.category).filter(Boolean))];
    return cats.sort();
  }, [items]);

  const dongs = useMemo(() => {
    const dongList = [...new Set(items.map(item => item.dong).filter(Boolean))];
    return dongList.sort();
  }, [items]);

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      category: '',
      dong: '',
      priceMin: undefined,
      priceMax: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  return (
    <main style={{ padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>?¤í¬ì¸?ë§ˆì¼“</h1>
        <button data-voice-action="new-product" onClick={() => nav('/product/new')} disabled={!user}>+ ???í’ˆ ?±ë¡</button>
      </header>

              {/* ê³ ê¸‰ ê²€??ë°??„í„° */}
        <AdvancedFilters
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories}
          dongs={dongs}
          showPriceFilter={true}
          showDateFilter={true}
        />

        {/* ê²°ê³¼ ê°œìˆ˜ ?œì‹œ */}
        <div style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
          ì´?{filteredItems.length}ê°??í’ˆ (?„ì²´ {items.length}ê°?
        </div>

      {/* ?í’ˆ ëª©ë¡ */}
      {filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
          {items.length === 0 ? '?±ë¡???í’ˆ???†ìŠµ?ˆë‹¤.' : 'ê²€??ì¡°ê±´??ë§ëŠ” ?í’ˆ???†ìŠµ?ˆë‹¤.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {filteredItems.map(p => (
            <Link key={p.id} to={`/product/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 12 }}>
                <div style={{
                  width: '100%', aspectRatio: '1 / 1', borderRadius: 8, overflow: 'hidden',
                  background: '#f2f2f2', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {p.cover ? <img src={p.cover} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                           : <span style={{ color: '#999' }}>No Image</span>}
                </div>
                <div style={{ marginTop: 8, fontWeight: 600 }}>{p.title}</div>
                {typeof p.price === 'number' && <div style={{ color: '#444' }}>{p.price.toLocaleString()} ??/div>}
                {p.category && <div style={{ color: '#666', fontSize: 12 }}>{p.category}</div>}
                {p.dong && <div style={{ color: '#777', fontSize: 12 }}>{p.dong}</div>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
