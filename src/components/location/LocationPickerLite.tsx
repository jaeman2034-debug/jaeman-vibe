import { useEffect, useState } from "react";
import type { Place } from "@/lib/geo";

type Props = {
  value?: Place | null;
  onChange: (p: Place | null) => void;
  defaultRegion?: string; // "KR"
};

export default function LocationPickerLite({ value, onChange, defaultRegion="KR" }: Props) {
  const [name, setName] = useState(value?.name ?? "");
  const [coords, setCoords] = useState<{lat:number,lng:number} | null>(
    value ? { lat: value.lat, lng: value.lng } : null
  );

  useEffect(() => {
    if (!value) return;
    setName(value.name ?? "");
    setCoords({ lat: value.lat, lng: value.lng });
  }, [value?.name, value?.lat, value?.lng]);

  const useMyLocation = async () => {
    if (!("geolocation" in navigator)) {
      alert("이 브라우저는 위치 기능을 지원하지 않습니다.");
      return;
    }
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000 })
      );
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setCoords({ lat, lng });
      onChange({ name: name || "", region: defaultRegion, lat, lng });
    } catch (e: any) {
      alert("위치를 가져올 수 없습니다. (권한 허용 필요)");
      console.error(e);
    }
  };

  const onBlurName = () => {
    if (!coords) return;
    onChange({ name: name.trim(), region: defaultRegion, lat: coords.lat, lng: coords.lng });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button type="button" className="px-3 py-2 rounded border" onClick={useMyLocation}>
          내 위치 가져오기
        </button>
        {coords && <span className="text-xs text-muted-foreground">{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>}
      </div>
      <div>
        <label className="block text-sm mb-1">동네 이름</label>
        <input
          className="w-full border rounded px-3 h-10"
          placeholder="예) 송산2동"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={onBlurName}
        />
        <p className="mt-1 text-xs text-muted-foreground">※ '내 위치'로 좌표 저장, 동네명은 직접 입력(추후 역지오코딩 붙일 수 있음)</p>
      </div>
    </div>
  );
}
