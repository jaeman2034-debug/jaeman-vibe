import { describe, it, expect } from "vitest";
import { parseSignupUtterance } from "./nlu/parseSignup";
describe("parseSignupUtterance", () => { it("?�메??공백 ?�축", () => { const p = parseSignupUtterance("?�메?��? k i m 골뱅???�이�???c o m"); expect(p.email).toBe("kim@naver.com"); }); it("비번 ??글?�씩", () => { const p = parseSignupUtterance("비�?번호??p a s s w o r d 1 2 3 ?�니??);    expect(p.password).toBe(", password123, ");  });    it(", 비); }); });
