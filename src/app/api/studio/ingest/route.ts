import { NextResponse, type NextRequest } from "next/server";
import { persistProduct } from "@/lib/studio/actions";
import { formatCompatible, ikeaCompatibleFrom } from "@/lib/compatible";

/**
 * Entry point for the local folder-watcher ingest script (see
 * /Users/carmennales/3DPIY_ingest-script on Carmen's Mac — not part of
 * this repo). Shared-secret
 * pattern: no user session, just a secret the script and this route both
 * know (INGEST_AUTH_CODE).
 *
 * Every product created here is forced to publication_status "draft",
 * regardless of what the caller sends — nothing the script uploads goes
 * live without Carmen opening Studio and publishing it herself.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-ingest-secret");
  if (!secret || secret !== process.env.INGEST_AUTH_CODE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.INGEST_AUTH_CODE) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const formData = await request.formData();
  formData.set("publicationStatus", "draft");
  // IKEA hacks: link the IKEA product(s) named in the folder/file names.
  if (formData.get("category") === "ikea-hacks" && !formData.has("compatible")) {
    const links = ikeaCompatibleFrom(
      String(formData.get("folderName") ?? ""),
      String(formData.get("title") ?? ""),
      String(formData.get("sourceFilename") ?? ""),
    );
    if (links.length > 0) formData.set("compatible", formatCompatible(links));
  }

  try {
    const { id, commerceError } = await persistProduct(formData);
    return NextResponse.json({ ok: true, id, commerceError });
  } catch (error) {
    console.error("[ingest] persistProduct failed", error);
    // Supabase's PostgrestError isn't an Error instance, so check for a
    // .message property rather than only `error instanceof Error`.
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
