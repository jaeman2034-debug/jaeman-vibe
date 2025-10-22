// 관리자 토큰 관리 유틸리티

export function setManageToken(v: string) {
  sessionStorage.setItem('yago:manageToken', v);
}

export function getManageToken(): string {
  return sessionStorage.getItem('yago:manageToken') || '';
}

export function clearManageToken() {
  sessionStorage.removeItem('yago:manageToken');
}

export function hasManageToken(): boolean {
  return !!getManageToken();
}

// 관리자 API 호출을 위한 헤더 생성
export function getManageHeaders(): HeadersInit {
  const token = getManageToken();
  return token ? { 'X-Admin-Token': token } : {};
}
