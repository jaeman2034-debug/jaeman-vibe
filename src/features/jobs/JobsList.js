import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listJobs } from '@/features/jobs/services/jobService';
import { useAuth } from '@/contexts/AuthContext';
export default function JobsList() {
    const [items, setItems] = useState([]);
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
    const getTypeLabel = (type) => {
        const labels = {
            fulltime: '정규',
            parttime: '파트',
            coach: '코치',
            etc: '기타'
        };
        return labels[type] || type;
    };
    return (_jsxs("main", { style: { padding: 24 }, children: [_jsxs("header", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, children: [_jsx("h1", { children: "\uAD6C\uC9C1" }), _jsx("button", { "data-voice-action": "create-job", onClick: () => nav('/jobs/new'), disabled: !user, children: "+ \uAD6C\uC778 \uB4F1\uB85D" })] }), _jsxs("div", { style: { marginBottom: 24, display: 'grid', gap: 12 }, children: [_jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center' }, children: [_jsx("input", { type: "text", placeholder: "\uAC80\uC0C9\uC5B4", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), style: { flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd' } }), _jsx("button", { "data-voice-action": "search", onClick: () => { }, style: { padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: 6 }, children: "\uAC80\uC0C9" })] }), _jsxs("div", { style: { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx("label", { style: { fontSize: 14, fontWeight: 500 }, children: "\uC720\uD615:" }), _jsxs("select", { value: selectedType, onChange: (e) => setSelectedType(e.target.value), style: { padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd' }, children: [_jsx("option", { value: "", children: "\uC804\uCCB4" }), types.map(type => (_jsx("option", { value: type, children: getTypeLabel(type) }, type)))] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 4 }, children: [_jsx("label", { style: { fontSize: 14, fontWeight: 500 }, children: "\uD589\uC815\uB3D9:" }), _jsxs("select", { value: selectedDong, onChange: (e) => setSelectedDong(e.target.value), style: { padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd' }, children: [_jsx("option", { value: "", children: "\uC804\uCCB4" }), dongs.map(dong => (_jsx("option", { value: dong, children: dong }, dong)))] })] }), (searchTerm || selectedType || selectedDong) && (_jsx("button", { onClick: clearFilters, style: { padding: '4px 12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 4, fontSize: 12 }, children: "\uD544\uD130 \uCD08\uAE30\uD654" }))] }), _jsxs("div", { style: { fontSize: 14, color: '#666' }, children: ["\uCD1D ", filteredItems.length, "\uAC1C \uAD6C\uC778 (\uC804\uCCB4 ", items.length, "\uAC1C)"] })] }), filteredItems.length === 0 ? (_jsx("div", { style: { textAlign: 'center', padding: 40, color: '#666' }, children: items.length === 0 ? '등록된 구인 정보가 없습니다.' : '검색 조건에 맞는 구인 정보가 없습니다.' })) : (_jsx("div", { style: { display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }, children: filteredItems.map(j => (_jsx(Link, { to: `/jobs/${j.id}`, style: { textDecoration: 'none', color: 'inherit' }, children: _jsxs("div", { style: { border: '1px solid #eee', borderRadius: 12, padding: 16 }, children: [_jsx("div", { style: { marginBottom: 8, fontWeight: 600, fontSize: 18 }, children: j.title }), j.company && _jsxs("div", { style: { color: '#666', marginBottom: 4 }, children: ["\uD68C\uC0AC: ", j.company] }), _jsxs("div", { style: { color: '#444', marginBottom: 4 }, children: ["\uC720\uD615: ", getTypeLabel(j.type)] }), (j.salaryMin || j.salaryMax) && (_jsxs("div", { style: { color: '#444', marginBottom: 4 }, children: ["\uAE09\uC5EC: ", j.salaryMin ? `${j.salaryMin.toLocaleString()}원` : '', j.salaryMin && j.salaryMax ? ' ~ ' : '', j.salaryMax ? `${j.salaryMax.toLocaleString()}원` : ''] })), j.dong && _jsx("div", { style: { color: '#777', fontSize: 12 }, children: j.dong }), j.desc && (_jsx("div", { style: { color: '#555', fontSize: 14, marginTop: 8, lineHeight: 1.4 }, children: j.desc.length > 100 ? `${j.desc.substring(0, 100)}...` : j.desc }))] }) }, j.id))) }))] }));
}
