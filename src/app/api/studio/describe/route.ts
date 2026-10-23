import { NextResponse, type NextRequest } from "next/server";
import { generateProductText, isAiConfigured } from "@/lib/ai/productText";

/**
 * Product texts in the house style (src/lib/ai/productText.ts) for the
 * ingest script — same shared-secret auth as /api/studio/ingest. Studio
 * itself calls generateProductText through a server action instead.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-ingest-secret");
  if (!process.env.INGEST_AUTH_CODE || !isAiConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  if (!secret || secret !== process.env.INGEST_AUTH_CODE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json().catch(() => null)) as {
    title?: string;
    description?: string;
    categoryName?: string;
    fileNames?: string[];
  } | null;
  try {
    const text = await generateProductText({
      title: body?.title?.slice(0, 300),
      description: body?.description?.slice(0, 4000),
      categoryName: body?.categoryName?.slice(0, 100),
      fileNames: Array.isArray(body?.fileNames)
        ? body.fileNames.slice(0, 50).map(String)
        : [],
    });
    return NextResponse.json(text);
  } catch (error) {
    console.error("[describe] failed", error);
    return NextResponse.json({ error: String(error) }, { status: 502 });
  }
}
