import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/logo", () => ({
  Logo: () => <span>Logo</span>,
}));

vi.mock("@infrastructure/ui-web", () => ({
  Button: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));

import { Navbar } from "@/components/navbar";

describe("Navbar", () => {
  it("renders logo text", () => {
    render(<Navbar />);
    expect(screen.getByText("Monorepo Template")).toBeTruthy();
  });

  it("renders desktop nav links", () => {
    render(<Navbar />);
    expect(screen.getByText("Features")).toBeTruthy();
    expect(screen.getByText("Stack")).toBeTruthy();
    expect(screen.getByText("Docs")).toBeTruthy();
  });

  it("renders desktop action buttons", () => {
    render(<Navbar />);
    const githubButtons = screen.getAllByText("GitHub");
    const getStartedButtons = screen.getAllByText("Get Started");
    expect(githubButtons.length).toBeGreaterThan(0);
    expect(getStartedButtons.length).toBeGreaterThan(0);
  });

  it("renders mobile hamburger button", () => {
    render(<Navbar />);
    const hamburger = screen.getByLabelText("Toggle menu");
    expect(hamburger).toBeTruthy();
  });

  it("opens mobile menu when hamburger is clicked", () => {
    render(<Navbar />);
    const hamburger = screen.getByLabelText("Toggle menu");

    // Initially mobile menu should not be visible
    expect(hamburger.getAttribute("aria-expanded")).toBe("false");

    // Click to open
    fireEvent.click(hamburger);
    expect(hamburger.getAttribute("aria-expanded")).toBe("true");
  });

  it("shows nav links in mobile menu when open", () => {
    render(<Navbar />);
    const hamburger = screen.getByLabelText("Toggle menu");

    // Open mobile menu
    fireEvent.click(hamburger);

    // All nav links should be present (desktop + mobile)
    const featuresLinks = screen.getAllByText("Features");
    const stackLinks = screen.getAllByText("Stack");
    const docsLinks = screen.getAllByText("Docs");

    expect(featuresLinks.length).toBeGreaterThan(1);
    expect(stackLinks.length).toBeGreaterThan(1);
    expect(docsLinks.length).toBeGreaterThan(1);
  });
});
