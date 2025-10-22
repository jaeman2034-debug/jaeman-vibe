import React, { useState } from 'react';
import PostComposer from './PostComposer';

export default function QuickActions({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState<null | 'checkin' | 'mate' | 'carpool'>(null);
  
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <button className="rounded-xl border p-3" onClick={() => setOpen('checkin')}>
          ✅ 출첵
        </button>
        <button className="rounded-xl border p-3" onClick={() => setOpen('mate')}>
          🤝 스파링
        </button>
        <button className="rounded-xl border p-3" onClick={() => setOpen('carpool')}>
          🚗 카풀
        </button>
      </div>
      {open && <PostComposer eventId={eventId} type={open} onClose={() => setOpen(null)} />}
    </>
  );
}
