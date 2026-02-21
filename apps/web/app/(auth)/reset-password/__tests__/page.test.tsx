"use client";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/auth-form", () => ({
  AuthForm: ({ title, submitLabel }: { title: string; submitLabel: string }) => (
    <div data-testid="auth-form">
      <span>{title}</span>
      <span>{submitLabel}</span>
    </div>
  ),
}));

vi.mock("@infrastructure/navigation", () => ({
  useNavigation: () => ({
    navigate: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("@/lib/supabase", () => ({
  createBrowserSupabase: () => ({
    auth: {
      updateUser: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

import ResetPasswordPage from "../page";

describe("ResetPasswordPage", () => {
  it("renders with correct title", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByText("Reset Password")).toBeDefined();
  });

  it("renders Update Password submit label", () => {
    render(<ResetPasswordPage />);
    expect(screen.getByText("Update Password")).toBeDefined();
  });
});
