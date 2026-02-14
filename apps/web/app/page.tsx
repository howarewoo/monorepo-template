import { Button } from "@infrastructure/ui-web";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@infrastructure/ui-web";
import { UserList } from "@/components/user-list";

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Monorepo Template</h1>
          <p className="text-muted-foreground">
            A modern monorepo with Next.js, Expo, Hono, and oRPC
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Next.js</CardTitle>
              <CardDescription>Web application</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                React framework with App Router and shadcn/ui components
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expo</CardTitle>
              <CardDescription>Mobile application</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                React Native with Expo Router and UniWind styling
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hono + oRPC</CardTitle>
              <CardDescription>Type-safe API</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                End-to-end type safety with oRPC and Hono
              </p>
            </CardContent>
          </Card>
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

        <div className="flex justify-center gap-4">
          <Button>Get Started</Button>
          <Button variant="outline">Documentation</Button>
        </div>
      </div>
    </main>
  );
}
