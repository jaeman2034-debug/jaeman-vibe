export function Badge({ text, tone="gray" }:{ text:string; tone?: "gray"|"blue"|"green"|"amber"|"red"}) {
  const map:any = {
    gray:"bg-gray-100 text-gray-700 border-gray-200",
    blue:"bg-blue-50 text-blue-700 border-blue-200",
    green:"bg-emerald-50 text-emerald-700 border-emerald-200",
    amber:"bg-amber-50 text-amber-700 border-amber-200",
    red:"bg-red-50 text-red-700 border-red-200",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${map[tone]}`}>{text}</span>;
}

export function priceKRW(n?: number|null) {
  if (n==null || Number.isNaN(n)) return "가격 문의";
  return "₩" + n.toLocaleString();
}