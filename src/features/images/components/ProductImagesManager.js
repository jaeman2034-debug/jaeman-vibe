import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { deleteObject, ref } from 'firebase/firestore';
import FIREBASE from '@/lib/firebase';
import { updateProduct } from '@/features/market/services/productService';
import ImageGallery from './ImageGallery';
export default function ProductImagesManager({ product, onProductUpdate, ownerId }) {
    const [isEditing, setIsEditing] = useState(false);
    const [images, setImages] = useState(product.images || []);
    const [coverImage, setCoverImage] = useState(product.cover || '');
    const handleImagesChange = useCallback(async (newImages) => {
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
        }
        catch (error) {
            console.error('이미지 순서 변경 실패:', error);
            alert('이미지 순서 변경에 실패했습니다.');
        }
    }, [product, onProductUpdate]);
    const handleCoverChange = useCallback(async (coverImage) => {
        setCoverImage(coverImage.url);
        try {
            await updateProduct(product.id, { cover: coverImage.url });
            onProductUpdate({ ...product, cover: coverImage.url });
        }
        catch (error) {
            console.error('커버 이미지 변경 실패:', error);
            alert('커버 이미지 변경에 실패했습니다.');
        }
    }, [product, onProductUpdate]);
    const handleDeleteImage = useCallback(async (image, index) => {
        if (!confirm('이 이미지를 삭제하시겠습니까?'))
            return;
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
            }
            else {
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
        }
        catch (error) {
            console.error('이미지 삭제 실패:', error);
            alert('이미지 삭제에 실패했습니다.');
        }
    }, [images, coverImage, product, onProductUpdate]);
    if (!isEditing) {
        return (_jsx("div", { style: { marginTop: 16 }, children: _jsx("button", { onClick: () => setIsEditing(true), style: {
                    padding: '8px 16px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer'
                }, children: "\uC774\uBBF8\uC9C0 \uAD00\uB9AC" }) }));
    }
    return (_jsxs("div", { style: { marginTop: 16 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, children: [_jsx("h3", { children: "\uC774\uBBF8\uC9C0 \uAD00\uB9AC" }), _jsx("button", { onClick: () => setIsEditing(false), style: {
                            padding: '6px 12px',
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer'
                        }, children: "\uC644\uB8CC" })] }), _jsx(ImageGallery, { images: images, onImagesChange: handleImagesChange, onCoverChange: handleCoverChange, coverImageId: images.find(img => img.url === coverImage)?.path || '', maxImages: 10, onDelete: handleDeleteImage }), _jsx("div", { style: { marginTop: 16, fontSize: 14, color: '#666' }, children: "\uD83D\uDCA1 \uB4DC\uB798\uADF8 \uC564 \uB4DC\uB86D\uC73C\uB85C \uC21C\uC11C\uB97C \uBCC0\uACBD\uD558\uACE0, \uCEE4\uBC84 \uC774\uBBF8\uC9C0\uB97C \uC124\uC815\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." })] }));
}
