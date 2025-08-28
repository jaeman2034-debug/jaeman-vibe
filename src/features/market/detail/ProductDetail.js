import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProduct, uploadProductImage } from '@/features/market/services/productService';
import { useAuth } from '@/contexts/AuthContext';
export default function ProductDetail() {
    const { id } = useParams();
    const [item, setItem] = useState(null);
    const { user } = useAuth();
    useEffect(() => {
        if (!id)
            return;
        getProduct(id).then(setItem);
    }, [id]);
    if (!id)
        return _jsx("main", { style: { padding: 24 }, children: "\uC798\uBABB\uB41C \uACBD\uB85C" });
    if (!item)
        return _jsx("main", { style: { padding: 24 }, children: "\uB85C\uB529/\uC5C6\uC74C" });
    const onUpload = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file)
                return;
            try {
                await uploadProductImage(id, file);
                const refreshed = await getProduct(id);
                setItem(refreshed);
            }
            catch (e) {
                console.error(e);
                alert('이미지 업로드 실패');
            }
        };
        input.click();
    };
    const isOwner = user?.uid && user.uid === item.ownerId;
    return (_jsx("main", { style: { padding: 24, maxWidth: 960, margin: '0 auto' }, children: _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }, children: [_jsxs("div", { children: [_jsx("div", { style: { borderRadius: 12, overflow: 'hidden', background: '#f2f2f2', aspectRatio: '1 / 1' }, children: item.cover
                                ? _jsx("img", { src: item.cover, alt: item.title, style: { width: '100%', height: '100%', objectFit: 'cover' } })
                                : _jsx("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }, children: "No Image" }) }), (item.images?.length ?? 0) > 0 && (_jsx("div", { style: { display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }, children: item.images.map((im, idx) => (_jsx("img", { src: im.url, alt: `img${idx}`, style: { width: 80, height: 80, objectFit: 'cover', borderRadius: 8 } }, idx))) }))] }), _jsxs("div", { children: [_jsx("h1", { children: item.title }), typeof item.price === 'number' && _jsxs("h2", { style: { marginTop: 8 }, children: [item.price.toLocaleString(), " \uC6D0"] }), item.category && _jsxs("div", { style: { color: '#666' }, children: ["\uCE74\uD14C\uACE0\uB9AC: ", item.category] }), item.dong && _jsxs("div", { style: { color: '#666' }, children: ["\uD589\uC815\uB3D9: ", item.dong] }), item.desc && _jsx("p", { style: { marginTop: 12, whiteSpace: 'pre-wrap' }, children: item.desc }), isOwner && (_jsx("div", { style: { marginTop: 16, display: 'flex', gap: 8 }, children: _jsx("button", { "data-voice-action": "upload", onClick: onUpload, children: "\uC774\uBBF8\uC9C0 \uCD94\uAC00 \uC5C5\uB85C\uB4DC" }) }))] })] }) }));
}
