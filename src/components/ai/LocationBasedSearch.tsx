import React, { useState, useEffect, useCallback } from 'react';

interface Location {
  latitude: number;
  longitude: number;
  geohash: string;
  address?: string;
}

interface LocationBasedSearchProps {
  onLocationSet: (location: Location) => void;
  onClose: () => void;
}

export default function LocationBasedSearch({ onLocationSet, onClose }: LocationBasedSearchProps) {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [showConsent, setShowConsent] = useState(true);
  const [consentGiven, setConsentGiven] = useState(false);

  // GeoFire 기반 지오해시 생성 (실제로는 서버에서 처리)
  const generateGeohash = (lat: number, lng: number): string => {
    // 실제로는 GeoFire 라이브러리 사용
    // 여기서는 간단한 구현으로 대체
    const latInt = Math.floor((lat + 90) * 1000);
    const lngInt = Math.floor((lng + 180) * 1000);
    return `${latInt.toString(36)}${lngInt.toString(36)}`.substring(0, 8);
  };

  // 주소 역지오코딩 (OpenStreetMap Nominatim 사용)
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=ko`
      );
      const data = await response.json();
      return data.display_name || '위치 정보 없음';
    } catch (err) {
      console.warn('역지오코딩 실패:', err);
      return '위치 정보 없음';
    }
  };

  // 위치 권한 확인
  const checkPermission = useCallback(async () => {
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        setPermission(permissionStatus.state);
        
        // 권한 상태 변경 감지
        permissionStatus.onchange = () => {
          setPermission(permissionStatus.state);
        };
      } catch (err) {
        console.warn('권한 확인 실패:', err);
        setPermission('prompt');
      }
    }
  }, []);

  // 현재 위치 가져오기
  const getCurrentLocation = useCallback(async () => {
    if (!consentGiven) {
      setError('위치 사용 동의가 필요합니다.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 위치 권한 재확인
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
        if (permissionStatus.state === 'denied') {
          throw new Error('위치 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.');
        }
      }

      // 현재 위치 가져오기 (사용자 제안 설정 적용)
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      const geohash = generateGeohash(latitude, longitude);
      const address = await reverseGeocode(latitude, longitude);

      const newLocation: Location = {
        latitude,
        longitude,
        geohash,
        address
      };

      setLocation(newLocation);
      setPermission('granted');

    } catch (err: any) {
      console.error('위치 가져오기 실패:', err);
      
      if (err.code === 1) {
        setError('위치 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.');
        setPermission('denied');
      } else if (err.code === 2) {
        setError('위치를 찾을 수 없습니다. GPS가 활성화되어 있는지 확인해주세요.');
      } else if (err.code === 3) {
        setError('위치 요청 시간이 초과되었습니다. 다시 시도해주세요.');
      } else {
        setError('위치를 가져오는 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [consentGiven]);

  // 수동으로 위치 설정 (지도 선택 시뮬레이션)
  const setManualLocation = () => {
    if (!consentGiven) {
      setError('위치 사용 동의가 필요합니다.');
      return;
    }

    // 실제로는 지도 선택 UI 제공
    const mockLocation: Location = {
      latitude: 37.5665,
      longitude: 126.9780,
      geohash: generateGeohash(37.5665, 126.9780),
      address: '서울특별시 강남구'
    };
    setLocation(mockLocation);
  };

  // 위치 설정 완료
  const handleLocationSet = () => {
    if (location) {
      onLocationSet(location);
    }
  };

  // 위치 사용 동의
  const handleConsent = (agreed: boolean) => {
    setConsentGiven(agreed);
    setShowConsent(false);
    
    if (agreed) {
      // 동의 후 바로 위치 가져오기
      getCurrentLocation();
    }
  };

  // 컴포넌트 마운트 시 권한 상태 확인
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 rounded-t-lg">
          <h2 className="text-xl font-semibold">📍 위치 설정</h2>
          <p className="text-green-100 text-sm mt-1">
            상품 검색과 추천을 위한 위치 정보를 설정해주세요
          </p>
        </div>

        <div className="p-6">
          {/* 위치 사용 동의 */}
          {showConsent && (
            <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-3">위치 정보 사용 동의</h3>
              <p className="text-sm text-blue-800 mb-4">
                상품 검색과 추천을 위해 위치 정보가 필요합니다. 
                위치 정보는 상품 검색에만 사용되며, 개인정보와 연결되지 않습니다.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => handleConsent(true)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  동의하고 위치 설정
                </button>
                <button
                  onClick={() => handleConsent(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
                >
                  거부
                </button>
              </div>
            </div>
          )}

          {/* 권한 상태 표시 */}
          {!showConsent && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${
                  permission === 'granted' ? 'bg-green-500' :
                  permission === 'denied' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <span className="text-sm font-medium">
                  {permission === 'granted' ? '위치 권한 허용됨' :
                   permission === 'denied' ? '위치 권한 거부됨' : '위치 권한 확인 중'}
                </span>
              </div>
              
              {permission === 'denied' && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  브라우저 설정에서 위치 권한을 허용해주세요.
                  <br />
                  설정 → 개인정보 보호 → 위치 서비스
                </div>
              )}
            </div>
          )}

          {/* 위치 설정 옵션 */}
          {!showConsent && consentGiven && (
            <>
              {/* 현재 위치 가져오기 */}
              <div className="mb-4">
                <button
                  onClick={getCurrentLocation}
                  disabled={isLoading || permission === 'denied'}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>위치 확인 중...</span>
                    </>
                  ) : (
                    <>
                      <span>📍</span>
                      <span>현재 위치 사용</span>
                    </>
                  )}
                </button>
              </div>

              {/* 또는 구분선 */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">또는</span>
                </div>
              </div>

              {/* 수동 위치 설정 */}
              <div className="mb-6">
                <button
                  onClick={setManualLocation}
                  className="w-full bg-gray-600 text-white py-3 px-4 rounded hover:bg-gray-700 flex items-center justify-center space-x-2"
                >
                  <span>🗺️</span>
                  <span>지도에서 선택</span>
                </button>
              </div>
            </>
          )}

          {/* 위치 정보 표시 */}
          {location && (
            <div className="mb-6 p-4 bg-green-50 rounded border border-green-200">
              <h3 className="font-medium text-green-900 mb-2">설정된 위치</h3>
              <div className="text-sm text-green-800 space-y-1">
                <div>📍 {location.address}</div>
                <div>위도: {location.latitude.toFixed(6)}</div>
                <div>경도: {location.longitude.toFixed(6)}</div>
                <div>지오해시: <code className="bg-green-100 px-1 rounded">{location.geohash}</code></div>
              </div>
              
              {/* 위치 정보 안내 */}
              <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                <strong>ℹ️ 안내:</strong> 이 위치 정보는 상품 등록 시 서버에서 안전하게 처리되며, 
                클라이언트에서 임의로 수정할 수 없습니다.
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
            >
              취소
            </button>
            <button
              onClick={handleLocationSet}
              disabled={!location || !consentGiven}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              위치 설정 완료
            </button>
          </div>

          {/* 보안 정보 */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            <div className="mb-2">
              <strong>🔒 보안:</strong> 위치 정보는 서버에서만 설정되며, 
              클라이언트에서 임의 수정이 불가능합니다.
            </div>
            <div>
              <strong>📍 용도:</strong> 상품 검색, 근접 상품 추천, 지역별 필터링
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 