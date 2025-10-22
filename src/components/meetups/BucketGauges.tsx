export function BucketGauges({ caps }: { caps: any }) {
  const keys = Object.keys(caps?.capacity || {});
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {keys.map(k => {
        const cap = Number(caps.capacity[k] || 0);
        const used = Number(caps.paid?.[k] || 0) + Number(caps.pending?.[k] || 0);
        const wait = Number(caps.waitlist?.[k] || 0);
        const pct = cap && isFinite(cap) ? Math.min(100, Math.round(used / cap * 100)) : 0;
        
        return (
          <div key={k} className="rounded-2xl p-4 bg-zinc-900/60">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-zinc-300">{k.toUpperCase()}</div>
              <div className="text-sm text-zinc-400">{used}/{cap || '∞'}</div>
            </div>
            <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden">
              <div 
                className="h-3 bg-gradient-to-r from-blue-500 to-green-500" 
                style={{ width: pct + '%' }} 
              />
            </div>
            <div className="text-xs text-zinc-500 mt-1">대기열 {wait}</div>
          </div>
        );
      })}
    </div>
  );
}
