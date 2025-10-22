export async function verifyPaymentOnServer(params: {
  eventId: string;
  registrationId: string;
  provider: 'toss' | 'portone' | 'mock';
  payload: any; // provider별 성공 콜백에서 받은 key들
}) {
  const base =
    import.meta.env.VITE_FN_BASE_URL /* e.g. https://<region>-<project>.cloudfunctions.net */
    || ''; // Hosting rewrite 쓸 경우 빈 문자열로 /verifyPayment 직접 콜
  const url = `${base}/verifyPayment`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'VERIFY_FAILED');
  return data;
}
