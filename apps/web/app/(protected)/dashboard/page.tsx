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
import { UserList } from "@/components/user-list";

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const { replace } = useNavigation();

  const email = user?.email ?? "User";

  async function handleSignOut() {
    await signOut();
    replace("/sign-in");
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/40 bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-8">
          <span className="font-semibold">Monorepo Template</span>
          <div className="flex items-center gap-4">
            <a href="/settings" className="text-sm text-muted-foreground hover:text-foreground">
              Settings
            </a>
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {(email[0] ?? "U").toLowerCase()}
              </span>
              <span className="text-sm text-muted-foreground">{email}</span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-5xl space-y-6 p-8">
        <div>
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground">{email}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Users from API</CardTitle>
            <CardDescription>Data fetched from the Hono API</CardDescription>
          </CardHeader>
          <CardContent>
            <UserList />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
