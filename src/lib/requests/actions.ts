"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { contactInbox, isMailConfigured, sendMail } from "@/lib/mail/send";
import { emailLayout, escapeHtml, textToHtml } from "@/lib/mail/template";
import { isEmail } from "@/lib/newsletter/server";

export type RequestFormState = { status: "idle" | "sent" | "invalid" | "error" };

const siteUrl = () => (process.env.SITE_URL || "https://3dpiy.com").replace(/\/$/, "");

/** The form on /requests: a wish for a design, or a problem with one. */
export async function submitModelRequest(
  _prev: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  if (formData.get("company")) return { status: "sent" }; // honeypot
  const kind = formData.get("kind") === "problem" ? "problem" : "request";
  const title = String(formData.get("title") ?? "").trim().slice(0, 150);
  const details = String(formData.get("details") ?? "").trim().slice(0, 4000);
  const name = String(formData.get("name") ?? "").trim().slice(0, 200);
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 254);
  const locale = formData.get("locale") === "nl" ? "nl" : "en";
  if (!title || !name || !isEmail(email)) return { status: "invalid" };

  const admin = createAdminClient();
  if (!admin) return { status: "error" };

  const productSlug = String(formData.get("product") ?? "");
  const { data: product } = productSlug
    ? await admin.from("products").select("id, title").eq("slug", productSlug).maybeSingle()
    : { data: null };

  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  const { error } = await admin.from("model_requests").insert({
    kind,
    title,
    details,
    product_id: product?.id ?? null,
    name,
    email,
    user_id: user?.id ?? null,
    locale,
  });
  if (error) {
    console.error("[requests] insert failed", error);
    return { status: "error" };
  }

  // Heads-up mail to the 3DPIY inbox; the request is saved either way.
  if (isMailConfigured()) {
    const label = kind === "problem" ? "Probleem" : "Modelverzoek";
    const about = product ? `Over: ${product.title}\n\n` : "";
    await sendMail({
      to: contactInbox(),
      replyTo: email,
      subject: `[3DPIY ${label.toLowerCase()}] ${title}`,
      text: `${about}${details}\n\n— ${name} (${email})\n\nStudio: ${siteUrl()}/studio/requests`,
      html: emailLayout({
        heading: `${label}: ${title}`,
        bodyHtml: `${product ? `<p style="margin:0 0 16px"><b>Over:</b> ${escapeHtml(product.title)}</p>` : ""}${details ? textToHtml(details) : ""}<p style="margin:0 0 16px;color:#6b6478">— ${escapeHtml(name)} (${escapeHtml(email)})</p><p style="margin:0"><a href="${siteUrl()}/studio/requests" style="color:#8c52ff">Bekijken in Studio</a></p>`,
        footerHtml: "Beantwoorden = direct naar de afzender.<br>",
      }),
    }).catch((e) => console.error("[requests] mail failed", e));
  }

  revalidatePath("/studio/requests");
  return { status: "sent" };
}

/** Vote button on /requests: adds or takes back your vote. */
export async function toggleRequestVote(
  requestId: string,
): Promise<{ ok: boolean; signIn?: boolean }> {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) return { ok: false, signIn: true };
  const admin = createAdminClient();
  if (!admin || !/^[0-9a-f-]{36}$/i.test(requestId)) return { ok: false };

  const { data: request } = await admin
    .from("model_requests")
    .select("id")
    .eq("id", requestId)
    .eq("kind", "request")
    .in("status", ["open", "planned"])
    .maybeSingle();
  if (!request) return { ok: false };

  const { data: existing } = await admin
    .from("model_request_votes")
    .select("request_id")
    .eq("request_id", requestId)
    .eq("user_id", user.id)
    .maybeSingle();
  const { error } = existing
    ? await admin
        .from("model_request_votes")
        .delete()
        .eq("request_id", requestId)
        .eq("user_id", user.id)
    : await admin.from("model_request_votes").insert({ request_id: requestId, user_id: user.id });
  revalidatePath("/requests");
  revalidatePath("/nl/requests");
  return { ok: !error };
}
