import { describe, it, expect } from "vitest";
import { parseSignupUtterance } from "./nlu/parseSignup";

describe("parseSignupUtterance", () => {
  it("이메일 공백 압축", () => {
    const p = parseSignupUtterance("이메일은 k i m 골뱅이 네이버 점 c o m");
    expect(p.email).toBe("kim@naver.com");
  });
  
  it("비번 한 글자씩", () => {
    const p = parseSignupUtterance("비밀번호는 p a s s w o r d 1 2 3 입니다");
    expect(p.password).toBe("password123");
  });
  
  it("비밀번호 키워드 근처에서만 캡처", () => {
    const p = parseSignupUtterance("안녕하세요 비밀번호는 abc123이고 다른 말은 무시해주세요");
    expect(p.password).toBe("abc123");
  });
  
  it("전화번호 키워드 근처에서만 캡처", () => {
    const p = parseSignupUtterance("전화번호는 010-1234-5678이고 다른 숫자는 999-888-7777입니다");
    expect(p.phone).toBe("010-1234-5678");
  });
  
  it("핸드폰 키워드로 전화번호 캡처", () => {
    const p = parseSignupUtterance("핸드폰 번호는 010 9876 5432입니다");
    expect(p.phone).toBe("010-9876-5432");
  });
  
  it("이름 추출", () => {
    const p = parseSignupUtterance("이름은 김철수이고 이메일은 a@b.com");
    expect(p.name).toBe("김철수");
  });
}); 