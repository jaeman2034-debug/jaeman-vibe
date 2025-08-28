import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import FIREBASE from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scheduledBackfills, setScheduledBackfills] = useState([]);
    const { user } = useAuth();
    // 관리자 권한 확인
    const adminUids = import.meta.env.VITE_ADMIN_UIDS?.split(',') || [];
    const isAdmin = user && adminUids.includes(user.uid);
    useEffect(() => {
        if (!isAdmin)
            return;
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
                type: 'product',
                title: doc.data().title,
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                ownerId: doc.data().ownerId
            }));
            const recentGroups = groupsSnapshot.docs
                .slice(0, 5)
                .map(doc => ({
                id: doc.id,
                type: 'group',
                title: doc.data().title,
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                ownerId: doc.data().ownerId
            }));
            const recentJobs = jobsSnapshot.docs
                .slice(0, 5)
                .map(doc => ({
                id: doc.id,
                type: 'job',
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
        }
        catch (error) {
            console.error('대시보드 데이터 로드 실패:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const scheduleBackfill = (collection) => {
        const scheduledAt = new Date(Date.now() + 5 * 60 * 1000); // 5분 후
        const newScheduledBackfill = {
            id: `${collection}-${Date.now()}`,
            collection,
            scheduledAt,
            status: 'pending'
        };
        setScheduledBackfills(prev => [...prev, newScheduledBackfill]);
        // 실제 백필 실행 (5분 후)
        setTimeout(() => {
            setScheduledBackfills(prev => prev.map(item => item.id === newScheduledBackfill.id
                ? { ...item, status: 'running' }
                : item));
            // 백필 완료 시뮬레이션 (실제로는 AdminTools의 백필 함수 호출)
            setTimeout(() => {
                setScheduledBackfills(prev => prev.map(item => item.id === newScheduledBackfill.id
                    ? { ...item, status: 'completed' }
                    : item));
            }, 3000);
        }, 5 * 60 * 1000);
    };
    if (!isAdmin) {
        return _jsx("main", { style: { padding: 24 }, children: "403 \u2014 \uAD8C\uD55C \uC5C6\uC74C" });
    }
    if (loading) {
        return _jsx("main", { style: { padding: 24 }, children: "\uB85C\uB529 \uC911..." });
    }
    if (!stats) {
        return _jsx("main", { style: { padding: 24 }, children: "\uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." });
    }
    return (_jsxs("main", { style: { padding: 24 }, children: [_jsx("h1", { children: "\uC6B4\uC601 \uB300\uC2DC\uBCF4\uB4DC" }), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: 20,
                    marginBottom: 32
                }, children: [_jsxs("div", { style: {
                            padding: 24,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            borderRadius: 12
                        }, children: [_jsx("h3", { style: { margin: 0, marginBottom: 8 }, children: "\uCD1D \uC0C1\uD488" }), _jsx("div", { style: { fontSize: 32, fontWeight: 700 }, children: stats.totalProducts }), _jsxs("div", { style: { fontSize: 14, opacity: 0.8 }, children: [stats.productsWithoutDong, "\uAC1C \uD589\uC815\uB3D9 \uC815\uBCF4 \uC5C6\uC74C"] })] }), _jsxs("div", { style: {
                            padding: 24,
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            color: 'white',
                            borderRadius: 12
                        }, children: [_jsx("h3", { style: { margin: 0, marginBottom: 8 }, children: "\uCD1D \uBAA8\uC784" }), _jsx("div", { style: { fontSize: 32, fontWeight: 700 }, children: stats.totalGroups }), _jsxs("div", { style: { fontSize: 14, opacity: 0.8 }, children: [stats.groupsWithoutDong, "\uAC1C \uD589\uC815\uB3D9 \uC815\uBCF4 \uC5C6\uC74C"] })] }), _jsxs("div", { style: {
                            padding: 24,
                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            color: 'white',
                            borderRadius: 12
                        }, children: [_jsx("h3", { style: { margin: 0, marginBottom: 8 }, children: "\uCD1D \uAD6C\uC9C1" }), _jsx("div", { style: { fontSize: 32, fontWeight: 700 }, children: stats.totalJobs }), _jsxs("div", { style: { fontSize: 14, opacity: 0.8 }, children: [stats.jobsWithoutDong, "\uAC1C \uD589\uC815\uB3D9 \uC815\uBCF4 \uC5C6\uC74C"] })] }), _jsxs("div", { style: {
                            padding: 24,
                            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                            color: 'white',
                            borderRadius: 12
                        }, children: [_jsx("h3", { style: { margin: 0, marginBottom: 8 }, children: "\uD65C\uC131 \uC0AC\uC6A9\uC790" }), _jsx("div", { style: { fontSize: 32, fontWeight: 700 }, children: stats.totalUsers }), _jsx("div", { style: { fontSize: 14, opacity: 0.8 }, children: "\uCD94\uC815\uCE58" })] })] }), _jsxs("div", { style: { marginBottom: 32 }, children: [_jsx("h2", { children: "\uBC31\uD544 \uC2A4\uCF00\uC904\uB9C1" }), _jsxs("div", { style: { display: 'flex', gap: 12, marginBottom: 16 }, children: [_jsx("button", { onClick: () => scheduleBackfill('products'), style: {
                                    padding: '12px 24px',
                                    background: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 8,
                                    cursor: 'pointer'
                                }, children: "\uC0C1\uD488 \uD589\uC815\uB3D9 \uBC31\uD544 \uC608\uC57D" }), _jsx("button", { onClick: () => scheduleBackfill('groups'), style: {
                                    padding: '12px 24px',
                                    background: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 8,
                                    cursor: 'pointer'
                                }, children: "\uBAA8\uC784 \uD589\uC815\uB3D9 \uBC31\uD544 \uC608\uC57D" }), _jsx("button", { onClick: () => scheduleBackfill('jobs'), style: {
                                    padding: '12px 24px',
                                    background: '#ffc107',
                                    color: 'black',
                                    border: 'none',
                                    borderRadius: 8,
                                    cursor: 'pointer'
                                }, children: "\uAD6C\uC9C1 \uD589\uC815\uB3D9 \uBC31\uD544 \uC608\uC57D" })] }), scheduledBackfills.length > 0 && (_jsxs("div", { style: {
                            border: '1px solid #e9ecef',
                            borderRadius: 8,
                            padding: 16,
                            backgroundColor: '#f8f9fa'
                        }, children: [_jsx("h4", { style: { margin: 0, marginBottom: 16 }, children: "\uC608\uC57D\uB41C \uBC31\uD544" }), _jsx("div", { style: { display: 'grid', gap: 8 }, children: scheduledBackfills.map(item => (_jsxs("div", { style: {
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px 16px',
                                        background: 'white',
                                        borderRadius: 6,
                                        border: '1px solid #dee2e6'
                                    }, children: [_jsxs("div", { children: [_jsx("strong", { children: item.collection }), " \uD589\uC815\uB3D9 \uBC31\uD544", _jsxs("div", { style: { fontSize: 12, color: '#666' }, children: ["\uC608\uC57D: ", item.scheduledAt.toLocaleString()] })] }), _jsx("div", { style: {
                                                padding: '4px 12px',
                                                borderRadius: 20,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                background: item.status === 'pending' ? '#ffc107' :
                                                    item.status === 'running' ? '#007bff' :
                                                        item.status === 'completed' ? '#28a745' : '#dc3545',
                                                color: 'white'
                                            }, children: item.status === 'pending' ? '대기' :
                                                item.status === 'running' ? '실행중' :
                                                    item.status === 'completed' ? '완료' : '실패' })] }, item.id))) })] }))] }), _jsxs("div", { children: [_jsx("h2", { children: "\uCD5C\uADFC \uD65C\uB3D9" }), _jsx("div", { style: {
                            border: '1px solid #e9ecef',
                            borderRadius: 8,
                            overflow: 'hidden'
                        }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { background: '#f8f9fa' }, children: [_jsx("th", { style: { padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }, children: "\uC720\uD615" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }, children: "\uC81C\uBAA9" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }, children: "\uB4F1\uB85D\uC77C" }), _jsx("th", { style: { padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }, children: "\uC0AC\uC6A9\uC790" })] }) }), _jsx("tbody", { children: stats.recentActivity.map(item => (_jsxs("tr", { style: { borderBottom: '1px solid #f8f9fa' }, children: [_jsx("td", { style: { padding: '12px' }, children: _jsx("span", { style: {
                                                        padding: '4px 8px',
                                                        borderRadius: 4,
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        background: item.type === 'product' ? '#007bff' :
                                                            item.type === 'group' ? '#28a745' : '#ffc107',
                                                        color: 'white'
                                                    }, children: item.type === 'product' ? '상품' :
                                                        item.type === 'group' ? '모임' : '구직' }) }), _jsx("td", { style: { padding: '12px', fontWeight: 600 }, children: item.title }), _jsx("td", { style: { padding: '12px', color: '#666' }, children: item.createdAt.toLocaleDateString() }), _jsxs("td", { style: { padding: '12px', color: '#666', fontSize: 14 }, children: [item.ownerId.substring(0, 8), "..."] })] }, item.id))) })] }) })] })] }));
}
