import { payhipProvider } from "./payhip";
import type { CommerceProvider } from "./types";

/**
 * Active commerce provider, selected via env var so it can be swapped
 * without touching any page or component.
 *
 * To replace Payhip: implement `CommerceProvider` in a new file (e.g.
 * woocommerce.ts or stripe.ts), add it to the map below, and set
 * COMMERCE_PROVIDER accordingly. No other code needs to change.
 */
const providers: Record<string, CommerceProvider> = {
  payhip: payhipProvider,
};

const selected = process.env.COMMERCE_PROVIDER ?? "payhip";

export const commerceProvider: CommerceProvider = providers[selected] ?? payhipProvider;

export type { CheckoutLink, CheckoutMode, CommerceProvider } from "./types";
