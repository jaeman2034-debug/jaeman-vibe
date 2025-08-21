import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import type { Auth, ConfirmationResult } from "firebase/auth";

export function toE164KR(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (d.startsWith("0")) return "+82" + d.slice(1);
  if (d.startsWith("82")) return "+" + d;
  return "+82" + d;
}

let recaptcha: RecaptchaVerifier | null = null;
function ensureRecaptcha(auth: Auth) {
  if (recaptcha) return recaptcha;
  const id = "recaptcha-container";
  if (!document.getElementById(id)) {
    const div = document.createElement("div");
    div.id = id; div.style.display = "none"; document.body.appendChild(div);
  }
  recaptcha = new RecaptchaVerifier(auth, id, { size: "invisible" });
  return recaptcha;
}

export async function sendSms(auth: Auth, phoneDigits: string): Promise<ConfirmationResult> {
  const verifier = ensureRecaptcha(auth);
  return signInWithPhoneNumber(auth, toE164KR(phoneDigits), verifier);
}
export async function verifySmsCode(confirmation: ConfirmationResult, code: string) {
  return confirmation.confirm(code);
} 