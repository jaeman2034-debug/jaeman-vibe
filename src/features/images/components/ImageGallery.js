import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { deleteObject } from 'firebase/storage';
import { ref } from 'firebase/storage';
import FIREBASE from '@/lib/firebase';
export default function ImageGallery({ images, onImagesChange, onCoverChange, coverImageId, maxImages = 10 }) {
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const handleDragStart = useCallback((e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    }, []);
    const handleDragOver = useCallback((e, index) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== index) {
            setDragOverIndex(index);
        }
    }, [draggedIndex]);
    const handleDragLeave = useCallback(() => {
        setDragOverIndex(null);
    }, []);
    const handleDrop = useCallback((e, dropIndex) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex)
            return;
        const newImages = [...images];
        const [draggedImage] = newImages.splice(draggedIndex, 1);
        newImages.splice(dropIndex, 0, draggedImage);
        onImagesChange(newImages);
        setDraggedIndex(null);
        setDragOverIndex(null);
    }, [images, draggedIndex, onImagesChange]);
    const handleDragEnd = useCallback(() => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    }, []);
    const handleDelete = useCallback(async (image, index) => {
        if (!confirm('이 이미지를 삭제하시겠습니까?'))
            return;
        try {
            // Firebase Storage에서 삭제
            const storageRef = ref(FIREBASE.storage, image.path);
            await deleteObject(storageRef);
            // 로컬 상태에서 제거
            const newImages = images.filter((_, i) => i !== index);
            onImagesChange(newImages);
            // 커버 이미지였다면 첫 번째 이미지를 커버로 설정
            if (coverImageId === image.id && newImages.length > 0 && onCoverChange) {
                onCoverChange(newImages[0]);
            }
        }
        catch (error) {
            console.error('이미지 삭제 실패:', error);
            alert('이미지 삭제에 실패했습니다.');
        }
    }, [images, coverImageId, onCoverChange, onImagesChange]);
    const handleSetCover = useCallback((image) => {
        if (onCoverChange) {
            onCoverChange(image);
        }
    }, [onCoverChange]);
    const formatFileSize = (bytes) => {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    if (images.length === 0) {
        return (_jsx("div", { style: {
                textAlign: 'center',
                padding: 40,
                color: '#666',
                border: '1px dashed #ddd',
                borderRadius: 8
            }, children: "\uC5C5\uB85C\uB4DC\uB41C \uC774\uBBF8\uC9C0\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4" }));
    }
    return (_jsxs("div", { style: { display: 'grid', gap: 16 }, children: [_jsx("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 16
                }, children: images.map((image, index) => (_jsxs("div", { draggable: true, onDragStart: (e) => handleDragStart(e, index), onDragOver: (e) => handleDragOver(e, index), onDragLeave: handleDragLeave, onDrop: (e) => handleDrop(e, index), onDragEnd: handleDragEnd, style: {
                        position: 'relative',
                        border: `2px solid ${dragOverIndex === index ? '#007bff' : '#eee'}`,
                        borderRadius: 8,
                        overflow: 'hidden',
                        cursor: 'grab',
                        opacity: draggedIndex === index ? 0.5 : 1,
                        transform: dragOverIndex === index ? 'scale(1.05)' : 'scale(1)',
                        transition: 'all 0.2s ease'
                    }, children: [coverImageId === image.id && (_jsx("div", { style: {
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                background: '#007bff',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: 4,
                                fontSize: 12,
                                fontWeight: 600,
                                zIndex: 10
                            }, children: "\uCEE4\uBC84" })), _jsx("img", { src: image.url, alt: image.name, style: {
                                width: '100%',
                                height: 200,
                                objectFit: 'cover',
                                display: 'block'
                            } }), _jsxs("div", { style: { padding: 12 }, children: [_jsx("div", { style: {
                                        fontSize: 14,
                                        fontWeight: 600,
                                        marginBottom: 4,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }, children: image.name }), _jsx("div", { style: {
                                        fontSize: 12,
                                        color: '#666',
                                        marginBottom: 8
                                    }, children: formatFileSize(image.size) }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [coverImageId !== image.id && (_jsx("button", { onClick: () => handleSetCover(image), style: {
                                                padding: '4px 8px',
                                                fontSize: 12,
                                                background: '#28a745',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 4,
                                                cursor: 'pointer'
                                            }, children: "\uCEE4\uBC84\uB85C" })), _jsx("button", { onClick: () => handleDelete(image, index), style: {
                                                padding: '4px 8px',
                                                fontSize: 12,
                                                background: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: 4,
                                                cursor: 'pointer'
                                            }, children: "\uC0AD\uC81C" })] })] })] }, image.id))) }), _jsxs("div", { style: {
                    fontSize: 14,
                    color: '#666',
                    textAlign: 'center'
                }, children: [images.length, " / ", maxImages, " \uC774\uBBF8\uC9C0"] })] }));
}
