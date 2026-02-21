"use client";

import { useNavigation } from "@infrastructure/navigation";
import { useAuth } from "@infrastructure/supabase/auth";
import { useState } from "react";
import { AuthForm } from "@/components/auth-form";

export default function SignUpPage() {
  const { signUp, signInWithOAuth } = useAuth();
  const { replace } = useNavigation();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(email: string, password: string) {
    setError("");
    setIsLoading(true);
    try {
      await signUp({ email, password });
      replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOAuth(provider: "google" | "apple" | "github") {
    try {
      await signInWithOAuth(provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OAuth sign in failed");
    }
  }

  return (
    <AuthForm
      title="Sign Up"
      description="Create an account to get started"
      submitLabel="Create Account"
      onSubmit={handleSubmit}
      showOAuth
      onOAuthClick={handleOAuth}
      error={error}
      isLoading={isLoading}
      footer={
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <a href="/sign-in" className="text-foreground underline">
            Sign In
          </a>
        </p>
      }
    />
  );
}
