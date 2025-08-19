export const fmtPrice = (v: number) =>
  new Intl.NumberFormat("ko-KR").format(v) + "원"; 