export function readUtmSource() {
  const m = document.cookie.match(/(?:^|; )utm_src=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : undefined;
}
