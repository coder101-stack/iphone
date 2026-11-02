import { describe, expect, it } from "vitest";
import { classifyScore, formatScore, resolveScore } from "./AppScore";
import { getNextTier, getTierLabel } from "@/lib/app-score";
import { getAremRank } from "@/lib/arem-score";

describe("classifyScore — tier boundaries", () => {
  const cases: [number | null | undefined, string][] = [
    [0, "emerging"], [49, "emerging"], [49.9, "emerging"],
    [50, "rising"], [69, "rising"], [69.9, "rising"],
    [70, "cool"], [79, "cool"], [79.9, "cool"],
    [80, "hot"], [84, "hot"], [84.9, "hot"],
    [85, "blazing"], [89, "blazing"], [89.9, "blazing"],
    [90, "exotic"], [95, "exotic"], [99.9, "exotic"], [100, "exotic"],
    [null, "unknown"], [undefined, "unknown"], [NaN, "unknown"],
  ];
  it.each(cases)("%s → %s", (input, expected) => {
    expect(classifyScore(input)).toBe(expected);
  });

  it("Exotic covers the whole 90–100 range, not only 100", () => {
    for (const s of [90, 92, 95, 99, 99.9, 100]) expect(classifyScore(s)).toBe("exotic");
  });

  it("never rounds up into a higher tier (truncation rule)", () => {
    expect(classifyScore(49.99)).toBe("emerging");
    expect(classifyScore(69.99)).toBe("rising");
    expect(classifyScore(79.99)).toBe("cool");
    expect(classifyScore(84.99)).toBe("hot");
    expect(classifyScore(89.99)).toBe("blazing");
    expect(classifyScore(89.96)).toBe("blazing");
  });

  it("values just above each boundary land in the higher tier", () => {
    expect(classifyScore(50.1)).toBe("rising");
    expect(classifyScore(70.1)).toBe("cool");
    expect(classifyScore(80.1)).toBe("hot");
    expect(classifyScore(85.1)).toBe("blazing");
    expect(classifyScore(90.1)).toBe("exotic");
  });

  it("non-finite and negative inputs are unknown", () => {
    expect(classifyScore(Infinity)).toBe("unknown");
    expect(classifyScore(-Infinity)).toBe("unknown");
    expect(classifyScore(-1)).toBe("unknown");
  });
});

describe("resolveScore / formatScore — display states", () => {
  it("missing score is pending, never 0", () => {
    expect(resolveScore(null)).toEqual({ kind: "pending" });
    expect(resolveScore(undefined)).toEqual({ kind: "pending" });
  });
  it("non-numeric values are invalid", () => {
    expect(resolveScore(NaN).kind).toBe("invalid");
    expect(resolveScore("abc").kind).toBe("invalid");
    expect(resolveScore({}).kind).toBe("invalid");
    expect(resolveScore("").kind).toBe("invalid");
  });
  it("out-of-range values are clamped and flagged", () => {
    expect(resolveScore(140)).toMatchObject({ kind: "ok", value: 100, tier: "exotic", clamped: true });
    expect(resolveScore(-3)).toMatchObject({ kind: "ok", value: 0, tier: "emerging", clamped: true });
    expect(resolveScore(87)).toMatchObject({ kind: "ok", display: "87", tier: "blazing", clamped: false });
  });
  it("display truncates, never rounds up", () => {
    expect(formatScore(89.96)).toBe("89.9");
    expect(formatScore(87)).toBe("87");
    expect(formatScore(99.99)).toBe("99.9");
  });
});

describe("shared labels", () => {
  it("legacy getAremRank delegates to the 6-tier system", () => {
    expect(getAremRank(87)).toBe("BLAZING");
    expect(getAremRank(92)).toBe("EXOTIC");
    expect(getAremRank(null)).toBe("UNRANKED");
    expect(getTierLabel(61)).toBe("RISING");
  });
  it("next tier progression", () => {
    expect(getNextTier(87)?.id).toBe("exotic");
    expect(getNextTier(95)).toBeNull();
    expect(getNextTier(null)).toBeNull();
  });
});
