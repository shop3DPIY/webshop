import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/studio/ProductForm";
import { getPricingSettings } from "@/lib/pricing/settings";
import { getBundleCandidates } from "@/lib/studio/bundles";
import { isAiConfigured } from "@/lib/ai/productText";
import { countOwners } from "@/lib/studio/owners";
import { archiveProduct, deleteProduct } from "@/lib/studio/lifecycle";
import { ConfirmSubmitButton } from "@/components/ui/ConfirmDialog";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ deleteError?: string }>;
}) {
  const { id } = await params;
  const { deleteError } = await searchParams;
  const supabase = await createClient();
  const { data: product } = await supabase!
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) notFound();
  const owners = await countOwners(product.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Edit product</h1>
        <Link
          href={`/studio/products/${product.id}/notify`}
          className="border-line hover:bg-mist rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          Notify buyers
        </Link>
      </div>
      <div>
        <ProductForm
          product={product}
          pricingSettings={await getPricingSettings()}
          bundleCandidates={await getBundleCandidates(product.id)}
          aiAvailable={isAiConfigured()}
        />
      </div>

      <section className="flex max-w-2xl flex-col gap-3 rounded-3xl p-6 glass">
        <h2 className="font-display text-lg font-semibold">
          {owners > 0 ? "Take offline" : "Delete product"}
        </h2>
        {owners > 0 ? (
          <>
            <p className="text-ink text-sm">
              {owners} purchase(s)/download(s) — this design can&apos;t be
              deleted. Taking it offline removes it from the shop and from
              Polar; buyers keep it in their library and can still download
              it. You can put it back live any time via Status → Published.
            </p>
            {product.publication_status === "archived" ? (
              <p className="text-sm font-medium">This design is offline.</p>
            ) : (
              <form action={archiveProduct}>
                <input type="hidden" name="id" value={product.id} />
                <ConfirmSubmitButton
                  className="border-line hover:bg-mist rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors"
                  labels={{
                    title: `Take “${product.title}” offline?`,
                    body: "It disappears from the shop and from Polar checkouts. Buyers keep it in their library.",
                    confirm: "Yes, take offline",
                    cancel: "Cancel",
                  }}
                >
                  Take offline
                </ConfirmSubmitButton>
              </form>
            )}
          </>
        ) : (
          <form action={deleteProduct} className="flex flex-col gap-3">
            <input type="hidden" name="id" value={product.id} />
            <p className="text-ink text-sm">
              Nobody has bought or downloaded this design yet, so it can be
              deleted for good: the product, its files and photos, and its
              Polar listing. This can&apos;t be undone.
            </p>
            {deleteError === "confirm" && (
              <p className="text-sm text-red-200">Confirm in the dialog first.</p>
            )}
            <ConfirmSubmitButton
              className="w-fit rounded-full border border-red-300 bg-red-500/70 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600"
              labels={{
                title: `Delete “${product.title}” permanently?`,
                body: "The product, its files and photos, and its Polar listing are deleted. This can't be undone.",
                confirm: "Yes, delete permanently",
                cancel: "Cancel",
              }}
            >
              Delete permanently
            </ConfirmSubmitButton>
          </form>
        )}
        {deleteError === "owned" && (
          <p className="text-sm text-red-200">
            Someone bought or downloaded it in the meantime — take it
            offline instead.
          </p>
        )}
      </section>
    </div>
  );
}
