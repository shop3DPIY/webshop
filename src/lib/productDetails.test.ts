import { describe, expect, it } from "vitest";
import { difficultyFor, fitsSmallBed, involvesFor } from "./productDetails";

describe("product details", () => {
  it("derives what's involved", () => {
    expect(involvesFor({ productKind: "pattern", category: "doll-mini" })).toEqual(["sew"]);
    expect(
      involvesFor({ productKind: "print", category: "tech-electronics", printSettings: { requiredParts: [{ qty: 1, name: "ESP32" }] } }),
    ).toEqual(["print", "parts", "electronics"]);
    expect(involvesFor({ category: "organize", printSettings: { involves: ["print", "paint"] } })).toEqual(["print", "paint"]);
  });

  it("derives a difficulty unless one is set", () => {
    expect(difficultyFor({ productKind: "print", category: "organize" })).toBe(1);
    expect(difficultyFor({ category: "organize", printSettings: { parts: 6, supportsRequired: true } })).toBe(3);
    expect(difficultyFor({ category: "organize", printSettings: { difficulty: 2, parts: 9 } })).toBe(2);
  });

  it("knows what fits an A1 mini", () => {
    expect(fitsSmallBed({ width: 120, depth: 80, height: 40 })).toBe(true);
    expect(fitsSmallBed({ width: 243, depth: 180, height: 45 })).toBe(false);
    expect(fitsSmallBed(undefined)).toBe(false);
  });
});
