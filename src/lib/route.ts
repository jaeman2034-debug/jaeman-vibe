// URL 빌더 유틸 - 하드코딩 방지
export const route = {
  event: (id: string) => `/events/${id}`,
  checkout: (id: string) => `/events/${id}/checkout`,
  community: (id: string) => `/events/${id}/community`,
  matches: (id: string) => `/events/${id}/matches`,
  courts: (id: string) => `/events/${id}/courts`,
  live: (id: string) => `/events/${id}/live`,
  manage: (id: string) => `/events/${id}/manage`,
};