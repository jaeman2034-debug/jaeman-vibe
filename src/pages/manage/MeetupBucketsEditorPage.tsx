import { useEffect, useState } from 'react';
import { RequireRole } from '../../components/auth/RequireRole';
import { useAuth } from '../../hooks/useAuth';

export default function MeetupBucketsEditorPage() {
  const clubId = location.pathname.split('/')[2];
  const id = location.pathname.split('/')[4];
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const j = await (await fetch(`/api/meetups/${id}/buckets`)).json();
      setItems(j.items || [{ key: 'default', label: '일반', capacity: 16 }]);
    })();
  }, [id]);

  function add() {
    setItems(p => [...p, { 
      key: 'bucket' + (p.length + 1), 
      label: '새 버킷', 
      capacity: 0, 
      rules: { gender: 'any' } 
    }]);
  }

  function del(i: number) {
    setItems(p => p.filter((_, idx) => idx !== i));
  }

  async function save() {
    const r = await fetch(`/api/clubs/${clubId}/meetups/${id}/buckets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await user!.getIdToken()}`
      },
      body: JSON.stringify({ items })
    });
    if (r.ok) alert('저장완료');
    else alert('실패');
  }

  return (
    <RequireRole clubId={clubId} roles={['owner', 'manager']}>
      <div className="mx-auto max-w-3xl p-6 space-y-4">
        <h1 className="text-2xl font-bold">버킷 정의</h1>
        <div className="grid gap-3">
          {items.map((it, idx) => (
            <div key={idx} className="rounded-2xl border p-3 grid sm:grid-cols-5 gap-2 items-center">
              <input
                className="sm:col-span-1 px-2 py-1 rounded-lg border"
                value={it.key}
                onChange={e => setItems(p => p.map((x, i) => i === idx ? { ...x, key: e.target.value } : x))}
                placeholder="key"
              />
              <input
                className="sm:col-span-1 px-2 py-1 rounded-lg border"
                value={it.label}
                onChange={e => setItems(p => p.map((x, i) => i === idx ? { ...x, label: e.target.value } : x))}
                placeholder="label"
              />
              <input
                type="number"
                className="sm:col-span-1 px-2 py-1 rounded-lg border"
                value={it.capacity ?? 0}
                onChange={e => setItems(p => p.map((x, i) => i === idx ? { ...x, capacity: Number(e.target.value || 0) } : x))}
                placeholder="capacity"
              />
              <div className="sm:col-span-2 flex gap-2 items-center text-sm">
                <select
                  className="px-2 py-1 rounded-lg border"
                  value={it.rules?.gender || 'any'}
                  onChange={e => setItems(p => p.map((x, i) => i === idx ? { ...x, rules: { ...x.rules, gender: e.target.value } } : x))}
                >
                  <option value="any">성별 제한 없음</option>
                  <option value="femaleOnly">여성 전용</option>
                  <option value="maleOnly">남성 전용</option>
                </select>
                <input
                  type="number"
                  className="w-24 px-2 py-1 rounded-lg border"
                  placeholder="minAge"
                  value={it.rules?.minAge ?? ''}
                  onChange={e => setItems(p => p.map((x, i) => i === idx ? { ...x, rules: { ...x.rules, minAge: Number(e.target.value || '') } } : x))}
                />
                <input
                  type="number"
                  className="w-24 px-2 py-1 rounded-lg border"
                  placeholder="maxAge"
                  value={it.rules?.maxAge ?? ''}
                  onChange={e => setItems(p => p.map((x, i) => i === idx ? { ...x, rules: { ...x.rules, maxAge: Number(e.target.value || '') } } : x))}
                />
                <button
                  className="ml-auto px-2 py-1 rounded-lg bg-red-600 text-white"
                  onClick={() => del(idx)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-xl bg-zinc-100" onClick={add}>
            버킷 추가
          </button>
          <button className="px-4 py-2 rounded-xl bg-black text-white" onClick={save}>
            저장
          </button>
        </div>
      </div>
    </RequireRole>
  );
}
