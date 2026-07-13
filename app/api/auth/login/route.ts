import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, createAdminSession, validAdminPassword } from "@/lib/admin-auth";

export async function POST(request: NextRequest) {
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
