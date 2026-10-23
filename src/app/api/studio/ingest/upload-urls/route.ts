import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Step 1 of an ingest upload (see ../route.ts for step 2). Netlify caps a
 * function request at ~6 MB, too small for zips and timelapse videos, so
 * the ingest script never sends files through the site: it asks here for
 * one-time signed upload URLs, PUTs each file straight into Supabase
 * Storage, then posts only the resulting storage paths to /api/studio/ingest.
 *
 * Downloads go to the private product-files bucket; photos and the
 * timelapse to the public product-images bucket.
 */
const KINDS = {
  download: "product-files",
  image: "product-images",
  video: "product-images",
} as const;
type Kind = keyof typeof KINDS;

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-ingest-secret");
  if (!process.env.INGEST_AUTH_CODE) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  if (!secret || secret !== process.env.INGEST_AUTH_CODE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin)
    return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const body = (await request.json().catch(() => null)) as {
    folder?: string;
    files?: { name: string; kind: Kind }[];
  } | null;
  if (!body?.folder || !Array.isArray(body.files) || body.files.length === 0) {
    return NextResponse.json(
      { error: "Expected { folder, files: [{ name, kind }] }" },
      { status: 400 },
    );
  }

  const folder = safeName(body.folder);
  const stamp = Date.now();
  const uploads = [];
  for (const file of body.files) {
    const bucket = KINDS[file.kind];
    if (!bucket)
      return NextResponse.json(
        { error: `Unknown kind: ${file.kind}` },
        { status: 400 },
      );
    const path = `${folder}/${stamp}-${safeName(file.name)}`;
    const { data, error } = await admin.storage
      .from(bucket)
      .createSignedUploadUrl(path);
    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Could not sign upload" },
        { status: 500 },
      );
    }
    uploads.push({
      name: file.name,
      kind: file.kind,
      bucket,
      path,
      signedUrl: data.signedUrl,
    });
  }
  return NextResponse.json({ uploads });
}
