import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '@/lib/firebase';

export default function AttendeePanel({ eventId, onUserSelect }:{ eventId:string; onUserSelect?: (uid: string) => void }){
	const [rows,setRows]=useState<any[]>([]);
	useEffect(()=>{
		const q = query(collection(db,'events',eventId,'attendees'), orderBy('joinedAt','asc'));
		const unsub = onSnapshot(q,s=>setRows(s.docs.map(d=>({ id:d.id, ...(d.data() as any) }))));
		return ()=>unsub();
	},[eventId]);

	const kick = async(uid:string)=>{
		if(!confirm('정말 강퇴하시겠어요?')) return;
		const fn = httpsCallable(getFunctions(), 'kickAttendee');
		await fn({ eventId, targetUid: uid, reason: 'manage.kick' });
	};

	return (
		<section className="rounded-xl border p-4">
			<h3 className="font-semibold mb-2">참가자 관리</h3>
			{!rows.length && <div className="text-sm text-gray-500">참가자 없음</div>}
			<ul className="space-y-1">
				{rows.map(r=> (
					<li key={r.id} className="flex items-center justify-between">
						<div 
							className="truncate cursor-pointer hover:bg-gray-100 p-2 rounded"
							onClick={() => onUserSelect?.(r.id)}
						>
							{r.id}
						</div>
						<div className="flex gap-2">
							<button 
								onClick={() => onUserSelect?.(r.id)} 
								className="px-3 py-1 rounded-lg border text-blue-600"
							>
								페널티
							</button>
							<button onClick={()=>kick(r.id)} className="px-3 py-1 rounded-lg border text-red-600">강퇴</button>
						</div>
					</li>
				))}
			</ul>
		</section>
	);
}
