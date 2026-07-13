import { NextResponse } from "next/server";
import { supabaseRequest } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

type GenerationRun = {
  id: string;
  project_id: string | null;
  trigger_type: string;
  provider: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
};

export async function GET() {
  try {
    const runs = await supabaseRequest<GenerationRun[]>(
      "card_generation_runs?select=*&order=started_at.desc&limit=10",
    );
    return NextResponse.json({ runs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown backend error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
