import type { Product } from "@/types/product";
import type { CheckoutLink, CommerceProvider } from "./types";

/**
 * Payhip commerce provider.
 *
 * Uses Payhip's documented, zero-backend integration method:
 * - Every Payhip product has a hosted checkout page at
 *   `https://payhip.com/b/<productId>` (the "permalink"). Linking to it
 *   directly requires no API key and works even without JavaScript.
 * - Payhip also offers an embeddable "Buy Button" widget
 *   (`https://payhip.com/payhip.js` + an `<a class="payhip-buy-button">`)
 *   for an in-page checkout experience. This is left available as an
 *   "embed" mode but is NOT the default, since the plain redirect link is
 *   more robust and has no external script dependency.
 *
 * `product.externalCommerceId` must hold the Payhip product id/permalink
 * slug. It is intentionally the only Payhip-specific field that ever
 * touches product data.
 *
 * IMPORTANT: Payhip does not expose a public API for building custom
 * multi-item carts or server-side order creation on a hobby/standard plan.
 * Do not invent such an API. Multi-product checkout, if needed, should use
 * Payhip's own dashboard-configured cart/upsell features — verify current
 * capabilities in the Payhip dashboard/docs before relying on them.
 */

const PAYHIP_BASE_URL = "https://payhip.com/b";
const PAYHIP_EMBED_SCRIPT = "https://payhip.com/payhip.js";

function isCommerceEnabled(): boolean {
  // Payments stay disabled until explicitly turned on post-launch.
  return process.env.NEXT_PUBLIC_COMMERCE_ENABLED === "true";
}

export const payhipProvider: CommerceProvider = {
  name: "payhip",

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

    if (!product.externalCommerceId) {
      return {
        mode: "disabled",
        url: null,
        disabledReason: "This product has not been listed with a commerce provider yet.",
      };
    }

    return {
      mode: "redirect",
      url: `${PAYHIP_BASE_URL}/${product.externalCommerceId}`,
      embedScriptSrc: PAYHIP_EMBED_SCRIPT,
      buttonAttributes: {
        "data-theme": "none",
      },
    };
  },
};
