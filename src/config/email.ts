// ⚠️ 절대 다른 모듈을 import 하지 마세요 (순환 import 방지)
export const DOMAIN_WHITELIST = new Set<string>([
  "gmail.com",
  "naver.com",
  "daum.net",
  "outlook.com",
  "nate.com",
  "hanmail.net",
  "kakao.com",
  "icloud.com"
  // 필요 시 확장
]); 