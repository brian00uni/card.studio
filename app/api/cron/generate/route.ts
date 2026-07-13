import { NextRequest, NextResponse } from "next/server";
import { countTraceableSources, generateResearchDraft } from "@/lib/groq";
import { CardProject, supabaseRequest } from "@/lib/supabase-rest";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

async function patchProject(id: string, body: Record<string, unknown>) {
  return supabaseRequest<CardProject[]>(`card_projects?id=eq.${id}`, {
    method: "PATCH",
    prefer: "return=representation",
    body: JSON.stringify(body),
  });
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let project: CardProject | undefined;
  let runId: string | undefined;
  try {
    const settings = await supabaseRequest<Array<{ enabled: boolean }>>(
      "automation_settings?select=enabled&id=eq.true&limit=1",
    );
    if (settings[0] && !settings[0].enabled) {
      return NextResponse.json({ skipped: true, reason: "Automation is disabled" });
    }

    const queue = await supabaseRequest<CardProject[]>(
      "card_projects?select=*&status=in.(queued,failed)&order=order_index.asc&limit=1",
    );
    project = queue[0];
    if (!project) return NextResponse.json({ skipped: true, reason: "No queued project" });

    await patchProject(project.id, { status: "researching", run_date: new Date().toISOString() });
    const runs = await supabaseRequest<Array<{ id: string }>>("card_generation_runs", {
      method: "POST",
      prefer: "return=representation",
      body: JSON.stringify({ project_id: project.id, trigger_type: "cron", provider: "groq", status: "started" }),
    });
    runId = runs[0]?.id;

    const draft = await generateResearchDraft(project);
    const traceableSourceCount = countTraceableSources(draft);
    const version = project.current_version + 1;
    if (project.current_version > 0) {
      await supabaseRequest(`card_versions?project_id=eq.${project.id}&status=neq.approved`, {
        method: "PATCH",
        prefer: "return=minimal",
        body: JSON.stringify({ status: "superseded" }),
      });
    }
    const versions = await supabaseRequest<Array<{ id: string }>>("card_versions", {
      method: "POST",
      prefer: "return=representation",
      body: JSON.stringify({
        project_id: project.id,
        version,
        status: "needs_review",
        card_data: draft.cardData,
        research: draft.research,
        sources: draft.sources,
        qa_report: draft.qaReport,
        caption: draft.caption,
        text_version: draft.textVersion,
      }),
    });
    const versionId = versions[0]?.id;

    const medicineCandidates = (draft.medicineCandidates || []).filter((asset) =>
      /^https:\/\//.test(asset.sourceUrl || ""),
    );
    if (medicineCandidates.length) {
      await supabaseRequest("card_assets", {
        method: "POST",
        prefer: "return=minimal",
        body: JSON.stringify(medicineCandidates.map((asset) => ({
          project_id: project!.id,
          version_id: versionId,
          category: asset.category,
          local_product_name: asset.localProductName,
          korean_product_name: asset.koreanProductName,
          source_url: asset.sourceUrl,
          source_type: asset.sourceType || "manufacturer",
          usage_note: asset.usageNote,
          approval_status: "pending",
        }))),
      });
    }

    const nextStatus = traceableSourceCount >= 3 ? "needs_asset" : "needs_review";
    await patchProject(project.id, { status: nextStatus, current_version: version });
    if (runId) await supabaseRequest(`card_generation_runs?id=eq.${runId}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: JSON.stringify({ status: "completed", finished_at: new Date().toISOString(), metadata: { version, versionId } }),
    });
    return NextResponse.json({ ok: true, project: project.slug, version, status: nextStatus, traceableSourceCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown generation error";
    if (project) await patchProject(project.id, { status: "failed" }).catch(() => undefined);
    if (runId) await supabaseRequest(`card_generation_runs?id=eq.${runId}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: JSON.stringify({ status: "failed", finished_at: new Date().toISOString(), error_message: message.slice(0, 2000) }),
    }).catch(() => undefined);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
