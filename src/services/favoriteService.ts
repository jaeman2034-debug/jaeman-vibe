import { 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc, 
  collection, 
  query, 
  getDocs, 
  orderBy,
  onSnapshot,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type { MarketItem } from '../features/market/types';

// 찜하기 타입
export interface FavoriteItem {
  id: string;
  productId: string;
  uid: string;
  createdAt: any; // Firestore Timestamp
  item?: MarketItem; // 상품 정보 (옵션)
}

// 찜하기 추가
export const addToFavorites = async (uid: string, productId: string): Promise<void> => {
  try {
    const favoriteRef = doc(db, 'users', uid, 'favorites', productId);
    await setDoc(favoriteRef, {
      productId,
      createdAt: serverTimestamp(),
    }, { merge: true });
    console.log('찜하기 추가 완료:', productId);
  } catch (error) {
    console.error('찜하기 추가 실패:', error);
    throw new Error('찜하기 추가에 실패했습니다.');
  }
};

// 찜하기 제거
export const removeFromFavorites = async (uid: string, productId: string): Promise<void> => {
  try {
    const favoriteRef = doc(db, 'users', uid, 'favorites', productId);
    await deleteDoc(favoriteRef);
    console.log('찜하기 제거 완료:', productId);
  } catch (error) {
    console.error('찜하기 제거 실패:', error);
    throw new Error('찜하기 제거에 실패했습니다.');
  }
};

// 찜하기 상태 확인
export const isFavorite = async (uid: string, productId: string): Promise<boolean> => {
  try {
    const favoriteRef = doc(db, 'users', uid, 'favorites', productId);
    const docSnap = await getDoc(favoriteRef);
    return docSnap.exists();
  } catch (error) {
    console.error('찜하기 상태 확인 실패:', error);
    return false;
  }
};

// 사용자의 찜한 상품 목록 조회
export const getUserFavorites = async (uid: string): Promise<FavoriteItem[]> => {
  try {
    const favoritesRef = collection(db, 'users', uid, 'favorites');
    const q = query(favoritesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const favorites: FavoriteItem[] = [];
    querySnapshot.forEach((doc) => {
      favorites.push({
        id: doc.id,
        ...doc.data()
      } as FavoriteItem);
    });
    
    return favorites;
  } catch (error) {
    console.error('찜한 상품 목록 조회 실패:', error);
    return [];
  }
};

// 찜한 상품의 상세 정보와 함께 조회
export const getUserFavoritesWithDetails = async (uid: string): Promise<(FavoriteItem & { item: MarketItem })[]> => {
  try {
    const favorites = await getUserFavorites(uid);
    
    // 각 찜한 상품의 상세 정보 조회
    const favoritesWithDetails = await Promise.all(
      favorites.map(async (favorite) => {
        try {
          const itemRef = doc(db, 'products', favorite.productId);
          const itemSnap = await getDoc(itemRef);
          
          if (itemSnap.exists()) {
            return {
              ...favorite,
              item: { id: itemSnap.id, ...itemSnap.data() } as MarketItem
            };
          } else {
            // 상품이 삭제된 경우
            return {
              ...favorite,
              item: undefined
            };
          }
        } catch (error) {
          console.error('상품 정보 조회 실패:', favorite.productId, error);
          return {
            ...favorite,
            item: undefined
          };
        }
      })
    );
    
    // 상품 정보가 있는 것만 필터링
    return favoritesWithDetails.filter(fav => fav.item) as (FavoriteItem & { item: MarketItem })[];
  } catch (error) {
    console.error('찜한 상품 상세 정보 조회 실패:', error);
    return [];
  }
};

// 실시간 찜한 상품 목록 구독
export const subscribeToUserFavorites = (
  uid: string,
  callback: (favorites: FavoriteItem[]) => void
) => {
  try {
    const favoritesRef = collection(db, 'users', uid, 'favorites');
    const q = query(favoritesRef, orderBy('createdAt', 'desc'));
    
    return onSnapshot(q, (snapshot) => {
      const favorites: FavoriteItem[] = [];
      snapshot.forEach((doc) => {
        favorites.push({
          id: doc.id,
          ...doc.data()
        } as FavoriteItem);
      });
      
      callback(favorites);
    });
  } catch (error) {
    console.error('찜한 상품 실시간 구독 실패:', error);
    return () => {};
  }
};

// 찜한 상품 개수 조회
export const getFavoriteCount = async (uid: string): Promise<number> => {
  try {
    const favorites = await getUserFavorites(uid);
    return favorites.length;
  } catch (error) {
    console.error('찜한 상품 개수 조회 실패:', error);
    return 0;
  }
};

// 상품의 찜한 사용자 수 조회
export const getItemFavoriteCount = async (productId: string): Promise<number> => {
  try {
    // 모든 사용자의 찜한 상품에서 해당 상품을 찾기
    // 실제 운영에서는 별도 필드로 관리하는 것이 효율적
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);
    
    let totalCount = 0;
    
    for (const userDoc of usersSnap.docs) {
      const userFavoritesRef = collection(db, 'users', userDoc.id, 'favorites');
      const itemSnap = await getDoc(doc(userFavoritesRef, productId));
      if (itemSnap.exists()) {
        totalCount++;
      }
    }
    
    return totalCount;
  } catch (error) {
    console.error('상품 찜한 사용자 수 조회 실패:', error);
    return 0;
  }
};

// 찜하기 일괄 처리 (여러 상품을 한 번에 찜하기/제거)
export const batchUpdateFavorites = async (
  uid: string,
  operations: { productId: string; action: 'add' | 'remove' }[]
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    operations.forEach(({ productId, action }) => {
      const favoriteRef = doc(db, 'users', uid, 'favorites', productId);
      
      if (action === 'add') {
        batch.set(favoriteRef, {
          productId,
          createdAt: serverTimestamp()
        });
      } else if (action === 'remove') {
        batch.delete(favoriteRef);
      }
    });
    
    await batch.commit();
    console.log('찜하기 일괄 처리 완료:', operations.length, '개');
  } catch (error) {
    console.error('찜하기 일괄 처리 실패:', error);
    throw new Error('찜하기 일괄 처리에 실패했습니다.');
  }
};

// 찜한 상품 검색 (제목, 태그 등으로)
export const searchFavorites = async (
  uid: string,
  searchQuery: string
): Promise<(FavoriteItem & { item: MarketItem })[]> => {
  try {
    const allFavorites = await getUserFavoritesWithDetails(uid);
    
    if (!searchQuery.trim()) {
      return allFavorites;
    }
    
    const queryLower = searchQuery.toLowerCase();
    
    return allFavorites.filter((favorite) => {
      const item = favorite.item;
      if (!item) return false;
      
      // 제목 검색
      if (item.title.toLowerCase().includes(queryLower)) {
        return true;
      }
      
      // 설명 검색
      if (item.description.toLowerCase().includes(queryLower)) {
        return true;
      }
      
      // 카테고리 검색
      if (item.category && item.category.toLowerCase().includes(queryLower)) {
        return true;
      }
      
      // AI 태그 검색
      if (item.ai?.tags) {
        const tagMatch = item.ai.tags.some(tag => 
          tag.toLowerCase().includes(queryLower)
        );
        if (tagMatch) return true;
      }
      
      // 브랜드 검색
      if (item.ai?.brand && item.ai.brand.toLowerCase().includes(queryLower)) {
        return true;
      }
      
      return false;
    });
  } catch (error) {
    console.error('찜한 상품 검색 실패:', error);
    return [];
  }
}; 