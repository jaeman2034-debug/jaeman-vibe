export function StatusBadge({ status }: { status?: string }) {
  if (!status || status === 'active') return null;
  
  const map: Record<string,{label:string; cls:string}> = {
    reserved: { label: '예약중', cls: 'bg-amber-500' },
    sold:     { label: '판매완료', cls: 'bg-gray-600' },
  };
  
  const info = map[status] || { label: status, cls: 'bg-slate-500' };
  
  return (
    <span className={`absolute left-2 top-2 text-xs text-white px-2 py-0.5 rounded-full ${info.cls}`}>
      {info.label}
    </span>
  );
}
