import { NextRequest, NextResponse } from "next/server";

// 허용 오리진: 환경변수로 관리 (쉼표 구분)
const allow = (process.env.ALLOWED_ORIGINS || "")
  .split(",").map(s => s.trim()).filter(Boolean);

function withCORS(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get("origin") || "";
  const ok = allow.length ? allow.includes(origin) : true; // 설정 없으면 모두 허용
  res.headers.set("Access-Control-Allow-Origin", ok ? origin : "null");
  res.headers.set("Vary", "Origin");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

export async function OPTIONS(req: NextRequest) {
  return withCORS(req, new NextResponse(null, { status: 204 }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // TODO: 저장 (DB/S3 등)
    console.log("[telemetry]", Array.isArray(body?.events) ? body.events.length : 0);
    const res = NextResponse.json({ ok: true });
    return withCORS(req, res);
  } catch (e) {
    return withCORS(req, NextResponse.json({ ok: false }, { status: 400 }));
  }
} 