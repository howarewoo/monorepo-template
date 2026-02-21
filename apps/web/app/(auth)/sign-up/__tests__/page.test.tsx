"use client";

import { render, screen } from "@testing-library/react";
import type React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@infrastructure/supabase/auth", () => ({
  useAuth: () => ({
    signUp: vi.fn(),
    signInWithOAuth: vi.fn(),
    isLoading: false,
    session: null,
    user: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock("@infrastructure/navigation", () => ({
  useNavigation: () => ({
    navigate: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("@/components/auth-form", () => ({
  AuthForm: ({
    title,
    submitLabel,
    footer,
  }: {
    title: string;
    submitLabel: string;
    footer?: React.ReactNode;
  }) => (
    <div data-testid="auth-form">
      <span>{title}</span>
      <span>{submitLabel}</span>
      {footer}
    </div>
  ),
}));

import SignUpPage from "../page";

describe("SignUpPage", () => {
  it("renders AuthForm with sign-up title", () => {
    render(<SignUpPage />);
    expect(screen.getByText("Sign Up")).toBeDefined();
  });

  it("renders Create Account submit label", () => {
    render(<SignUpPage />);
    expect(screen.getByText("Create Account")).toBeDefined();
  });

  it("renders sign-in link", () => {
    render(<SignUpPage />);
    expect(screen.getByText(/Sign In/)).toBeDefined();
  });
});
