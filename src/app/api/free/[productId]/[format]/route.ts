import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Download button of a free design: no checkout, no Polar, no account
 * needed. Only published designs marked free in Studio qualify — paid
 * files stay behind /api/account/download and the thank-you page.
 *
 * A signed-in visitor also gets the design added to their library, so
 * it's there to download again later.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string; format: string }> },
) {
  const { productId, format } = await params;

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const { data: product } = await admin
    .from("products")
    .select("id, download_files, is_free, publication_status")
    .eq("id", productId)
    .maybeSingle();
  if (!product?.is_free || product.publication_status !== "published") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const file = product.download_files.find(
    (f: { format: string; storagePath?: string }) => f.format === format && f.storagePath,
  );
  if (!file?.storagePath) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (user) {
    await admin
      .from("entitlements")
      .upsert(
        { customer_id: user.id, product_id: product.id },
        { onConflict: "customer_id,product_id", ignoreDuplicates: true },
      );
  }

  const { data: signed, error } = await admin.storage
    .from("product-files")
    .createSignedUrl(file.storagePath, 60, { download: file.fileName ?? true });

  if (error || !signed) {
    return NextResponse.json({ error: "Could not sign file" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
