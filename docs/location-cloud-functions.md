# 위치 기반 검색 Cloud Functions 구현 가이드 🌍

## 📋 개요

이 문서는 Cloud Functions를 통한 안전한 위치 정보 설정과 GeoFire 기반 근접 검색 구현 방법을 설명합니다.

## 🎯 핵심 요구사항

### **1. 보안 규칙**
- **클라이언트에서 위치 정보 임의 수정 불가**
- **서버에서만 위치 정보 설정 가능**
- **create 시 request.auth.uid == ownerId 검증**

### **2. 위치 정보 처리**
- **GeoFire/geofirestore 사용**
- **geohash 자동 생성 및 저장**
- **반경 기반 근접 검색 지원**

## 🛠️ Cloud Functions 구현

### **1. 위치 정보 설정 함수**

```typescript
// functions/src/location/setItemLocation.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { generateGeohash } from './geohash';

export const setItemLocation = functions.https.onCall(async (data, context) => {
  // 인증 확인
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  try {
    const { itemId, location } = data;
    
    // 필수 데이터 검증
    if (!itemId || !location) {
      throw new functions.https.HttpsError('invalid-argument', '상품 ID와 위치 정보가 필요합니다.');
    }
    
    if (!location.latitude || !location.longitude) {
      throw new functions.https.HttpsError('invalid-argument', '유효한 좌표가 필요합니다.');
    }

    const db = admin.firestore();
    const itemRef = db.collection('market_items').doc(itemId);

    // 상품 소유자 확인
    const itemDoc = await itemRef.get();
    if (!itemDoc.exists) {
      throw new functions.https.HttpsError('not-found', '상품을 찾을 수 없습니다.');
    }

    const itemData = itemDoc.data();
    if (itemData?.ownerId !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', '상품 소유자만 위치를 설정할 수 있습니다.');
    }

    // geohash 생성 (GeoFire 라이브러리 사용)
    const geohash = generateGeohash(location.latitude, location.longitude);
    
    // 위치 정보 업데이트
    await itemRef.update({
      'geo.latitude': location.latitude,
      'geo.longitude': location.longitude,
      'geo.geohash': geohash,
      'geo.region': location.address || null,
      'geo.updatedAt': admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      data: {
        itemId,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          geohash,
          region: location.address
        }
      }
    };

  } catch (error) {
    console.error('위치 설정 실패:', error);
    throw new functions.https.HttpsError('internal', '위치 설정 중 오류가 발생했습니다.');
  }
});
```

### **2. GeoFire geohash 생성**

```typescript
// functions/src/location/geohash.ts
import * as geofire from 'geofire-common';

export const generateGeohash = (latitude: number, longitude: number): string => {
  // GeoFire 라이브러리 사용
  return geofire.geohashForLocation([latitude, longitude]);
};

export const getGeohashRange = (
  centerLat: number,
  centerLng: number,
  radiusInKm: number
) => {
  // 반경 내 geohash 범위 계산
  const bounds = geofire.geohashQueryBounds([centerLat, centerLng], radiusInKm * 1000);
  
  return bounds.map(b => ({
    start: b[0],
    end: b[1]
  }));
};
```

### **3. 근접 상품 검색 함수**

```typescript
// functions/src/location/searchNearbyItems.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { getGeohashRange } from './geohash';

export const searchNearbyItems = functions.https.onCall(async (data, context) => {
  // 인증 확인
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  try {
    const { latitude, longitude, radiusKm = 10, limit = 20, filters = {} } = data;
    
    // 좌표 검증
    if (!latitude || !longitude) {
      throw new functions.https.HttpsError('invalid-argument', '유효한 좌표가 필요합니다.');
    }

    const db = admin.firestore();
    
    // geohash 범위 계산
    const bounds = getGeohashRange(latitude, longitude, radiusKm);
    
    // 각 geohash 범위에서 검색
    const searchPromises = bounds.map(async (b) => {
      const q = db.collection('market_items')
        .where('geo.geohash', '>=', b.start)
        .where('geo.geohash', '<=', b.end)
        .where('status', '==', 'active')
        .limit(limit);
      
      // 추가 필터 적용
      if (filters.category) {
        q.where('category', '==', filters.category);
      }
      
      if (filters.maxPrice) {
        q.where('price', '<=', filters.maxPrice);
      }
      
      if (filters.minPrice) {
        q.where('price', '>=', filters.minPrice);
      }
      
      if (filters.condition) {
        q.where('condition', '==', filters.condition);
      }
      
      const snapshot = await q.get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        distance: calculateDistance(latitude, longitude, doc.data().geo.latitude, doc.data().geo.longitude)
      }));
    });
    
    const results = await Promise.all(searchPromises);
    const items = results.flat();
    
    // 거리순 정렬 및 중복 제거
    const uniqueItems = items
      .filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      )
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
    
    return {
      success: true,
      data: {
        items: uniqueItems,
        total: uniqueItems.length,
        radius: radiusKm,
        center: { latitude, longitude }
      }
    };

  } catch (error) {
    console.error('근접 검색 실패:', error);
    throw new functions.https.HttpsError('internal', '근접 검색 중 오류가 발생했습니다.');
  }
});

// 거리 계산 (Haversine 공식)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

### **4. 상품 등록 시 위치 자동 설정**

```typescript
// functions/src/location/autoSetLocation.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { generateGeohash } from './geohash';

export const autoSetLocation = functions.firestore
  .document('market_items/{itemId}')
  .onCreate(async (snap, context) => {
    try {
      const itemData = snap.data();
      
      // 위치 정보가 이미 있으면 스킵
      if (itemData.geo) {
        return null;
      }
      
      // 사용자 위치 정보 가져오기
      const userRef = admin.firestore().collection('users').doc(itemData.ownerId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists || !userDoc.data()?.location) {
        console.log('사용자 위치 정보 없음:', itemData.ownerId);
        return null;
      }
      
      const userLocation = userDoc.data()!.location;
      
      // geohash 생성
      const geohash = generateGeohash(userLocation.latitude, userLocation.longitude);
      
      // 상품 위치 정보 업데이트
      await snap.ref.update({
        'geo.latitude': userLocation.latitude,
        'geo.longitude': userLocation.longitude,
        'geo.geohash': geohash,
        'geo.region': userLocation.address || null,
        'geo.autoSet': true,
        'geo.updatedAt': admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('상품 위치 자동 설정 완료:', context.params.itemId);
      
    } catch (error) {
      console.error('상품 위치 자동 설정 실패:', error);
    }
  });
```

## 🔒 보안 규칙 설정

### **1. Firestore 보안 규칙**

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    // 상품 컬렉션
    match /market_items/{itemId} {
      // 읽기: 모든 사용자
      allow read: if true;
      
      // 생성: 인증된 사용자, 소유자 ID 일치
      allow create: if request.auth != null
                    && request.resource.data.ownerId == request.auth.uid
                    && !('geo' in request.resource.data); // 위치 정보는 서버에서만 설정
      
      // 수정: 소유자만, 위치 정보 수정 불가
      allow update: if request.auth != null
                    && resource.data.ownerId == request.auth.uid
                    && !('geo' in request.resource.data); // 위치 정보 수정 금지
      
      // 삭제: 소유자만
      allow delete: if request.auth != null
                    && resource.data.ownerId == request.auth.uid;
    }
    
    // 사용자 컬렉션
    match /users/{userId} {
      // 읽기: 본인만
      allow read: if request.auth != null
                  && request.auth.uid == userId;
      
      // 수정: 본인만, 위치 정보는 서버에서만 설정
      allow update: if request.auth != null
                    && request.auth.uid == userId
                    && !('location' in request.resource.data); // 위치 정보 수정 금지
    }
  }
}
```

### **2. Storage 보안 규칙**

```javascript
// storage.rules
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 상품 이미지
    match /products/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## 📱 클라이언트 연동

### **1. 위치 정보 설정 호출**

```typescript
// src/services/locationService.ts
import { getFunctions, httpsCallable } from 'firebase/firebase';

const functions = getFunctions();
const setItemLocation = httpsCallable(functions, 'setItemLocation');

export const updateItemLocation = async (
  itemId: string, 
  location: Location
) => {
  try {
    const result = await setItemLocation({
      itemId,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address
      }
    });
    
    return result.data;
    
  } catch (error) {
    console.error('위치 설정 실패:', error);
    throw error;
  }
};
```

### **2. 근접 검색 호출**

```typescript
// src/services/locationService.ts
const searchNearbyItems = httpsCallable(functions, 'searchNearbyItems');

export const searchNearbyItemsClient = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 10,
  filters: any = {}
) => {
  try {
    const result = await searchNearbyItems({
      latitude,
      longitude,
      radiusKm,
      limit: 20,
      filters
    });
    
    return result.data;
    
  } catch (error) {
    console.error('근접 검색 실패:', error);
    throw error;
  }
};
```

## 🗺️ 지도 연동 (선택사항)

### **1. Google Maps API 연동**

```typescript
// functions/src/location/mapsIntegration.ts
import * as functions from 'firebase-functions';
import { Client } from '@googlemaps/google-maps-services-js';

const client = new Client({});

export const getAddressFromCoordinates = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '로그인이 필요합니다.');
  }

  try {
    const { latitude, longitude } = data;
    
    const response = await client.reverseGeocode({
      params: {
        latlng: { lat: latitude, lng: longitude },
        key: process.env.GOOGLE_MAPS_API_KEY,
        language: 'ko'
      }
    });
    
    if (response.data.results.length > 0) {
      const address = response.data.results[0].formatted_address;
      return { success: true, address };
    }
    
    return { success: false, address: null };
    
  } catch (error) {
    console.error('주소 변환 실패:', error);
    throw new functions.https.HttpsError('internal', '주소 변환 중 오류가 발생했습니다.');
  }
});
```

## 📊 성능 최적화

### **1. 인덱스 설정**

```json
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "market_items",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "geo.geohash", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "market_items",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "geo.geohash", "order": "ASCENDING" },
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "market_items",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "geo.geohash", "order": "ASCENDING" },
        { "fieldPath": "price", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    }
  ]
}
```

### **2. 캐싱 전략**

```typescript
// functions/src/location/cache.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Redis 캐싱 (선택사항)
export const cacheNearbyResults = functions.https.onCall(async (data, context) => {
  // 검색 결과를 Redis에 캐싱하여 반복 요청 최적화
  // TTL 설정으로 데이터 신선도 유지
});
```

## 🔮 향후 개선 방향

### **1. 단기 (1-2개월)**
- [ ] GeoFire 라이브러리 완전 연동
- [ ] 위치 기반 실시간 알림
- [ ] 지역별 상품 통계

### **2. 중기 (3-6개월)**
- [ ] 머신러닝 기반 위치 추천
- [ ] 이동 패턴 분석
- [ ] 지역별 가격 동향

### **3. 장기 (6개월+)**
- [ ] AR 기반 위치 시각화
- [ ] 실시간 교통 정보 연동
- [ ] 글로벌 위치 서비스

## 🎉 결론

이 위치 기반 검색 시스템은 **보안성**과 **성능**을 모두 고려하여 설계되었습니다.

**클라이언트에서 위치 정보 임의 수정을 방지**하고, **서버에서만 안전하게 처리**하여 데이터 무결성을 보장합니다.

**GeoFire 기반의 효율적인 근접 검색**으로 사용자에게 정확하고 빠른 지역 기반 서비스를 제공할 수 있습니다! 🌍✨ 