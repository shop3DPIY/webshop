import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RequestForm } from "@/components/requests/RequestForm";
import { VoteButton } from "@/components/requests/VoteButton";
import { getProductBySlug } from "@/lib/products";
import { getPublicRequests } from "@/lib/requests/server";
import { createClient } from "@/lib/supabase/server";
import { productText } from "@/types/product";

export async function generateMetadata() {
  const t = await getTranslations("requests");
  return { title: t("title"), description: t("description") };
}

/**
 * Model requests: the form ("I'd like a design for …" or "something's
 * wrong with …", opened from the button under the designs) and the
 * public wish list, where signed-in visitors vote. Carmen decides in
 * Studio → Requests what goes on the list.
 */
export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; kind?: string }>;
}) {
  const { product: slug, kind } = await searchParams;
  const t = await getTranslations("requests");
  const locale = await getLocale();
  const product = slug ? await getProductBySlug(slug.slice(0, 200)) : undefined;

  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  const { data: profile } = user
    ? await supabase!.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
    : { data: null };
  const requests = await getPublicRequests(user?.id ?? null);

  const statusLabel = {
    open: null,
    planned: t("statusPlanned"),
    done: t("statusDone"),
  } as const;

  return (
    <Container panel className="flex flex-col gap-12 py-12 sm:py-16">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[2fr_3fr] lg:items-start lg:gap-14">
        <SectionHeading
          as="h1"
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
        />
        <div className="min-w-0 rounded-3xl p-5 glass sm:p-8">
          <RequestForm
            product={product && { slug: product.slug, title: productText(product, locale).title }}
            initialKind={kind === "problem" ? "problem" : "request"}
            defaultName={profile?.full_name ?? ""}
            defaultEmail={user?.email ?? ""}
          />
        </div>
      </div>

      <section className="flex flex-col gap-4" aria-labelledby="wishlist">
        <div>
          <h2 id="wishlist" className="font-display text-ink text-2xl font-semibold">
            {t("listTitle")}
          </h2>
          <p className="text-ink mt-1 text-sm">
            {user ? t("listIntro") : t("listIntroSignedOut")}
          </p>
        </div>
        {requests.length === 0 ? (
          <p className="text-ink rounded-3xl p-6 text-sm glass">{t("listEmpty")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {requests.map((r) => (
              <li key={r.id} className="flex items-start gap-4 rounded-3xl p-4 glass sm:p-5">
                <VoteButton
                  requestId={r.id}
                  votes={r.votes}
                  voted={r.voted}
                  signedIn={!!user}
                  disabled={r.status === "done"}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-ink flex flex-wrap items-center gap-2 font-semibold">
                    {r.title}
                    {statusLabel[r.status] && (
                      <span className="border-brand-purple bg-brand-purple/25 rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                        {statusLabel[r.status]}
                      </span>
                    )}
                  </p>
                  {r.details && (
                    <p className="text-ink mt-1 text-sm whitespace-pre-line">{r.details}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
