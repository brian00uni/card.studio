import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { GroqDraft, reviseResearchDraft } from "@/lib/groq";
import { CardProject, supabaseRequest } from "@/lib/supabase-rest";

export const maxDuration = 120;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { slug } = await context.params;
    const body = await request.json() as { prompt?: string; cardNumber?: number };
    const prompt = body.prompt?.trim();
    if (!prompt || prompt.length < 3) return NextResponse.json({ error: "수정 요청을 입력하세요." }, { status: 400 });
    if (body.cardNumber && (body.cardNumber < 1 || body.cardNumber > 7)) {
      return NextResponse.json({ error: "카드 번호는 1~7이어야 합니다." }, { status: 400 });
    }

    const projects = await supabaseRequest<CardProject[]>(
      `card_projects?select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`,
    );
    const project = projects[0];
    if (!project || project.current_version < 1) {
      return NextResponse.json({ error: "수정할 초안이 없습니다." }, { status: 404 });
    }
    const versions = await supabaseRequest<Array<{
      id: string;
      version: number;
      card_data: Record<string, unknown>;
      research: Record<string, unknown>;
      sources: Array<Record<string, unknown>>;
      qa_report: Record<string, unknown>;
      caption: string;
      text_version: string;
    }>>(`card_versions?select=*&project_id=eq.${project.id}&version=eq.${project.current_version}&limit=1`);
    const current = versions[0];
    if (!current) return NextResponse.json({ error: "현재 버전을 찾지 못했습니다." }, { status: 404 });

    const currentDraft: GroqDraft = {
      cardData: current.card_data,
      research: current.research,
      sources: current.sources,
      qaReport: current.qa_report,
      caption: current.caption,
      textVersion: current.text_version,
      medicineCandidates: [],
    };
    const revised = await reviseResearchDraft(currentDraft, prompt, body.cardNumber);
    const nextVersion = project.current_version + 1;

    await supabaseRequest(`card_versions?id=eq.${current.id}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: JSON.stringify({ status: "superseded" }),
    });
    const created = await supabaseRequest<Array<{ id: string }>>("card_versions", {
      method: "POST",
      prefer: "return=representation",
      body: JSON.stringify({
        project_id: project.id,
        version: nextVersion,
        status: "needs_review",
        card_data: revised.cardData,
        research: revised.research,
        sources: revised.sources,
        qa_report: revised.qaReport,
        caption: revised.caption,
        text_version: revised.textVersion,
      }),
    });
    const versionId = created[0]?.id;
    await supabaseRequest("card_reviews", {
      method: "POST",
      prefer: "return=minimal",
      body: JSON.stringify({
        project_id: project.id,
        version_id: versionId,
        card_number: body.cardNumber || null,
        action: "revision_request",
        prompt,
        result: { previousVersion: current.version, newVersion: nextVersion },
      }),
    });
    await supabaseRequest(`card_projects?id=eq.${project.id}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: JSON.stringify({ status: "needs_review", current_version: nextVersion }),
    });
    return NextResponse.json({ ok: true, version: nextVersion, versionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown revision error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
