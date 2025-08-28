import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProductWithOptionalImage } from '@/features/market/services/productService';
import { analyzeImage, getFieldLockStatus, applyAISuggestions } from '@/features/ai/aiProvider';
import { useAuth } from '@/contexts/AuthContext';
import ImageUploader, { UploadedImage } from '@/features/images/components/ImageUploader';
import ImageGallery from '@/features/images/components/ImageGallery';

export default function ProductCreate() {
  const nav = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [category, setCategory] = useState('');
  const [desc, setDesc] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [coverImageId, setCoverImageId] = useState<string>('');
  const [autoMode, setAutoMode] = useState(false);
  const [userModifiedFields] = useState(new Set<string>());
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const canSave = useMemo(() => user && !!title, [user, title]);

  if (!user) return <main style={{ padding: 24 }}>로그인 필요</main>;

  const onImagesChange = async (newImages: UploadedImage[]) => {
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
        const fieldLocks = getFieldLockStatus(
          { title, price: typeof price === 'number' ? price : undefined, category, desc },
          userModifiedFields
        );
        
        // AI 제안 적용 (잠긴 필드는 건드리지 않음)
        const suggestions = applyAISuggestions(
          { title, price: typeof price === 'number' ? price : undefined, category, desc },
          result,
          fieldLocks
        );
        
        // 빈 필드에만 제안 적용
        if (!title && suggestions.title) setTitle(suggestions.title);
        if (!price && suggestions.price) setPrice(suggestions.price);
        if (!category && suggestions.category) setCategory(suggestions.category);
        
      } catch (error) {
        console.error('AI 분석 실패:', error);
      }
    } else if (newImages.length === 0) {
      setAiAnalysis(null);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
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
    } catch (e) {
      console.error(e);
      alert('등록 실패');
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>새 상품 등록</h1>
      <p style={{ color: '#666' }}>
        {autoMode ? 
          '자동모드 ON: 사진 선택 시 AI가 빈 필드를 자동으로 채웁니다.' :
          '자동모드 OFF: 사진 선택 시 프리뷰만 표시됩니다.'
        }
      </p>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        {/* 자동모드 토글 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label>
            <input
              type="checkbox"
              checked={autoMode}
              onChange={(e) => setAutoMode(e.target.checked)}
            />
            AI 자동모드
          </label>
          {aiAnalysis && (
            <span style={{ color: '#666', fontSize: 14 }}>
              AI 신뢰도: {(aiAnalysis.confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>

        {/* 이미지 업로드 */}
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            이미지
          </label>
          <ImageUploader
            onImagesChange={onImagesChange}
            maxImages={10}
            maxSizeMB={5}
          />
          
          {/* 이미지 갤러리 */}
          {images.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <ImageGallery
                images={images}
                onImagesChange={onImagesChange}
                onCoverChange={(coverImage) => setCoverImageId(coverImage.id)}
                coverImageId={coverImageId}
                maxImages={10}
              />
            </div>
          )}
        </div>

        <input 
          placeholder="제목" 
          value={title} 
          onChange={e => {
            setTitle(e.target.value);
            userModifiedFields.add('title');
          }} 
          required 
        />
        <input 
          placeholder="가격(원)" 
          type="number"
          value={price as any} 
          onChange={e => {
            setPrice(e.target.value ? Number(e.target.value) : '');
            userModifiedFields.add('price');
          }} 
        />
        <input 
          placeholder="카테고리" 
          value={category} 
          onChange={e => {
            setCategory(e.target.value);
            userModifiedFields.add('category');
          }} 
        />
        <textarea 
          placeholder="설명" 
          rows={5} 
          value={desc} 
          onChange={e => {
            setDesc(e.target.value);
            userModifiedFields.add('desc');
          }} 
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={!canSave}>등록</button>
          <button type="button" onClick={() => nav(-1)}>취소</button>
        </div>
      </form>
    </main>
  );
}
