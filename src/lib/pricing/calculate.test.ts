import { describe, expect, it } from "vitest";
import {
  DEFAULT_PRICING_SETTINGS as S,
  calculatePrices,
  estimateNetCents,
  formatEuro,
  parseEuroToCents,
  setFactor,
  validateSettings,
  withDefaults,
  type PriceInput,
} from "./calculate";

const standard = (category: PriceInput["category"]): PriceInput => ({
  category,
  complexity: "standard",
  isSet: false,
  partCount: 1,
  includesStep: false,
});

const prices = (input: PriceInput) => {
  const r = calculatePrices(S, input);
  return [r.personalCents, r.smallCents, r.unlimitedCents];
};

describe("calculatePrices — standard single models", () => {
  it("Doll & Mini = €4,50 / €22,50 / €65", () => {
    expect(prices(standard("doll-mini"))).toEqual([450, 2250, 6500]);
  });
  it("Organize = €3,00 / €15 / €45", () => {
    expect(prices(standard("organize"))).toEqual([300, 1500, 4500]);
  });
  it("Tech & Electronics = €6,00 / €30 / €90", () => {
    expect(prices(standard("tech-electronics"))).toEqual([600, 3000, 9000]);
  });
  it("Home & Living = €5,50 / €27,50 / €80", () => {
    expect(prices(standard("home-living"))).toEqual([550, 2750, 8000]);
  });
});

describe("calculatePrices — inputs and limits", () => {
  it("applies the complexity factor and rounds to €0,50", () => {
    // 4,50 × 0,7 = 3,15 → 3,00 ; 4,50 × 1,5 = 6,75 → 7,00 (rounds half up)
    expect(prices({ ...standard("doll-mini"), complexity: "simple" })[0]).toBe(300);
    expect(prices({ ...standard("doll-mini"), complexity: "complex" })[0]).toBe(700);
  });

  it("adds the STEP surcharge before the set factor", () => {
    // (4,50 + 3,00) = 7,50
    expect(prices({ ...standard("doll-mini"), includesStep: true })[0]).toBe(750);
  });

  it("clamps to the category's min and max", () => {
    // Organize simple: 3,00 × 0,7 = 2,10 → 2,00 → clamped up to 2,50
    expect(prices({ ...standard("organize"), complexity: "simple" })[0]).toBe(250);
    // Doll & Mini set of 3: 4,50 × 1,8 = 8,10 → 8,00 (within max 9,00)
    expect(prices({ ...standard("doll-mini"), isSet: true, partCount: 3 })[0]).toBe(800);
    // Doll & Mini set of 5: 4,50 × 2,6 = 11,70 → clamped down to 9,00
    expect(prices({ ...standard("doll-mini"), isSet: true, partCount: 5 })[0]).toBe(900);
  });

  it("ignores the part count when it isn't a set", () => {
    expect(prices({ ...standard("doll-mini"), partCount: 6 })[0]).toBe(450);
  });

  it("caps the set factor at its maximum", () => {
    expect(setFactor(S, 1)).toBe(1);
    expect(setFactor(S, 3)).toBeCloseTo(1.8);
    expect(setFactor(S, 20)).toBe(4);
  });

  it("uses the small-license minimum when 5× is lower", () => {
    // Organize simple → 2,50 × 5 = 12,50 → minimum 15,00
    const r = calculatePrices(S, { ...standard("organize"), complexity: "simple" });
    expect(r.smallCents).toBe(1500);
    expect(r.unlimitedCents).toBe(4500);
  });

  it("floors Unlimited to €5", () => {
    // Doll & Mini complex: 7,00 → 35,00 → 105,00 ; STEP: 7,50 → 37,50 → 112,50 → 110
    expect(prices({ ...standard("doll-mini"), complexity: "complex" })[2]).toBe(10500);
    expect(prices({ ...standard("doll-mini"), includesStep: true })[2]).toBe(11000);
  });

  it("flags subscription membership and Serious Games custom work", () => {
    expect(calculatePrices(S, standard("doll-mini")).inSubscription).toBe(true);
    const sg = calculatePrices(S, standard("serious-games"));
    expect(sg.inSubscription).toBe(false);
    expect(sg.customFromCents).toBe(25000);
    expect(calculatePrices(S, standard("doll-mini")).customFromCents).toBeNull();
  });
});

describe("formatting, parsing and validation", () => {
  it("formats in Dutch notation", () => {
    expect(formatEuro(450).replace(/\s/g, " ")).toBe("€ 4,50");
  });

  it("accepts both comma and dot", () => {
    expect(parseEuroToCents("4,50")).toBe(450);
    expect(parseEuroToCents("4.5")).toBe(450);
    expect(parseEuroToCents("€ 12,95")).toBe(1295);
    expect(parseEuroToCents("-1")).toBeNull();
    expect(parseEuroToCents("abc")).toBeNull();
  });

  it("accepts the defaults and rejects min > base", () => {
    expect(validateSettings(S)).toEqual([]);
    const bad = withDefaults({
      categories: { ...S.categories, organize: { ...S.categories.organize, minCents: 400 } },
    });
    expect(validateSettings(bad).length).toBe(1);
  });

  it("fills missing stored values from the defaults", () => {
    const merged = withDefaults({ smallFactor: 6 } as never);
    expect(merged.smallFactor).toBe(6);
    expect(merged.categories["doll-mini"].baseCents).toBe(450);
  });
});

describe("estimateNetCents", () => {
  it("takes off 21% VAT and Polar's fee", () => {
    // €4.50: VAT 78, fee 29 + 45 → 298
    expect(estimateNetCents(450)).toBe(298);
    expect(estimateNetCents(1500)).toBe(1097);
  });
});

describe("per-category license factors", () => {
  it("Serious Games: €8 / €39 / €149 with its own factor and prices ending in 9", () => {
    const r = calculatePrices(S, {
      category: "serious-games",
      complexity: "standard",
      isSet: false,
      partCount: 1,
      includesStep: false,
    });
    expect([r.personalCents, r.smallCents, r.unlimitedCents]).toEqual([800, 3900, 14900]);
  });

  it("other categories keep the general factors", () => {
    const r = calculatePrices(S, {
      category: "doll-mini",
      complexity: "standard",
      isSet: false,
      partCount: 1,
      includesStep: false,
    });
    expect([r.personalCents, r.smallCents, r.unlimitedCents]).toEqual([450, 2250, 6500]);
  });
});
