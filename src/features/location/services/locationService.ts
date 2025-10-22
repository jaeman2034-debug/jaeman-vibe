import type { Group, Job } from '@/shared/types/product';

export type Location = { lat: number; lng: number };

/** Î∏åÎùº?∞Ï? ?ÑÏπò ?ïÎ≥¥ Í∞Ä?∏Ïò§Í∏?*/
export async function getBrowserLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(new Error(`Location error: ${error.message}`));
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });
}

/** Kakao reverse geocoding?ºÎ°ú ?âÏ†ï???ïÎ≥¥ Í∞Ä?∏Ïò§Í∏?*/
export async function getDongFromLocation(loc: Location): Promise<string | null> {
  try {
    const kakaoKey = import.meta.env.VITE_KAKAO_REST_KEY;
    if (!kakaoKey) {
      console.warn('Kakao REST API key not found');
      return null;
    }

    const response = await fetch(
      `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${loc.lng}&y=${loc.lat}`,
      {
        headers: {
          'Authorization': `KakaoAK ${kakaoKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Kakao API error: ${response.status}`);
    }

    const data = await response.json();
    const address = data.documents?.[0]?.address;
    
    if (address?.region_3depth_name) {
      return address.region_3depth_name; // ?âÏ†ï??
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get dong from location:', error);
    return null;
  }
}

/** Î™®ÏûÑ/Íµ¨ÏßÅ Î¨∏ÏÑú???âÏ†ï???ïÎ≥¥ ?êÎèô Î≥¥Ï†ï */
export async function autoCorrectDong<T extends Group | Job>(
  collection: string,
  docId: string,
  loc: Location | null
): Promise<string | null> {
  if (!loc) return null;
  
  try {
    const dong = await getDongFromLocation(loc);
    if (dong) {
      // Firestore ?ÖÎç∞?¥Ìä∏
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { FIREBASE } = await import('@/lib/firebase');
      
      await updateDoc(doc(FIREBASE.db, collection, docId), {
        dong,
        updatedAt: serverTimestamp()
      });
      
      return dong;
    }
  } catch (error) {
    console.error('Auto-correct dong failed:', error);
  }
  
  return null;
}
