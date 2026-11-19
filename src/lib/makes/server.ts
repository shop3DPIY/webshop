import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Customer "makes" (migration 0016): photos owners share of their print.
 * Pending until approved in Studio → Makes; approved ones show on the
 * product page. Photos live in the public customer-makes bucket.
 */

export const MAKES_BUCKET = "customer-makes";

export interface Make {
  id: string;
  imageUrl: string;
  displayName: string;
  caption: string;
}

export function makeImageUrl(path: string): string {
  const admin = createAdminClient();
  return admin?.storage.from(MAKES_BUCKET).getPublicUrl(path).data.publicUrl ?? "";
}

export async function getApprovedMakes(productId: string): Promise<Make[]> {
  const admin = createAdminClient();
  if (!admin) return [];
  const { data } = await admin
    .from("customer_makes")
    .select("id, image_path, display_name, caption")
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("approved_at", { ascending: false })
    .limit(24);
  return (data ?? []).map((m) => ({
    id: m.id,
    imageUrl: makeImageUrl(m.image_path),
    displayName: m.display_name,
    caption: m.caption,
  }));
}

export interface GalleryMake extends Make {
  product: { slug: string; title: string; titleNl: string | null };
}

/** All approved makes, newest first, with the design they belong to. */
export async function getAllApprovedMakes(): Promise<GalleryMake[]> {
  const admin = createAdminClient();
  if (!admin) return [];
  const { data } = await admin
    .from("customer_makes")
    .select("id, image_path, display_name, caption, products(slug, title, title_nl, publication_status)")
    .eq("status", "approved")
    .order("approved_at", { ascending: false })
    .limit(120);
  return (data ?? []).flatMap((m) => {
    const p = (Array.isArray(m.products) ? m.products[0] : m.products) as
      | { slug: string; title: string; title_nl: string | null; publication_status: string }
      | null;
    if (!p || p.publication_status !== "published") return [];
    return [{
      id: m.id,
      imageUrl: makeImageUrl(m.image_path),
      displayName: m.display_name,
      caption: m.caption,
      product: { slug: p.slug, title: p.title, titleNl: p.title_nl },
    }];
  });
}
