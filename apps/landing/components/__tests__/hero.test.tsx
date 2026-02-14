import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@infrastructure/ui-web", () => ({
  Button: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));

import { Hero } from "@/components/hero";

describe("Hero", () => {
  it("renders headline text", () => {
    render(<Hero />);
    expect(screen.getByText("The modern monorepo")).toBeTruthy();
    expect(screen.getByText("template")).toBeTruthy();
  });

  it("renders subtitle", () => {
    render(<Hero />);
    expect(screen.getByText(/Ship web, mobile, and API from a single codebase/)).toBeTruthy();
  });

  it("renders announcement badge", () => {
    render(<Hero />);
    expect(screen.getByText("Now with Next.js 16, Expo SDK 54, and Hono")).toBeTruthy();
  });

  it("renders CTA buttons", () => {
    render(<Hero />);
    expect(screen.getAllByText("Get Started").length).toBeGreaterThan(0);
    expect(screen.getAllByText("View on GitHub").length).toBeGreaterThan(0);
  });

  it("renders terminal command", () => {
    render(<Hero />);
    expect(screen.getByText("pnpm dev")).toBeTruthy();
  });

  it("renders terminal port URLs", () => {
    render(<Hero />);
    expect(screen.getByText(/http:\/\/localhost:3000/)).toBeTruthy();
    expect(screen.getByText(/http:\/\/localhost:3001/)).toBeTruthy();
    expect(screen.getByText(/http:\/\/localhost:8081/)).toBeTruthy();
  });
});
