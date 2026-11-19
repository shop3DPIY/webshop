import { getLocale, getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { Calculator } from "@/components/calculator/Calculator";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmDialog";
import { deleteCalculation } from "@/lib/calculator/actions";
import { createClient } from "@/lib/supabase/server";
import { toLibraryItem } from "@/lib/calculator/library";
import { DEFAULT_INPUTS, withDefaults, type CalcInputs } from "@/lib/calculator/calc";

export async function generateMetadata() {
  const t = await getTranslations("calculator");
  return { title: t("fullTitle"), robots: { index: false, follow: false } };
}

const EUR = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

/** The full calculator for signed-in visitors, with their saved calculations. */
export default async function AccountCalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; draft?: string }>;
}) {
  const { id, draft } = await searchParams;
  // From the public calculator: start from what was filled in there.
  let draftInputs: Partial<CalcInputs> | null = null;
  try {
    draftInputs = draft ? withDefaults({ ...DEFAULT_INPUTS, ...JSON.parse(draft.slice(0, 4000)) }) : null;
  } catch {}
  const t = await getTranslations("calculator");
  const locale = await getLocale();
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    return (
      <Container panel className="flex flex-col items-center gap-6 py-24 text-center">
        <SectionHeading as="h1" title={t("fullTitle")} description={t("signInBody")} />
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            href={`/auth/sign-in?next=${encodeURIComponent(`/account/calculator${draft ? `?draft=${encodeURIComponent(draft)}` : ""}`)}`}
            size="lg"
          >{t("signIn")}</Button>
          <Button href="/auth/sign-up" variant="secondary" size="lg">{t("signUp")}</Button>
        </div>
        <Link href="/tools/3d-print-cost-calculator" className="text-ink text-sm underline">
          {t("backToSimple")}
        </Link>
      </Container>
    );
  }

  const { data: saved } = await supabase!
    .from("calculations")
    .select("id, name, inputs, price_cents, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });
  const current = id ? saved?.find((c) => c.id === id) : undefined;
  const { data: libraryRows } = await supabase!
    .from("calc_library")
    .select("*")
    .eq("user_id", user.id)
    .order("name");
  const library = (libraryRows ?? []).map(toLibraryItem);
  const dateLocale = locale === "nl" ? "nl-NL" : "en-GB";

  return (
    <Container panel className="flex flex-col gap-10 py-12 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("fullTitle")} description={t("fullIntro")} />
        <Link href="/account" className="text-ink hover:text-ink text-sm">
          ← {t("toAccount")}
        </Link>
      </div>

      {(saved?.length ?? 0) > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-ink text-lg font-semibold">{t("savedTitle")}</h2>
            <Link href="/account/calculator" className="border-line hover:bg-mist rounded-full border px-4 py-1.5 text-sm font-semibold">
              + {t("newCalc")}
            </Link>
          </div>
          <ul className="divide-line divide-y rounded-3xl glass">
            {saved!.map((c) => (
              <li key={c.id} className={`flex flex-wrap items-center justify-between gap-3 p-4 text-sm ${c.id === id ? "bg-brand-purple/15" : ""}`}>
                <Link href={`/account/calculator?id=${c.id}`} className="min-w-0 flex-1">
                  <span className="text-ink font-semibold">{c.name || t("untitled")}</span>
                  <span className="text-ink ml-2">
                    {c.price_cents != null && `${EUR.format(c.price_cents / 100)} · `}
                    {new Date(c.updated_at).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </Link>
                <form action={deleteCalculation}>
                  <input type="hidden" name="id" value={c.id} />
                  <ConfirmSubmitButton
                    className="border-line hover:bg-mist rounded-full border px-3 py-1 text-xs font-semibold"
                    labels={{
                      title: t("deleteTitle", { name: c.name || t("untitled") }),
                      body: t("deleteBody"),
                      confirm: t("deleteConfirm"),
                      cancel: t("cancel"),
                    }}
                  >
                    {t("delete")}
                  </ConfirmSubmitButton>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Calculator
        key={current?.id ?? (draftInputs ? "draft" : "new")}
        mode="full"
        initial={(current?.inputs as Partial<CalcInputs> | undefined) ?? draftInputs}
        savedId={current?.id ?? null}
        savedName={current?.name ?? ""}
        library={library}
      />
    </Container>
  );
}
