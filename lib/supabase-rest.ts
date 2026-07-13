const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export class BackendConfigurationError extends Error {}

function configuration() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new BackendConfigurationError("Supabase server environment variables are not configured.");
  }
  return { supabaseUrl, serviceRoleKey };
}

export async function supabaseRequest<T>(
  path: string,
  init: RequestInit & { prefer?: string } = {},
): Promise<T> {
  const config = configuration();
  const response = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.prefer ? { Prefer: init.prefer } : {}),
      ...init.headers,
    },
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${body.slice(0, 800)}`);
  }
  return (body ? JSON.parse(body) : null) as T;
}

export type ProjectStatus =
  | "queued" | "researching" | "needs_review" | "needs_asset"
  | "revision_requested" | "approved" | "rendering" | "completed" | "failed";

export interface CardProject {
  id: string;
  order_index: number;
  country: string;
  country_code: string;
  city: string;
  slug: string;
  topic: string;
  status: ProjectStatus;
  run_date: string | null;
  current_version: number;
  updated_at: string;
}
