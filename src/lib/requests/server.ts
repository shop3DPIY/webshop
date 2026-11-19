import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Model requests (migration 0016). Visitors send them from /requests (or
 * the "Something wrong or missing?" button under the designs); Studio →
 * Requests reviews them. Requests set to open/planned/done are public on
 * /requests, where signed-in visitors vote. Problem reports stay private.
 */

export const PUBLIC_STATUSES = ["open", "planned", "done"] as const;
export type RequestStatus = "new" | "open" | "planned" | "done" | "declined";

export interface PublicRequest {
  id: string;
  title: string;
  details: string;
  status: "open" | "planned" | "done";
  votes: number;
  voted: boolean;
  created_at: string;
}

/** Public requests, most votes first (done ones last). */
export async function getPublicRequests(userId: string | null): Promise<PublicRequest[]> {
  const admin = createAdminClient();
  if (!admin) return [];
  const { data: rows } = await admin
    .from("model_requests")
    .select("id, title, details, status, created_at, model_request_votes(user_id)")
    .eq("kind", "request")
    .in("status", [...PUBLIC_STATUSES]);

  const list = (rows ?? []).map((r) => {
    const votes = (r.model_request_votes ?? []) as { user_id: string }[];
    return {
      id: r.id as string,
      title: r.title as string,
      details: r.details as string,
      status: r.status as PublicRequest["status"],
      created_at: r.created_at as string,
      votes: votes.length,
      voted: !!userId && votes.some((v) => v.user_id === userId),
    };
  });
  const rank = (s: string) => (s === "done" ? 1 : 0);
  return list.sort(
    (a, b) =>
      rank(a.status) - rank(b.status) ||
      b.votes - a.votes ||
      b.created_at.localeCompare(a.created_at),
  );
}
