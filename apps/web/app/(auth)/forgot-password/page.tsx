"use client";

import { useState } from "react";
import { AuthForm } from "@/components/auth-form";
import { createBrowserSupabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(email: string) {
    setError("");
    setIsLoading(true);
    try {
      const supabase = createBrowserSupabase();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <h2 className="text-2xl font-bold">Check your email</h2>
          <p className="text-muted-foreground">
            We sent a password reset link to your email address.
          </p>
          <a href="/sign-in" className="text-sm text-muted-foreground hover:text-foreground">
            Back to Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <AuthForm
      title="Forgot Password"
      description="Enter your email to receive a password reset link"
      submitLabel="Send Reset Link"
      onSubmit={handleSubmit}
      error={error}
      isLoading={isLoading}
      hidePassword
      footer={
        <a href="/sign-in" className="text-muted-foreground hover:text-foreground">
          Back to Sign In
        </a>
      }
    />
  );
}
