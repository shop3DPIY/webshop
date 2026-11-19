import { describe, expect, it } from "vitest";
import { calculate, DEFAULT_INPUTS, withDefaults } from "./calc";

const bare = {
  ...DEFAULT_INPUTS,
  materials: [{ name: "PLA", grams: 100, pricePerKg: 20 }],
  printHours: 0,
  printerPrice: 0,
  maintenancePerHour: 0,
  powerWatts: 0,
  failurePct: 0,
  prepMinutes: 0,
  postMinutes: 0,
  packMinutes: 0,
  supplies: [],
  feePct: 0,
  feeFixed: 0,
  listingFee: 0,
  returnsPct: 0,
  vatMode: "kor" as const,
  profitMode: "amount" as const,
  profitValue: 0,
  roundMode: "none" as const,
};

describe("calculate", () => {
  it("costs material per item, split over the plate", () => {
    expect(calculate(bare).costPrice).toBeCloseTo(2);
    expect(calculate({ ...bare, itemsPerPlate: 4 }).costPrice).toBeCloseTo(0.5);
  });

  it("adds energy, machine wear and failures", () => {
    const r = calculate({ ...bare, printHours: 10, powerWatts: 100, kwhPrice: 0.3, printerPrice: 500, printerLifeHours: 5000, failurePct: 50 });
    // material 2 + energy 0.30 + machine 1.00 = 3.30, ×2 with 50 % failures
    expect(r.costPrice).toBeCloseTo(6.6);
  });

  it("spreads design costs over the expected sales", () => {
    const r = calculate({ ...bare, designHours: 5, hourlyRate: 20, designUnits: 50, prototypeCost: 10 });
    expect(r.lines.find((l) => l.key === "design")!.amount).toBeCloseTo(2.2);
  });

  it("solves the price so the margin survives VAT and fees", () => {
    const r = calculate({ ...bare, vatMode: "vat21", feePct: 10, feeFixed: 0.3, profitMode: "margin", profitValue: 30 });
    const net = r.price / 1.21;
    expect(r.profit).toBeCloseTo(0.3 * net);
    expect(net - r.platformFees - r.costPrice).toBeCloseTo(r.profit);
  });

  it("rounds up to .99 and keeps the profit honest", () => {
    const r = calculate({ ...bare, profitMode: "amount", profitValue: 1, roundMode: "99" });
    expect(r.rawPrice).toBeCloseTo(3);
    expect(r.price).toBeCloseTo(3.99);
    expect(r.profit).toBeCloseTo(1.99);
  });

  it("flags settings that can never make a profit", () => {
    expect(calculate({ ...bare, feePct: 60, profitMode: "margin", profitValue: 50 }).impossible).toBe(true);
  });

  it("costs supplies bought in packs per item", () => {
    const r = calculate({ ...bare, supplies: [
      { name: "box", kind: "packaging", packPrice: 12.99, packSize: 25, perItem: 1 },
      { name: "flyer", kind: "marketing", packPrice: 20, packSize: 100, perItem: 1 },
      { name: "magnet", kind: "extra", packPrice: 5, packSize: 100, perItem: 4 },
    ] });
    expect(r.lines.find((l) => l.key === "packaging")!.amount).toBeCloseTo(0.5196);
    expect(r.lines.find((l) => l.key === "marketing")!.amount).toBeCloseTo(0.2);
    expect(r.lines.find((l) => l.key === "extras")!.amount).toBeCloseTo(0.2);
  });

  it("turns old extras/packaging into supply lines", () => {
    const i = withDefaults({ extras: [{ name: "magnet", cost: 0.4 }], packagingCost: 0.5 } as never);
    expect(i.supplies).toEqual([
      { name: "magnet", kind: "extra", packPrice: 0.4, packSize: 1, perItem: 1 },
      { name: "", kind: "packaging", packPrice: 0.5, packSize: 1, perItem: 1 },
    ]);
  });

  it("fills in missing or broken saved inputs", () => {
    const i = withDefaults({ printHours: Number.NaN, materials: [{ name: "x" } as never] });
    expect(i.printHours).toBe(DEFAULT_INPUTS.printHours);
    expect(i.materials[0]).toEqual({ name: "x", grams: 0, pricePerKg: 0 });
  });
});
