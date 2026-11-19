import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { Link } from "@/i18n/navigation";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmDialog";
import { deleteLibraryItem, saveLibraryItem } from "@/lib/calculator/actions";
import {
  LIBRARY_KINDS,
  pricePerKg,
  pricePerPiece,
  toLibraryItem,
  type LibraryItem,
  type LibraryKind,
} from "@/lib/calculator/library";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata() {
  const t = await getTranslations("calculator");
  return { title: t("myMaterials"), robots: { index: false, follow: false } };
}

const FIELD = "border-line bg-paper w-full rounded-2xl border px-3 py-2 text-sm font-normal";
const EUR = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const decimal = (n: number) => String(n).replace(".", ",");

/**
 * "My materials": the filaments (per seller / with your discount) and the
 * supplies you buy in packs, so the calculator can pick them and keep
 * prices in one place.
 */
export default async function MaterialsPage() {
  const t = await getTranslations("calculator");
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) {
    return (
      <Container panel className="flex flex-col items-center gap-6 py-24 text-center">
        <SectionHeading as="h1" title={t("myMaterials")} description={t("signInBody")} />
        <Button href="/auth/sign-in?next=/account/calculator/materials" size="lg">{t("signIn")}</Button>
      </Container>
    );
  }

  const { data } = await supabase!
    .from("calc_library")
    .select("*")
    .eq("user_id", user.id)
    .order("name");
  const items = (data ?? []).map(toLibraryItem);

  const row = (item: LibraryItem | null, kind: LibraryKind) => {
    const filament = kind === "filament";
    return (
      <form action={saveLibraryItem} className="grid items-end gap-2 sm:grid-cols-[2fr_1.5fr_1fr_1fr_auto]">
        {item && <input type="hidden" name="id" value={item.id} />}
        <input type="hidden" name="kind" value={kind} />
        <label className="flex flex-col gap-1 text-xs font-medium">
          {t("libName")}
          <input name="name" required defaultValue={item?.name} placeholder={t(`libNamePh.${kind}`)} className={FIELD} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          {t("libSupplier")}
          <input name="supplier" defaultValue={item?.supplier} placeholder={t("libSupplierPh")} className={FIELD} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          {filament ? t("libSpoolPrice") : t("packPrice")}
          <input name="price" inputMode="decimal" required defaultValue={item ? decimal(item.price) : ""} placeholder="19,99" className={FIELD} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          {filament ? t("libSpoolGrams") : t("packSize")}
          <input name="packSize" inputMode="decimal" required defaultValue={item ? decimal(item.packSize) : filament ? "1000" : ""} placeholder={filament ? "1000" : "25"} className={FIELD} />
        </label>
        <button type="submit" className="border-action bg-action text-on-action hover:bg-action-hover h-9 rounded-full border px-4 text-sm font-semibold">
          {item ? t("save") : `+ ${t("libAdd")}`}
        </button>
      </form>
    );
  };

  return (
    <Container panel className="flex flex-col gap-8 py-12 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading as="h1" eyebrow={t("eyebrow")} title={t("myMaterials")} description={t("myMaterialsIntro")} />
        <Link href="/account/calculator" className="text-ink hover:text-ink text-sm">
          ← {t("fullTitle")}
        </Link>
      </div>

      {LIBRARY_KINDS.map((kind) => {
        const list = items.filter((i) => i.kind === kind);
        return (
          <section key={kind} className="flex flex-col gap-4 rounded-3xl p-5 glass sm:p-6">
            <h2 className="font-display text-ink text-lg font-semibold">{t(`libKinds.${kind}`)}</h2>
            {list.map((item) => (
              <div key={item.id} className="border-line flex flex-col gap-2 border-b pb-4">
                {row(item, kind)}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-ink text-xs">
                    {kind === "filament"
                      ? t("libPerKg", { price: EUR.format(pricePerKg(item)) })
                      : t("libPerPiece", { price: EUR.format(pricePerPiece(item)) })}
                  </span>
                  <form action={deleteLibraryItem}>
                    <input type="hidden" name="id" value={item.id} />
                    <ConfirmSubmitButton
                      className="text-ink hover:text-ink text-xs underline"
                      labels={{
                        title: t("deleteTitle", { name: item.name }),
                        body: t("libDeleteBody"),
                        confirm: t("deleteConfirm"),
                        cancel: t("cancel"),
                      }}
                    >
                      {t("delete")}
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            ))}
            {row(null, kind)}
          </section>
        );
      })}
    </Container>
  );
}
