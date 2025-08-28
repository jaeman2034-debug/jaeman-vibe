import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
export function toE164KR(raw) { const d = raw.replace(/\D/g, ""); if (d.startsWith("0"))
    return "+82" + d.slice(1); if (d.startsWith("82"))
    return "+" + d; return "+82" + d; }
let recaptcha = null;
function ensureRecaptcha(auth) { if (recaptcha)
    return recaptcha; const id = "recaptcha-container"; if (!document.getElementById(id)) {
    const div = document.createElement("div");
    div.id = id;
    div.style.display = "none";
    document.body.appendChild(div);
} recaptcha = new RecaptchaVerifier(auth, id, { size: "invisible" }); return recaptcha; }
export async function sendSms(auth, phoneDigits) { const verifier = ensureRecaptcha(auth); return signInWithPhoneNumber(auth, toE164KR(phoneDigits), verifier); }
export async function verifySmsCode(confirmation, code) { return confirmation.confirm(code); }
