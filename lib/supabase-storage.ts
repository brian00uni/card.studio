const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "card-assets";

function configuration() {
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase storage environment variables are not configured.");
  return { supabaseUrl, serviceRoleKey };
}

function headers(contentType?: string) {
  const config = configuration();
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    ...(contentType ? { "Content-Type": contentType } : {}),
  };
}

export async function ensureCardAssetsBucket() {
  const config = configuration();
  const response = await fetch(`${config.supabaseUrl}/storage/v1/bucket`, {
    method: "POST",
    headers: headers("application/json"),
    body: JSON.stringify({
      id: BUCKET,
      name: BUCKET,
      public: false,
      file_size_limit: 8 * 1024 * 1024,
      allowed_mime_types: ["image/jpeg", "image/png", "image/webp"],
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    if (!body.toLowerCase().includes("already exists") && !body.toLowerCase().includes("duplicate")) {
      throw new Error(`Supabase bucket ${response.status}: ${body.slice(0, 500)}`);
    }
  }
}

export async function uploadCardAsset(path: string, bytes: ArrayBuffer, contentType: string) {
  const config = configuration();
  const response = await fetch(`${config.supabaseUrl}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: { ...headers(contentType), "x-upsert": "false" },
    body: bytes,
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Supabase upload ${response.status}: ${body.slice(0, 500)}`);
  return body ? JSON.parse(body) : {};
}

export async function createCardAssetSignedUrl(path: string, expiresIn = 3600) {
  const config = configuration();
  const response = await fetch(`${config.supabaseUrl}/storage/v1/object/sign/${BUCKET}/${path}`, {
    method: "POST",
    headers: headers("application/json"),
    body: JSON.stringify({ expiresIn }),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Supabase sign ${response.status}: ${body.slice(0, 500)}`);
  const payload = JSON.parse(body) as { signedURL?: string; signedUrl?: string };
  const signedPath = payload.signedURL || payload.signedUrl;
  if (!signedPath) throw new Error("Supabase returned no signed asset URL.");
  return signedPath.startsWith("http") ? signedPath : `${config.supabaseUrl}/storage/v1${signedPath}`;
}
