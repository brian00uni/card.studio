import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { downloadApprovedImage } from "@/lib/safe-image-download";
import { supabaseRequest } from "@/lib/supabase-rest";
import { ensureCardAssetsBucket, uploadCardAsset } from "@/lib/supabase-storage";

type Asset = {
  id: string;
  project_id: string;
  version_id: string;
  category: string;
  source_url: string;
  approval_status: string;
  metadata: { imageUrl?: string };
};

export const maxDuration = 60;

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json() as { confirmProductMatch?: boolean; confirmUsageRights?: boolean };
    if (!body.confirmProductMatch || !body.confirmUsageRights) {
      return NextResponse.json({ error: "제품 일치와 이미지 사용 조건을 모두 확인해야 합니다." }, { status: 400 });
    }
    const { id } = await context.params;
    const assets = await supabaseRequest<Asset[]>(`card_assets?select=*&id=eq.${encodeURIComponent(id)}&limit=1`);
    const asset = assets[0];
    if (!asset) return NextResponse.json({ error: "약품 자산을 찾지 못했습니다." }, { status: 404 });
    if (asset.approval_status === "downloaded") return NextResponse.json({ ok: true, alreadyDownloaded: true });
    const imageUrl = asset.metadata?.imageUrl;
    if (!imageUrl) return NextResponse.json({ error: "실제 이미지 URL이 없습니다." }, { status: 400 });

    const image = await downloadApprovedImage(imageUrl);
    await ensureCardAssetsBucket();
    const storagePath = `${asset.project_id}/${asset.version_id}/${asset.id}.${image.extension}`;
    await uploadCardAsset(storagePath, image.bytes, image.contentType);
    const verifiedAt = new Date().toISOString();
    await supabaseRequest(`card_assets?id=eq.${asset.id}`, {
      method: "PATCH",
      prefer: "return=minimal",
      body: JSON.stringify({
        approval_status: "downloaded",
        storage_path: storagePath,
        verified_at: verifiedAt,
        metadata: {
          ...asset.metadata,
          finalImageUrl: image.finalUrl,
          contentType: image.contentType,
          byteLength: image.bytes.byteLength,
          productMatchConfirmed: true,
          usageRightsConfirmed: true,
        },
      }),
    });
    await supabaseRequest("card_reviews", {
      method: "POST",
      prefer: "return=minimal",
      body: JSON.stringify({
        project_id: asset.project_id,
        version_id: asset.version_id,
        card_number: 6,
        action: "approve_asset",
        result: { assetId: asset.id, storagePath, verifiedAt },
      }),
    });
    return NextResponse.json({ ok: true, storagePath, verifiedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown asset approval error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
