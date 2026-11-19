"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/studio/guard";
import type { RequestStatus } from "./server";

const STATUSES: RequestStatus[] = ["new", "open", "planned", "done", "declined"];

/** Studio → Requests: put a request on the public list, plan it, etc. */
export async function setRequestStatus(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase admin client not configured");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as RequestStatus;
  const tab = String(formData.get("tab") ?? "new");
  if (STATUSES.includes(status)) {
    await admin
      .from("model_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
  }
  revalidatePath("/studio/requests");
  revalidatePath("/requests");
  revalidatePath("/nl/requests");
  redirect(`/studio/requests?tab=${encodeURIComponent(tab)}`);
}

/** Deletes a request and its votes (asked to confirm first). */
export async function deleteRequest(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) throw new Error("Supabase admin client not configured");
  const tab = String(formData.get("tab") ?? "new");
  if (formData.get("confirm") === "on") {
    await admin.from("model_requests").delete().eq("id", String(formData.get("id") ?? ""));
  }
  revalidatePath("/studio/requests");
  revalidatePath("/requests");
  revalidatePath("/nl/requests");
  redirect(`/studio/requests?tab=${encodeURIComponent(tab)}`);
}
