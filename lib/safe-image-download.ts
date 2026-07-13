import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_BYTES = 8 * 1024 * 1024;
const MIME_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function privateAddress(address: string) {
  const lower = address.toLowerCase();
  if (lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80:")) return true;
  if (lower.startsWith("::ffff:")) return privateAddress(lower.slice(7));
  const parts = lower.split(".").map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return false;
  return parts[0] === 10 || parts[0] === 127 || parts[0] === 0
    || (parts[0] === 169 && parts[1] === 254)
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168);
}

async function assertPublicHttps(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("이미지 URL은 HTTPS만 허용합니다.");
  if (url.username || url.password) throw new Error("인증정보가 포함된 URL은 허용하지 않습니다.");
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".local")) throw new Error("내부 주소는 허용하지 않습니다.");
  if (isIP(hostname)) {
    if (privateAddress(hostname)) throw new Error("내부 IP 주소는 허용하지 않습니다.");
  } else {
    const addresses = await lookup(hostname, { all: true });
    if (!addresses.length || addresses.some(({ address }) => privateAddress(address))) {
      throw new Error("공개 인터넷 이미지 주소만 허용합니다.");
    }
  }
  return url;
}

export async function downloadApprovedImage(source: string) {
  let url = await assertPublicHttps(source);
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    const response = await fetch(url, {
      redirect: "manual",
      headers: { "User-Agent": "CardStudioAssetVerifier/1.0" },
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirects === 3) throw new Error("이미지 리디렉션을 확인할 수 없습니다.");
      url = await assertPublicHttps(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) throw new Error(`이미지 다운로드 실패: HTTP ${response.status}`);
    const contentType = response.headers.get("content-type")?.split(";")[0].toLowerCase() || "";
    const extension = MIME_EXTENSIONS[contentType];
    if (!extension) throw new Error("JPG, PNG, WEBP 실제 이미지 파일만 허용합니다.");
    const declaredLength = Number(response.headers.get("content-length") || "0");
    if (declaredLength > MAX_BYTES) throw new Error("이미지는 8MB 이하여야 합니다.");
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > MAX_BYTES) throw new Error("이미지는 8MB 이하여야 합니다.");
    if (bytes.byteLength < 1024) throw new Error("이미지 파일이 너무 작아 실제 패키지를 확인할 수 없습니다.");
    return { bytes, contentType, extension, finalUrl: url.toString() };
  }
  throw new Error("이미지를 다운로드하지 못했습니다.");
}
