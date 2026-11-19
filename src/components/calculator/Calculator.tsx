"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import {
  calculate,
  DEFAULT_INPUTS,
  PLATFORM_PRESETS,
  withDefaults,
  type CalcInputs,
  type ExtraLine,
  type MaterialLine,
} from "@/lib/calculator/calc";
import { saveCalculation } from "@/lib/calculator/actions";

/**
 * The calculator UI. "simple" is the public page (a handful of inputs,
 * the rest at sensible defaults); "full" is the account version with
 * every cost people tend to forget, and saving.
 */

const FIELD =
  "border-line bg-paper w-full rounded-2xl border px-3 py-2 text-sm font-normal";
const LABEL = "flex flex-col gap-1 text-sm font-medium";

/** What the public calculator hands to the full one (via ?draft=). */
function draftOf(i: CalcInputs): Partial<CalcInputs> {
  const { materials, printHours, kwhPrice, postMinutes, hourlyRate, platformId, feePct, feeFixed, listingFee, vatMode, profitMode, profitValue } = i;
  return { materials, printHours, kwhPrice, postMinutes, hourlyRate, platformId, feePct, feeFixed, listingFee, vatMode, profitMode, profitValue };
}

const EUR = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const euro = (v: number) => EUR.format(Number.isFinite(v) ? v : 0);

/** The public page's inputs; everything else stays at these values. */
const SIMPLE_BASE: Partial<CalcInputs> = {
  prepMinutes: 0,
  packMinutes: 0,
  packagingCost: 0,
  returnsPct: 0,
  extras: [],
  designHours: 0,
  designLicenseCost: 0,
  prototypeCost: 0,
  overheadPerMonth: 0,
  shippingCost: 0,
  shippingCharged: 0,
  wasteGrams: 0,
};

/** Number input that accepts "4,50" as well as "4.50". */
function NumberField({
  label,
  hint,
  value,
  onChange,
  suffix,
  step = "any",
}: {
  label: ReactNode;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  step?: string;
}) {
  const [text, setText] = useState(String(value).replace(".", ","));
  const [shown, setShown] = useState(value);
  // Follow outside changes (preset buttons, loading a saved calculation),
  // but leave half-typed input such as "4," alone.
  if (value !== shown) {
    setShown(value);
    if (Number(text.replace(",", ".")) !== value) setText(String(value).replace(".", ","));
  }
  return (
    <label className={LABEL}>
      <span>{label}</span>
      <span className="relative">
        <input
          inputMode="decimal"
          value={text}
          step={step}
          onChange={(e) => {
            setText(e.target.value);
            const parsed = Number(e.target.value.replace(",", "."));
            if (Number.isFinite(parsed)) onChange(parsed);
          }}
          className={`${FIELD} ${suffix ? "pr-14" : ""}`}
        />
        {suffix && (
          <span className="text-ink/50 pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
            {suffix}
          </span>
        )}
      </span>
      {hint && <span className="text-ink/55 text-xs font-normal">{hint}</span>}
    </label>
  );
}

function Section({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-3xl p-5 glass sm:p-6">
      <div>
        <h3 className="font-display text-ink text-lg font-semibold">{title}</h3>
        {intro && <p className="text-ink/60 mt-1 text-sm">{intro}</p>}
      </div>
      {children}
    </section>
  );
}

export function Calculator({
  mode,
  initial,
  savedId,
  savedName,
}: {
  mode: "simple" | "full";
  initial?: Partial<CalcInputs> | null;
  savedId?: string | null;
  savedName?: string;
}) {
  const t = useTranslations("calculator");
  const router = useRouter();
  const full = mode === "full";
  const [inputs, setInputs] = useState<CalcInputs>(() =>
    withDefaults(full ? initial : { ...DEFAULT_INPUTS, ...SIMPLE_BASE, platformId: "none", feePct: 0, feeFixed: 0, listingFee: 0 }),
  );
  const [name, setName] = useState(savedName ?? "");
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [pending, start] = useTransition();

  const result = useMemo(() => calculate(inputs), [inputs]);
  const set = <K extends keyof CalcInputs>(key: K, value: CalcInputs[K]) => {
    setInputs((i) => ({ ...i, [key]: value }));
    setSaveState("idle");
  };

  const setMaterial = (index: number, patch: Partial<MaterialLine>) =>
    set("materials", inputs.materials.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  const setExtra = (index: number, patch: Partial<ExtraLine>) =>
    set("extras", inputs.extras.map((e, i) => (i === index ? { ...e, ...patch } : e)));

  const choosePlatform = (id: string) => {
    const preset = PLATFORM_PRESETS.find((p) => p.id === id);
    setInputs((i) => ({
      ...i,
      platformId: id,
      ...(preset && id !== "custom" && {
        feePct: preset.feePct,
        feeFixed: preset.feeFixed,
        listingFee: preset.listingFee,
      }),
    }));
  };

  function save(asNew: boolean) {
    start(async () => {
      const res = await saveCalculation({
        id: asNew ? null : (savedId ?? null),
        name: name.trim() || t("untitled"),
        inputs,
        priceCents: Math.round(result.price * 100),
      });
      if (!res.ok) return setSaveState("error");
      setSaveState("saved");
      if (res.id !== savedId) router.replace(`/account/calculator?id=${res.id}`);
      else router.refresh();
    });
  }

  const platformSelect = (
    <label className={LABEL}>
      {t("platform")}
      <select value={inputs.platformId} onChange={(e) => choosePlatform(e.target.value)} className={FIELD}>
        {PLATFORM_PRESETS.map((p) => (
          <option key={p.id} value={p.id}>
            {t(`platforms.${p.id}`)}
          </option>
        ))}
      </select>
    </label>
  );
  const vatSelect = (
    <label className={LABEL}>
      {t("vat")}
      <select value={inputs.vatMode} onChange={(e) => set("vatMode", e.target.value as CalcInputs["vatMode"])} className={FIELD}>
        <option value="kor">{t("vatKor")}</option>
        <option value="vat21">{t("vat21")}</option>
        <option value="vat9">{t("vat9")}</option>
      </select>
    </label>
  );
  const profitFields = (
    <div className="grid grid-cols-2 gap-3">
      <label className={LABEL}>
        {t("profitMode")}
        <select value={inputs.profitMode} onChange={(e) => set("profitMode", e.target.value as CalcInputs["profitMode"])} className={FIELD}>
          <option value="margin">{t("profitMargin")}</option>
          <option value="amount">{t("profitAmount")}</option>
        </select>
      </label>
      <NumberField
        label={inputs.profitMode === "margin" ? t("marginPct") : t("profitPerItem")}
        value={inputs.profitValue}
        onChange={(v) => set("profitValue", v)}
        suffix={inputs.profitMode === "margin" ? "%" : "€"}
      />
    </div>
  );

  const form = full ? (
    <div className="flex flex-col gap-5">
      <Section title={t("s.print")} intro={t("s.printIntro")}>
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField label={t("itemsPerPlate")} hint={t("itemsPerPlateHint")} value={inputs.itemsPerPlate} onChange={(v) => set("itemsPerPlate", v)} />
          <NumberField label={t("printHours")} value={inputs.printHours} onChange={(v) => set("printHours", v)} suffix={t("hours")} />
          <NumberField label={t("wasteGrams")} hint={t("wasteGramsHint")} value={inputs.wasteGrams} onChange={(v) => set("wasteGrams", v)} suffix="g" />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{t("materials")}</p>
          {inputs.materials.map((m, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
              <label className={LABEL}>
                <span className="sr-only">{t("materialName")}</span>
                <input value={m.name} onChange={(e) => setMaterial(i, { name: e.target.value })} placeholder={t("materialName")} className={FIELD} />
              </label>
              <NumberField label={<span className="sr-only">{t("grams")}</span>} value={m.grams} onChange={(v) => setMaterial(i, { grams: v })} suffix="g" />
              <NumberField label={<span className="sr-only">{t("pricePerKg")}</span>} value={m.pricePerKg} onChange={(v) => setMaterial(i, { pricePerKg: v })} suffix="€/kg" />
              <button
                type="button"
                onClick={() => set("materials", inputs.materials.filter((_, j) => j !== i))}
                disabled={inputs.materials.length === 1}
                aria-label={t("remove")}
                className="border-line hover:bg-mist mb-0.5 h-9 w-9 rounded-full border text-sm disabled:opacity-30"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => set("materials", [...inputs.materials, { name: "", grams: 0, pricePerKg: 20 }])}
            className="border-line hover:bg-mist w-fit rounded-full border px-3 py-1.5 text-xs font-semibold"
          >
            + {t("addMaterial")}
          </button>
          <p className="text-ink/55 text-xs">{t("materialsHint")}</p>
        </div>
      </Section>

      <Section title={t("s.printer")} intro={t("s.printerIntro")}>
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField label={t("printerPrice")} value={inputs.printerPrice} onChange={(v) => set("printerPrice", v)} suffix="€" />
          <NumberField label={t("printerLifeHours")} hint={t("printerLifeHint")} value={inputs.printerLifeHours} onChange={(v) => set("printerLifeHours", v)} suffix={t("hours")} />
          <NumberField label={t("maintenancePerHour")} hint={t("maintenanceHint")} value={inputs.maintenancePerHour} onChange={(v) => set("maintenancePerHour", v)} suffix="€/u" />
          <NumberField label={t("powerWatts")} hint={t("powerHint")} value={inputs.powerWatts} onChange={(v) => set("powerWatts", v)} suffix="W" />
          <NumberField label={t("kwhPrice")} value={inputs.kwhPrice} onChange={(v) => set("kwhPrice", v)} suffix="€/kWh" />
          <NumberField label={t("failurePct")} hint={t("failureHint")} value={inputs.failurePct} onChange={(v) => set("failurePct", v)} suffix="%" />
        </div>
      </Section>

      <Section title={t("s.time")} intro={t("s.timeIntro")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField label={t("hourlyRate")} hint={t("hourlyRateHint")} value={inputs.hourlyRate} onChange={(v) => set("hourlyRate", v)} suffix="€/u" />
          <NumberField label={t("prepMinutes")} hint={t("prepHint")} value={inputs.prepMinutes} onChange={(v) => set("prepMinutes", v)} suffix="min" />
          <NumberField label={t("postMinutes")} hint={t("postHint")} value={inputs.postMinutes} onChange={(v) => set("postMinutes", v)} suffix="min" />
          <NumberField label={t("packMinutes")} hint={t("packHint")} value={inputs.packMinutes} onChange={(v) => set("packMinutes", v)} suffix="min" />
        </div>
      </Section>

      <Section title={t("s.design")} intro={t("s.designIntro")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField label={t("designHours")} hint={t("designHoursHint")} value={inputs.designHours} onChange={(v) => set("designHours", v)} suffix={t("hours")} />
          <NumberField label={t("designLicenseCost")} hint={t("designLicenseHint")} value={inputs.designLicenseCost} onChange={(v) => set("designLicenseCost", v)} suffix="€" />
          <NumberField label={t("prototypeCost")} hint={t("prototypeHint")} value={inputs.prototypeCost} onChange={(v) => set("prototypeCost", v)} suffix="€" />
          <NumberField label={t("designUnits")} hint={t("designUnitsHint")} value={inputs.designUnits} onChange={(v) => set("designUnits", v)} />
        </div>
      </Section>

      <Section title={t("s.extras")} intro={t("s.extrasIntro")}>
        <div className="flex flex-col gap-2">
          {inputs.extras.map((e, i) => (
            <div key={i} className="grid grid-cols-[2fr_1fr_auto] items-end gap-2">
              <input value={e.name} onChange={(ev) => setExtra(i, { name: ev.target.value })} placeholder={t("extraName")} aria-label={t("extraName")} className={FIELD} />
              <NumberField label={<span className="sr-only">{t("extraCost")}</span>} value={e.cost} onChange={(v) => setExtra(i, { cost: v })} suffix="€" />
              <button
                type="button"
                onClick={() => set("extras", inputs.extras.filter((_, j) => j !== i))}
                aria-label={t("remove")}
                className="border-line hover:bg-mist mb-0.5 h-9 w-9 rounded-full border text-sm"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => set("extras", [...inputs.extras, { name: "", cost: 0 }])}
            className="border-line hover:bg-mist w-fit rounded-full border px-3 py-1.5 text-xs font-semibold"
          >
            + {t("addExtra")}
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField label={t("packagingCost")} hint={t("packagingHint")} value={inputs.packagingCost} onChange={(v) => set("packagingCost", v)} suffix="€" />
          <NumberField label={t("shippingCost")} value={inputs.shippingCost} onChange={(v) => set("shippingCost", v)} suffix="€" />
          <NumberField label={t("shippingCharged")} hint={t("shippingChargedHint")} value={inputs.shippingCharged} onChange={(v) => set("shippingCharged", v)} suffix="€" />
        </div>
      </Section>

      <Section title={t("s.overhead")} intro={t("s.overheadIntro")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField label={t("overheadPerMonth")} hint={t("overheadHint")} value={inputs.overheadPerMonth} onChange={(v) => set("overheadPerMonth", v)} suffix="€" />
          <NumberField label={t("itemsPerMonth")} value={inputs.itemsPerMonth} onChange={(v) => set("itemsPerMonth", v)} />
        </div>
      </Section>

      <Section title={t("s.selling")} intro={t("s.sellingIntro")}>
        <div className="grid gap-3 sm:grid-cols-2">
          {platformSelect}
          {vatSelect}
          <NumberField label={t("feePct")} value={inputs.feePct} onChange={(v) => { set("feePct", v); set("platformId", "custom"); }} suffix="%" />
          <NumberField label={t("feeFixed")} value={inputs.feeFixed} onChange={(v) => { set("feeFixed", v); set("platformId", "custom"); }} suffix="€" />
          <NumberField label={t("listingFee")} value={inputs.listingFee} onChange={(v) => { set("listingFee", v); set("platformId", "custom"); }} suffix="€" />
          <NumberField label={t("returnsPct")} hint={t("returnsHint")} value={inputs.returnsPct} onChange={(v) => set("returnsPct", v)} suffix="%" />
        </div>
        <p className="text-ink/55 text-xs">{t("feesNote")}</p>
        {profitFields}
        <label className={LABEL}>
          {t("rounding")}
          <select value={inputs.roundMode} onChange={(e) => set("roundMode", e.target.value as CalcInputs["roundMode"])} className={FIELD}>
            <option value="99">{t("round99")}</option>
            <option value="50">{t("round50")}</option>
            <option value="none">{t("roundNone")}</option>
          </select>
        </label>
      </Section>
    </div>
  ) : (
    <div className="flex flex-col gap-4 rounded-3xl p-5 glass sm:p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberField label={t("grams")} value={inputs.materials[0]?.grams ?? 0} onChange={(v) => setMaterial(0, { grams: v })} suffix="g" />
        <NumberField label={t("pricePerKg")} value={inputs.materials[0]?.pricePerKg ?? 0} onChange={(v) => setMaterial(0, { pricePerKg: v })} suffix="€/kg" />
        <NumberField label={t("printHours")} value={inputs.printHours} onChange={(v) => set("printHours", v)} suffix={t("hours")} />
        <NumberField label={t("kwhPrice")} value={inputs.kwhPrice} onChange={(v) => set("kwhPrice", v)} suffix="€/kWh" />
        <NumberField label={t("postMinutes")} hint={t("postHint")} value={inputs.postMinutes} onChange={(v) => set("postMinutes", v)} suffix="min" />
        <NumberField label={t("hourlyRate")} value={inputs.hourlyRate} onChange={(v) => set("hourlyRate", v)} suffix="€/u" />
        {platformSelect}
        {vatSelect}
      </div>
      {profitFields}
    </div>
  );

  const maxLine = Math.max(0.01, ...result.lines.map((l) => Math.abs(l.amount)));

  const resultPanel = (
    <aside className="flex flex-col gap-4 rounded-3xl p-5 glass sm:p-6 lg:sticky lg:top-24">
      {result.impossible ? (
        <p className="text-sm font-semibold text-red-200">{t("impossible")}</p>
      ) : (
        <>
          <div>
            <p className="text-ink/60 text-xs font-semibold tracking-wide uppercase">{t("price")}</p>
            <p className="font-display text-ink text-4xl font-bold">{euro(result.price)}</p>
            <p className="text-ink/60 text-xs">
              {inputs.vatMode === "kor" ? t("priceNoVat") : t("priceInclVat", { vat: euro(result.vat) })}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-ink/70">{t("costPrice")}</dt>
            <dd className="text-right font-semibold">{euro(result.costPrice)}</dd>
            <dt className="text-ink/70">{t("platformFees")}</dt>
            <dd className="text-right">{euro(result.platformFees)}</dd>
            {result.returnsReserve > 0 && (
              <>
                <dt className="text-ink/70">{t("returnsReserve")}</dt>
                <dd className="text-right">{euro(result.returnsReserve)}</dd>
              </>
            )}
            <dt className="text-ink font-semibold">{t("profit")}</dt>
            <dd className="text-right font-semibold">
              {euro(result.profit)} <span className="text-ink/60 font-normal">({result.marginPct.toFixed(0)}%)</span>
            </dd>
            {result.earningsPerHour !== null && (
              <>
                <dt className="text-ink/70">{t("perHour")}</dt>
                <dd className="text-right">{euro(result.earningsPerHour)}</dd>
              </>
            )}
            {full && result.designBreakEven !== null && (
              <>
                <dt className="text-ink/70">{t("breakEven")}</dt>
                <dd className="text-right">{t("items", { n: result.designBreakEven })}</dd>
              </>
            )}
          </dl>
          <div className="flex flex-col gap-1.5">
            <p className="text-ink/60 text-xs font-semibold tracking-wide uppercase">{t("breakdown")}</p>
            {result.lines
              .filter((l) => Math.abs(l.amount) >= 0.005)
              .map((l) => (
                <div key={l.key} className="text-xs">
                  <div className="flex justify-between">
                    <span>{t(`lines.${l.key}`)}</span>
                    <span>{euro(l.amount)}</span>
                  </div>
                  <div className="bg-ink/10 mt-0.5 h-1.5 overflow-hidden rounded-full">
                    <div
                      className="bg-brand-purple h-full rounded-full"
                      style={{ width: `${Math.min(100, (Math.abs(l.amount) / maxLine) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </>
      )}

      {full ? (
        <div className="border-line flex flex-col gap-2 border-t pt-4">
          <label className={LABEL}>
            {t("name")}
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} className={FIELD} />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => save(false)}
              className="border-action bg-action text-on-action hover:bg-action-hover rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {savedId ? t("save") : t("saveNew")}
            </button>
            {savedId && (
              <button
                type="button"
                disabled={pending}
                onClick={() => save(true)}
                className="border-line hover:bg-mist rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {t("saveCopy")}
              </button>
            )}
          </div>
          {saveState === "saved" && <p role="status" className="text-xs font-medium">✓ {t("saved")}</p>}
          {saveState === "error" && <p className="text-xs text-red-200">{t("saveError")}</p>}
        </div>
      ) : (
        <div className="border-line flex flex-col gap-2 border-t pt-4 text-sm">
          <p className="text-ink/70">{t("fullTeaser")}</p>
          {/* The full calculator starts from what's filled in here. */}
          <Link
            href={`/account/calculator?draft=${encodeURIComponent(JSON.stringify(draftOf(inputs)))}`}
            className="border-action bg-action text-on-action hover:bg-action-hover w-fit rounded-full border px-4 py-2 text-sm font-semibold"
          >
            {t("openFull")}
          </Link>
        </div>
      )}
    </aside>
  );

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
      {form}
      {resultPanel}
    </div>
  );
}
