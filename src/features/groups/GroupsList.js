import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listGroups } from '@/features/groups/services/groupService';
import { useAuth } from '@/contexts/AuthContext';
export default function GroupsList() {
    const [items, setItems] = useState([]);
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
            // 행정동 필터
            if (selectedDong && item.dong !== selectedDong) {
                return false;
            }
            return true;
        });
    }, [items, searchTerm, selectedCategory, selectedDong]);
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
        setSearchTerm('');
        setSelectedCategory('');
        setSelectedDong('');
    };
    return (_jsxs("main", { style: { padding: 24 }, children: [_jsxs("header", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, children: [_jsx("h1", { children: "\uBAA8\uC784" }), _jsx("button", { "data-voice-action": "create-group", onClick: () => nav('/groups/new'), disabled: !user, children: "+ \uC0C8 \uBAA8\uC784 \uB9CC\uB4E4\uAE30" })] }), _jsxs("div", { style: { marginBottom: 24, display: 'grid', gap: 12 }, children: [_jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center' }, children: [_jsx("input", { type: "text", placeholder: "\uAC80\uC0C9\uC5B4", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), style: { flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' } }), _jsx("button", { "data-voice-action": "search", onClick: () => { }, style: { padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: 6 }, children: "\uAC80\uC0C9" })] }), _jsxs("div", { style: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx("label", { style: { fontSize: 14, fontWeight: 500 }, children: "\uCE74\uD14C\uACE0\uB9AC:" }), _jsxs("select", { value: selectedCategory, onChange: (e) => setSelectedCategory(e.target.value), style: { padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd' }, children: [_jsx("option", { value: "", children: "\uC804\uCCB4" }), categories.map(cat => (_jsx("option", { value: cat, children: cat }, cat)))] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx("label", { style: { fontSize: 14, fontWeight: 500 }, children: "\uD589\uC815\uB3D9:" }), _jsxs("select", { value: selectedDong, onChange: (e) => setSelectedDong(e.target.value), style: { padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd' }, children: [_jsx("option", { value: "", children: "\uC804\uCCB4" }), dongs.map(dong => (_jsx("option", { value: dong, children: dong }, dong)))] })] }), (searchTerm || selectedCategory || selectedDong) && (_jsx("button", { onClick: clearFilters, style: { padding: '4px 12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 4, fontSize: 12 }, children: "\uD544\uD130 \uCD08\uAE30\uD654" }))] }), _jsxs("div", { style: { fontSize: 14, color: '#666' }, children: ["\uCD1D ", filteredItems.length, "\uAC1C \uBAA8\uC784 (\uC804\uCCB4 ", items.length, "\uAC1C)"] })] }), filteredItems.length === 0 ? (_jsx("div", { style: { textAlign: 'center', padding: 40, color: '#666' }, children: items.length === 0 ? '등록된 모임이 없습니다.' : '검색 조건에 맞는 모임이 없습니다.' })) : (_jsx("div", { style: { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }, children: filteredItems.map(g => (_jsx(Link, { to: `/groups/${g.id}`, style: { textDecoration: 'none', color: 'inherit' }, children: _jsxs("div", { style: { border: '1px solid #eee', borderRadius: 12, padding: 16 }, children: [_jsx("div", { style: { marginBottom: 8, fontWeight: 600, fontSize: 18 }, children: g.title }), g.category && _jsxs("div", { style: { color: '#666', marginBottom: 4 }, children: ["\uCE74\uD14C\uACE0\uB9AC: ", g.category] }), g.maxMembers && (_jsxs("div", { style: { color: '#444', marginBottom: 4 }, children: ["\uC778\uC6D0: ", g.currentMembers || 0, "/", g.maxMembers, "\uBA85"] })), g.dong && _jsx("div", { style: { color: '#777', fontSize: 12 }, children: g.dong }), g.desc && (_jsx("div", { style: { color: '#555', fontSize: 14, marginTop: 8, lineHeight: 1.4 }, children: g.desc.length > 100 ? `${g.desc.substring(0, 100)}...` : g.desc }))] }) }, g.id))) }))] }));
}
