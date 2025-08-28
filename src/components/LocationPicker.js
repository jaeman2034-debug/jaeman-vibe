import { jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { getCurrentLocation, reverseGeocode } from "@/features/location/locationService";
export default function LocationPicker({ onPicked }) { const [busy, setBusy] = useState(false); const [text, setText] = useState(""); async function handlePick() { try {
    setBusy(true);
    const coord = await getCurrentLocation();
    const region = await reverseGeocode(coord);
    const regionText = region?.full ?? `${coord.lat.toFixed(5)}, ${coord.lng.toFixed(5)}`;
    setText(regionText);
    onPicked({ ...coord, regionText });
}
catch {
    setText("?�치 권한 ?�용 ?�요");
    onPicked({ lat: NaN, lng: NaN });
}
finally {
    setBusy(false);
} } return (_jsxs("div", { style: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }, children: ["      ", _jsxs("button", { disabled: busy, onClick: handlePick, style: { padding: '8px 16px', background: busy ? '#ccc' : '#007bff', color: 'white', border: 'none', borderRadius: 6, cursor: busy ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px' }, children: ["        ?\uFFFD\uFFFD ", busy ? "?�치 가?�오??�?.." : "?�재 ?�치 가?�오�?}      </button>      {text && (        <small style={{           color: text.includes(" ?  : , "\uFFFD\uCE58 \uAD8C\uD55C\") ? '#dc3545' : '#28a745',          fontSize: 12,          fontWeight: 500        }}>          ", text, "        "] }), "      )}    "] })); }
