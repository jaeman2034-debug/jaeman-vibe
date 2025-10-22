import { useEffect, useState } from "react";

export function useMyLocation() {
  const [coords, setCoords] = useState<{lat:number,lng:number} | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem("myCoords");
    if (cached) {
      setCoords(JSON.parse(cached));
      setLoading(false);
      return;
    }
    if (!("geolocation" in navigator)) { setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        localStorage.setItem("myCoords", JSON.stringify(p));
        setCoords(p);
        setLoading(false);
      },
      () => setLoading(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  return { coords, loading };
}
