export type JoinBucket = 'default' | 'women' | 'u10';

export function JoinTypePicker({ 
  value, 
  onChange 
}: { 
  value: JoinBucket; 
  onChange: (v: JoinBucket) => void 
}) {
  const opts: { key: JoinBucket; label: string; desc?: string }[] = [
    { key: 'default', label: '일반' },
    { key: 'women', label: '여성 전용', desc: '여성 참가자 전용 좌석' },
    { key: 'u10', label: 'U10', desc: '만 10세 이하' },
  ];

  return (
    <div className="flex gap-2">
      {opts.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`px-3 py-2 rounded-xl border ${
            value === o.key 
              ? 'bg-black text-white' 
              : 'bg-white dark:bg-zinc-900'
          }`}
        >
          <div className="text-sm font-medium">{o.label}</div>
          {o.desc && <div className="text-xs text-zinc-500">{o.desc}</div>}
        </button>
      ))}
    </div>
  );
}

export function JoinTypePickerDynamic({ 
  buckets, 
  value, 
  onChange 
}: { 
  buckets: { key: string; label: string; description?: string }[]; 
  value: string; 
  onChange: (v: string) => void 
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {buckets.map(b => (
        <button
          key={b.key}
          onClick={() => onChange(b.key)}
          className={`px-3 py-2 rounded-xl border ${
            value === b.key 
              ? 'bg-black text-white' 
              : 'bg-white dark:bg-zinc-900'
          }`}
        >
          <div className="text-sm font-medium">{b.label}</div>
          {b.description && <div className="text-xs text-zinc-500">{b.description}</div>}
        </button>
      ))}
    </div>
  );
}
