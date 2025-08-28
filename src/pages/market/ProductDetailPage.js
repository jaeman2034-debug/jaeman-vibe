import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUid } from '@/lib/auth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
export default function ProductDetailPage() { const { id } = useParams(); const navigate = useNavigate(); const [product, setProduct] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(null); const [currentImageIndex, setCurrentImageIndex] = useState(0); const uid = getUid(); useEffect(() => { if (!id)
    return; const fetchProduct = async () => { try {
    setLoading(true);
    const docRef = doc(db, 'products', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        setProduct({ id: docSnap.id, ...data });
    }
    else {
        setError('?�품??찾을 ???�습?�다.');
    }
}
catch (err) {
    console.error('?�품 조회 ?�패:', err);
    setError('?�품 조회???�패?�습?�다: ' + err.message);
}
finally {
    setLoading(false);
} }; fetchProduct(); }, [id]); if (loading) {
    return (_jsxs("div", { style: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }, children: ["        ", _jsx(LoadingSpinner, {}), "      "] }));
} if (error || !product) {
    return _jsx(ErrorState, { message: error || '?�품??찾을 ???�습?�다.' });
} const handleImageChange = (index) => { setCurrentImageIndex(index); }; const formatPrice = (price) => { return price.toLocaleString('ko-KR') + '??;  };  const formatDate = (timestamp: any) => {    if (!timestamp) return ' ?  : ; }; }
