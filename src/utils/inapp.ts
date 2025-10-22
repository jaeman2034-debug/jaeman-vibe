// src/utils/inapp.ts
export const isInAppBrowser = () => {
  const ua = (navigator.userAgent || "").toLowerCase();

  // 대표 인앱/웹뷰 UA 패턴
  const inapp =
    ua.includes("kakaotalk") ||
    ua.includes("instagram") ||
    ua.includes("line/") ||
    ua.includes("fbav") || ua.includes("fban") || // Facebook/Instagram
    ua.includes("naver") || ua.includes("naver(inapp)") ||
    ua.includes("whale") && ua.includes("wv") || // 일부 웨일 인앱
    ua.includes("; wv") || ua.includes("version/") && ua.includes("chrome/") && ua.includes("mobile safari") // 안드로이드 webview 흔적

  return inapp;
};

export const openExternalBrowser = () => {
  const url = window.location.href;

  // Android: Chrome 의도 URL
  if (/android/i.test(navigator.userAgent)) {
    // https 스킴 유지
    const clean = url.replace(/^https?:\/\//, "");
    location.href =
      `intent://${clean}#Intent;scheme=https;package=com.android.chrome;end`;
    // 실패 시 원래 페이지로 복귀
    setTimeout(() => (location.href = url), 1500);
    return;
  }

  // iOS: 인앱에서 사파리 강제 오픈은 제한적 -> 안내 + 복사 or 새 탭
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
    alert("상단 •••(공유) > Safari로 열기를 눌러주세요.");
    // 보조로 새 탭 시도
    window.open(url, "_blank");
    return;
  }

  // 데스크톱 등: 새 창
  window.open(url, "_blank");
};
