export type GeocodeResp = {
  ok: boolean;
  address: string;
  x: number; // lng
  y: number; // lat
  region?: any;
};

export async function geocode(addr: string): Promise<GeocodeResp> {
  const r = await fetch(`/api/geocode?q=${encodeURIComponent(addr)}`);
  if (!r.ok) throw new Error(`geocode failed: ${r.status}`);
  return r.json();
}
