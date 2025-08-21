import { useEffect, useState } from 'react';
import { searchNearby } from '@/lib/geoQuery';
import { Link } from 'react-router-dom';
import { getUserLocation } from '@/lib/location';
import DistanceBadge from '@/components/market/DistanceBadge';

export default function Nearby() {
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState('');
  const [radius, setRadius] = useState(5000);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const loadNearbyItems = async () => {
      try {
        // 사용자 위치 가져오기
        const location = await getUserLocation();
        if (!location) {
          setErr('위치 정보를 가져올 수 없습니다.');
          return;
        }
        
        setUserLocation(location);
        
        // 근처 상품 검색
        const res = await searchNearby(location.lat, location.lng, radius);
        setItems(res);
      } catch (error: any) {
        console.error('근처 상품 검색 실패:', error);
        setErr(error?.message || '근처 상품 검색에 실패했습니다.');
      }
    };

    loadNearbyItems();
  }, [radius]);

  if (err) return <div style={{padding:16}}>위치 권한이 필요합니다: {err}</div>;

  return (
    <div style={{padding:16}}>
      <h3>내 주변</h3>
      <div style={{margin:'8px 0'}}>
        반경:
        <select value={radius} onChange={e=>setRadius(Number(e.target.value))}>
          <option value={1000}>1km</option>
          <option value={3000}>3km</option>
          <option value={5000}>5km</option>
          <option value={10000}>10km</option>
        </select>
      </div>
      
      {userLocation && (
        <div style={{marginBottom: 16, fontSize: '14px', color: '#666'}}>
          현재 위치: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
        </div>
      )}
      
      {items.map(it => (
        <Link key={it.id} to={`/market/${it.id}`} style={{display:'block', padding:'8px 0'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span>{it.title}</span>
            {it.geo && userLocation && (
              <DistanceBadge
                itemGeo={it.geo}
                userLocation={userLocation}
                showIcon={false}
              />
            )}
          </div>
        </Link>
      ))}
      {!items.length && <div>주변 상품이 없습니다.</div>}
    </div>
  );
} 