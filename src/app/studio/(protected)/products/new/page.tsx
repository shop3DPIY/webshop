import { ProductForm } from "@/components/studio/ProductForm";
import { getPricingSettings } from "@/lib/pricing/settings";
import { isAiConfigured } from "@/lib/ai/productText";

export default async function NewProductPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold">New product</h1>
      <div>
        <ProductForm
          pricingSettings={await getPricingSettings()}
          aiAvailable={isAiConfigured()}
        />
      </div>
    </div>
  );
}
