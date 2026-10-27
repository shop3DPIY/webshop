import { polarProvider } from "./polar";
import type { CommerceProvider } from "./types";

/**
 * Active commerce provider, selected via env var so it can be swapped
 * without touching any page or component.
 *
 * To replace Polar: implement `CommerceProvider` in a new file (e.g.
 * stripe.ts), add it to the map below, and set COMMERCE_PROVIDER
 * accordingly. The catalog sync, checkout route and webhook live in
 * src/lib/commerce/polar/ and src/app/api/{checkout,webhooks/polar}.
 */
const providers: Record<string, CommerceProvider> = {
  polar: polarProvider,
};

const selected = process.env.COMMERCE_PROVIDER ?? "polar";

export const commerceProvider: CommerceProvider = providers[selected] ?? polarProvider;

export { isListed } from "./types";
export type { CheckoutLink, CheckoutMode, CommerceProvider } from "./types";
