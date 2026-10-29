import { createAdminClient } from "@/lib/supabase/admin";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { BackendNotConnected } from "@/components/system/BackendNotConnected";
import { SignOutButton } from "@/components/account/SignOutButton";
import { ProfileSettingsForm } from "@/components/account/ProfileSettingsForm";
import { AccountNewsletter } from "@/components/newsletter/AccountNewsletter";
import { Link } from "@/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import {
  COLLECTION_CLASSNAMES,
  type CollectionSlug,
} from "@/lib/config/colors";

export async function generateMetadata() {
  const t = await getTranslations("account");
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ newsletter?: string }>;
}) {
  const { newsletter } = await searchParams;
  const t = await getTranslations("account");
  const tHero = await getTranslations("hero");

  if (!isSupabaseConfigured()) {
    return (
      <Container panel className="py-16 sm:py-24">
        <BackendNotConnected />
      </Container>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();

  if (!user) {
    return (
      <Container
        panel
        className="flex flex-col items-center gap-6 py-24 text-center"
      >
        <SectionHeading as="h1" title={t("title")} />
        <Button href="/auth/sign-in" size="lg">
          {t("signIn")}
        </Button>
      </Container>
    );
  }

  const [{ data: profile }, { data: entitlementRows }, { data: orders }] =
    await Promise.all([
      supabase!
        .from("profiles")
        .select("full_name, email, role")
        .eq("id", user.id)
        .single(),
      supabase!
        .from("entitlements")
        .select("product_id, granted_at")
        .order("granted_at", { ascending: false }),
      supabase!
        .from("orders")
        .select("id, external_order_id, total_cents, currency, created_at")
        .order("created_at", { ascending: false }),
    ]);

  // Two queries instead of a nested .select() embed: PostgREST embeds are
  // ambiguous (one-to-many vs. one-to-one) without generated types, so this
  // is both simpler to type and simpler to read.
  const productIds = (entitlementRows ?? []).map((row) => row.product_id);
  const { data: libraryProducts } =
    productIds.length > 0
      ? // Service-role read: the ids come from the visitor's own
        // (RLS-checked) entitlements, and owned designs that were taken
        // offline (archived) must stay in the library — the public RLS
        // policy only shows published products.
        await (createAdminClient() ?? supabase!)
          .from("products")
          .select("id, slug, title, category, download_files")
          .in("id", productIds)
      : { data: [] };

  return (
    <Container panel className="flex flex-col gap-14 py-16 sm:py-24">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("title")} />
        <SignOutButton />
      </div>

      {profile?.role === "admin" && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6 glass">
          <div>
            <p className="font-display text-ink text-base font-semibold">
              {t("adminBannerTitle")}
            </p>
            <p className="text-ink/70 mt-1 text-sm">{t("adminBannerBody")}</p>
          </div>
          {/* Plain <a>, not the i18n-aware Button/Link: /studio lives
              outside the [locale] route tree entirely. */}
          <a
            href="/studio"
            className="border border-action bg-action text-on-action hover:border-action-hover-border hover:bg-action-hover hover:text-on-action-hover backdrop-blur-lg inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold"
          >
            {t("adminBannerCta")}
          </a>
        </div>
      )}

      <section className="flex flex-col gap-6">
        <h2 className="font-display text-ink text-xl font-semibold">
          {t("libraryTab")}
        </h2>
        {libraryProducts && libraryProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {libraryProducts.map((product) => {
              const classes =
                COLLECTION_CLASSNAMES[product.category as CollectionSlug];
              return (
                <div key={product.id} className="rounded-3xl p-5 glass">
                  <span
                    className={`inline-flex h-3 w-3 rounded-full ${classes?.bg ?? "bg-ink"}`}
                  />
                  <h3 className="font-display text-ink mt-3 text-base font-semibold">
                    {product.title}
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {product.download_files.map((file: { format: string }) => (
                      <Button
                        key={file.format}
                        href={`/api/account/download/${product.id}/${file.format}`}
                        variant="secondary"
                        size="md"
                      >
                        {t("download")} ({file.format})
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl p-10 text-center glass">
            <p className="font-medium">{t("libraryEmptyTitle")}</p>
            <p className="text-ink/60 mt-1 text-sm">{t("libraryEmptyBody")}</p>
            <Link
              href="/shop"
              className="text-ink mt-4 inline-block text-sm font-medium"
            >
              {tHero("ctaShop")}
            </Link>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="font-display text-ink text-xl font-semibold">
          {t("ordersTab")}
        </h2>
        {orders && orders.length > 0 ? (
          <div className="divide-line divide-y rounded-3xl glass">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-5 text-sm"
              >
                <div>
                  <p className="font-medium">{order.external_order_id}</p>
                  <p className="text-ink/60">{order.created_at}</p>
                </div>
                {order.total_cents != null && (
                  <p className="font-medium">
                    {(order.total_cents / 100).toFixed(2)} {order.currency}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl p-10 text-center glass">
            <p className="font-medium">{t("ordersEmptyTitle")}</p>
            <p className="text-ink/60 mt-1 text-sm">{t("ordersEmptyBody")}</p>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="font-display text-ink text-xl font-semibold">
          {t("settingsTab")}
        </h2>
        {/* Profile form and newsletter side by side on wide screens. */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <div className="min-w-0">
            <ProfileSettingsForm
              userId={user.id}
              email={profile?.email ?? user.email ?? ""}
              fullName={profile?.full_name ?? ""}
            />
          </div>
          <AccountNewsletter
            email={profile?.email ?? user.email ?? ""}
            justSubscribed={newsletter === "subscribed"}
          />
        </div>
      </section>
    </Container>
  );
}
