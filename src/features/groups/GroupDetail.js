import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getGroup } from '@/features/groups/services/groupService';
import { autoCorrectDong } from '@/features/location/services/locationService';
import { useAuth } from '@/contexts/AuthContext';
export default function GroupDetail() {
    const { id } = useParams();
    const [item, setItem] = useState(null);
    const { user } = useAuth();
    useEffect(() => {
        if (!id)
            return;
        getGroup(id).then(setItem);
    }, [id]);
    if (!id)
        return _jsx("main", { style: { padding: 24 }, children: "\uC798\uBABB\uB41C \uACBD\uB85C" });
    if (!item)
        return _jsx("main", { style: { padding: 24 }, children: "\uB85C\uB529/\uC5C6\uC74C" });
    const onCheckDong = async () => {
        if (!item.loc) {
            alert('위치 정보가 없습니다.');
            return;
        }
        try {
            const dong = await autoCorrectDong('groups', id, item.loc);
            if (dong) {
                setItem(prev => prev ? { ...prev, dong } : null);
                alert(`행정동 정보가 업데이트되었습니다: ${dong}`);
            }
            else {
                alert('행정동 정보를 가져올 수 없습니다.');
            }
        }
        catch (error) {
            console.error('Check dong error:', error);
            alert('행정동 확인에 실패했습니다.');
        }
    };
    const isOwner = user?.uid && user.uid === item.ownerId;
    return (_jsx("main", { style: { padding: 24, maxWidth: 960, margin: '0 auto' }, children: _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }, children: [_jsxs("div", { children: [_jsx("h1", { children: item.title }), item.category && _jsxs("div", { style: { color: '#666', marginTop: 8 }, children: ["\uCE74\uD14C\uACE0\uB9AC: ", item.category] }), item.maxMembers && (_jsxs("div", { style: { color: '#444', marginTop: 8 }, children: ["\uC778\uC6D0: ", item.currentMembers || 0, "/", item.maxMembers, "\uBA85"] })), item.dong && _jsxs("div", { style: { color: '#777', marginTop: 8 }, children: ["\uD589\uC815\uB3D9: ", item.dong] }), item.loc && (_jsxs("div", { style: { color: '#555', marginTop: 8 }, children: ["\uC704\uCE58: lat ", item.loc.lat.toFixed(5), ", lng ", item.loc.lng.toFixed(5)] })), item.desc && (_jsx("p", { style: { marginTop: 16, whiteSpace: 'pre-wrap', lineHeight: 1.6 }, children: item.desc })), _jsxs("div", { style: { marginTop: 24, display: 'flex', gap: 8 }, children: [_jsx("button", { "data-voice-action": "check-dong", onClick: onCheckDong, disabled: !item.loc, children: "\uD589\uC815\uB3D9 \uD655\uC778" }), isOwner && (_jsxs(_Fragment, { children: [_jsx("button", { disabled: true, children: "\uD3B8\uC9D1" }), _jsx("button", { disabled: true, children: "\uC0AD\uC81C" })] }))] })] }), _jsxs("div", { style: { background: '#f8f8f8', padding: 24, borderRadius: 12 }, children: [_jsx("h3", { children: "\uBAA8\uC784 \uC815\uBCF4" }), _jsxs("div", { style: { marginTop: 16 }, children: [_jsxs("div", { children: [_jsx("strong", { children: "\uC0DD\uC131\uC77C:" }), " ", item.createdAt?.toDate?.()?.toLocaleDateString() || '알 수 없음'] }), _jsxs("div", { children: [_jsx("strong", { children: "\uC18C\uC720\uC790:" }), " ", item.ownerId] }), item.updatedAt && (_jsxs("div", { children: [_jsx("strong", { children: "\uC218\uC815\uC77C:" }), " ", item.updatedAt?.toDate?.()?.toLocaleDateString()] }))] })] })] }) }));
}
