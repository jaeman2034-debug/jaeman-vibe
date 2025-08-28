import { useState, useCallback } from 'react';
import { deleteObject, ref } from 'firebase/firestore';
import FIREBASE from '@/lib/firebase';
import { updateProduct } from '@/features/market/services/productService';
import type { Product, ProductImage } from '@/shared/types/product';
import ImageGallery from './ImageGallery';

interface ProductImagesManagerProps {
  product: Product;
  onProductUpdate: (updatedProduct: Product) => void;
  ownerId: string;
}

export default function ProductImagesManager({ 
  product, 
  onProductUpdate, 
  ownerId 
}: ProductImagesManagerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [images, setImages] = useState<ProductImage[]>(product.images || []);
  const [coverImage, setCoverImage] = useState<string>(product.cover || '');

  const handleImagesChange = useCallback(async (newImages: ProductImage[]) => {
    setImages(newImages);
    
    // 상품 업데이트
    const updatedProduct = {
      ...product,
      images: newImages,
      cover: newImages.length > 0 ? newImages[0].url : '',
      hasImages: newImages.length > 0
    };
    
    try {
      await updateProduct(product.id, updatedProduct);
      onProductUpdate(updatedProduct);
    } catch (error) {
      console.error('이미지 순서 변경 실패:', error);
      alert('이미지 순서 변경에 실패했습니다.');
    }
  }, [product, onProductUpdate]);

  const handleCoverChange = useCallback(async (coverImage: ProductImage) => {
    setCoverImage(coverImage.url);
    
    try {
      await updateProduct(product.id, { cover: coverImage.url });
      onProductUpdate({ ...product, cover: coverImage.url });
    } catch (error) {
      console.error('커버 이미지 변경 실패:', error);
      alert('커버 이미지 변경에 실패했습니다.');
    }
  }, [product, onProductUpdate]);

  const handleDeleteImage = useCallback(async (image: ProductImage, index: number) => {
    if (!confirm('이 이미지를 삭제하시겠습니까?')) return;
    
    try {
      // Firebase Storage에서 삭제
      const storageRef = ref(FIREBASE.storage, image.path);
      await deleteObject(storageRef);
      
      // 로컬 상태에서 제거
      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
      
      // 커버 이미지였다면 첫 번째 이미지를 커버로 설정
      if (coverImage === image.url && newImages.length > 0) {
        setCoverImage(newImages[0].url);
        await updateProduct(product.id, { 
          images: newImages, 
          cover: newImages[0].url,
          hasImages: newImages.length > 0
        });
      } else {
        await updateProduct(product.id, { 
          images: newImages,
          hasImages: newImages.length > 0
        });
      }
      
      onProductUpdate({ 
        ...product, 
        images: newImages, 
        cover: newImages.length > 0 ? newImages[0].url : '',
        hasImages: newImages.length > 0
      });
      
    } catch (error) {
      console.error('이미지 삭제 실패:', error);
      alert('이미지 삭제에 실패했습니다.');
    }
  }, [images, coverImage, product, onProductUpdate]);

  if (!isEditing) {
    return (
      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => setIsEditing(true)}
          style={{
            padding: '8px 16px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          이미지 관리
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>이미지 관리</h3>
        <button
          onClick={() => setIsEditing(false)}
          style={{
            padding: '6px 12px',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          완료
        </button>
      </div>
      
      <ImageGallery
        images={images}
        onImagesChange={handleImagesChange}
        onCoverChange={handleCoverChange}
        coverImageId={images.find(img => img.url === coverImage)?.path || ''}
        maxImages={10}
        onDelete={handleDeleteImage}
      />
      
      <div style={{ marginTop: 16, fontSize: 14, color: '#666' }}>
        💡 드래그 앤 드롭으로 순서를 변경하고, 커버 이미지를 설정할 수 있습니다.
      </div>
    </div>
  );
}
