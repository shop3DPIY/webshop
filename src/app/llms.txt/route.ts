import { getSiteMode } from "@/lib/config/siteMode";
import { LLMS_TXT } from "./content";

/**
 * /llms.txt — a short description of 3DPIY for AI assistants. Files with
 * an extension skip the coming-soon gate in proxy.ts, so this route
 * checks the site mode itself: nothing is described until the site is live.
 */
export function GET() {
  if (getSiteMode() !== "live") return new Response("Not found", { status: 404 });
  return new Response(LLMS_TXT, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
