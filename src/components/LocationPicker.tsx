import { useState } from "react";
import { getCurrentLocation, reverseGeocode } from "@/features/location/locationService";

type Props = { onPicked: (p:{lat:number;lng:number;regionText?:string}) => void; };

export default function LocationPicker({ onPicked }: Props) {
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");

  async function handlePick() {
    try {
      setBusy(true);
      const coord = await getCurrentLocation();
      const region = await reverseGeocode(coord);
      const regionText = region?.full ?? `${coord.lat.toFixed(5)}, ${coord.lng.toFixed(5)}`;
      setText(regionText);
      onPicked({ ...coord, regionText });
    } catch {
      setText("위치 권한 허용 필요");
      onPicked({ lat: NaN, lng: NaN });
    } finally { setBusy(false); }
  }

  return (
    <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap: "wrap" }}>
      <button 
        disabled={busy} 
        onClick={handlePick}
        style={{
          padding: '8px 16px',
          background: busy ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: busy ? 'not-allowed' : 'pointer',
          fontSize: 14,
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        📍 {busy ? "위치 가져오는 중..." : "현재 위치 가져오기"}
      </button>
      {text && (
        <small style={{ 
          color: text.includes("위치 권한") ? '#dc3545' : '#28a745',
          fontSize: 12,
          fontWeight: 500
        }}>
          {text}
        </small>
      )}
    </div>
  );
} 