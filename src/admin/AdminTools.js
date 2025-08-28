import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { listProducts } from '@/features/market/services/productService';
import { listGroups } from '@/features/groups/services/groupService';
import { listJobs } from '@/features/jobs/services/jobService';
import { autoCorrectDong } from '@/features/location/services/locationService';
import { useAuth } from '@/contexts/AuthContext';
export default function AdminTools() {
    const [activeTab, setActiveTab] = useState('products');
    const [products, setProducts] = useState([]);
    const [groups, setGroups] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [log, setLog] = useState([]);
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
    if (!allow)
        return _jsx("main", { style: { padding: 24 }, children: "403 \u2014 \uAD8C\uD55C \uC5C6\uC74C" });
    const push = (s) => setLog(prev => [s, ...prev].slice(0, 200));
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
        return (_jsx("div", { style: { display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }, children: items.map(item => (_jsxs("div", { style: { border: '1px solid #eee', borderRadius: 12, padding: 12 }, children: [_jsx("div", { style: { fontWeight: 600 }, children: item.title }), _jsx("div", { style: { color: '#777', fontSize: 12 }, children: item.id }), _jsx("div", { style: { color: '#555' }, children: item.dong ?? 'dong 없음' })] }, item.id))) }));
    };
    return (_jsxs("main", { style: { padding: 24 }, children: [_jsxs("header", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }, children: [_jsx("h1", { children: "Admin Tools" }), _jsx(Link, { to: "/admin/dashboard", style: {
                            padding: '8px 16px',
                            background: '#007bff',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: 6,
                            fontSize: 14
                        }, children: "\uB300\uC2DC\uBCF4\uB4DC" })] }), _jsxs("div", { style: { display: 'flex', gap: 8, margin: '12px 0', borderBottom: '1px solid #eee' }, children: [_jsxs("button", { onClick: () => setActiveTab('products'), style: {
                            padding: '8px 16px',
                            background: activeTab === 'products' ? '#007bff' : '#f8f9fa',
                            color: activeTab === 'products' ? 'white' : '#333',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px 4px 0 0',
                            cursor: 'pointer'
                        }, children: ["\uC0C1\uD488 (", products.length, ")"] }), _jsxs("button", { onClick: () => setActiveTab('groups'), style: {
                            padding: '8px 16px',
                            background: activeTab === 'groups' ? '#007bff' : '#f8f9fa',
                            color: activeTab === 'groups' ? 'white' : '#333',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px 4px 0 0',
                            cursor: 'pointer'
                        }, children: ["\uBAA8\uC784 (", groups.length, ")"] }), _jsxs("button", { onClick: () => setActiveTab('jobs'), style: {
                            padding: '8px 16px',
                            background: activeTab === 'jobs' ? '#007bff' : '#f8f9fa',
                            color: activeTab === 'jobs' ? 'white' : '#333',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px 4px 0 0',
                            cursor: 'pointer'
                        }, children: ["\uAD6C\uC9C1 (", jobs.length, ")"] })] }), _jsxs("div", { style: { display: 'flex', gap: 8, margin: '12px 0' }, children: [_jsx("button", { onClick: runBackfillDongCurrent, children: "\uD604\uC7AC \uD0ED \uD589\uC815\uB3D9 \uBC31\uD544" }), _jsx("button", { onClick: () => navigator.clipboard.writeText(JSON.stringify(getCurrentItems().map(i => i.id))), children: "\uD604\uC7AC \uD0ED ID \uBCF5\uC0AC" })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }, children: [_jsxs("div", { children: [_jsxs("h3", { children: [activeTab === 'products' ? '상품' : activeTab === 'groups' ? '모임' : '구직', " \uBBF8\uB9AC\uBCF4\uAE30(", getCurrentItems().length, ")"] }), renderItems()] }), _jsxs("div", { children: [_jsx("h3", { children: "\uB85C\uADF8" }), _jsx("pre", { style: { background: '#111', color: '#0f0', minHeight: 200, padding: 12, borderRadius: 8 }, children: log.join('\n') })] })] })] }));
}
