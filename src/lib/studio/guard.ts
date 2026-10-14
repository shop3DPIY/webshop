import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Call at the top of every /studio page (or once in the layout) — wrapped
 * in React's cache() so calling it from both the protected layout and a
 * page in the same request only hits Supabase once.
 *
 * There is no separate admin sign-in screen — not logged in at all sends
 * you to the normal site sign-in (/auth/sign-in?next=/studio), which
 * itself redirects admins straight into Studio after a successful login
 * (see SignInForm.tsx). Logged in but not an admin sends you back to your
 * own account rather than bouncing you to a login page you'd just pass
 * straight through again.
 */
export const requireAdmin = cache(async () => {
  const supabase = await createClient();
  if (!supabase) redirect("/auth/sign-in?next=/studio");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/studio");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, email")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/account");

  return { user, profile };
});
