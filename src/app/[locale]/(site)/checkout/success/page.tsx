import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { confirmCheckout } from "@/lib/commerce/polar/checkout";

export async function generateMetadata() {
  const t = await getTranslations("checkoutSuccess");
  return { title: t("title"), robots: { index: false, follow: false } };
}

/**
 * Where Polar sends the buyer after paying. Confirms the purchase with
 * Polar itself, stores the order (in case the webhook hasn't arrived)
 * and offers the files straight away — no account needed.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout_id?: string }>;
}) {
  const { checkout_id: checkoutId = "" } = await searchParams;
  const t = await getTranslations("checkoutSuccess");
  const tAccount = await getTranslations("account");
  const result = await confirmCheckout(checkoutId);

  if (result.status !== "paid") {
    const pending = result.status === "pending";
    return (
      <Container panel className="flex flex-col items-center gap-6 py-24 text-center">
        <SectionHeading
          as="h1"
          title={pending ? t("pendingTitle") : t("invalidTitle")}
          description={pending ? t("pendingBody") : t("invalidBody")}
        />
        {pending ? (
          <a
            href={`?checkout_id=${encodeURIComponent(checkoutId)}`}
            className="text-ink text-sm font-medium underline"
          >
            {t("refresh")}
          </a>
        ) : (
          <Button href="/contact">{t("contact")}</Button>
        )}
      </Container>
    );
  }

  const admin = createAdminClient();
  const locale = await getLocale();
  const { data: row } = await admin!
    .from("products")
    .select("title, title_nl, download_files, bundle_product_ids")
    .eq("id", result.productId)
    .single();
  const titleOf = (p: { title: string; title_nl: string | null } | null) =>
    (locale === "nl" && p?.title_nl) || p?.title || "";
  const title = titleOf(row);

  // What to download: the design itself, or each design in a bundle
  // (?p= tells the download route which one).
  const bundleIds = (row?.bundle_product_ids ?? []) as string[];
  const { data: parts } =
    bundleIds.length > 0
      ? await admin!
          .from("products")
          .select("id, title, title_nl, download_files")
          .in("id", bundleIds)
      : { data: null };
  const groups = (
    parts
      ? parts.map((p) => ({ id: p.id as string, title: titleOf(p), files: p.download_files }))
      : [{ id: null, title: "", files: row?.download_files ?? [] }]
  ) as { id: string | null; title: string; files: { format: string }[] }[];

  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  return (
    <Container panel className="flex flex-col items-center gap-8 py-24 text-center">
      <SectionHeading as="h1" title={t("title")} description={t("body", { title })} />

      <div className="flex flex-col items-center gap-6">
        {groups.map((group) => (
          <div key={group.id ?? "single"} className="flex flex-col items-center gap-3">
            {group.title && (
              <p className="font-display text-ink font-semibold">{group.title}</p>
            )}
            <div className="flex flex-wrap justify-center gap-3">
              {group.files.map((file) => (
                <Button
                  key={file.format}
                  href={`/api/checkout/download/${checkoutId}/${file.format}${group.id ? `?p=${group.id}` : ""}`}
                  size="lg"
                >
                  {tAccount("download")} ({file.format})
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-ink/60 max-w-md text-sm">
        {user
          ? t("inLibrary")
          : t("keepIt", { email: result.email })}{" "}
        <Link
          href={user ? "/account" : "/auth/sign-in"}
          className="text-ink font-medium underline"
        >
          {user ? t("toLibrary") : tAccount("signIn")}
        </Link>
      </p>
    </Container>
  );
}
