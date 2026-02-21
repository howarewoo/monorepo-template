"use client";

import { render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@infrastructure/supabase/auth", () => ({
  useAuth: () => ({
    signOut: vi.fn(),
    user: {
      id: "abc-123",
      email: "test@example.com",
      created_at: "2026-01-15T10:30:00Z",
    },
    isLoading: false,
    session: {},
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInWithOAuth: vi.fn(),
  }),
}));

vi.mock("@infrastructure/navigation", () => ({
  useNavigation: () => ({
    navigate: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("@infrastructure/ui-web", () => ({
  Button: ({ children, ...props }: React.ComponentProps<"button">) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <h3>{children}</h3>,
}));

import SettingsPage from "../page";

describe("SettingsPage", () => {
  it("renders Settings heading", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Settings")).toBeDefined();
  });

  it("renders user email", () => {
    render(<SettingsPage />);
    expect(screen.getByText("test@example.com")).toBeDefined();
  });

  it("renders user ID", () => {
    render(<SettingsPage />);
    expect(screen.getByText(/abc-123/)).toBeDefined();
  });

  it("renders sign out button", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Sign Out")).toBeDefined();
  });

  it("renders back to dashboard link", () => {
    render(<SettingsPage />);
    expect(screen.getByText(/Dashboard/)).toBeDefined();
  });
});
