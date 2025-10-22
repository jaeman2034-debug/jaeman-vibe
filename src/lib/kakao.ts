// src/lib/kakao.ts
let _loading: Promise<any> | null = null;

export const loadKakao = async (appKey = import.meta.env.VITE_KAKAO_JS_KEY as string) => {
  if (typeof window === 'undefined') throw new Error('client only');
  if ((window as any).kakao?.maps) return (window as any).kakao;
  if (!appKey) throw new Error('Missing VITE_KAKAO_JS_KEY');
  if (_loading) return _loading;
  _loading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    s.onload = () => {
      const kakao = (window as any).kakao;
      kakao.load(() => resolve(kakao));
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return _loading;
};

export type LatLng = { lat: number; lng: number };

export async function geocodePlaceName(placeName: string): Promise<LatLng | null> {
  const kakao = await loadKakao();
  return new Promise((resolve) => {
    const ps = new kakao.maps.services.Places();
    ps.keywordSearch(placeName, (data: any[], status: any) => {
      if (status !== kakao.maps.services.Status.OK || !data.length) return resolve(null);
      const { x, y } = data[0];
      resolve({ lng: parseFloat(x), lat: parseFloat(y) });
    });
  });
}