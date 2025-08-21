import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import type { MarketItem } from '../features/market/types';

// 상품 상태 타입
export type ItemStatus = 'active' | 'reserved' | 'sold';

// 상태 변경 이력 타입
export interface StatusChangeHistory {
  id: string;
  itemId: string;
  userId: string;
  oldStatus: ItemStatus;
  newStatus: ItemStatus;
  reason?: string;
  createdAt: any; // Firestore Timestamp
}

// 상태 변경 권한 확인
export const canUpdateStatus = async (itemId: string, userId: string): Promise<boolean> => {
  try {
    const itemRef = doc(db, 'market_items', itemId);
    const itemSnap = await getDoc(itemRef);
    
    if (!itemSnap.exists()) {
      return false;
    }
    
    const itemData = itemSnap.data() as MarketItem;
    return itemData.ownerId === userId;
  } catch (error) {
    console.error('상태 변경 권한 확인 실패:', error);
    return false;
  }
};

// 상품 상태 업데이트
export const updateItemStatus = async (
  itemId: string, 
  userId: string, 
  newStatus: ItemStatus,
  reason?: string
): Promise<void> => {
  try {
    // 권한 확인
    const hasPermission = await canUpdateStatus(itemId, userId);
    if (!hasPermission) {
      throw new Error('상품 상태를 변경할 권한이 없습니다.');
    }

    // 현재 상태 조회
    const itemRef = doc(db, 'market_items', itemId);
    const itemSnap = await getDoc(itemRef);
    
    if (!itemSnap.exists()) {
      throw new Error('상품을 찾을 수 없습니다.');
    }
    
    const currentData = itemSnap.data() as MarketItem;
    const oldStatus = currentData.status;

    // 상태 변경이 실제로 필요한지 확인
    if (oldStatus === newStatus) {
      console.log('상태가 이미 동일합니다:', newStatus);
      return;
    }

    // 상품 상태 업데이트
    await updateDoc(itemRef, {
      status: newStatus,
      updatedAt: new Date()
    });

    // 상태 변경 이력 저장
    await saveStatusChangeHistory(itemId, userId, oldStatus, newStatus, reason);

    console.log('상품 상태 업데이트 완료:', {
      itemId,
      oldStatus,
      newStatus,
      reason
    });

  } catch (error) {
    console.error('상품 상태 업데이트 실패:', error);
    throw error;
  }
};

// 상태 변경 이력 저장
const saveStatusChangeHistory = async (
  itemId: string,
  userId: string,
  oldStatus: ItemStatus,
  newStatus: ItemStatus,
  reason?: string
): Promise<void> => {
  try {
    const historyRef = doc(collection(db, 'status_changes'));
    await updateDoc(historyRef, {
      itemId,
      userId,
      oldStatus,
      newStatus,
      reason,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('상태 변경 이력 저장 실패:', error);
    // 이력 저장 실패는 상품 상태 업데이트를 막지 않음
  }
};

// 사용자의 상품 상태별 조회
export const getUserItemsByStatus = async (
  userId: string,
  status?: ItemStatus
): Promise<MarketItem[]> => {
  try {
    let q = query(
      collection(db, 'market_items'),
      where('ownerId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    if (status) {
      q = query(q, where('status', '==', status));
    }

    const querySnapshot = await getDocs(q);
    const items: MarketItem[] = [];
    
    querySnapshot.forEach((doc) => {
      items.push({
        id: doc.id,
        ...doc.data()
      } as MarketItem);
    });
    
    return items;
  } catch (error) {
    console.error('사용자 상품 상태별 조회 실패:', error);
    return [];
  }
};

// 상품 상태별 통계 조회
export const getStatusStatistics = async (userId: string): Promise<{
  active: number;
  reserved: number;
  sold: number;
  total: number;
}> => {
  try {
    const allItems = await getUserItemsByStatus(userId);
    
    const stats = {
      active: allItems.filter(item => item.status === 'active').length,
      reserved: allItems.filter(item => item.status === 'reserved').length,
      sold: allItems.filter(item => item.status === 'sold').length,
      total: allItems.length
    };
    
    return stats;
  } catch (error) {
    console.error('상태 통계 조회 실패:', error);
    return { active: 0, reserved: 0, sold: 0, total: 0 };
  }
};

// 실시간 상품 상태 모니터링
export const subscribeToUserItemsStatus = (
  userId: string,
  callback: (items: MarketItem[]) => void
) => {
  try {
    const q = query(
      collection(db, 'market_items'),
      where('ownerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const items: MarketItem[] = [];
      snapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data()
        } as MarketItem);
      });
      
      callback(items);
    });
  } catch (error) {
    console.error('상품 상태 실시간 구독 실패:', error);
    return () => {};
  }
};

// 상태 변경 이력 조회
export const getStatusChangeHistory = async (
  itemId: string,
  limit: number = 10
): Promise<StatusChangeHistory[]> => {
  try {
    const q = query(
      collection(db, 'status_changes'),
      where('itemId', '==', itemId),
      orderBy('createdAt', 'desc'),
      limit
    );
    
    const querySnapshot = await getDocs(q);
    const history: StatusChangeHistory[] = [];
    
    querySnapshot.forEach((doc) => {
      history.push({
        id: doc.id,
        ...doc.data()
      } as StatusChangeHistory);
    });
    
    return history;
  } catch (error) {
    console.error('상태 변경 이력 조회 실패:', error);
    return [];
  }
};

// 일괄 상태 업데이트 (여러 상품)
export const batchUpdateItemStatus = async (
  operations: {
    itemId: string;
    userId: string;
    newStatus: ItemStatus;
    reason?: string;
  }[]
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    for (const operation of operations) {
      // 권한 확인
      const hasPermission = await canUpdateStatus(operation.itemId, operation.userId);
      if (!hasPermission) {
        throw new Error(`상품 ${operation.itemId}의 상태를 변경할 권한이 없습니다.`);
      }
      
      const itemRef = doc(db, 'market_items', operation.itemId);
      batch.update(itemRef, {
        status: operation.newStatus,
        updatedAt: new Date()
      });
    }
    
    await batch.commit();
    console.log('일괄 상태 업데이트 완료:', operations.length, '개');
    
  } catch (error) {
    console.error('일괄 상태 업데이트 실패:', error);
    throw error;
  }
};

// 상태별 상품 필터링
export const filterItemsByStatus = (
  items: MarketItem[],
  status?: ItemStatus
): MarketItem[] => {
  if (!status) return items;
  return items.filter(item => item.status === status);
};

// 상태 변경 가능 여부 확인
export const canChangeToStatus = (
  currentStatus: ItemStatus,
  targetStatus: ItemStatus
): boolean => {
  // 상태 변경 규칙 정의
  const allowedTransitions: Record<ItemStatus, ItemStatus[]> = {
    active: ['reserved', 'sold'],      // 판매중 → 예약중, 판매완료
    reserved: ['active', 'sold'],     // 예약중 → 판매중, 판매완료
    sold: []                          // 판매완료 → 변경 불가
  };
  
  return allowedTransitions[currentStatus].includes(targetStatus);
};

// 상태별 색상 및 텍스트
export const getStatusDisplayInfo = (status: ItemStatus): {
  color: string;
  backgroundColor: string;
  text: string;
  description: string;
} => {
  switch (status) {
    case 'active':
      return {
        color: '#059669',
        backgroundColor: '#d1fae5',
        text: '판매중',
        description: '현재 판매 중인 상품입니다'
      };
    case 'reserved':
      return {
        color: '#d97706',
        backgroundColor: '#fed7aa',
        text: '예약중',
        description: '구매자가 예약한 상품입니다'
      };
    case 'sold':
      return {
        color: '#dc2626',
        backgroundColor: '#fecaca',
        text: '판매완료',
        description: '판매가 완료된 상품입니다'
      };
    default:
      return {
        color: '#6b7280',
        backgroundColor: '#f3f4f6',
        text: '알 수 없음',
        description: '상태 정보가 없습니다'
      };
  }
}; 