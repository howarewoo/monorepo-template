"use client";

import { useNavigation } from "@infrastructure/navigation";
import { useState } from "react";
import { AuthForm } from "@/components/auth-form";
import { createBrowserSupabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const { replace } = useNavigation();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(_email: string, password: string) {
    setError("");
    setIsLoading(true);
    try {
      const supabase = createBrowserSupabase();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthForm
      title="Reset Password"
      description="Enter your new password"
      submitLabel="Update Password"
      onSubmit={handleSubmit}
      error={error}
      isLoading={isLoading}
      footer={
        <a href="/sign-in" className="text-muted-foreground hover:text-foreground">
          Back to Sign In
        </a>
      }
    />
  );
}
