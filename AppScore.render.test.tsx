import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppScore } from "./AppScore";

const html = (el: React.ReactElement) => renderToStaticMarkup(el);

describe("AppScore rendering", () => {
  it("profile variant shows number + tier name and an accessible label (87 = Blazing)", () => {
    const out = html(<AppScore variant="profile" score={87} />);
    expect(out).toContain('aria-label="App Score: 87, Blazing tier"');
    expect(out).toContain(">87<");
    expect(out).toContain(">Blazing<");
    expect(out).toContain('data-tier="blazing"');
    expect(out).toContain("app-score-halo");
  });

  it("Exotic renders for 90 and 99.9 with gradient digits", () => {
    for (const s of [90, 99.9]) {
      const out = html(<AppScore variant="profile" score={s} />);
      expect(out).toContain('data-tier="exotic"');
      expect(out).toContain(">Exotic<");
      expect(out).toContain("background-clip:text");
    }
  });

  it("feed variant on dark uses white text pill and shows tier name", () => {
    const out = html(<AppScore variant="feed" score={61} />);
    expect(out).toContain('aria-label="App Score: 61, Rising tier"');
    expect(out).toContain("text-white");
    expect(out).toContain(">Rising<");
  });

  it("null score shows a dash and 'Score pending', never 0", () => {
    const out = html(<AppScore variant="profile" score={null} />);
    expect(out).toContain(">—<");
    expect(out).toContain("Score pending");
    expect(out).not.toContain(">0<");
  });

  it("NaN shows 'Score unavailable'", () => {
    const out = html(<AppScore variant="feed" score={NaN} />);
    expect(out).toContain("Score unavailable");
  });

  it("loading renders a skeleton with no number", () => {
    const out = html(<AppScore variant="profile" score={87} loading />);
    expect(out).toContain('aria-busy="true"');
    expect(out).not.toContain(">87<");
    expect(out).toContain("motion-reduce:animate-none");
  });

  it("emerging tier has no glow layer", () => {
    const out = html(<AppScore variant="profile" score={12} />);
    expect(out).not.toContain("app-score-halo");
    expect(out).toContain(">Emerging<");
  });

  it("out-of-range score is clamped for display", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const out = html(<AppScore variant="profile" score={150} />);
    expect(out).toContain('aria-label="App Score: 100, Exotic tier"');
  });
});
