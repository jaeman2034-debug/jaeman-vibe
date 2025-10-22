export function openInExternalBrowser(targetUrl = window.location.href) {
  const url = new URL(targetUrl);
  const scheme = url.protocol.replace(":", ""); // http/https

  // 1) Android: 여러 브라우저 패키지 순차 시도
  const androidPkgs = [
    "com.android.chrome",             // Chrome
    "com.sec.android.app.sbrowser",   // 삼성 인터넷
    "com.microsoft.emmx",             // Edge
    "org.mozilla.firefox",            // Firefox
  ];

  let tried = false;
  const tryIntent = (pkg: string, delay: number) =>
    setTimeout(() => {
      tried = true;
      const intent =
        `intent://${url.host}${url.pathname}${url.search}` +
        `#Intent;scheme=${scheme};package=${pkg};` +
        `S.browser_fallback_url=${encodeURIComponent(url.toString())};end`;
      window.location.href = intent;
    }, delay);

  if (/Android/i.test(navigator.userAgent)) {
    androidPkgs.forEach((pkg, idx) => tryIntent(pkg, idx * 600));
    // 3초 내 아무 변화 없으면 안내
    setTimeout(() => {
      if (!tried) alert("외부 브라우저로 열 수 없어요. 우측 상단 메뉴에서 '브라우저에서 열기'를 선택해주세요.");
    }, androidPkgs.length * 650 + 500);
    return;
  }

  // 2) iOS: chrome scheme 시도 → 실패 시 안내
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    // Chrome 설치된 경우만 동작
    const chromeUrl = "googlechrome://" + url.href.replace(/^https?:\/\//, "");
    window.location.href = chromeUrl;
    setTimeout(() => {
      alert("상단 ••• 메뉴에서 'Safari에서 열기'를 눌러주세요.\n또는 링크를 복사해 Safari에 붙여넣어 주세요.");
    }, 800);
    return;
  }

  // 3) 기타: 새 창 열기
  window.open(url.toString(), "_blank", "noopener,noreferrer");
}
