import "server-only";
import JSZip from "jszip";

/**
 * Reads the print details out of a Bambu Studio / OrcaSlicer 3MF project,
 * as suggestions for the product form (Studio "Fill in from 3MF") and for
 * drafts from the ingest folder. Everything is optional — a plain 3MF
 * export only has the mesh, and print time / filament weight are only
 * there when the project was saved after slicing.
 */

export interface ThreeMfInfo {
  plates?: number;
  parts?: number;
  printTimeHours?: number;
  filamentGrams?: number;
  nozzleMm?: number;
  layerHeightMm?: number;
  infillPct?: number;
  supportsRequired?: boolean;
  /** Filament types actually used, e.g. ["PLA", "TPU"] */
  materials?: string[];
  /** More than one filament/colour is used (AMS) */
  multicolor?: boolean;
  /** The printer the project was set up for, e.g. "Bambu Lab A1" */
  printerModel?: string;
  dimensions?: { width: number; depth: number; height: number };
}

const attr = (xml: string, key: string) =>
  [...xml.matchAll(new RegExp(`<metadata key="${key}" value="([^"]*)"`, "g"))].map((m) => m[1]);

const round = (n: number, step = 10) => Math.round(n * step) / step;

export async function readThreeMf(buffer: ArrayBuffer | Buffer): Promise<ThreeMfInfo> {
  let zip = await JSZip.loadAsync(buffer);
  // A ZIP of print files (ingest folders with a subfolder): read the
  // first 3MF inside it.
  if (!zip.file("3D/3dmodel.model")) {
    const inner = Object.keys(zip.files).find((p) => p.toLowerCase().endsWith(".3mf") && !p.startsWith("__MACOSX"));
    if (!inner) throw new Error("No 3MF in this file");
    zip = await JSZip.loadAsync(await zip.file(inner)!.async("arraybuffer"));
  }
  const text = async (path: string) => (await zip.file(path)?.async("text")) ?? "";
  const info: ThreeMfInfo = {};

  // Project settings (JSON): nozzle, layer height, infill, supports, printer.
  let settings: Record<string, unknown> = {};
  try {
    settings = JSON.parse((await text("Metadata/project_settings.config")) || "{}");
  } catch {}
  const first = (v: unknown) => (Array.isArray(v) ? v[0] : v);
  const nozzle = Number(first(settings.nozzle_diameter));
  if (nozzle > 0) info.nozzleMm = nozzle;
  const layer = Number(settings.layer_height);
  if (layer > 0) info.layerHeightMm = layer;
  const infill = parseFloat(String(settings.sparse_infill_density ?? ""));
  if (Number.isFinite(infill)) info.infillPct = infill;
  if (settings.enable_support !== undefined) info.supportsRequired = String(settings.enable_support) === "1";
  if (typeof settings.printer_model === "string" && settings.printer_model) info.printerModel = settings.printer_model;

  // Plates, printed objects and which filaments (extruders) they use.
  const model = await text("Metadata/model_settings.config");
  if (model) {
    const plates = model.match(/<plate>/g)?.length ?? 0;
    if (plates > 0) info.plates = plates;
    const instances = model.match(/<model_instance>/g)?.length ?? 0;
    const objects = model.match(/<object id=/g)?.length ?? 0;
    if (instances || objects) info.parts = instances || objects;
    const extruders = new Set(attr(model, "extruder").filter((e) => e !== "0"));
    const types = Array.isArray(settings.filament_type) ? (settings.filament_type as string[]) : [];
    const used = [...extruders].map((e) => types[Number(e) - 1]).filter(Boolean);
    if (used.length > 0) info.materials = [...new Set(used)];
    if (extruders.size > 1) info.multicolor = true;
  }

  // Colours painted onto the model (MMU painting) also need an AMS.
  const objectFiles = Object.keys(zip.files).filter((p) => p.startsWith("3D/") && p.endsWith(".model"));
  const xmls = await Promise.all(objectFiles.map((p) => text(p)));
  if (xmls.some((x) => x.includes('paint_color="'))) info.multicolor = true;

  // Sliced projects: predicted time (s) and weight (g) per plate.
  const slice = await text("Metadata/slice_info.config");
  const seconds = attr(slice, "prediction").map(Number).filter((n) => n > 0);
  const grams = attr(slice, "weight").map(Number).filter((n) => n > 0);
  if (seconds.length) info.printTimeHours = round(seconds.reduce((a, b) => a + b, 0) / 3600);
  if (grams.length) info.filamentGrams = Math.round(grams.reduce((a, b) => a + b, 0));

  // Size of the whole model (mesh vertices; transforms not applied, so a
  // rotated part gives an approximate box).
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const vertex = /<vertex\s+x="([-\d.eE+]+)"\s+y="([-\d.eE+]+)"\s+z="([-\d.eE+]+)"/g;
  for (const xml of xmls) {
    for (const m of xml.matchAll(vertex)) {
      for (let i = 0; i < 3; i++) {
        const v = parseFloat(m[i + 1]);
        min[i] = Math.min(min[i], v);
        max[i] = Math.max(max[i], v);
      }
    }
  }
  if (Number.isFinite(min[0])) {
    info.dimensions = {
      width: round(max[0] - min[0]),
      depth: round(max[1] - min[1]),
      height: round(max[2] - min[2]),
    };
  }
  return info;
}
