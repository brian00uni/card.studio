import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

export const ADMIN_COOKIE = "card_studio_admin";
const SESSION_SECONDS = 60 * 60 * 8;

function signingSecret() {
  const secret = process.env.CRON_SECRET;
  if (!secret) throw new Error("CRON_SECRET is not configured.");
  return secret;
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function signature(payload: string) {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

export function validAdminPassword(password: unknown) {
  const configured = process.env.CARD_STUDIO_ADMIN_PASSWORD;
  return typeof password === "string" && Boolean(configured) && safeEqual(password, configured!);
}

export function createAdminSession() {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString("base64url");
  return { token: `${payload}.${signature(payload)}`, maxAge: SESSION_SECONDS };
}

export function isAdminRequest(request: NextRequest) {
  try {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) return false;
    const [payload, providedSignature] = token.split(".");
    if (!payload || !providedSignature || !safeEqual(providedSignature, signature(payload))) return false;
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
    return typeof parsed.exp === "number" && parsed.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
