import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '@/lib/firebase';

export default function LogPanel({ eventId }:{ eventId:string }){
	const [rows,setRows]=useState<any[]>([]);
	useEffect(()=>{
		const q = query(collection(db,'events',eventId,'logs'), orderBy('at','desc'), limit(50));
		const unsub = onSnapshot(q,s=>setRows(s.docs.map(d=>({ id:d.id, ...(d.data() as any) }))));
		return ()=>unsub();
	},[eventId]);

	return (
		<section className="rounded-xl border p-4">
			<div className="flex items-center justify-between mb-2">
				<h3 className="font-semibold">감사 로그 (최근 50개)</h3>
				<Link 
					to={`/events/${eventId}/logs`} 
					className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
				>
					전체 로그 보기
				</Link>
			</div>
			{!rows.length && <div className="text-sm text-gray-500">로그 없음</div>}
			<ul className="space-y-1 text-sm">
				{rows.map(l=> (
					<li key={l.id} className="grid grid-cols-4 gap-2">
						<div className="col-span-1 text-gray-500">{l.at?.toDate ? l.at.toDate().toLocaleString() : ''}</div>
						<div className="col-span-1">{l.actorId}</div>
						<div className="col-span-2 truncate">{l.action}{l.meta?` — ${JSON.stringify(l.meta)}`:''}</div>
					</li>
				))}
			</ul>
		</section>
	);
}
