import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { productForFreeToken } from "@/lib/free/server";

/**
 * Download buttons in the free-design mail (src/lib/free). The token is
 * the proof the visitor subscribed with a real address; it works for
 * FREE_LINK_DAYS and only while the design is still free and published.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string; format: string }> },
) {
  const { token, format } = await params;

  const productId = await productForFreeToken(token);
  const admin = createAdminClient();
  if (!productId || !admin) {
    return NextResponse.json({ error: "Link expired or not valid" }, { status: 403 });
  }

  const { data: product } = await admin
    .from("products")
    .select("download_files, is_free, publication_status")
    .eq("id", productId)
    .single();
  if (!product?.is_free || product.publication_status !== "published") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const file = product.download_files.find(
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
