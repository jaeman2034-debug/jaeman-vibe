import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createJob } from '@/features/jobs/services/jobService';
import { getBrowserLocation } from '@/features/location/services/locationService';
import { analyzeJob, getJobFieldLockStatus, applyJobAISuggestions } from '@/features/ai/aiProvider';
import { useAuth } from '@/contexts/AuthContext';
export default function JobCreate() {
    const nav = useNavigate();
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [company, setCompany] = useState('');
    const [type, setType] = useState('etc');
    const [salaryMin, setSalaryMin] = useState('');
    const [salaryMax, setSalaryMax] = useState('');
    const [contact, setContact] = useState('');
    const [desc, setDesc] = useState('');
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
            const result = await analyzeJob(title);
            setAiAnalysis(result);
            // 필드 잠금 상태 확인
            const fieldLocks = getJobFieldLockStatus({ title, company, type, desc, salaryMin: typeof salaryMin === 'number' ? salaryMin : undefined, salaryMax: typeof salaryMax === 'number' ? salaryMax : undefined }, userModifiedFields);
            // AI 제안 적용 (잠긴 필드는 건드리지 않음)
            const suggestions = applyJobAISuggestions({ title, company, type, desc, salaryMin: typeof salaryMin === 'number' ? salaryMin : undefined, salaryMax: typeof salaryMax === 'number' ? salaryMax : undefined }, result, fieldLocks);
            // 빈 필드에만 제안 적용
            if (!company && suggestions.company)
                setCompany(suggestions.company);
            if (!type && suggestions.type)
                setType(suggestions.type);
            if (!desc && suggestions.desc)
                setDesc(suggestions.desc);
            if (!salaryMin && suggestions.salaryMin)
                setSalaryMin(suggestions.salaryMin);
            if (!salaryMax && suggestions.salaryMax)
                setSalaryMax(suggestions.salaryMax);
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
            const id = await createJob({
                title,
                company: company || undefined,
                type,
                salaryMin: typeof salaryMin === 'number' ? salaryMin : undefined,
                salaryMax: typeof salaryMax === 'number' ? salaryMax : undefined,
                contact: contact || undefined,
                desc: desc || undefined,
                ownerId: user.uid,
                loc: loc ?? null,
            });
            nav(`/jobs/${id}`);
        }
        catch (error) {
            console.error('Create job error:', error);
            alert('구인 등록에 실패했습니다.');
        }
    };
    return (_jsxs("main", { style: { padding: 24, maxWidth: 720, margin: '0 auto' }, children: [_jsx("h1", { children: "\uAD6C\uC778 \uB4F1\uB85D" }), _jsxs("p", { style: { color: '#666' }, children: [autoMode ?
                        '자동모드 ON: 제목 입력 시 AI가 빈 필드를 자동으로 채웁니다.' :
                        '자동모드 OFF: 수동으로 모든 필드를 입력합니다.', "\uC704\uCE58 \uC124\uC815 \uC2DC \uD589\uC815\uB3D9 \uC815\uBCF4\uAC00 \uC790\uB3D9\uC73C\uB85C \uCC44\uC6CC\uC9D1\uB2C8\uB2E4."] }), _jsxs("form", { onSubmit: onSubmit, style: { display: 'grid', gap: 12 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: autoMode, onChange: (e) => setAutoMode(e.target.checked) }), "AI \uC790\uB3D9\uBAA8\uB4DC"] }), aiAnalysis && (_jsxs("span", { style: { color: '#666', fontSize: 14 }, children: ["AI \uC2E0\uB8B0\uB3C4: ", (aiAnalysis.confidence * 100).toFixed(0), "%"] }))] }), _jsx("input", { placeholder: "\uC81C\uBAA9", value: title, onChange: e => handleTitleChange(e.target.value), required: true }), _jsx("input", { placeholder: "\uD68C\uC0AC", value: company, onChange: e => setCompany(e.target.value) }), _jsxs("select", { value: type, onChange: e => setType(e.target.value), style: { padding: 8, borderRadius: 4, border: '1px solid #ddd' }, children: [_jsx("option", { value: "fulltime", children: "\uC815\uADDC" }), _jsx("option", { value: "parttime", children: "\uD30C\uD2B8" }), _jsx("option", { value: "coach", children: "\uCF54\uCE58" }), _jsx("option", { value: "etc", children: "\uAE30\uD0C0" })] }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("input", { type: "number", placeholder: "\uCD5C\uC18C \uAE09\uC5EC", value: salaryMin, onChange: e => setSalaryMin(e.target.value ? Number(e.target.value) : '') }), _jsx("input", { type: "number", placeholder: "\uCD5C\uB300 \uAE09\uC5EC", value: salaryMax, onChange: e => setSalaryMax(e.target.value ? Number(e.target.value) : '') })] }), _jsx("input", { placeholder: "\uC5F0\uB77D\uCC98(\uBA54\uC77C/\uC804\uD654/URL)", value: contact, onChange: e => setContact(e.target.value) }), _jsx("textarea", { placeholder: "\uC124\uBA85", rows: 6, value: desc, onChange: e => setDesc(e.target.value) }), _jsxs("div", { style: { display: 'flex', gap: 8, alignItems: 'center' }, children: [_jsx("button", { type: "button", onClick: onGetLocation, children: "\uD604\uC7AC \uC704\uCE58 \uC124\uC815" }), loc && (_jsxs("span", { style: { color: '#555' }, children: ["lat: ", loc.lat.toFixed(5), ", lng: ", loc.lng.toFixed(5)] }))] }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { type: "submit", disabled: !canSave, children: "\uAD6C\uC778 \uB4F1\uB85D" }), _jsx("button", { type: "button", onClick: () => nav(-1), children: "\uCDE8\uC18C" })] })] })] }));
}
