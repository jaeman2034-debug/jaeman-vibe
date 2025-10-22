import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProductWithOptionalImage } from '@/features/market/services/productService';
import { analyzeImage, getFieldLockStatus, applyAISuggestions } from '@/features/ai/aiProvider';
import { useAuth } from '@/features/auth/AuthContext';
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

  if (!user) return <main style={{ padding: 24 }}>로그???�요</main>;

  const onImagesChange = async (newImages: UploadedImage[]) => {
    setImages(newImages);
    
    // �?번째 ?��?지가 커버 ?��?지가 ?�도�??�정
    if (newImages.length > 0 && !coverImageId) {
      setCoverImageId(newImages[0].id);
    }
    
    // ?�동모드가 켜져?�고 �?번째 ?��?지가 ?�으�?AI 분석 ?�행
    if (autoMode && newImages.length > 0) {
      try {
        // �?번째 ?��?지�?AI 분석 (?�제로는 File 객체가 ?�요?��?�?URL?�서 fetch)
        const response = await fetch(newImages[0].url);
        const blob = await response.blob();
        const file = new File([blob], newImages[0].name, { type: newImages[0].url.split(';')[0].split(':')[1] });
        
        const result = await analyzeImage(file);
        setAiAnalysis(result);
        
        // ?�드 ?�금 ?�태 ?�인
        const fieldLocks = getFieldLockStatus(
          { title, price: typeof price === 'number' ? price : undefined, category, desc },
          userModifiedFields
        );
        
        // AI ?�안 ?�용 (?�긴 ?�드??건드리�? ?�음)
        const suggestions = applyAISuggestions(
          { title, price: typeof price === 'number' ? price : undefined, category, desc },
          result,
          fieldLocks
        );
        
        // �??�드?�만 ?�안 ?�용
        if (!title && suggestions.title) setTitle(suggestions.title);
        if (!price && suggestions.price) setPrice(suggestions.price);
        if (!category && suggestions.category) setCategory(suggestions.category);
        
      } catch (error) {
        console.error('AI 분석 ?�패:', error);
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
      alert('?�록 ?�패');
    }
  };

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <h1>???�품 ?�록</h1>
      <p style={{ color: '#666' }}>
        {autoMode ? 
          '?�동모드 ON: ?�진 ?�택 ??AI가 �??�드�??�동?�로 채웁?�다.' :
          '?�동모드 OFF: ?�진 ?�택 ???�리뷰만 ?�시?�니??'
        }
      </p>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        {/* ?�동모드 ?��? */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label>
            <input
              type="checkbox"
              checked={autoMode}
              onChange={(e) => setAutoMode(e.target.checked)}
            />
            AI ?�동모드
          </label>
          {aiAnalysis && (
            <span style={{ color: '#666', fontSize: 14 }}>
              AI ?�뢰?? {(aiAnalysis.confidence * 100).toFixed(0)}%
            </span>
          )}
        </div>

        {/* ?��?지 ?�로??*/}
        <div>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            ?��?지
          </label>
          <ImageUploader
            onImagesChange={onImagesChange}
            maxImages={10}
            maxSizeMB={5}
          />
          
          {/* ?��?지 갤러�?*/}
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
          placeholder="?�목" 
          value={title} 
          onChange={e => {
            setTitle(e.target.value);
            userModifiedFields.add('title');
          }} 
          required 
        />
        <input 
          placeholder="가�???" 
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
          placeholder="?�명" 
          rows={5} 
          value={desc} 
          onChange={e => {
            setDesc(e.target.value);
            userModifiedFields.add('desc');
          }} 
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={!canSave}>?�록</button>
          <button type="button" onClick={() => nav(-1)}>취소</button>
        </div>
      </form>
    </main>
  );
}
