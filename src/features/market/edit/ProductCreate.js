import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProductWithOptionalImage } from '@/features/market/services/productService';
import { analyzeImage, getFieldLockStatus, applyAISuggestions } from '@/features/ai/aiProvider';
import { useAuth } from '@/contexts/AuthContext';
import ImageUploader from '@/features/images/components/ImageUploader';
import ImageGallery from '@/features/images/components/ImageGallery';
export default function ProductCreate() {
    const nav = useNavigate();
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [desc, setDesc] = useState('');
    const [images, setImages] = useState([]);
    const [coverImageId, setCoverImageId] = useState('');
    const [autoMode, setAutoMode] = useState(false);
    const [userModifiedFields] = useState(new Set());
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const canSave = useMemo(() => user && !!title, [user, title]);
    if (!user)
        return _jsx("main", { style: { padding: 24 }, children: "\uB85C\uADF8\uC778 \uD544\uC694" });
    const onImagesChange = async (newImages) => {
        setImages(newImages);
        // 첫 번째 이미지가 커버 이미지가 되도록 설정
        if (newImages.length > 0 && !coverImageId) {
            setCoverImageId(newImages[0].id);
        }
        // 자동모드가 켜져있고 첫 번째 이미지가 있으면 AI 분석 실행
        if (autoMode && newImages.length > 0) {
            try {
                // 첫 번째 이미지로 AI 분석 (실제로는 File 객체가 필요하므로 URL에서 fetch)
                const response = await fetch(newImages[0].url);
                const blob = await response.blob();
                const file = new File([blob], newImages[0].name, { type: newImages[0].url.split(';')[0].split(':')[1] });
                const result = await analyzeImage(file);
                setAiAnalysis(result);
                // 필드 잠금 상태 확인
                const fieldLocks = getFieldLockStatus({ title, price: typeof price === 'number' ? price : undefined, category, desc }, userModifiedFields);
                // AI 제안 적용 (잠긴 필드는 건드리지 않음)
                const suggestions = applyAISuggestions({ title, price: typeof price === 'number' ? price : undefined, category, desc }, result, fieldLocks);
                // 빈 필드에만 제안 적용
                if (!title && suggestions.title)
                    setTitle(suggestions.title);
                if (!price && suggestions.price)
                    setPrice(suggestions.price);
                if (!category && suggestions.category)
                    setCategory(suggestions.category);
            }
            catch (error) {
                console.error('AI 분석 실패:', error);
            }
        }
        else if (newImages.length === 0) {
            setAiAnalysis(null);
        }
    };
    const onSubmit = async (e) => {
        e.preventDefault();
        if (!canSave)
            return;
        try {
            const id = await createProductWithOptionalImage({
                title,
                price: typeof price === 'number' ? price : undefined,
                category: category || undefined,
                desc: desc || undefined,
                ownerId: user.uid,
                images: images.map(img => img.url),
                coverImageUrl: images.find(img => img.id === coverImageId)?.url || images[0]?.url
            }, null);
            nav(`/product/${id}`);
        }
        catch (e) {
            console.error(e);
            alert('등록 실패');
        }
    };
    return (_jsxs("main", { style: { padding: 24, maxWidth: 720, margin: '0 auto' }, children: [_jsx("h1", { children: "\uC0C8 \uC0C1\uD488 \uB4F1\uB85D" }), _jsx("p", { style: { color: '#666' }, children: autoMode ?
                    '자동모드 ON: 사진 선택 시 AI가 빈 필드를 자동으로 채웁니다.' :
                    '자동모드 OFF: 사진 선택 시 프리뷰만 표시됩니다.' }), _jsxs("form", { onSubmit: onSubmit, style: { display: 'grid', gap: 12 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: autoMode, onChange: (e) => setAutoMode(e.target.checked) }), "AI \uC790\uB3D9\uBAA8\uB4DC"] }), aiAnalysis && (_jsxs("span", { style: { color: '#666', fontSize: 14 }, children: ["AI \uC2E0\uB8B0\uB3C4: ", (aiAnalysis.confidence * 100).toFixed(0), "%"] }))] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', marginBottom: 8, fontWeight: 600 }, children: "\uC774\uBBF8\uC9C0" }), _jsx(ImageUploader, { onImagesChange: onImagesChange, maxImages: 10, maxSizeMB: 5 }), images.length > 0 && (_jsx("div", { style: { marginTop: 16 }, children: _jsx(ImageGallery, { images: images, onImagesChange: onImagesChange, onCoverChange: (coverImage) => setCoverImageId(coverImage.id), coverImageId: coverImageId, maxImages: 10 }) }))] }), _jsx("input", { placeholder: "\uC81C\uBAA9", value: title, onChange: e => {
                            setTitle(e.target.value);
                            userModifiedFields.add('title');
                        }, required: true }), _jsx("input", { placeholder: "\uAC00\uACA9(\uC6D0)", type: "number", value: price, onChange: e => {
                            setPrice(e.target.value ? Number(e.target.value) : '');
                            userModifiedFields.add('price');
                        } }), _jsx("input", { placeholder: "\uCE74\uD14C\uACE0\uB9AC", value: category, onChange: e => {
                            setCategory(e.target.value);
                            userModifiedFields.add('category');
                        } }), _jsx("textarea", { placeholder: "\uC124\uBA85", rows: 5, value: desc, onChange: e => {
                            setDesc(e.target.value);
                            userModifiedFields.add('desc');
                        } }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { type: "submit", disabled: !canSave, children: "\uB4F1\uB85D" }), _jsx("button", { type: "button", onClick: () => nav(-1), children: "\uCDE8\uC18C" })] })] })] }));
}
