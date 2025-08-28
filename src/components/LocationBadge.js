import { useState, useEffect } from 'react';
import { reverseGeocodeDong } from '@/lib/geo';
export default function LocationBadge({ my, item }) { const [address, setAddress] = useState(''); const [loading, setLoading] = useState(true); useEffect(() => { const loadAddress = async () => { try {
    setLoading(true);
    const adminAddress = await reverseGeocodeDong(item.lat, item.lng);
    setAddress(adminAddress.full);
}
catch (error) {
    console.error('주소 변???�패:', error);
    setAddress('?�치 ?�보 ?�음');
}
finally {
    setLoading(false);
} }; if (item.lat && item.lng) {
    loadAddress();
}
else {
    setAddress('?�치 ?�보 ?�음');
    setLoading(false);
} }, [item.lat, item.lng]); } // 거리 계산  const distance = my ? distanceMeters(my, item) : null;  const distanceText = distance ? formatDistanceKm(distance) : null;  // 카카?�맵 링크  const mapUrl = `https://map.kakao.com/link/map/${encodeURIComponent(address)},${item.lat},${item.lng}`;  if (loading) {    return (      <div className="inline-flex items-center gap-1 text-xs rounded-full px-2 py-1 bg-gray-100 text-gray-700">        ?�� ?�치 ?�보 로딩 �?..      </div>    );  }  return (    <a       href={mapUrl}       target="_blank"       rel="noreferrer"      className="inline-flex items-center gap-1 text-xs rounded-full px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"    >      ?�� {address} {distanceText && `· ${distanceText}`}    </a>  );}
