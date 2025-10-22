import { useState, useCallback } from 'react';
import { deleteObject, ref } from 'firebase/firestore';
import { storage } from '@/lib/firebase'; // ???�일 진입???�용
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
    
    // ?�품 ?�데?�트
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
      console.error('?��?지 ?�서 변�??�패:', error);
      alert('?��?지 ?�서 변경에 ?�패?�습?�다.');
    }
  }, [product, onProductUpdate]);

  const handleCoverChange = useCallback(async (coverImage: ProductImage) => {
    setCoverImage(coverImage.url);
    
    try {
      await updateProduct(product.id, { cover: coverImage.url });
      onProductUpdate({ ...product, cover: coverImage.url });
    } catch (error) {
      console.error('커버 ?��?지 변�??�패:', error);
      alert('커버 ?��?지 변경에 ?�패?�습?�다.');
    }
  }, [product, onProductUpdate]);

  const handleDeleteImage = useCallback(async (image: ProductImage, index: number) => {
    if (!confirm('???��?지�???��?�시겠습?�까?')) return;
    
    try {
      // Firebase Storage?�서 ??��
      const storageRef = ref(storage, image.path);
      await deleteObject(storageRef);
      
      // 로컬 ?�태?�서 ?�거
      const newImages = images.filter((_, i) => i !== index);
      setImages(newImages);
      
      // 커버 ?��?지?�?�면 �?번째 ?��?지�?커버�??�정
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
      console.error('?��?지 ??�� ?�패:', error);
      alert('?��?지 ??��???�패?�습?�다.');
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
          ?��?지 관�?
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>?��?지 관�?/h3>
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
          ?�료
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
        ?�� ?�래�????�롭?�로 ?�서�?변경하�? 커버 ?��?지�??�정?????�습?�다.
      </div>
    </div>
  );
}
