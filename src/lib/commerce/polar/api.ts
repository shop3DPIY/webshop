/**
 * Minimal server-side client for Polar's REST API (https://polar.sh/docs).
 *
 * Plain fetch instead of the SDK: we only need a handful of endpoints.
 * POLAR_SERVER=sandbox talks to sandbox-api.polar.sh (mock payments,
 * used until go-live); anything else talks to the real API. The access
 * token is an organization token, so no organization_id is needed.
 *
 * Server-only — never import this from a Client Component.
 */

export function isPolarConfigured(): boolean {
  return Boolean(process.env.POLAR_ACCESS_TOKEN);
}

function baseUrl() {
  return process.env.POLAR_SERVER === "sandbox"
    ? "https://sandbox-api.polar.sh/v1"
    : "https://api.polar.sh/v1";
}

export class PolarError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`Polar API ${status}: ${JSON.stringify(body).slice(0, 300)}`);
  }
}

export async function polarFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = process.env.POLAR_ACCESS_TOKEN;
  if (!token) throw new Error("POLAR_ACCESS_TOKEN is not set");

  const response = await fetch(`${baseUrl()}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) throw new PolarError(response.status, body);
  return body as T;
}

// --- The parts of Polar's objects we use -------------------------------

export interface PolarPrice {
  id: string;
  amount_type: string;
  price_amount?: number;
  price_currency?: string;
  is_archived: boolean;
}

export interface PolarProduct {
  id: string;
  name: string;
  description: string | null;
  is_archived: boolean;
  prices: PolarPrice[];
  metadata: Record<string, string | number | boolean>;
  attached_custom_fields: { custom_field_id: string; required: boolean }[];
}

export interface PolarCustomField {
  id: string;
  slug: string;
}

export interface PolarCheckout {
  id: string;
  url: string;
  status: "open" | "expired" | "confirmed" | "succeeded" | "failed";
  customer_email: string | null;
  metadata: Record<string, string | number | boolean>;
}

export interface PolarOrder {
  id: string;
  status: string;
  paid: boolean;
  total_amount: number;
  currency: string;
  checkout_id: string | null;
  product_id: string | null;
  product: { id: string; name: string; metadata: Record<string, unknown> } | null;
  customer: { email: string; external_id: string | null };
  metadata: Record<string, string | number | boolean>;
  created_at: string;
}

export interface PolarList<T> {
  items: T[];
}
