export const KST = 'Asia/Seoul';

export function startOfDay(ts = Date.now()) {
  const d = new Date(ts);
  const kr = new Intl.DateTimeFormat('ko-KR', { 
    timeZone: KST, 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit' 
  }).formatToParts(d);
  const y = kr.find(x => x.type === 'year').value;
  const m = kr.find(x => x.type === 'month').value;
  const da = kr.find(x => x.type === 'day').value;
  return new Date(`${y}-${m}-${da}T00:00:00+09:00`).getTime();
}

export function endOfDay(ts = Date.now()) {
  return startOfDay(ts) + 24 * 60 * 60 * 1000 - 1;
}
