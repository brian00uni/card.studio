import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { supabaseRequest } from "@/lib/supabase-rest";
import { createCardAssetSignedUrl } from "@/lib/supabase-storage";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const assets = await supabaseRequest<Array<{ storage_path: string | null }>>(
    `card_assets?select=storage_path&id=eq.${encodeURIComponent(id)}&limit=1`,
  );
  const path = assets[0]?.storage_path;
  if (!path) return NextResponse.json({ error: "다운로드된 이미지가 없습니다." }, { status: 404 });
  return NextResponse.redirect(await createCardAssetSignedUrl(path));
}
