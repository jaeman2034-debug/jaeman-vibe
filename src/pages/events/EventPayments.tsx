import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function EventPayments(){
  const { id } = useParams();
  const [items, setItems] = useState<any[]>([]);
  const callCancel = httpsCallable(getFunctions(), 'tossCancelPayment');

  useEffect(()=>{
    if(!id) return;
    const q = query(collection(db,'events',id!, 'payments'), orderBy('createdAt','desc'));
    const unsub = onSnapshot(q,(s)=> setItems(s.docs.map(d=>({ id:d.id, ...(d.data() as any) }))));
    return ()=>unsub();
  },[id]);

  const cancel = async (orderId:string)=>{
    if (!confirm('환불하시겠습니까?')) return;
    await callCancel({ orderId, reason:'admin cancel' });
    alert('환불 완료');
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Link to={`/events/${id}/manage`} className="text-blue-600 underline">← 관리</Link>
        <h1 className="text-lg font-semibold">결제 내역</h1>
      </div>
      <ul className="divide-y">
        {items.map(it=> (
          <li key={it.id} className="py-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="text-sm">{it.orderName}</div>
              <div className="text-xs text-gray-500">
                {it.method || '-'} · {it.status} · {it.amount?.toLocaleString()}원
                {it.cashReceipt?.receiptUrl && (
                  <span className="ml-2">
                    <a href={it.cashReceipt.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      현금영수증
                    </a>
                  </span>
                )}
              </div>
            </div>
            {it.status==='paid' && (
              <button onClick={()=>cancel(it.id)} className="px-3 py-1.5 rounded-xl border text-sm">환불</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
