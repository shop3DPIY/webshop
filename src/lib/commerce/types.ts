/**
 * Commerce abstraction layer.
 *
 * Nothing outside this folder should know which commerce provider is active.
 * Components and pages only ever call `commerceProvider` (see index.ts) and
 * work with the types defined here. This keeps Payhip replaceable later by
 * WooCommerce, a custom Stripe backend, or anything else — swapping the
 * provider implementation is the only change required.
 *
 * Product data (src/types/product.ts) never depends on this file; it only
 * carries a generic `externalCommerceId` that a provider implementation
 * knows how to interpret.
 */

import type { Product } from "@/types/product";

export type CheckoutMode = "redirect" | "embed" | "disabled";

export interface CheckoutLink {
  mode: CheckoutMode;
  /** Direct URL to send the customer to. Null when mode is "embed" or "disabled". */
  url: string | null;
  /**
   * Attributes for an embeddable buy-button widget, when the provider
   * supports one and `mode === "embed"`. Rendered by a small client
   * component that also loads `embedScriptSrc`.
   */
  buttonAttributes?: Record<string, string>;
  embedScriptSrc?: string | null;
  /** Human-readable reason shown in the UI when mode is "disabled" */
  disabledReason?: string;
}

export interface CommerceProvider {
  readonly name: string;
  /** Whether real checkout is currently active for the storefront. */
  isEnabled(): boolean;
  /** Build the checkout link/widget config for a single product. */
  getCheckoutLink(product: Product): CheckoutLink;
}
