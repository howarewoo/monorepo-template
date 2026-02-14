import { TechStackBar } from "@/components/logo-bar";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

describe("TechStackBar", () => {
  beforeEach(() => {
    render(<TechStackBar />);
  });

  it('renders "Built with" label', () => {
    expect(screen.getByText("Built with")).toBeTruthy();
  });

  it("renders Next.js", () => {
    expect(screen.getByText("Next.js")).toBeTruthy();
  });

  it("renders Expo", () => {
    expect(screen.getByText("Expo")).toBeTruthy();
  });

  it("renders React Native", () => {
    expect(screen.getByText("React Native")).toBeTruthy();
  });

  it("renders Hono", () => {
    expect(screen.getByText("Hono")).toBeTruthy();
  });

  it("renders oRPC", () => {
    expect(screen.getByText("oRPC")).toBeTruthy();
  });

  it("renders Tailwind CSS", () => {
    expect(screen.getByText("Tailwind CSS")).toBeTruthy();
  });

  it("renders TypeScript", () => {
    expect(screen.getByText("TypeScript")).toBeTruthy();
  });

  it("renders Turborepo", () => {
    expect(screen.getByText("Turborepo")).toBeTruthy();
  });
});
