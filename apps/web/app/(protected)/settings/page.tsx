"use client";

import { useNavigation } from "@infrastructure/navigation";
import { useAuth } from "@infrastructure/supabase/auth";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@infrastructure/ui-web";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { replace } = useNavigation();

  async function handleSignOut() {
    await signOut();
    replace("/sign-in");
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <a href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              &larr; Dashboard
            </a>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm font-medium">Email</span>
              <p className="text-sm text-muted-foreground">{user?.email ?? "—"}</p>
            </div>
            <div>
              <span className="text-sm font-medium">User ID</span>
              <p className="text-sm text-muted-foreground">{user?.id ?? "—"}</p>
            </div>
            {user?.created_at && (
              <div>
                <span className="text-sm font-medium">Member since</span>
                <p className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
