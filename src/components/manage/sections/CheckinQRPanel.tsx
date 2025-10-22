import React, { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { QRCodeSVG } from 'qrcode.react';

export default function CheckinQRPanel({ eventId }:{ eventId:string }){
	const [token, setToken] = useState<string>('');
	const [url, setUrl] = useState<string>('');

	const issue = async ()=>{
		const fn = httpsCallable(getFunctions(), 'createCheckinToken');
		const { data }: any = await fn({ eventId, ttlMinutes: 15 });
		setToken(data.token);
		setUrl(`${location.origin}/events/${eventId}/checkin?token=${data.token}`);
	};

	useEffect(()=>{ issue(); },[]);

	return (
		<section className="rounded-xl border p-4">
			<h3 className="font-semibold mb-2">체크인 QR</h3>
			{url ? (
				<div className="flex items-center gap-4">
					<QRCodeSVG value={url} size={140}/>
					<div className="text-sm break-all">
						<div>유효: 15분</div>
						<a className="underline" href={url} target="_blank" rel="noreferrer">{url}</a>
					</div>
				</div>
			) : <div className="text-sm text-gray-500">발급 중…</div>}
			<div className="mt-3">
				<button onClick={issue} className="px-3 py-2 rounded-xl border">다시 발급</button>
			</div>
		</section>
	);
}
