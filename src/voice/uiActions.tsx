import type { Entities } from "./intents";
import { createPortal } from "react-dom";
import type { NavigateFunction } from "react-router-dom";
import { getCurrentPosition } from "./util/location";
import { fetchWithinRadius } from "./util/geoquery";
import { uploadBlobToStorage } from "./util/upload";

// 런타임 주입: navigate/useModal.open 등을 외부에서 세팅
let _navigate: NavigateFunction | null = null;
let _openModal: ((key: string, props?: any) => void) | null = null;
let _setOverlay: ((node: JSX.Element | null) => void) | null = null;
let _lastImageUrl: string | null = null;

export const uiBridge = {
  setNavigate(n: NavigateFunction) { _navigate = n; },
  setOpenModal(fn: (key: string, props?: any) => void) { _openModal = fn; },
  setOverlaySetter(fn: (node: JSX.Element | null) => void) { _setOverlay = fn; },
};

function ensure(cond: any, msg: string) { if (!cond) throw new Error(msg); }

export const uiActions = {
  navigate(e?: Entities) {
    ensure(_navigate, "navigate not set");
    const n = _navigate!;
    const page = e?.page ?? "home";
    const paths: Record<string, string> = { home: "/", market: "/market", meet: "/meet", jobs: "/jobs", sell: "/sell" };
    if (e?.category && page === "market") {
      n(`/market?cat=${encodeURIComponent(e.category)}`);
      return;
    }
    n(paths[page]);
  },
  openAny(raw: string) {
    ensure(_openModal, "openModal not set");
    const open = _openModal!;
    if (/vad/i.test(raw)) return open("voice:vad");
    if (/asr/i.test(raw)) return open("voice:asr");
    if (/원샷|가입/.test(raw)) return open("voice:signup");
    // 기본: Voice Hub
    open("voice:asr");
  },
  captureProduct() {
    ensure(_openModal, "openModal not set");
    _openModal!("voice:capture", {
      onCaptured: async (blob: Blob) => {
        const url = await uploadBlobToStorage(blob);
        _lastImageUrl = url;
        _openModal!("voice:register", { preset: {}, imageUrl: url });
      },
    });
  },
  registerProduct(e?: Entities) {
    ensure(_openModal, "openModal not set");
    _openModal!("voice:register", { preset: e });
  },
  analyzeProduct(imageUrl?: string) {
    ensure(_openModal, "openModal not set");
    _openModal!("voice:analyze", { imageUrl: imageUrl ?? _lastImageUrl ?? undefined });
  },
  async locationSearch(e?: Entities) {
    const radiusKm = e?.radiusKm ?? 2;
    const pos = await getCurrentPosition({ enableHighAccuracy: true, timeout: 8000 });
    const items = await fetchWithinRadius("products", { lat: pos.coords.latitude, lng: pos.coords.longitude }, radiusKm);
    // 간단 오버레이 출력 (필요 시 별도 모달로 교체)
    _setOverlay?.(
      <div className="fixed inset-0 bg-black/40 grid place-items-center p-4" onClick={() => _setOverlay?.(null)}>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-4 w-full max-w-xl">
          <h3 className="text-lg font-semibold mb-2">내 주변 {radiusKm}km 결과</h3>
          <ul className="max-h-80 overflow-auto list-disc pl-5 space-y-1">
            {items.length === 0 ? (
              <li className="list-none text-sm text-zinc-500">주변 {radiusKm}km 내 결과가 없습니다.</li>
            ) : (
              items.map((it) => (
                <li key={it.id}>
                  <a className="hover:underline" href={`/market/${it.id}`}>{it.title}</a>
                  {" "}— {(it.distanceKm).toFixed(2)}km
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    );
  },
  help() {
    _setOverlay?.(
      <div className="fixed inset-0 bg-black/40 grid place-items-center p-4" onClick={() => _setOverlay?.(null)}>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 w-full max-w-xl space-y-2">
          <h3 className="text-lg font-semibold">음성 명령 예시</h3>
          <ul className="list-disc pl-5 text-sm space-y-1">
            <li>"마켓으로 이동" / "모임 페이지 열어줘"</li>
            <li>"축구화 카테고리 보여줘"</li>
            <li>"상품 촬영 시작" / "카메라 열어줘"</li>
            <li>"상품 등록 시작" / "6만5천원에 등록해"</li>
            <li>"상품 AI 분석해줘"</li>
            <li>"내 주변 2km 매물 보여줘"</li>
            <li>"닫아" / "취소"</li>
          </ul>
        </div>
      </div>
    );
  },
  cancel() { _setOverlay?.(null); },
}; 