import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUid, LoginRequiredUI } from '../../lib/auth';
import { 
  getUserItemsByStatus, 
  getStatusStatistics,
  subscribeToUserItemsStatus,
  type ItemStatus 
} from '../../services/marketStatusService';
import StatusBadge from '../../components/market/StatusBadge';
import StatusChangeModal from '../../components/market/StatusChangeModal';
import type { MarketItem } from '../../features/market/types';

export default function MyItemsPage() {
  const uid = getUid();
  const [items, setItems] = useState<MarketItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<MarketItem[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<ItemStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({ active: 0, reserved: 0, sold: 0, total: 0 });
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);

  // 로그인 상태 확인
  if (!uid) {
    return <LoginRequiredUI message="내 상품을 관리하려면 로그인이 필요합니다." />;
  }

  // 상품 목록 로드
  useEffect(() => {
    loadItems();
    loadStatistics();
    
    // 실시간 구독
    const unsubscribe = subscribeToUserItemsStatus(uid, (userItems) => {
      setItems(userItems);
      setFilteredItems(filterItemsByStatus(userItems, selectedStatus === 'all' ? undefined : selectedStatus));
      loadStatistics();
    });

    return () => unsubscribe();
  }, [uid]);

  const loadItems = async () => {
    try {
      setIsLoading(true);
      const userItems = await getUserItemsByStatus(uid);
      setItems(userItems);
      setFilteredItems(filterItemsByStatus(userItems, selectedStatus === 'all' ? undefined : selectedStatus));
    } catch (error) {
      console.error('상품 로드 실패:', error);
      setError('상품을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const statistics = await getStatusStatistics(uid);
      setStats(statistics);
    } catch (error) {
      console.error('통계 로드 실패:', error);
    }
  };

  // 상태별 필터링
  const filterItemsByStatus = (items: MarketItem[], status?: ItemStatus) => {
    if (!status) return items;
    return items.filter(item => item.status === status);
  };

  // 상태 필터 변경
  const handleStatusFilterChange = (status: ItemStatus | 'all') => {
    setSelectedStatus(status);
    if (status === 'all') {
      setFilteredItems(items);
    } else {
      setFilteredItems(filterItemsByStatus(items, status));
    }
  };

  // 상태 변경 모달 열기
  const openStatusModal = (item: MarketItem) => {
    setSelectedItem(item);
    setIsStatusModalOpen(true);
  };

  // 상태 변경 처리
  const handleStatusChange = (newStatus: ItemStatus) => {
    if (selectedItem) {
      setItems(prev => prev.map(item => 
        item.id === selectedItem.id ? { ...item, status: newStatus } : item
      ));
      setFilteredItems(prev => prev.map(item => 
        item.id === selectedItem.id ? { ...item, status: newStatus } : item
      ));
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">내 상품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={loadItems}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📦 내 상품 관리</h1>
        <p className="text-gray-600">
          등록한 상품의 상태를 관리하고 변경할 수 있습니다
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">전체 상품</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-600">판매중</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.reserved}</div>
          <div className="text-sm text-gray-600">예약중</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.sold}</div>
          <div className="text-sm text-gray-600">판매완료</div>
        </div>
      </div>

      {/* 상태별 필터 */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleStatusFilterChange('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체 ({stats.total})
          </button>
          <button
            onClick={() => handleStatusFilterChange('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            판매중 ({stats.active})
          </button>
          <button
            onClick={() => handleStatusFilterChange('reserved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === 'reserved'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            예약중 ({stats.reserved})
          </button>
          <button
            onClick={() => handleStatusFilterChange('sold')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === 'sold'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            판매완료 ({stats.sold})
          </button>
        </div>
      </div>

      {/* 상품이 없을 때 */}
      {filteredItems.length === 0 && (
        <div className="text-center py-16">
          <div className="text-gray-400 text-6xl mb-4">
            {selectedStatus === 'all' ? '📦' : '🔍'}
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {selectedStatus === 'all' ? '등록된 상품이 없습니다' : `${selectedStatus === 'active' ? '판매중' : selectedStatus === 'reserved' ? '예약중' : '판매완료'}인 상품이 없습니다`}
          </h3>
          <p className="text-gray-600 mb-6">
            {selectedStatus === 'all' ? '첫 번째 상품을 등록해보세요!' : '다른 상태의 상품을 확인해보세요.'}
          </p>
          {selectedStatus === 'all' && (
            <Link
              to="/market/new"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              + 상품 등록
            </Link>
          )}
        </div>
      )}

      {/* 상품 목록 */}
      {filteredItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200"
            >
              {/* 상품 이미지 */}
              <div className="aspect-square bg-gray-100 overflow-hidden relative">
                {item.images && item.images.length > 0 ? (
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-fit-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                    📷
                  </div>
                )}

                {/* 상태 배지 (우상단) */}
                <div className="absolute top-2 right-2">
                  <StatusBadge status={item.status} size="sm" />
                </div>
              </div>

              {/* 상품 정보 */}
              <div className="p-4">
                <Link
                  to={`/market/${item.id}`}
                  className="block hover:text-blue-600 transition-colors mb-2"
                >
                  <h3 className="font-medium text-gray-900 line-clamp-2">
                    {item.title}
                  </h3>
                </Link>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-blue-600">
                    {item.price.toLocaleString()}원
                  </span>
                  <span className="text-xs text-gray-500">
                    {item.createdAt?.toDate ? 
                      item.createdAt.toDate().toLocaleDateString('ko-KR') : 
                      '날짜 정보 없음'
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{item.category}</span>
                  <span>{item.region}</span>
                </div>

                {/* 상태 변경 버튼 */}
                <button
                  onClick={() => openStatusModal(item)}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  상태 변경
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 상태 변경 모달 */}
      {selectedItem && (
        <StatusChangeModal
          item={selectedItem}
          isOpen={isStatusModalOpen}
          onClose={() => {
            setIsStatusModalOpen(false);
            setSelectedItem(null);
          }}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
} 