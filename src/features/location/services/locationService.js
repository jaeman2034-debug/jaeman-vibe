/** 브라우저 위치 정보 가져오기 */
export async function getBrowserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }
        navigator.geolocation.getCurrentPosition((position) => {
            resolve({
                lat: position.coords.latitude,
                lng: position.coords.longitude
            });
        }, (error) => {
            reject(new Error(`Location error: ${error.message}`));
        }, { timeout: 10000, enableHighAccuracy: true });
    });
}
/** Kakao reverse geocoding으로 행정동 정보 가져오기 */
export async function getDongFromLocation(loc) {
    try {
        const kakaoKey = import.meta.env.VITE_KAKAO_REST_KEY;
        if (!kakaoKey) {
            console.warn('Kakao REST API key not found');
            return null;
        }
        const response = await fetch(`https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${loc.lng}&y=${loc.lat}`, {
            headers: {
                'Authorization': `KakaoAK ${kakaoKey}`
            }
        });
        if (!response.ok) {
            throw new Error(`Kakao API error: ${response.status}`);
        }
        const data = await response.json();
        const address = data.documents?.[0]?.address;
        if (address?.region_3depth_name) {
            return address.region_3depth_name; // 행정동
        }
        return null;
    }
    catch (error) {
        console.error('Failed to get dong from location:', error);
        return null;
    }
}
/** 모임/구직 문서에 행정동 정보 자동 보정 */
export async function autoCorrectDong(collection, docId, loc) {
    if (!loc)
        return null;
    try {
        const dong = await getDongFromLocation(loc);
        if (dong) {
            // Firestore 업데이트
            const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
            const { FIREBASE } = await import('@/lib/firebase');
            await updateDoc(doc(FIREBASE.db, collection, docId), {
                dong,
                updatedAt: serverTimestamp()
            });
            return dong;
        }
    }
    catch (error) {
        console.error('Auto-correct dong failed:', error);
    }
    return null;
}
