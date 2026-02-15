import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BrowserFrame } from "@/components/browser-frame";

describe("BrowserFrame", () => {
  it("renders URL bar with localhost:3000", () => {
    render(<BrowserFrame />);
    expect(screen.getByText("localhost:3000")).toBeTruthy();
  });

  it("renders three app cards", () => {
    render(<BrowserFrame />);
    expect(screen.getByText("Web")).toBeTruthy();
    expect(screen.getByText("Mobile")).toBeTruthy();
    expect(screen.getByText("API")).toBeTruthy();
  });

  it("renders card subtitles", () => {
    render(<BrowserFrame />);
    expect(screen.getByText("Next.js 16")).toBeTruthy();
    expect(screen.getByText("Expo SDK 54")).toBeTruthy();
    expect(screen.getByText("Hono + oRPC")).toBeTruthy();
  });

  it("renders infrastructure badges", () => {
    render(<BrowserFrame />);
    expect(screen.getByText("api-client")).toBeTruthy();
    expect(screen.getByText("navigation")).toBeTruthy();
    expect(screen.getByText("ui-web")).toBeTruthy();
  });

  it("renders tooling badges", () => {
    render(<BrowserFrame />);
    expect(screen.getByText("Turborepo")).toBeTruthy();
    expect(screen.getByText("Biome")).toBeTruthy();
    expect(screen.getByText("Vitest")).toBeTruthy();
  });

  it("renders quick start commands", () => {
    render(<BrowserFrame />);
    expect(screen.getByText("pnpm install")).toBeTruthy();
    expect(screen.getByText("pnpm dev")).toBeTruthy();
    expect(screen.getByText("pnpm build")).toBeTruthy();
    expect(screen.getByText("pnpm test")).toBeTruthy();
  });
});
