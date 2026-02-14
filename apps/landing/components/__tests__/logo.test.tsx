import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Logo } from "@/components/logo";

describe("Logo", () => {
  it("renders an SVG element", () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
  });

  it("uses default size of 22", () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("22");
    expect(svg?.getAttribute("height")).toBe("22");
  });

  it("accepts a custom size", () => {
    const { container } = render(<Logo size={16} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("16");
    expect(svg?.getAttribute("height")).toBe("16");
  });
});
