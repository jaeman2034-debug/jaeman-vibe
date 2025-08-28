import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import FIREBASE from '@/lib/firebase';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
export default function Market() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        (async () => {
            try {
                const q = query(collection(FIREBASE.db, 'products'), orderBy('createdAt', 'desc'), limit(20));
                const snap = await getDocs(q);
                setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            }
            finally {
                setLoading(false);
            }
        })();
    }, []);
    return (_jsxs("div", { style: { padding: 24 }, children: [_jsx("h1", { children: "\uC2A4\uD3EC\uCE20 \uB9C8\uCF13" }), _jsx("button", { onClick: () => (window.location.hash = '/start'), children: "\u2190 \uC2DC\uC791\uC73C\uB85C" }), loading && _jsx("div", { style: { marginTop: 16 }, children: "\uB85C\uB529 \uC911\u2026" }), !loading && items.length === 0 && (_jsx("div", { style: { marginTop: 16, color: '#888' }, children: "\uC0C1\uD488\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. (\uC5C5\uB85C\uB4DC\uB294 \uB2E4\uC74C \uB2E8\uACC4\uC5D0\uC11C \uBD99\uC785\uB2C8\uB2E4)" })), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 220px)', gap: 16, marginTop: 16 }, children: items.map((it) => (_jsxs("div", { style: { border: '1px solid #eee', borderRadius: 8, padding: 12 }, children: [_jsx("div", { style: {
                                width: '100%',
                                height: 140,
                                background: '#fafafa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                borderRadius: 6,
                            }, children: it.cover ? (_jsx("img", { src: it.cover, style: { width: '100%', objectFit: 'cover' } })) : (_jsx("span", { style: { color: '#aaa', fontSize: 12 }, children: "\uC774\uBBF8\uC9C0 \uC5C6\uC74C" })) }), _jsx("div", { style: { marginTop: 8, fontWeight: 600 }, children: it.title ?? '제목 없음' }), _jsx("div", { style: { marginTop: 4 }, children: it.price ? `${it.price.toLocaleString()}원` : '가격 미정' })] }, it.id))) })] }));
}
