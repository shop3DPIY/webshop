/**
 * Hand-written to match supabase/migrations/0001_init.sql.
 *
 * Once a real Supabase project exists, regenerate this from the live
 * schema instead of maintaining it by hand:
 *   npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "customer" | "admin";
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string;
          category: string;
          extra_categories: string[];
          tags: string[];
          images: { src: string; alt: string }[];
          download_files: { format: string; fileName: string; note?: string; storagePath?: string }[];
          dimensions: { width: number; depth: number; height: number } | null;
          print_settings: {
            layerHeightMm?: number;
            recommendedMaterials?: string[];
            supportsRequired?: boolean;
            instructions?: string;
            compatiblePrinters?: string[];
          } | null;
          version: string;
          last_updated: string;
          license_type: "personal" | "commercial" | "enterprise" | "free";
          is_free: boolean;
          /** Old single Payhip id — unused since 0012 */
          external_commerce_id: string | null;
          /** Commerce provider (Polar) product id per license tier, see 0012 */
          commerce_product_ids: Partial<Record<"personal" | "small" | "unlimited", string>>;
          /** Last version buyers got an update mail about, see 0014 */
          update_notified_version: string | null;
          publication_status: "draft" | "published" | "archived";
          related_product_ids: string[] | null;
          external_links: { printables?: string; makerWorld?: string; compatible?: { label: string; url?: string }[] } | null;
          /** Chosen Persoonlijk price (see migration 0008) */
          price_cents: number | null;
          complexity: "simple" | "standard" | "complex";
          is_set: boolean;
          part_count: number;
          includes_step: boolean;
          price_personal_calc_cents: number | null;
          price_small_cents: number | null;
          price_small_calc_cents: number | null;
          price_unlimited_cents: number | null;
          price_unlimited_calc_cents: number | null;
          price_overrides: ("personal" | "small" | "unlimited")[];
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & {
          slug: string;
          title: string;
          description: string;
          category: string;
          license_type: "personal" | "commercial" | "enterprise" | "free";
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
      };
      orders: {
        Row: {
          id: string;
          external_order_id: string;
          checkout_id: string | null;
          buyer_email: string;
          customer_id: string | null;
          total_cents: number | null;
          currency: string | null;
          raw_payload: Record<string, unknown>;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]> & {
          external_order_id: string;
          buyer_email: string;
          raw_payload: Record<string, unknown>;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          external_product_id: string | null;
          title: string | null;
          price_cents: number | null;
          license_tier: "personal" | "small" | "unlimited" | null;
        };
        Insert: Partial<Database["public"]["Tables"]["order_items"]["Row"]> & {
          order_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Row"]>;
      };
      entitlements: {
        Row: {
          id: string;
          customer_id: string;
          product_id: string;
          order_id: string | null;
          granted_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["entitlements"]["Row"]> & {
          customer_id: string;
          product_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["entitlements"]["Row"]>;
      };
    };
  };
}
