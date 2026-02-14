import { Providers } from "@/app/providers";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockNavigationValue = {
  router: {
    navigate: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  },
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
};

vi.mock("@/lib/navigation", () => ({
  useWebNavigation: () => mockNavigationValue,
}));

let capturedNavigationValue: unknown;

vi.mock("@infrastructure/navigation", () => ({
  NavigationProvider: ({ children, value }: { children: React.ReactNode; value: unknown }) => {
    capturedNavigationValue = value;
    return <div data-testid="navigation-provider">{children}</div>;
  },
}));

describe("Providers", () => {
  it("renders children wrapped in providers", () => {
    render(
      <Providers>
        <div data-testid="child">Hello</div>
      </Providers>
    );

    expect(screen.getByTestId("child")).toBeDefined();
    expect(screen.getByText("Hello")).toBeDefined();
  });

  it("wraps children with NavigationProvider", () => {
    render(
      <Providers>
        <div data-testid="child">Hello</div>
      </Providers>
    );

    expect(screen.getByTestId("navigation-provider")).toBeDefined();
  });

  it("passes navigation value to NavigationProvider", () => {
    render(
      <Providers>
        <div data-testid="child">Hello</div>
      </Providers>
    );

    expect(capturedNavigationValue).toBeDefined();
    const value = capturedNavigationValue as { router: unknown; Link: unknown };
    expect(value.router).toBeDefined();
    expect(value.Link).toBeDefined();
  });
});
