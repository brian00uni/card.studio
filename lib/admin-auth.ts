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

function normalizePassword(value: string) {
  let normalized = value.normalize("NFKC").trim();
  const first = normalized.at(0);
  const last = normalized.at(-1);
  if (normalized.length >= 2 && first === last && (first === '"' || first === "'")) {
    normalized = normalized.slice(1, -1).trim();
  }
  return normalized;
}

function signature(payload: string) {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

export function validAdminPassword(password: unknown) {
  const configured = process.env.CARD_STUDIO_ADMIN_PASSWORD;
  return typeof password === "string" && typeof configured === "string" && configured.length > 0
    && safeEqual(normalizePassword(password), normalizePassword(configured));
}

export function adminPasswordConfigured() {
  return Boolean(process.env.CARD_STUDIO_ADMIN_PASSWORD?.trim());
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
