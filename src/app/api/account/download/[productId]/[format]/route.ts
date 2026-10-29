import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Authorizes a single file download.
 *
 * Entitlement is checked with the REGULAR (RLS-respecting) client — if the
 * signed-in user has no `entitlements` row for this product, the query
 * simply returns nothing and we 403. Only after that check passes do we
 * use the service-role client to mint a short-lived signed URL from the
 * private `product-files` bucket. The file path is never public, and
 * nothing here trusts a client-supplied "payment succeeded" flag.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string; format: string }> },
) {
  const { productId, format } = await params;

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: entitlement } = await supabase
    .from("entitlements")
    .select("product_id")
    .eq("customer_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (!entitlement) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  // Service-role read (entitlement already checked above): a design that
  // was taken offline (archived) is hidden by RLS but stays downloadable
  // for the people who own it.
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
    .createSignedUrl(file.storagePath, 60);

  if (error || !signed) {
    return NextResponse.json({ error: "Could not sign file" }, { status: 500 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
