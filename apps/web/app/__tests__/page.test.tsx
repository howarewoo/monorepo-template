import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import Home from "@/app/page";

vi.mock("@/components/user-list", () => ({
  UserList: () => <div data-testid="user-list">Mocked UserList</div>,
}));

describe("Home page", () => {
  it("renders heading and subtitle", () => {
    render(<Home />);
    expect(screen.getByText("Monorepo Template")).toBeDefined();
    expect(
      screen.getByText("A production-ready monorepo with Next.js, Expo, and Hono")
    ).toBeDefined();
  });

  it("renders three app cards with correct titles", () => {
    render(<Home />);
    expect(screen.getByText("Web")).toBeDefined();
    expect(screen.getByText("Mobile")).toBeDefined();
    expect(screen.getByText("API")).toBeDefined();
  });

  it("renders card descriptions with ports", () => {
    render(<Home />);
    expect(screen.getByText(/port 3000/)).toBeDefined();
    expect(screen.getByText(/port 8081/)).toBeDefined();
    expect(screen.getByText(/port 3001/)).toBeDefined();
  });

  it("renders tech stack items", () => {
    render(<Home />);
    expect(screen.getByText("App Router")).toBeDefined();
    expect(screen.getByText("React Native 0.81")).toBeDefined();
    expect(screen.getByText("Type-safe RPC")).toBeDefined();
    expect(screen.getByText("React Compiler")).toBeDefined();
    expect(screen.getByText("UniWind")).toBeDefined();
    expect(screen.getByText("Zod validation")).toBeDefined();
  });

  it("renders shared infrastructure badges", () => {
    render(<Home />);
    expect(screen.getByText("api-client")).toBeDefined();
    expect(screen.getByText("navigation")).toBeDefined();
    expect(screen.getByText("ui")).toBeDefined();
    expect(screen.getByText("ui-web")).toBeDefined();
    expect(screen.getByText("utils")).toBeDefined();
    expect(screen.getByText("typescript-config")).toBeDefined();
  });

  it("renders tooling badges", () => {
    render(<Home />);
    expect(screen.getByText("Turborepo")).toBeDefined();
    expect(screen.getByText("pnpm")).toBeDefined();
    expect(screen.getByText("Biome")).toBeDefined();
    expect(screen.getByText("Vitest")).toBeDefined();
    expect(screen.getByText("Playwright")).toBeDefined();
  });

  it("renders quick start commands", () => {
    render(<Home />);
    expect(screen.getByText("Quick Start")).toBeDefined();
    expect(screen.getByText("pnpm install")).toBeDefined();
    expect(screen.getByText("pnpm dev")).toBeDefined();
    expect(screen.getByText("pnpm build")).toBeDefined();
    expect(screen.getByText("pnpm test")).toBeDefined();
  });

  it("renders Users from API section with mocked UserList", () => {
    render(<Home />);
    expect(screen.getByText("Users from API")).toBeDefined();
    expect(screen.getByTestId("user-list")).toBeDefined();
  });

  it("renders Get Started and Documentation buttons", () => {
    render(<Home />);
    expect(screen.getByText("Get Started")).toBeDefined();
    expect(screen.getByText("Documentation")).toBeDefined();
  });

  it("renders correct total number of Card components", () => {
    const { container } = render(<Home />);
    const cards = container.querySelectorAll('[data-slot="card"]');
    expect(cards).toHaveLength(7);
  });
});
