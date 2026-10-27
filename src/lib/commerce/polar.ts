import type { Product } from "@/types/product";
import { isListed, type CheckoutLink, type CommerceProvider } from "./types";

/**
 * Polar commerce provider (https://polar.sh — merchant of record: Polar
 * sells, charges VAT and pays out; we only list and deliver).
 *
 * Product pages are static, so the buy button can't create a checkout
 * itself: it links to our own /api/checkout/<product id> route, which
 * creates a Polar checkout session for all of the design's license tiers
 * and redirects there (src/app/api/checkout/[productId]/route.ts).
 *
 * The Polar product ids per tier are created automatically by Studio
 * (src/lib/commerce/polar/sync.ts) — a design without them isn't listed.
 */

function isCommerceEnabled(): boolean {
  // Payments stay disabled until explicitly turned on at go-live.
  return process.env.NEXT_PUBLIC_COMMERCE_ENABLED === "true";
}

export const polarProvider: CommerceProvider = {
  name: "polar",

  isEnabled() {
    return isCommerceEnabled();
  },

  getCheckoutLink(product: Product): CheckoutLink {
    if (!this.isEnabled()) {
      return {
        mode: "disabled",
        url: null,
        disabledReason: "Checkout is not yet active. 3DPIY is in development mode.",
      };
    }

    if (!isListed(product)) {
      return {
        mode: "disabled",
        url: null,
        disabledReason: "This product has not been listed with a commerce provider yet.",
      };
    }

    return { mode: "redirect", url: `/api/checkout/${product.id}` };
  },
};
