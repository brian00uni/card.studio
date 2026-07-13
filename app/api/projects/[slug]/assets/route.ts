import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { CardProject, supabaseRequest } from "@/lib/supabase-rest";

function httpsUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { slug } = await context.params;
    const body = await request.json() as Record<string, unknown>;
    const productPageUrl = httpsUrl(body.productPageUrl);
    const imageUrl = httpsUrl(body.imageUrl);
    if (!productPageUrl || !imageUrl) {
      return NextResponse.json({ error: "공식 제품 페이지와 실제 이미지의 HTTPS URL이 모두 필요합니다." }, { status: 400 });
    }
    const category = String(body.category || "").trim();
    const localName = String(body.localProductName || "").trim();
    if (!category || !localName) return NextResponse.json({ error: "약품 분류와 현지 제품명이 필요합니다." }, { status: 400 });
    const projects = await supabaseRequest<CardProject[]>(`card_projects?select=*&slug=eq.${encodeURIComponent(slug)}&limit=1`);
    const project = projects[0];
    if (!project || project.current_version < 1) return NextResponse.json({ error: "현재 카드 버전이 없습니다." }, { status: 404 });
    const versions = await supabaseRequest<Array<{ id: string }>>(
      `card_versions?select=id&project_id=eq.${project.id}&version=eq.${project.current_version}&limit=1`,
    );
    const versionId = versions[0]?.id;
    if (!versionId) return NextResponse.json({ error: "현재 버전을 찾지 못했습니다." }, { status: 404 });
    const assets = await supabaseRequest<Array<Record<string, unknown>>>("card_assets", {
      method: "POST",
      prefer: "return=representation",
      body: JSON.stringify({
        project_id: project.id,
        version_id: versionId,
        category,
        local_product_name: localName,
        korean_product_name: String(body.koreanProductName || "").trim(),
        source_url: productPageUrl,
        source_type: "manufacturer",
        usage_note: String(body.usageNote || "").trim(),
        approval_status: "pending",
        metadata: { imageUrl },
      }),
    });
    return NextResponse.json({ asset: assets[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown asset error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
