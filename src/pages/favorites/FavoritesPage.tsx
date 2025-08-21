import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUid, LoginRequiredUI } from '../../lib/auth';
import { 
  getUserFavoritesWithDetails, 
  subscribeToUserFavorites,
  searchFavorites 
} from '../../services/favoriteService';
import FavoriteButton from '../../components/favorite/FavoriteButton';
import SearchBox from '../../components/search/SearchBox';
import type { MarketItem } from '../../features/market/types';

interface FavoriteWithItem {
  id: string;
  itemId: string;
  userId: string;
  createdAt: any;
  item: MarketItem;
}

export default function FavoritesPage() {
  const uid = getUid();
  const [favorites, setFavorites] = useState<FavoriteWithItem[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteWithItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 로그인 상태 확인
  if (!uid) {
    return <LoginRequiredUI message="찜한 상품을 보려면 로그인이 필요합니다." />;
  }

  // 찜한 상품 목록 로드
  useEffect(() => {
    loadFavorites();
    
    // 실시간 구독
    const unsubscribe = subscribeToUserFavorites(uid, (favoriteItems) => {
      // 찜한 상품의 상세 정보와 함께 조회
      loadFavoritesWithDetails();
    });

    return () => unsubscribe();
  }, [uid]);

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      const favoritesWithDetails = await getUserFavoritesWithDetails(uid);
      setFavorites(favoritesWithDetails);
      setFilteredFavorites(favoritesWithDetails);
    } catch (error) {
      console.error('찜한 상품 로드 실패:', error);
      setError('찜한 상품을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFavoritesWithDetails = async () => {
    try {
      const favoritesWithDetails = await getUserFavoritesWithDetails(uid);
      setFavorites(favoritesWithDetails);
      
      // 검색 쿼리가 있으면 필터링 적용
      if (searchQuery.trim()) {
        const searchResults = await searchFavorites(uid, searchQuery);
        setFilteredFavorites(searchResults);
      } else {
        setFilteredFavorites(favoritesWithDetails);
      }
    } catch (error) {
      console.error('찜한 상품 상세 정보 로드 실패:', error);
    }
  };

  // 검색 처리
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredFavorites(favorites);
      return;
    }

    try {
      const searchResults = await searchFavorites(uid, query);
      setFilteredFavorites(searchResults);
    } catch (error) {
      console.error('찜한 상품 검색 실패:', error);
    }
  };

  // 찜하기 상태 변경 처리
  const handleFavoriteChange = (itemId: string, isFavorited: boolean) => {
    if (!isFavorited) {
      // 찜 해제된 경우 목록에서 제거
      setFavorites(prev => prev.filter(fav => fav.itemId !== itemId));
      setFilteredFavorites(prev => prev.filter(fav => fav.itemId !== itemId));
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">찜한 상품을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 로그인 체크는 이미 컴포넌트 시작 부분에서 완료됨

  // 에러 상태
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={loadFavorites}
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">❤️ 찜한 상품</h1>
            <p className="text-gray-600">
              총 <span className="font-semibold">{favorites.length}개</span>의 상품을 찜했습니다
            </p>
          </div>
          
          <SearchBox 
            onSearchResults={handleSearch}
            placeholder="찜한 상품에서 검색..."
            className="md:w-80"
          />
        </div>
      </div>

      {/* 검색 결과가 없을 때 */}
      {searchQuery.trim() && filteredFavorites.length === 0 && (
        <div className="text-center py-16">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
          <p className="text-gray-600 mb-6">
            "{searchQuery}"에 대한 찜한 상품을 찾을 수 없습니다.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilteredFavorites(favorites);
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            전체 찜한 상품 보기
          </button>
        </div>
      )}

      {/* 찜한 상품이 없을 때 */}
      {!searchQuery.trim() && favorites.length === 0 && (
        <div className="text-center py-16">
          <div className="text-gray-400 text-6xl mb-4">💔</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">아직 찜한 상품이 없습니다</h3>
          <p className="text-gray-600 mb-6">
            마음에 드는 상품을 찜해보세요!
          </p>
          <Link
            to="/market"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            상품 둘러보기
          </Link>
        </div>
      )}

      {/* 찜한 상품 목록 */}
      {filteredFavorites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFavorites.map((favorite) => (
            <div
              key={favorite.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              {/* 상품 이미지 */}
              <div className="aspect-square bg-gray-100 overflow-hidden relative">
                {favorite.item.images && favorite.item.images.length > 0 ? (
                  <img
                    src={favorite.item.images[0]}
                    alt={favorite.item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">
                    📷
                  </div>
                )}

                {/* 찜하기 버튼 (우상단) */}
                <div className="absolute top-2 right-2">
                  <FavoriteButton
                    itemId={favorite.itemId}
                    size="sm"
                    onFavoriteChange={(isFavorited) => 
                      handleFavoriteChange(favorite.itemId, isFavorited)
                    }
                  />
                </div>

                {/* AI 컨디션 배지 */}
                {favorite.item.ai?.condition && (
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      favorite.item.ai.condition === 'A' 
                        ? 'bg-green-100 text-green-800' 
                        : favorite.item.ai.condition === 'B'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {favorite.item.ai.condition}급
                    </span>
                  </div>
                )}
              </div>

              {/* 상품 정보 */}
              <div className="p-4">
                <Link
                  to={`/market/${favorite.itemId}`}
                  className="block hover:text-blue-600 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                    {favorite.item.title}
                  </h3>
                </Link>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-blue-600">
                    {favorite.item.price.toLocaleString()}원
                  </span>
                  <span className="text-xs text-gray-500">
                    {favorite.createdAt?.toDate ? 
                      favorite.createdAt.toDate().toLocaleDateString('ko-KR') : 
                      '날짜 정보 없음'
                    }
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>{favorite.item.category}</span>
                  <span>{favorite.item.region}</span>
                </div>

                {/* AI 태그 */}
                {favorite.item.ai?.tags && favorite.item.ai.tags.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {favorite.item.ai.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {favorite.item.ai.tags.length > 3 && (
                        <span className="text-xs px-2 py-1 bg-gray-200 text-gray-500 rounded-full">
                          +{favorite.item.ai.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 찜한 날짜 */}
                <div className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">
                  찜한 날짜: {favorite.createdAt?.toDate ? 
                    favorite.createdAt.toDate().toLocaleDateString('ko-KR') : 
                    '날짜 정보 없음'
                  }
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 검색 결과 요약 */}
      {searchQuery.trim() && filteredFavorites.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            "{searchQuery}" 검색 결과: <span className="font-semibold">{filteredFavorites.length}개</span>
          </p>
        </div>
      )}
    </div>
  );
} 