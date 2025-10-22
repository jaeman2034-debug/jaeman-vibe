// src/lib/openai.ts
async function askOpenAI(prompt: string) {
  const url =
    import.meta.env.DEV
      ? "http://127.0.0.1:5001/jaeman-vibe-platform/asia-northeast3/openaiChat" // 에뮬레이터/로컬 Functions(포트는 환경에 따라 5001/5002)
      : "https://asia-northeast3-jaeman-vibe-platform.cloudfunctions.net/openaiChat";

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await r.json();
  if (!data.ok) throw new Error(data.error || "OpenAI call failed");
  return data.text as string;
}

export { askOpenAI };
