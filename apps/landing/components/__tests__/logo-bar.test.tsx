import { TechStackBar } from "@/components/logo-bar";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("TechStackBar", () => {
  it('renders "Built with" label', () => {
    render(<TechStackBar />);
    expect(screen.getByText("Built with")).toBeTruthy();
  });

  it("renders Next.js", () => {
    render(<TechStackBar />);
    expect(screen.getByText("Next.js")).toBeTruthy();
  });

  it("renders Expo", () => {
    render(<TechStackBar />);
    expect(screen.getByText("Expo")).toBeTruthy();
  });

  it("renders React Native", () => {
    render(<TechStackBar />);
    expect(screen.getByText("React Native")).toBeTruthy();
  });

  it("renders Hono", () => {
    render(<TechStackBar />);
    expect(screen.getByText("Hono")).toBeTruthy();
  });

  it("renders oRPC", () => {
    render(<TechStackBar />);
    expect(screen.getByText("oRPC")).toBeTruthy();
  });

  it("renders Tailwind CSS", () => {
    render(<TechStackBar />);
    expect(screen.getByText("Tailwind CSS")).toBeTruthy();
  });

  it("renders TypeScript", () => {
    render(<TechStackBar />);
    expect(screen.getByText("TypeScript")).toBeTruthy();
  });

  it("renders Turborepo", () => {
    render(<TechStackBar />);
    expect(screen.getByText("Turborepo")).toBeTruthy();
  });
});
