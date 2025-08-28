const toLowerTrim = (s) => (s ?? "").toLowerCase().trim();
const onlyKr = (s) => s.replace(/[^\uAC00-\uD7A3\s]/g, " ");
const squeeze = (s) => s.replace(/\s+/g, " ").trim(); /** ?�름 ?�처�? ?��?�? 중복?�절 축약, 공백 ?�거, 길이 2~6 */
export const normalizeName = (s) => { let t = squeeze(onlyKr(s)); t = t.replace(/([가-??)\s*\1{1,}/g, "$1");  t = t.replace(/\s/g, "");  if (t.length < 2 || t.length > 6) return "";  return t;};/* =============== ?�이�?블랙리스??=============== */const NAME_BLACKLIST = [  "?�음","?�로","반복","?�작","중�?","?��?","취소","로그","?�식","초기??,  "?�함??,"?�자?�편","비�?번호","?�정","?�형","?�만","진행","?�인","?�내","질문"];const noisePatterns: RegExp[] = [  /?�녕?�세??, /?�러??, /?�떻�?, /?�아/, /?�작?�니??, /진행/,  /^?�음$/, /^?�로$/, /말고\?/, /\?$/, /?�니???$/];/ *  ===  ===  ===  ===  ===  ?  : ); };
