export function MeetupsMapView({ items }:{ items:any[] }){
  // 실제 지도 SDK 없이 경량 래스터 뷰(추후 Kakao/Google SDK로 교체 가능)
  return (
    <div className="rounded-2xl border bg-white p-3">
      <div className="text-sm text-gray-500 mb-2">간단 지도 보기(마커 클릭 → 카카오맵 열기)</div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map(m => (
          <div key={m.id} className="rounded-xl border p-3">
            <div className="font-semibold">{m.title}</div>
            <div className="text-sm text-gray-500">{m.place?.name || '위치 지정'}</div>
            {m.place?.lat && m.place?.lng ? (
              <a className="text-blue-600 text-sm" target="_blank" href={`https://map.kakao.com/link/map/${encodeURIComponent(m.title)},${m.place.lat},${m.place.lng}`}>지도에서 열기</a>
            ) : (
              <span className="text-xs text-gray-400">좌표 없음</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
