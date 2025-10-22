import { useEffect, useState } from 'react';
import { RequireRole } from '../../components/auth/RequireRole';
import { useAuth } from '../../hooks/useAuth';

export default function MeetupCapacityPage() {
  const clubId = location.pathname.split('/')[2];
  const id = location.pathname.split('/')[4];
  const { user } = useAuth();
  const [caps, setCaps] = useState<any>({ default: 16, women: 8, u10: 6 });

  useEffect(() => {
    (async () => {
      const j = await (await fetch(`/api/meetups/${id}/capacity`)).json();
      setCaps(j.capacity || caps);
    })();
  }, [id]);

  async function save() {
    const r = await fetch(`/api/clubs/${clubId}/meetups/${id}/capacity/buckets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await user!.getIdToken()}`
      },
      body: JSON.stringify({ capacity: caps })
    });
    if (r.ok) alert('저장 완료');
    else alert('실패');
  }

  return (
    <RequireRole clubId={clubId} roles={['owner', 'manager']}>
      <div className="mx-auto max-w-xl p-6 space-y-3">
        <h1 className="text-2xl font-bold">버킷 쿼터</h1>
        {['default', 'women', 'u10'].map(k => (
          <div key={k} className="flex items-center gap-2">
            <div className="w-24 text-sm text-zinc-500">{k}</div>
            <input
              type="number"
              className="px-2 py-1 rounded-lg border w-32"
              value={caps[k] || 0}
              onChange={e => setCaps((p: any) => ({ ...p, [k]: Number(e.target.value || 0) }))}
            />
          </div>
        ))}
        <div className="pt-2">
          <button className="px-4 py-2 rounded-xl bg-black text-white" onClick={save}>
            저장
          </button>
        </div>
      </div>
    </RequireRole>
  );
}
