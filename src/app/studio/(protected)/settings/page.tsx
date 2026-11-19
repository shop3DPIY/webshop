import { getBusinessDetails, type BusinessDetails } from "@/lib/settings/business";
import { saveBusinessDetails } from "@/lib/settings/admin-actions";

const FIELD = "border-line bg-paper w-full rounded-2xl border px-4 py-2.5 text-sm";
const LABEL = "flex flex-col gap-1.5 text-sm font-medium";

const FIELDS: { key: keyof BusinessDetails; label: string; hint?: string; wide?: boolean }[] = [
  { key: "companyName", label: "Company name", hint: "As registered at the KvK" },
  { key: "ownerName", label: "Owner" },
  { key: "street", label: "Street and number", wide: true },
  { key: "postcode", label: "Postcode" },
  { key: "city", label: "City" },
  { key: "country", label: "Country", hint: "In English, e.g. the Netherlands" },
  { key: "kvk", label: "KvK number" },
  { key: "vatId", label: "VAT ID (btw-id)", hint: "The NL…B01 number for websites and invoices — not the omzetbelastingnummer with your BSN" },
  { key: "iban", label: "Bank account (IBAN)", hint: "Not shown on the site unless a legal text uses {{iban}}" },
  { key: "contactEmail", label: "Contact email", hint: "Shown on the contact page and in the legal texts", wide: true },
];

/**
 * Business details for the footer, the contact page and the legal texts
 * ({{kvk}}, {{vat}}, {{address}}, … — see Studio → Legal).
 */
export default async function StudioSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const b = await getBusinessDetails();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
        <p className="text-ink mt-1 max-w-2xl text-sm">
          Business details. The footer shows the KvK number and VAT ID; the
          legal texts fill in the rest automatically. Saving updates the whole
          site straight away.
        </p>
      </div>
      {(saved || error) && (
        <p
          role="status"
          className={`w-fit rounded-full border px-4 py-2 text-sm font-medium ${
            error ? "border-red-300 text-red-200" : "border-brand-purple bg-brand-purple/25"
          }`}
        >
          {error ? `Couldn't save: ${error}` : "✓ Saved."}
        </p>
      )}
      <form action={saveBusinessDetails} className="grid max-w-3xl gap-4 rounded-3xl p-6 glass sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className={`${LABEL} ${f.wide ? "sm:col-span-2" : ""}`}>
            {f.label}
            <input name={f.key} defaultValue={b[f.key]} className={FIELD} />
            {f.hint && <span className="text-ink text-xs font-normal">{f.hint}</span>}
          </label>
        ))}
        <button
          type="submit"
          className="border-action bg-action text-on-action hover:border-action-hover-border hover:bg-action-hover w-fit rounded-full border px-6 py-3 text-sm font-semibold transition-colors sm:col-span-2"
        >
          Save
        </button>
      </form>
    </div>
  );
}
