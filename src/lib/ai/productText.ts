import "server-only";

/**
 * The one place that defines how 3DPIY product texts sound. Used by the
 * "Text with AI" button in Studio and by the ingest script (both through
 * /api/studio/describe), so every product reads the same.
 *
 * Input may be English, Dutch or just keywords; output is always a polished
 * English title + description plus a natural Dutch version of both.
 * Needs ANTHROPIC_API_KEY (Netlify env vars + .env.local).
 */

export const HOUSE_STYLE = `You write product texts for 3DPIY, an independent one-person studio selling original 3D-print design files (STL/3MF) that customers print themselves.

House style:
- Friendly, clear and practical; confident but never hypey. No marketing fluff, no exclamation marks, no emojis.
- Title: short, in Title Case (English) / normal Dutch capitalisation, names what the object is. Max ~6 words. No file formats or version numbers.
- Description: 1–3 sentences. Say what it is and what it's for; mention scale (e.g. 1:6, 1:12) or what it fits (e.g. an IKEA product) when known. Don't invent dimensions, materials or features that aren't given.
- Remember the customer buys a digital file to print, not a physical object.
- Dutch: natural, informal (je/jij), the same meaning and tone as the English — not a word-for-word translation.`;

export interface ProductTextInput {
  /** Title as typed or derived from the folder name (any language) */
  title?: string;
  /** Description as typed, or notes/keywords (any language) */
  description?: string;
  categoryName?: string;
  fileNames?: string[];
}

export interface ProductText {
  title: string;
  description: string;
  titleNl: string;
  descriptionNl: string;
}

export const isAiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

const MODEL = "claude-sonnet-5-5";

export async function generateProductText(
  input: ProductTextInput,
): Promise<ProductText> {
  if (!isAiConfigured()) throw new Error("ANTHROPIC_API_KEY is not set");

  const facts = [
    input.title && `Working title: ${input.title}`,
    input.description && `Notes / current text:\n${input.description}`,
    input.categoryName && `Collection: ${input.categoryName}`,
    input.fileNames?.length && `Delivered as: ${input.fileNames.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 800,
      system: HOUSE_STYLE,
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              title: { type: "string", description: "English title" },
              description: { type: "string", description: "English description" },
              titleNl: { type: "string", description: "Dutch title" },
              descriptionNl: { type: "string", description: "Dutch description" },
            },
            required: ["title", "description", "titleNl", "descriptionNl"],
            additionalProperties: false,
          },
        },
      },
      messages: [
        {
          role: "user",
          content: `Write the texts for this product.\n\n${facts || "(no details given)"}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Anthropic API error ${res.status}: ${await res.text().catch(() => "")}`,
    );
  }
  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  const raw = data.content.find((c) => c.type === "text")?.text ?? "";
  let out: Partial<ProductText> | undefined;
  try {
    out = JSON.parse(raw) as Partial<ProductText>;
  } catch {
    out = undefined;
  }
  if (!out?.title || !out.description || !out.titleNl || !out.descriptionNl) {
    throw new Error("The AI didn't return all four texts");
  }
  return {
    title: out.title.trim(),
    description: out.description.trim(),
    titleNl: out.titleNl.trim(),
    descriptionNl: out.descriptionNl.trim(),
  };
}
