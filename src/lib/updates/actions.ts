"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/studio/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidOptOut, sendUpdateMails } from "./server";

/** Studio → product → Notify buyers → "Send". */
export async function notifyBuyers(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").slice(0, 2000);

  const result = await sendUpdateMails(id, note);
  revalidatePath(`/studio/products/${id}/notify`);
  redirect(
    result.ok
      ? `/studio/products/${id}/notify?sent=${result.sent}`
      : `/studio/products/${id}/notify?error=${encodeURIComponent(result.error.slice(0, 300))}`,
  );
}

/** The opt-out button on /updates/unsubscribe (link from each update mail). */
export async function unsubscribeFromUpdates(formData: FormData) {
  const email = String(formData.get("e") ?? "").toLowerCase();
  const signature = String(formData.get("s") ?? "");
  const locale = String(formData.get("locale") ?? "en");
  const prefix = locale === "nl" ? "/nl" : "";
  const back = `${prefix}/updates/unsubscribe?e=${encodeURIComponent(email)}&s=${encodeURIComponent(signature)}`;

  const admin = createAdminClient();
  if (!admin || !isValidOptOut(email, signature)) redirect(back);

  await admin
    .from("update_mail_optouts")
    .upsert({ email }, { onConflict: "email", ignoreDuplicates: true });
  redirect(`${back}&done=1`);
}
