import { useEffect, useState } from "react";

export default function RegionBadge() {
  const [region, setRegion] = useState<string>(() => localStorage.getItem("region") || "KR");
  useEffect(() => {
    const onChange = (e: Event) => {
      const r = (e as CustomEvent<string>).detail;
      if (r) setRegion(r);
    };
    window.addEventListener("region:change", onChange as any);
    return () => window.removeEventListener("region:change", onChange as any);
  }, []);
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs text-gray-600 bg-white">
      지?? <strong className="font-medium">{region}</strong>
    </span>
  );
}
