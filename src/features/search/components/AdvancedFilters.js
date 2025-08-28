import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
export default function AdvancedFilters({ filters, onFiltersChange, categories, dongs, showPriceFilter = true, showDateFilter = true }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const handleFilterChange = useCallback((key, value) => {
        onFiltersChange({
            ...filters,
            [key]: value
        });
    }, [filters, onFiltersChange]);
    const clearFilters = useCallback(() => {
        onFiltersChange({
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
    }, [onFiltersChange]);
    const hasActiveFilters = filters.searchTerm ||
        filters.category ||
        filters.dong ||
        filters.priceMin ||
        filters.priceMax ||
        filters.dateFrom ||
        filters.dateTo ||
        filters.sortBy !== 'createdAt' ||
        filters.sortOrder !== 'desc';
    return (_jsxs("div", { style: { display: 'grid', gap: 16 }, children: [_jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center' }, children: [_jsx("input", { type: "text", placeholder: "\uAC80\uC0C9\uC5B4\uB97C \uC785\uB825\uD558\uC138\uC694...", value: filters.searchTerm, onChange: (e) => handleFilterChange('searchTerm', e.target.value), style: {
                            flex: 1,
                            padding: '12px 16px',
                            borderRadius: 8,
                            border: '1px solid #ddd',
                            fontSize: 16
                        } }), _jsx("button", { "data-voice-action": "search", onClick: () => { }, style: {
                            padding: '12px 24px',
                            background: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            fontSize: 16,
                            fontWeight: 600,
                            cursor: 'pointer'
                        }, children: "\uAC80\uC0C9" })] }), _jsxs("div", { style: { display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("label", { style: { fontSize: 14, fontWeight: 500 }, children: "\uCE74\uD14C\uACE0\uB9AC:" }), _jsxs("select", { value: filters.category, onChange: (e) => handleFilterChange('category', e.target.value), style: {
                                    padding: '8px 12px',
                                    borderRadius: 6,
                                    border: '1px solid #ddd',
                                    minWidth: 120
                                }, children: [_jsx("option", { value: "", children: "\uC804\uCCB4" }), categories.map(cat => (_jsx("option", { value: cat, children: cat }, cat)))] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("label", { style: { fontSize: 14, fontWeight: 500 }, children: "\uD589\uC815\uB3D9:" }), _jsxs("select", { value: filters.dong, onChange: (e) => handleFilterChange('dong', e.target.value), style: {
                                    padding: '8px 12px',
                                    borderRadius: 6,
                                    border: '1px solid #ddd',
                                    minWidth: 120
                                }, children: [_jsx("option", { value: "", children: "\uC804\uCCB4" }), dongs.map(dong => (_jsx("option", { value: dong, children: dong }, dong)))] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("label", { style: { fontSize: 14, fontWeight: 500 }, children: "\uC815\uB82C:" }), _jsxs("select", { value: filters.sortBy, onChange: (e) => handleFilterChange('sortBy', e.target.value), style: {
                                    padding: '8px 12px',
                                    borderRadius: 6,
                                    border: '1px solid #ddd',
                                    minWidth: 100
                                }, children: [_jsx("option", { value: "createdAt", children: "\uB4F1\uB85D\uC77C" }), _jsx("option", { value: "price", children: "\uAC00\uACA9" }), _jsx("option", { value: "title", children: "\uC81C\uBAA9" })] }), _jsxs("select", { value: filters.sortOrder, onChange: (e) => handleFilterChange('sortOrder', e.target.value), style: {
                                    padding: '8px 12px',
                                    borderRadius: 6,
                                    border: '1px solid #ddd',
                                    minWidth: 80
                                }, children: [_jsx("option", { value: "desc", children: "\uB0B4\uB9BC\uCC28\uC21C" }), _jsx("option", { value: "asc", children: "\uC624\uB984\uCC28\uC21C" })] })] }), _jsx("button", { onClick: () => setIsExpanded(!isExpanded), style: {
                            padding: '8px 16px',
                            background: isExpanded ? '#6c757d' : '#f8f9fa',
                            color: isExpanded ? 'white' : '#333',
                            border: '1px solid #dee2e6',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 14
                        }, children: isExpanded ? '간단히' : '고급' })] }), isExpanded && (_jsxs("div", { style: {
                    display: 'grid',
                    gap: 16,
                    padding: 20,
                    border: '1px solid #e9ecef',
                    borderRadius: 8,
                    backgroundColor: '#f8f9fa'
                }, children: [showPriceFilter && (_jsxs("div", { style: { display: 'grid', gap: 12 }, children: [_jsx("h4", { style: { margin: 0, fontSize: 16, fontWeight: 600 }, children: "\uAC00\uACA9 \uBC94\uC704" }), _jsxs("div", { style: { display: 'flex', gap: 12, alignItems: 'center' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("label", { style: { fontSize: 14 }, children: "\uCD5C\uC18C:" }), _jsx("input", { type: "number", placeholder: "0", value: filters.priceMin || '', onChange: (e) => handleFilterChange('priceMin', e.target.value ? Number(e.target.value) : undefined), style: {
                                                    padding: '8px 12px',
                                                    borderRadius: 6,
                                                    border: '1px solid #ddd',
                                                    width: 120
                                                } }), _jsx("span", { style: { fontSize: 14 }, children: "\uC6D0" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("label", { style: { fontSize: 14 }, children: "\uCD5C\uB300:" }), _jsx("input", { type: "number", placeholder: "\uBB34\uC81C\uD55C", value: filters.priceMax || '', onChange: (e) => handleFilterChange('priceMax', e.target.value ? Number(e.target.value) : undefined), style: {
                                                    padding: '8px 12px',
                                                    borderRadius: 6,
                                                    border: '1px solid #ddd',
                                                    width: 120
                                                } }), _jsx("span", { style: { fontSize: 14 }, children: "\uC6D0" })] })] })] })), showDateFilter && (_jsxs("div", { style: { display: 'grid', gap: 12 }, children: [_jsx("h4", { style: { margin: 0, fontSize: 16, fontWeight: 600 }, children: "\uB4F1\uB85D \uAE30\uAC04" }), _jsxs("div", { style: { display: 'flex', gap: 12, alignItems: 'center' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("label", { style: { fontSize: 14 }, children: "\uC2DC\uC791\uC77C:" }), _jsx("input", { type: "date", value: filters.dateFrom || '', onChange: (e) => handleFilterChange('dateFrom', e.target.value || undefined), style: {
                                                    padding: '8px 12px',
                                                    borderRadius: 6,
                                                    border: '1px solid #ddd'
                                                } })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("label", { style: { fontSize: 14 }, children: "\uC885\uB8CC\uC77C:" }), _jsx("input", { type: "date", value: filters.dateTo || '', onChange: (e) => handleFilterChange('dateTo', e.target.value || undefined), style: {
                                                    padding: '8px 12px',
                                                    borderRadius: 6,
                                                    border: '1px solid #ddd'
                                                } })] })] })] }))] })), hasActiveFilters && (_jsx("div", { style: { display: 'flex', justifyContent: 'center' }, children: _jsx("button", { onClick: clearFilters, style: {
                        padding: '8px 16px',
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 14
                    }, children: "\uBAA8\uB4E0 \uD544\uD130 \uCD08\uAE30\uD654" }) }))] }));
}
