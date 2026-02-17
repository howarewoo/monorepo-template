import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PhoneFrame } from "@/components/phone-frame";

describe("PhoneFrame", () => {
  it("renders app header", () => {
    render(<PhoneFrame />);
    expect(screen.getAllByText("Monorepo Template")).toHaveLength(2);
  });

  it("renders three stacked cards", () => {
    render(<PhoneFrame />);
    expect(screen.getByText("Next.js")).toBeTruthy();
    expect(screen.getByText("Expo")).toBeTruthy();
    expect(screen.getByText("Hono + oRPC")).toBeTruthy();
  });

  it("renders card subtitles", () => {
    render(<PhoneFrame />);
    expect(screen.getByText("Web application")).toBeTruthy();
    expect(screen.getByText("Mobile application")).toBeTruthy();
    expect(screen.getByText("Type-safe API")).toBeTruthy();
  });

  it("renders status bar time", () => {
    render(<PhoneFrame />);
    expect(screen.getByText("9:41")).toBeTruthy();
  });
});
