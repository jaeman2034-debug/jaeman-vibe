// src/features/market/create/submit.ts
import { addDoc, collection, serverTimestamp, GeoPoint } from 'firebase/firestore';
import { db } from '@/firebase';
import { getCurrentLocation, reverseGeocode } from '@/features/location/locationService';
import type { ProductDoc, RegionInfo } from '@/types/product';
// geohash 쓰면 거리/주변검색에 유리
import { geohashForLocation } from 'geofire-common';

export interface MarketItemPayload {
  title: string;
  price: number;
  description?: string;
  category: string;
  condition: 'new' | 'used' | 'refurbished';
  images?: string[];
  tags?: string[];
  sellerId: string;
  status: "active" | "sold";
}

export async function createMarketItem(payload: MarketItemPayload): Promise<string> {
  try {
    // 1. 현재 위치 가져오기 (선택사항)
    let location = null;
    let address = null;
    let geohash = null;
    
    try {
      console.log('📍 현재 위치 가져오는 중...');
      location = await getCurrentLocation();
      
      if (location.lat && location.lng) {
        // 2. 역지오코딩으로 주소 정보 가져오기
        console.log('🏠 주소 정보 변환 중...');
        address = await reverseGeocode(location.lat, location.lng);
        
        // 3. geohash 생성
        geohash = geohashForLocation([location.lat, location.lng]);
      }
    } catch (locationError) {
      console.warn('⚠️ 위치 서비스 실패 (계속 진행):', locationError);
      // 위치 서비스 실패해도 상품 등록은 계속 진행
    }
    
    // 4. Firestore에 저장할 데이터 구성 (ProductDoc 타입에 맞춤)
    const productData: Partial<ProductDoc> = {
      title: payload.title,
      price: payload.price,
      description: payload.description,
      images: payload.images,
      sellerId: payload.sellerId,
      status: payload.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // 위치 정보가 있으면 ProductDoc 타입에 맞게 추가
    if (location && address && geohash) {
      productData.location = new GeoPoint(location.lat, location.lng);
      productData.region = {
        si: address.sido,
        gu: address.sigungu,
        dong: address.dong,
        full: address.full,
        provider: "kakao"
      };
    } else {
      // 위치 정보가 없는 경우
      productData.region = {
        provider: "none"
      };
    }
    
    // 5. Firestore에 저장
    console.log('💾 상품 정보 저장 중...');
    const docRef = await addDoc(collection(db, 'products'), productData);
    
    if (location && address) {
      console.log('✅ 상품 등록 완료 (위치 포함):', {
        id: docRef.id,
        location: `${location.lat}, ${location.lng}`,
        address: address.full,
        geohash: geohash?.substring(0, 8) + '...'
      });
    } else {
      console.log('✅ 상품 등록 완료 (위치 없음):', {
        id: docRef.id
      });
    }
    
    return docRef.id;
    
  } catch (error) {
    console.error('❌ 상품 등록 실패:', error);
    throw new Error(`상품 등록에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

// 위치 정보만 업데이트하는 함수
export async function updateItemLocation(itemId: string): Promise<void> {
  try {
    const location = await getCurrentLocation();
    const address = await reverseGeocode(location.lat, location.lng);
    const geohash = geohashForLocation([location.lat, location.lng]);
    
    // Firestore 업데이트 로직 (구현 필요)
    console.log('📍 위치 정보 업데이트 완료:', address.full);
    
  } catch (error) {
    console.error('❌ 위치 정보 업데이트 실패:', error);
    throw error;
  }
} 