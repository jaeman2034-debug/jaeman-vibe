import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase';

export default function RulesPanel({ eventId }: { eventId: string }) {
  const [mode, setMode] = useState<'points' | 'sets'>('points');
  const [winPts, setWinPts] = useState(3);
  const [drawPts, setDrawPts] = useState(1);
  const [lossPts, setLossPts] = useState(0);
  const [setsToWin, setSetsToWin] = useState(2);
  const [setPointCap, setSetPointCap] = useState(25);

  useEffect(() => {
    const u = onSnapshot(doc(db, 'events', eventId), s => {
      const r = s.data()?.rules;
      if (!r) return;
      setMode(r.mode || 'points');
      setWinPts(r.winPts ?? 3);
      setDrawPts(r.drawPts ?? 1);
      setLossPts(r.lossPts ?? 0);
      setSetsToWin(r.setsToWin ?? 2);
      setSetPointCap(r.setPointCap ?? 25);
    });
    return () => u();
  }, [eventId]);

  const save = async () => {
    const fn = httpsCallable(getFunctions(), 'setRules');
    const rules: any = { mode };
    if (mode === 'points') {
      Object.assign(rules, { winPts, drawPts, lossPts });
    } else {
      Object.assign(rules, { setsToWin, setPointCap });
    }
    await fn({ eventId, rules });
    alert('규칙 저장 완료');
  };

  return (
    <section className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">스코어 규칙</h3>
        <button onClick={save} className="px-3 py-2 rounded-xl border">저장</button>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <select 
          value={mode} 
          onChange={e => setMode(e.target.value as any)} 
          className="border rounded-lg p-2"
        >
          <option value="points">승점제</option>
          <option value="sets">세트제</option>
        </select>
        {mode === 'points' ? (
          <div className="grid grid-cols-3 gap-2">
            <Num label="승" v={winPts} set={setWinPts} />
            <Num label="무" v={drawPts} set={setDrawPts} />
            <Num label="패" v={lossPts} set={setLossPts} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Num label="선승 세트" v={setsToWin} set={setSetsToWin} />
            <Num label="세트 점수" v={setPointCap} set={setSetPointCap} />
          </div>
        )}
      </div>
    </section>
  );
}

function Num({ label, v, set }: { label: string; v: number; set: (n: number) => void }) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-sm w-20">{label}</span>
      <input 
        type="number" 
        value={v} 
        onChange={e => set(Number(e.target.value))}
        className="border rounded-lg p-2 w-full"
      />
    </label>
  );
}
