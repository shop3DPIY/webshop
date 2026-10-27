import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { productForRecentCheckout } from "@/lib/commerce/polar/checkout";

/**
 * Download buttons on the thank-you page, for buyers without (or not
 * signed in to) an account. The checkout id is the proof of purchase:
 * it's unguessable, only the buyer is sent to a URL containing it, and
 * it only works for a few days (see productForRecentCheckout). Signed-in
 * buyers use /api/account/download instead, which has no time limit.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ checkoutId: string; format: string }> },
) {
  const { checkoutId, format } = await params;

  const productId = await productForRecentCheckout(checkoutId);
  if (!productId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const { data: product } = await admin
    .from("products")
    .select("download_files")
    .eq("id", productId)
    .single();

  const file = product?.download_files.find(
    (f: { format: string; storagePath?: string }) => f.format === format && f.storagePath,
  );
  if (!file?.storagePath) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const { data: signed, error } = await admin.storage
    .from("product-files")
    .createSignedUrl(file.storagePath, 60, { download: file.fileName ?? true });

  if (error || !signed) {
    return NextResponse.json({ error: "Could not sign file" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
