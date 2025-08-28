import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import FIREBASE from '@/lib/firebase';
export default function ImageUploader({ onImagesChange, maxImages = 10, acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'], maxSizeMB = 5 }) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const fileInputRef = useRef(null);
    const validateFile = (file) => {
        if (!acceptedTypes.includes(file.type)) {
            return '지원하지 않는 파일 형식입니다.';
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
            return `파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`;
        }
        return null;
    };
    const uploadImage = useCallback(async (file) => {
        const error = validateFile(file);
        if (error)
            throw new Error(error);
        const timestamp = Date.now();
        const fileName = `${timestamp}-${file.name.replace(/[^\w.\-]/g, '_')}`;
        const path = `uploads/${timestamp}/${fileName}`;
        const storageRef = ref(FIREBASE.storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);
        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed', (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(prev => ({ ...prev, [fileName]: progress }));
            }, (error) => {
                reject(error);
            }, async () => {
                try {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    const uploadedImage = {
                        id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
                        url,
                        path,
                        name: file.name,
                        size: file.size,
                        uploadedAt: new Date()
                    };
                    resolve(uploadedImage);
                }
                catch (error) {
                    reject(error);
                }
            });
        });
    });
    const handleFiles = useCallback(async (files) => {
        if (files.length === 0)
            return;
        setUploading(true);
        const fileArray = Array.from(files);
        try {
            const uploadPromises = fileArray.map(uploadImage);
            const uploadedImages = await Promise.all(uploadPromises);
            onImagesChange(uploadedImages);
        }
        catch (error) {
            console.error('이미지 업로드 실패:', error);
            alert('이미지 업로드에 실패했습니다.');
        }
        finally {
            setUploading(false);
            setUploadProgress({});
        }
    }, [uploadImage, onImagesChange]);
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);
    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFiles(files);
        }
    }, [handleFiles]);
    const handleFileSelect = useCallback((e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFiles(files);
        }
    }, [handleFiles]);
    const handleClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);
    return (_jsxs("div", { style: {
            border: `2px dashed ${isDragOver ? '#007bff' : '#ddd'}`,
            borderRadius: 8,
            padding: 24,
            textAlign: 'center',
            backgroundColor: isDragOver ? '#f8f9ff' : '#f8f9fa',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
        }, onDragOver: handleDragOver, onDragLeave: handleDragLeave, onDrop: handleDrop, onClick: handleClick, children: [_jsx("input", { ref: fileInputRef, type: "file", multiple: true, accept: acceptedTypes.join(','), onChange: handleFileSelect, style: { display: 'none' } }), _jsx("div", { style: { fontSize: 48, marginBottom: 16 }, children: "\uD83D\uDCF8" }), uploading ? (_jsxs("div", { children: [_jsx("div", { style: { marginBottom: 8 }, children: "\uC5C5\uB85C\uB4DC \uC911..." }), Object.entries(uploadProgress).map(([fileName, progress]) => (_jsxs("div", { style: { marginBottom: 4 }, children: [_jsx("div", { style: { fontSize: 12, marginBottom: 2 }, children: fileName }), _jsx("div", { style: {
                                    width: '100%',
                                    height: 4,
                                    backgroundColor: '#e9ecef',
                                    borderRadius: 2
                                }, children: _jsx("div", { style: {
                                        width: `${progress}%`,
                                        height: '100%',
                                        backgroundColor: '#007bff',
                                        borderRadius: 2,
                                        transition: 'width 0.3s ease'
                                    } }) })] }, fileName)))] })) : (_jsxs("div", { children: [_jsx("div", { style: { fontSize: 18, fontWeight: 600, marginBottom: 8 }, children: "\uC774\uBBF8\uC9C0\uB97C \uC5EC\uAE30\uC5D0 \uB4DC\uB798\uADF8\uD558\uAC70\uB098 \uD074\uB9AD\uD558\uC138\uC694" }), _jsxs("div", { style: { color: '#666', fontSize: 14 }, children: ["\uCD5C\uB300 ", maxImages, "\uAC1C, ", maxSizeMB, "MB \uC774\uD558"] }), _jsxs("div", { style: { color: '#999', fontSize: 12, marginTop: 4 }, children: [acceptedTypes.map(type => type.split('/')[1]).join(', '), " \uD615\uC2DD \uC9C0\uC6D0"] })] }))] }));
}
