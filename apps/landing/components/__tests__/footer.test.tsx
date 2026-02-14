import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/logo", () => ({
  Logo: () => <span>Logo</span>,
}));

import { Footer } from "@/components/footer";

describe("Footer", () => {
  it("renders logo text", () => {
    render(<Footer />);
    expect(screen.getByText("Monorepo Template")).toBeTruthy();
  });

  it("renders tagline", () => {
    render(<Footer />);
    expect(screen.getByText("Ship web, mobile, and API from a single codebase.")).toBeTruthy();
  });

  it("renders Product group heading", () => {
    render(<Footer />);
    expect(screen.getByText("Product")).toBeTruthy();
  });

  it("renders Product links", () => {
    render(<Footer />);
    expect(screen.getByText("Features")).toBeTruthy();
    expect(screen.getByText("Pricing")).toBeTruthy();
    expect(screen.getByText("Changelog")).toBeTruthy();
    expect(screen.getByText("Roadmap")).toBeTruthy();
  });

  it("renders Resources group heading", () => {
    render(<Footer />);
    expect(screen.getByText("Resources")).toBeTruthy();
  });

  it("renders Resources links", () => {
    render(<Footer />);
    expect(screen.getByText("Documentation")).toBeTruthy();
    expect(screen.getByText("Guides")).toBeTruthy();
    expect(screen.getByText("Examples")).toBeTruthy();
    expect(screen.getByText("Blog")).toBeTruthy();
  });

  it("renders Connect group heading", () => {
    render(<Footer />);
    expect(screen.getByText("Connect")).toBeTruthy();
  });

  it("renders Connect links", () => {
    render(<Footer />);
    expect(screen.getByText("GitHub")).toBeTruthy();
    expect(screen.getByText("Discord")).toBeTruthy();
    expect(screen.getByText("Twitter")).toBeTruthy();
    expect(screen.getByText("Contact")).toBeTruthy();
  });

  it("renders legal text", () => {
    render(<Footer />);
    expect(screen.getByText("MIT License")).toBeTruthy();
    expect(screen.getByText("Privacy")).toBeTruthy();
    expect(screen.getByText("Terms")).toBeTruthy();
  });
});
