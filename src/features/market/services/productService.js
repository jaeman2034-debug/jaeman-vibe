import FIREBASE from '@/lib/firebase';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, arrayUnion, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
const col = () => collection(FIREBASE.db, 'products');
function safeName(name) {
    return name.replace(/[^\w.\-ㄱ-힣]/g, '_');
}
/** 리스트 (최신순, 기본 120개) */
export async function listProducts(max = 120) {
    try {
        const q = query(col(), orderBy('createdAt', 'desc'), limit(max));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    catch {
        // 기존 문서에 createdAt 없을 때 폴백
        const snap = await getDocs(col());
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
}
/** 서버 사이드 필터링 (인덱스 필요) */
export async function listProductsServer(filters) {
    try {
        let q = query(col());
        // 가격 범위 필터
        if (filters.priceMin !== undefined) {
            q = query(q, where('price', '>=', filters.priceMin));
        }
        if (filters.priceMax !== undefined) {
            q = query(q, where('price', '<=', filters.priceMax));
        }
        // 날짜 범위 필터
        if (filters.dateFrom) {
            q = query(q, where('createdAt', '>=', filters.dateFrom));
        }
        if (filters.dateTo) {
            q = query(q, where('createdAt', '<=', filters.dateTo));
        }
        // 정렬
        const sortField = filters.sortBy || 'createdAt';
        const sortOrder = filters.sortOrder || 'desc';
        q = query(q, orderBy(sortField, sortOrder));
        // 제한
        if (filters.limit) {
            q = query(q, limit(filters.limit));
        }
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    catch (error) {
        console.error('서버 사이드 필터링 실패:', error);
        console.log('필요한 인덱스를 생성하려면 콘솔 링크를 클릭하세요.');
        // 폴백: 클라이언트 사이드 필터링
        return listProducts(filters.limit || 120);
    }
}
/** 필터링된 상품 목록 (클라이언트 사이드) */
export function filterProducts(products, filters) {
    return products.filter(product => {
        // 검색어 필터
        if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            const titleMatch = product.title.toLowerCase().includes(term);
            const descMatch = product.desc?.toLowerCase().includes(term) || false;
            if (!titleMatch && !descMatch)
                return false;
        }
        // 카테고리 필터
        if (filters.category && product.category !== filters.category) {
            return false;
        }
        // 행정동 필터
        if (filters.dong && product.dong !== filters.dong) {
            return false;
        }
        return true;
    });
}
/** 상세 */
export async function getProduct(id) {
    const snap = await getDoc(doc(FIREBASE.db, 'products', id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
/** 생성 (파일 선택은 '프리뷰만', 저장 시에만 업로드) */
export async function createProduct(data) {
    const now = serverTimestamp();
    const refDoc = await addDoc(col(), {
        ...data,
        images: [],
        hasImages: false,
        cover: '',
        createdAt: now,
        updatedAt: now,
    });
    return refDoc.id;
}
/** 업데이트 */
export async function updateProduct(id, patch) {
    await updateDoc(doc(FIREBASE.db, 'products', id), { ...patch, updatedAt: serverTimestamp() });
}
/** 이미지 업로드 + 문서 반영 (cover 없으면 cover로 지정) */
export async function uploadProductImage(productId, file) {
    const p = `market/${productId}/${Date.now()}-${safeName(file.name)}`;
    const task = uploadBytesResumable(ref(FIREBASE.storage, p), file, { contentType: file.type });
    await task;
    const url = await getDownloadURL(task.snapshot.ref);
    const img = { path: p, url };
    const current = await getProduct(productId);
    const shouldSetCover = !current?.cover;
    await updateDoc(doc(FIREBASE.db, 'products', productId), {
        images: arrayUnion(img),
        hasImages: true,
        ...(shouldSetCover ? { cover: url } : {}),
        updatedAt: serverTimestamp(),
    });
    return img;
}
/** 생성 + (옵션) 다중 이미지 업로드 */
export async function createProductWithOptionalImage(input, file) {
    const id = await createProduct(input);
    // 다중 이미지가 있으면 문서에 반영
    if (input.images && input.images.length > 0) {
        const images = input.images.map((url, index) => ({
            path: `products/${input.ownerId}/${id}/image-${index}`,
            url
        }));
        await updateDoc(doc(FIREBASE.db, 'products', id), {
            images,
            hasImages: true,
            cover: input.coverImageUrl || input.images[0],
            updatedAt: serverTimestamp(),
        });
    }
    else if (file) {
        // 기존 단일 이미지 업로드 지원
        await uploadProductImage(id, file);
    }
    return id;
}
/** 이미지 순서 변경 */
export async function reorderProductImages(productId, newImages) {
    await updateDoc(doc(FIREBASE.db, 'products', productId), {
        images: newImages,
        cover: newImages.length > 0 ? newImages[0].url : '',
        updatedAt: serverTimestamp(),
    });
}
/** 이미지 삭제 */
export async function removeProductImage(productId, imagePath) {
    // Firebase Storage에서 삭제
    const storageRef = ref(FIREBASE.storage, imagePath);
    await deleteObject(storageRef);
    // 상품 문서에서 이미지 제거
    const product = await getProduct(productId);
    if (product) {
        const newImages = product.images?.filter(img => img.path !== imagePath) || [];
        await updateDoc(doc(FIREBASE.db, 'products', productId), {
            images: newImages,
            cover: newImages.length > 0 ? newImages[0].url : '',
            hasImages: newImages.length > 0,
            updatedAt: serverTimestamp(),
        });
    }
}
/** 커버 이미지 설정 */
export async function setProductCoverImage(productId, coverImageUrl) {
    await updateDoc(doc(FIREBASE.db, 'products', productId), {
        cover: coverImageUrl,
        updatedAt: serverTimestamp(),
    });
}
