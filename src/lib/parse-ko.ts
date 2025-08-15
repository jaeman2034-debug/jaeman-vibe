export function normalizeEmail(raw: string) {
  const koNum: Record<string,string> = { 공:"0",영:"0",일:"1",이:"2",삼:"3",사:"4",오:"5",육:"6",칠:"7",팔:"8",구:"9" };
  const m = raw.match(/([A-Za-z0-9._%+\- ]+)\s*([공영일이삼사오육칠팔구])?\s*@\s*([A-Za-z0-9.\-]+)\s*\.\s*([A-Za-z]{2,})/i);
  if (!m) return null;
  const local = m[1].replace(/[ \.]/g, "").toLowerCase();
  const hangul = m[2] ? (koNum[m[2]] ?? "") : "";
  const domain = (m[3] + "." + m[4]).replace(/\s+/g, "").toLowerCase();
  const local2 = /\d$/.test(local) ? local + hangul : local;
  return `${local2}@${domain}`;
}

export function extractPhone(raw: string) {
  const rep = (s: string) => s
    .replace(/공|영/g,"0").replace(/일/g,"1").replace(/이/g,"2").replace(/삼/g,"3").replace(/사/g,"4")
    .replace(/오/g,"5").replace(/육/g,"6").replace(/칠/g,"7").replace(/팔/g,"8").replace(/구/g,"9")
    .replace(/[^\d]/g,"");
  const digits = rep(raw);
  const m = digits.match(/01[016789]\d{7,8}/);
  if (!m) return "";
  const d = m[0];
  return d.length === 10 ? `${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`
                         : `${d.slice(0,3)}-${d.slice(3,7)}-${d.slice(7)}`;
}

export type PwStatus = "ok"|"weak"|"missing";
export function extractPassword(raw: string): { value: string; status: PwStatus } {
  const mm = raw.match(/(비\s*밀\s*번\s*호|비\s*번|암호|password)[^A-Za-z0-9가-힣]{0,10}([\s\S]{0,80})$/i);
  if (!mm) return { value:"", status:"missing" };
  let s = mm[2];
  s = s.replace(/다시 말할게|못 알아듣|영어|알파벳|그래|일본어|입니다|요\./g, " ");
  const koLetter: Record<string,string> = { 에이:"A", 비:"B", 씨:"C", 디:"D", 이:"E", 에프:"F", 지:"G", 에이치:"H", 에취:"H", 아이:"I", 제이:"J", 케이:"K", 엘:"L", 엠:"M", 엔:"N", 오:"O", 피:"P", 큐:"Q", 알:"R", 에스:"S", 티:"T", 유:"U", 브이:"V", 더블유:"W", 엑스:"X", 와이:"Y", 지드:"Z" };
  s = s.replace(new RegExp(Object.keys(koLetter).join("|"),"g"), (m)=>koLetter[m]);
  s = s.replace(/\./g," ").replace(/\s+/g," ");
  s = s.replace(/[^A-Za-z0-9!@#$%^&*_\-+= ]/g,"");
  const parts = s.match(/[A-Za-z0-9!@#$%^&*_\-+=]+/g) || [];
  const joined = parts.join("");
  if (joined.length >= 8) return { value: joined, status: "ok" };
  if (joined.length >= 6) return { value: joined, status: "weak" };
  return { value:"", status:"missing" };
} 