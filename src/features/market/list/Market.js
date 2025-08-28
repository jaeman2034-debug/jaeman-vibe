import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listProducts, filterProducts } from '@/features/market/services/productService';
import { useAuth } from '@/contexts/AuthContext';
import AdvancedFilters from '@/features/search/components/AdvancedFilters';
export default function Market() {
    const [items, setItems] = useState([]);
    const [filters, setFilters] = useState({
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
    // 필터링된 상품 목록
    const filteredItems = useMemo(() => {
        let filtered = filterProducts(items, {
            searchTerm: filters.searchTerm,
            category: filters.category,
            dong: filters.dong
        });
        // 가격 범위 필터
        if (filters.priceMin !== undefined) {
            filtered = filtered.filter(item => item.price && item.price >= filters.priceMin);
        }
        if (filters.priceMax !== undefined) {
            filtered = filtered.filter(item => item.price && item.price <= filters.priceMax);
        }
        // 날짜 범위 필터
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
        // 정렬
        filtered.sort((a, b) => {
            let aValue, bValue;
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
            }
            else {
                return aValue < bValue ? 1 : -1;
            }
        });
        return filtered;
    }, [items, filters]);
    // 고유한 카테고리와 행정동 목록 추출
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
    return (_jsxs("main", { style: { padding: 24 }, children: [_jsxs("header", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, children: [_jsx("h1", { children: "\uC2A4\uD3EC\uCE20 \uB9C8\uCF13" }), _jsx("button", { "data-voice-action": "new-product", onClick: () => nav('/product/new'), disabled: !user, children: "+ \uC0C8 \uC0C1\uD488 \uB4F1\uB85D" })] }), _jsx(AdvancedFilters, { filters: filters, onFiltersChange: setFilters, categories: categories, dongs: dongs, showPriceFilter: true, showDateFilter: true }), _jsxs("div", { style: { fontSize: 14, color: '#666', marginBottom: 16 }, children: ["\uCD1D ", filteredItems.length, "\uAC1C \uC0C1\uD488 (\uC804\uCCB4 ", items.length, "\uAC1C)"] }), filteredItems.length === 0 ? (_jsx("div", { style: { textAlign: 'center', padding: 40, color: '#666' }, children: items.length === 0 ? '등록된 상품이 없습니다.' : '검색 조건에 맞는 상품이 없습니다.' })) : (_jsx("div", { style: { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }, children: filteredItems.map(p => (_jsx(Link, { to: `/product/${p.id}`, style: { textDecoration: 'none', color: 'inherit' }, children: _jsxs("div", { style: { border: '1px solid #eee', borderRadius: 12, padding: 12 }, children: [_jsx("div", { style: {
                                    width: '100%', aspectRatio: '1 / 1', borderRadius: 8, overflow: 'hidden',
                                    background: '#f2f2f2', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }, children: p.cover ? _jsx("img", { src: p.cover, alt: p.title, style: { width: '100%', height: '100%', objectFit: 'cover' } })
                                    : _jsx("span", { style: { color: '#999' }, children: "No Image" }) }), _jsx("div", { style: { marginTop: 8, fontWeight: 600 }, children: p.title }), typeof p.price === 'number' && _jsxs("div", { style: { color: '#444' }, children: [p.price.toLocaleString(), " \uC6D0"] }), p.category && _jsx("div", { style: { color: '#666', fontSize: 12 }, children: p.category }), p.dong && _jsx("div", { style: { color: '#777', fontSize: 12 }, children: p.dong })] }) }, p.id))) }))] }));
}
