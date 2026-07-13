import { NextRequest, NextResponse } from "next/server";
import { CardProject, supabaseRequest } from "@/lib/supabase-rest";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const projects = await supabaseRequest<CardProject[]>(
      `card_projects?select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`,
    );
    const project = projects[0];
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const [versions, assets, reviews] = await Promise.all([
      supabaseRequest<Array<Record<string, unknown>>>(
        `card_versions?select=*&project_id=eq.${project.id}&order=version.desc&limit=1`,
      ),
      supabaseRequest<Array<Record<string, unknown>>>(
        `card_assets?select=*&project_id=eq.${project.id}&order=created_at.asc`,
      ),
      supabaseRequest<Array<Record<string, unknown>>>(
        `card_reviews?select=*&project_id=eq.${project.id}&order=created_at.desc&limit=50`,
      ),
    ]);
    const version = versions[0] || null;
    const currentAssets = version
      ? assets.filter((asset) => asset.version_id === version.id)
      : [];
    return NextResponse.json({ project, version, assets: currentAssets, reviews });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown backend error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
