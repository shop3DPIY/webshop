"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function StudioSignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="border-line hover:bg-mist rounded-full border px-4 py-2 text-sm font-medium"
    >
      Sign out
    </button>
  );
}
