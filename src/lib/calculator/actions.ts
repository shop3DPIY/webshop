"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { withDefaults, type CalcInputs } from "./calc";

/**
 * Saved calculations (migration 0018). Uses the visitor's own session:
 * row-level security only lets people read and change their own rows.
 */

/** The route pattern, so both /account/calculator and /nl/… refresh. */
const CALC_ROUTE = "/[locale]/(site)/account/calculator";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function currentUser() {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  return { supabase, user };
}

export async function saveCalculation(input: {
  id: string | null;
  name: string;
  inputs: CalcInputs;
  priceCents: number;
}): Promise<{ ok: true; id: string } | { ok: false }> {
  const { supabase, user } = await currentUser();
  if (!supabase || !user) return { ok: false };
  const row = {
    name: input.name.slice(0, 120),
    // Re-validated, so only known fields with sane types are stored.
    inputs: withDefaults(input.inputs),
    price_cents: Number.isFinite(input.priceCents) ? Math.round(input.priceCents) : null,
    updated_at: new Date().toISOString(),
  };
  if (input.id && UUID_RE.test(input.id)) {
    const { error } = await supabase
      .from("calculations")
      .update(row)
      .eq("id", input.id)
      .eq("user_id", user.id);
    if (error) return { ok: false };
    revalidatePath(CALC_ROUTE, "page");
    return { ok: true, id: input.id };
  }
  const { data, error } = await supabase
    .from("calculations")
    .insert({ ...row, user_id: user.id })
    .select("id")
    .single();
  if (error || !data) return { ok: false };
  revalidatePath(CALC_ROUTE, "page");
  return { ok: true, id: data.id };
}

/** Delete one saved calculation (the button asks to confirm first). */
export async function deleteCalculation(formData: FormData) {
  const { supabase, user } = await currentUser();
  const id = String(formData.get("id") ?? "");
  if (supabase && user && formData.get("confirm") === "on" && UUID_RE.test(id)) {
    await supabase.from("calculations").delete().eq("id", id).eq("user_id", user.id);
  }
  revalidatePath(CALC_ROUTE, "page");
}

const MATERIALS_ROUTE = "/[locale]/(site)/account/calculator/materials";
const KINDS = ["filament", "extra", "packaging", "marketing"];

/** "My materials": add or change one filament / supply. */
export async function saveLibraryItem(formData: FormData) {
  const { supabase, user } = await currentUser();
  if (!supabase || !user) return;
  const id = String(formData.get("id") ?? "");
  const kind = String(formData.get("kind") ?? "");
  const number = (key: string) => {
    const n = Number(String(formData.get(key) ?? "").replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
  };
  const row = {
    kind,
    name: String(formData.get("name") ?? "").trim().slice(0, 120),
    supplier: String(formData.get("supplier") ?? "").trim().slice(0, 120),
    price: number("price"),
    pack_size: number("packSize") || 1,
    updated_at: new Date().toISOString(),
  };
  if (!row.name || !KINDS.includes(kind)) return;
  if (UUID_RE.test(id)) {
    await supabase.from("calc_library").update(row).eq("id", id).eq("user_id", user.id);
  } else {
    await supabase.from("calc_library").insert({ ...row, user_id: user.id });
  }
  revalidatePath(MATERIALS_ROUTE, "page");
  revalidatePath(CALC_ROUTE, "page");
}

/** Remove one item from "My materials" (asked to confirm first). */
export async function deleteLibraryItem(formData: FormData) {
  const { supabase, user } = await currentUser();
  const id = String(formData.get("id") ?? "");
  if (supabase && user && formData.get("confirm") === "on" && UUID_RE.test(id)) {
    await supabase.from("calc_library").delete().eq("id", id).eq("user_id", user.id);
  }
  revalidatePath(MATERIALS_ROUTE, "page");
  revalidatePath(CALC_ROUTE, "page");
}
