import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/studio/ProductForm";
import { getPricingSettings } from "@/lib/pricing/settings";
import { isAiConfigured } from "@/lib/ai/productText";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase!
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) notFound();

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
      <div className="max-w-2xl">
        <ProductForm
          product={product}
          pricingSettings={await getPricingSettings()}
          aiAvailable={isAiConfigured()}
        />
      </div>
    </div>
  );
}
