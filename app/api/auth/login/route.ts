import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminPasswordConfigured, createAdminSession, validAdminPassword } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
  if (!adminPasswordConfigured()) {
    return NextResponse.json({ error: "관리자 비밀번호 환경변수가 현재 배포에 적용되지 않았습니다." }, { status: 503 });
  }
  const body = await request.json().catch(() => ({}));
  if (!validAdminPassword(body.password)) {
    return NextResponse.json({ error: "관리자 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }
  const session = createAdminSession();
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(ADMIN_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: session.maxAge,
  });
  return response;
}
