import { PAGE_SYNONYMS, type Command, type Intent, type Entities } from "../intents";

const NUM_KOR = [
  ["천", 1000], ["만", 10000], ["십만", 100000], ["백만", 1000000]
] as const;

function parsePrice(s: string): number | undefined {
  // 예: "6만5천원", "65000원", "6만 5천"
  const digits = s.match(/[0-9]{3,}/);
  if (digits) return parseInt(digits[0], 10);
  let n = 0;
  let rest = s;
  for (const [unit, mul] of NUM_KOR) {
    const m = rest.match(new RegExp(`([0-9]+)\\s*${unit}`));
    if (m) n += parseInt(m[1], 10) * mul;
  }
  if (!n) {
    const m = rest.match(/([0-9]+)\s*원/);
    if (m) n = parseInt(m[1], 10);
  }
  return n || undefined;
}

function parseRadiusKm(s: string): number | undefined {
  const m = s.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:킬로|km|키로)/i);
  return m ? parseFloat(m[1]) : undefined;
}

function findPage(s: string): Entities["page"] | undefined {
  for (const k of Object.keys(PAGE_SYNONYMS)) {
    if (s.includes(k)) return PAGE_SYNONYMS[k];
  }
  return undefined;
}

export function nlu(text: string): Command | null {
  const raw = text.trim();
  const s = raw.replace(/\s+/g, "");

  // 취소
  if (/취소|닫아|그만|중지/.test(s)) return { intent: "CANCEL", raw };

  // 도움말
  if (/도움말|무엇을|어떻게|사용법/.test(s)) return { intent: "HELP", raw };

  // 페이지/카테고리 이동
  if (/(이동|가|열어|보여|들어가)/.test(s)) {
    const page = findPage(raw);
    if (page) return { intent: "NAVIGATE", entities: { page }, raw };
    // 카테고리 이동(마켓 하위): 예 "축구화 카테고리로 이동"
    const mCat = raw.match(/([가-힣a-zA-Z0-9 ]+?)\s*(카테고리|찾아|보여)/);
    if (mCat) return { intent: "NAVIGATE", entities: { page: "market", category: mCat[1].trim() }, raw };
  }

  // 카메라 촬영
  if (/(촬영|카메라|사진찍|촬영시작|사진찍어)/.test(s)) {
    return { intent: "CAPTURE_PRODUCT", raw };
  }

  // 상품 등록
  if (/(상품등록|등록해|올려|판매등록|등록시작)/.test(s)) {
    const price = parsePrice(raw) ?? undefined;
    const mCat = raw.match(/(축구화|유니폼|라켓|공|보호대|골프채)/);
    return { intent: "REGISTER_PRODUCT", entities: { category: mCat?.[1], price }, raw };
  }

  // AI 분석
  if (/(분석|AI분석|자동분류|카테고리분석)/.test(s)) {
    return { intent: "ANALYZE_PRODUCT", raw };
  }

  // 위치 분석/반경 검색
  if (/(근처|주변|가까운|반경|내주변)/.test(s)) {
    const r = parseRadiusKm(raw) ?? 2; // 기본 2km
    return { intent: "LOCATION_ANALYSIS", entities: { radiusKm: r }, raw };
  }

  // /voice 모달 (테스트)
  if (/(vad|asr|원샷|음성가입)/i.test(raw)) {
    return { intent: "OPEN_MODAL", raw };
  }

  // 폴백: 페이지 키워드만 인지되면 NAVIGATE
  const page = findPage(raw);
  if (page) return { intent: "NAVIGATE", entities: { page }, raw };

  return null;
} 