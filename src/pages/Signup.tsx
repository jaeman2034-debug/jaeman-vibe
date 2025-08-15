import React, { useEffect, useState } from "react";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("signupPrefill");
    if (saved) {
      const v = JSON.parse(saved);
      setName(v.name || "");
      setEmail(v.email || "");
      setPhone(v.phone || "");
      setPassword(v.password || "");
      localStorage.removeItem("signupPrefill");
    }
  }, []);

  // ... 실제 제출 로직(onSubmit 등) 연결
  return (
    <form style={{ padding: 16 }}>
      <h1>Signup</h1>
      <label>이름</label>
      <input value={name} onChange={(e)=>setName(e.target.value)} />
      <label>이메일</label>
      <input value={email} onChange={(e)=>setEmail(e.target.value)} />
      <label>전화번호</label>
      <input value={phone} onChange={(e)=>setPhone(e.target.value)} />
      <label>비밀번호</label>
      <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
      <button type="submit">가입</button>
    </form>
  );
}
