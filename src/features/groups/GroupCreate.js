import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGroup } from '@/features/groups/services/groupService';
import { getBrowserLocation } from '@/features/location/services/locationService';
import { analyzeGroup, getGroupFieldLockStatus, applyGroupAISuggestions } from '@/features/ai/aiProvider';
import { useAuth } from '@/contexts/AuthContext';
export default function GroupCreate() {
    const nav = useNavigate();
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [category, setCategory] = useState('');
    const [maxMembers, setMaxMembers] = useState('');
    const [loc, setLoc] = useState(null);
    const [autoMode, setAutoMode] = useState(false);
    const [userModifiedFields] = useState(new Set());
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const canSave = useMemo(() => !!user && !!title, [user, title]);
    if (!user)
        return _jsx("main", { style: { padding: 24 }, children: "\uB85C\uADF8\uC778 \uD544\uC694" });
    // AI 분석 실행
    const runAIAnalysis = async () => {
        if (!title || !autoMode)
            return;
        try {
            const result = await analyzeGroup(title);
            setAiAnalysis(result);
            // 필드 잠금 상태 확인
            const fieldLocks = getGroupFieldLockStatus({ title, category, desc, maxMembers: typeof maxMembers === 'number' ? maxMembers : undefined }, userModifiedFields);
            // AI 제안 적용 (잠긴 필드는 건드리지 않음)
            const suggestions = applyGroupAISuggestions({ title, category, desc, maxMembers: typeof maxMembers === 'number' ? maxMembers : undefined }, result, fieldLocks);
            // 빈 필드에만 제안 적용
            if (!category && suggestions.category)
                setCategory(suggestions.category);
            if (!desc && suggestions.desc)
                setDesc(suggestions.desc);
            if (!maxMembers && suggestions.maxMembers)
                setMaxMembers(suggestions.maxMembers);
        }
        catch (error) {
            console.error('AI 분석 실패:', error);
        }
    };
    // 제목 변경 시 AI 분석 실행
    const handleTitleChange = (value) => {
        setTitle(value);
        userModifiedFields.add('title');
        // 자동모드가 켜져있으면 AI 분석 실행
        if (autoMode && value) {
            setTimeout(runAIAnalysis, 500); // 타이핑 완료 후 분석
        }
    };
    const onGetLocation = async () => {
        try {
            const here = await getBrowserLocation();
            setLoc(here);
        }
        catch (error) {
            console.error('Location error:', error);
            alert('위치 정보를 가져올 수 없습니다.');
        }
    };
    const onSubmit = async (e) => {
        e.preventDefault();
        if (!canSave)
            return;
        try {
            const id = await createGroup({
                title,
                desc: desc || undefined,
                category: category || undefined,
                maxMembers: typeof maxMembers === 'number' ? maxMembers : undefined,
                ownerId: user.uid,
                loc: loc ?? null,
            });
            nav(`/groups/${id}`);
        }
        catch (error) {
            console.error('Create group error:', error);
            alert('모임 등록에 실패했습니다.');
        }
    };
    return (_jsxs("main", { style: { padding: 24, maxWidth: 720, margin: '0 auto' }, children: [_jsx("h1", { children: "\uC0C8 \uBAA8\uC784 \uB9CC\uB4E4\uAE30" }), _jsxs("p", { style: { color: '#666' }, children: [autoMode ?
                        '자동모드 ON: 제목 입력 시 AI가 빈 필드를 자동으로 채웁니다.' :
                        '자동모드 OFF: 수동으로 모든 필드를 입력합니다.', "\uC704\uCE58 \uC124\uC815 \uC2DC \uD589\uC815\uB3D9 \uC815\uBCF4\uAC00 \uC790\uB3D9\uC73C\uB85C \uCC44\uC6CC\uC9D1\uB2C8\uB2E4."] }), _jsxs("form", { onSubmit: onSubmit, style: { display: 'grid', gap: 12 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: autoMode, onChange: (e) => setAutoMode(e.target.checked) }), "AI \uC790\uB3D9\uBAA8\uB4DC"] }), aiAnalysis && (_jsxs("span", { style: { color: '#666', fontSize: 14 }, children: ["AI \uC2E0\uB8B0\uB3C4: ", (aiAnalysis.confidence * 100).toFixed(0), "%"] }))] }), _jsx("input", { placeholder: "\uBAA8\uC784 \uC81C\uBAA9", value: title, onChange: e => handleTitleChange(e.target.value), required: true }), _jsx("input", { placeholder: "\uCE74\uD14C\uACE0\uB9AC (\uC608: \uCD95\uAD6C, \uB18D\uAD6C, \uD14C\uB2C8\uC2A4)", value: category, onChange: e => {
                            setCategory(e.target.value);
                            userModifiedFields.add('category');
                        } }), _jsx("input", { type: "number", placeholder: "\uCD5C\uB300 \uC778\uC6D0\uC218", value: maxMembers, onChange: e => {
                            setMaxMembers(e.target.value ? Number(e.target.value) : '');
                            userModifiedFields.add('maxMembers');
                        } }), _jsx("textarea", { placeholder: "\uBAA8\uC784 \uC124\uBA85", rows: 6, value: desc, onChange: e => {
                            setDesc(e.target.value);
                            userModifiedFields.add('desc');
                        } }), _jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center' }, children: [_jsx("button", { type: "button", onClick: onGetLocation, children: "\uD604\uC7AC \uC704\uCE58 \uC124\uC815" }), loc && (_jsxs("span", { style: { color: '#555' }, children: ["lat: ", loc.lat.toFixed(5), ", lng: ", loc.lng.toFixed(5)] }))] }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { type: "submit", disabled: !canSave, children: "\uBAA8\uC784 \uB9CC\uB4E4\uAE30" }), _jsx("button", { type: "button", onClick: () => nav(-1), children: "\uCDE8\uC18C" })] })] })] }));
}
