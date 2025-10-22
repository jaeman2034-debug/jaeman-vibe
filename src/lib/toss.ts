// src/lib/toss.ts
let _p: Promise<any> | null = null;
export async function loadToss(clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY as string){
  if ((window as any).TossPayments) return (window as any).TossPayments(clientKey);
  if (!_p) {
    _p = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://js.tosspayments.com/v1'; // v2 사용할 땐 /v1/payment-widget
      s.onload = () => resolve((window as any).TossPayments(clientKey));
      s.onerror = reject; document.head.appendChild(s);
    });
  }
  return _p;
}