import { useEffect, useRef } from 'react';
import type { Meetup } from '@/types/meetups';
import maplibregl from 'maplibre-gl';

interface MeetupMapViewProps {
  items: Meetup[];
  onSelect: (id: string) => void;
}

export function MeetupMapView({ items, onSelect }: MeetupMapViewProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | undefined>();

  useEffect(() => {
    if (!ref.current) return;
    
    // 재사용
    if (!mapRef.current) {
      mapRef.current = new maplibregl.Map({
        container: ref.current,
        style: 'https://demotiles.maplibre.org/style.json', // 데모 스타일(공개)
        center: [127.0, 37.5], 
        zoom: 9,
        attributionControl: true
      });
    }
    const map = mapRef.current;

    // 기존 마커 제거
    (map as any)._yagoMarkers?.forEach((m: maplibregl.Marker) => m.remove());
    (map as any)._yagoMarkers = [];

    const bounds = new maplibregl.LngLatBounds();

    items.forEach((m) => {
      const lng = m.venue?.lng; 
      const lat = m.venue?.lat;
      if (typeof lng !== 'number' || typeof lat !== 'number') return;
      
      const el = document.createElement('button');
      el.className = 'rounded-full px-2 py-1 bg-black text-white text-[11px] shadow hover:bg-gray-800 transition-colors';
      el.innerText = m.title.length > 10 ? m.title.slice(0, 10) + '…' : m.title;
      el.addEventListener('click', () => onSelect(m.id));
      
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);
      (map as any)._yagoMarkers.push(marker);
      bounds.extend([lng, lat]);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 40, maxZoom: 14, duration: 300 });
    }

    return () => {};
  }, [items, onSelect]);

  return (
    <div className="rounded-2xl overflow-hidden border">
      <div ref={ref} className="h-[440px] w-full" />
    </div>
  );
}
