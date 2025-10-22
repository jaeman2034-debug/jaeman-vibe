import { useMemo } from "react";
import { WEEK_KO, startOfMonth, endOfMonth, ymd } from "@/lib/date";

type Ev = { id:string; title:string; startAt:any; type?:string; venue?:string };

export default function EventCalendar({
  month, events, onPrev, onNext, onPick
}: {
  month: Date;
  events: Ev[];                 // startAt: Date로 변환된 상태 가정
  onPrev: () => void;
  onNext: () => void;
  onPick?: (id:string)=>void;
}) {
  const s = startOfMonth(month);
  const e = endOfMonth(month);

  const days = useMemo(() => {
    const arr: Date[] = [];
    // 그리드 왼쪽에 주의 시작(일요일) 맞추기
    const head = new Date(s);
    head.setDate(s.getDate() - s.getDay());
    for (let i=0; i<42; i++) {
      const d = new Date(head);
      d.setDate(head.getDate()+i);
      arr.push(d);
    }
    return arr;
  }, [month]);

  const byDay = useMemo(() => {
    const map = new Map<string, Ev[]>();
    events.forEach(ev => {
      const k = ymd(ev.startAt);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(ev);
    });
    return map;
  }, [events]);

  const title = `${month.getFullYear()}년 ${month.getMonth()+1}월`;

  return (
    <div className="rounded-2xl border bg-white/70 dark:bg-white/10 border-gray-200/70 dark:border-white/10">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200/70 dark:border-white/10">
        <div className="font-semibold">{title}</div>
        <div className="flex gap-2">
          <button className="px-2 py-1 rounded-lg border" onClick={onPrev}>이전</button>
          <button className="px-2 py-1 rounded-lg border" onClick={onNext}>다음</button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-xs">
        {WEEK_KO.map((w,i)=>(
          <div key={i} className="px-2 py-2 font-medium text-gray-500">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px p-px">
        {days.map((d,i)=>{
          const k = ymd(d);
          const inMonth = d.getMonth()===month.getMonth();
          const list = byDay.get(k) || [];
          return (
            <div key={i} className={
              "min-h-[92px] p-2 bg-white dark:bg-white/5 " +
              (inMonth ? "" : "opacity-50")
            }>
              <div className="text-[11px] text-gray-500 mb-1">{d.getDate()}</div>
              <div className="space-y-1">
                {list.slice(0,3).map(ev=>(
                  <button key={ev.id}
                    onClick={()=>onPick?.(ev.id)}
                    className="w-full text-left px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] hover:opacity-90"
                    title={ev.title}>
                    {ev.type ? `[${ev.type}] ` : ""}{ev.title}
                  </button>
                ))}
                {list.length>3 && <div className="text-[11px] text-gray-400">+{list.length-3}개</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}