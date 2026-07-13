import { NextResponse } from "next/server";
import { BackendConfigurationError, CardProject, supabaseRequest } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const projects = await supabaseRequest<CardProject[]>(
      "card_projects?select=*&order=order_index.asc",
    );
    return NextResponse.json({ projects });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown backend error";
    const status = error instanceof BackendConfigurationError ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
