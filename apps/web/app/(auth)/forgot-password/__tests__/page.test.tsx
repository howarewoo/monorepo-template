"use client";

import { render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/auth-form", () => ({
  AuthForm: ({
    title,
    submitLabel,
    footer,
    hidePassword,
  }: {
    title: string;
    submitLabel: string;
    footer?: React.ReactNode;
    hidePassword?: boolean;
  }) => (
    <div data-testid="auth-form">
      <span>{title}</span>
      <span>{submitLabel}</span>
      <span data-testid="hide-password">{String(hidePassword)}</span>
      {footer}
    </div>
  ),
}));

vi.mock("@/lib/supabase", () => ({
  createBrowserSupabase: () => ({
    auth: {
      resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

import ForgotPasswordPage from "../page";

describe("ForgotPasswordPage", () => {
  it("renders with correct title", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByText("Forgot Password")).toBeDefined();
  });

  it("hides password field", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByTestId("hide-password").textContent).toBe("true");
  });

  it("renders back to sign-in link", () => {
    render(<ForgotPasswordPage />);
    expect(screen.getByText(/Sign In/)).toBeDefined();
  });
});
