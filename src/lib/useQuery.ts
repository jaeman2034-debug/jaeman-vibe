import { useLocation, useNavigate } from "react-router-dom";

export function useQuery() {
  const { search } = useLocation();
  return new URLSearchParams(search);
}

export function useQueryParam(key: string, fallback = "") {
  const qs = useQuery();
  return qs.get(key) ?? fallback;
}

export function useSetQuery() {
  const nav = useNavigate();
  const loc = useLocation();
  return (patch: Record<string, string | undefined>, replace = true) => {
    const qs = new URLSearchParams(loc.search);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === "") qs.delete(k);
      else qs.set(k, String(v));
    });
    nav(`${loc.pathname}?${qs.toString()}`, { replace });
  };
}
