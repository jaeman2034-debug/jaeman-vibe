export const isAndroid = /Android/i.test(navigator.userAgent);
export const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

/** 카톡/인스타/페북/네이버 등 인앱 + WebView( ; wv ) 탐지 */
export function isInAppWebView(ua = navigator.userAgent): boolean {
  return /(KAKAOTALK|Instagram|FBAN|FBAV|FB_IAB|Line|Twitter|NAVER|Daum|; wv|WebView)/i.test(ua);
}
