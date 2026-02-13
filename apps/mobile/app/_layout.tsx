import "../global.css";
import { NavigationProvider } from "@infrastructure/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { useMobileNavigation } from "../lib/navigation";

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  const navigationValue = useMobileNavigation();

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationProvider value={navigationValue}>
        <StatusBar style="auto" />
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              title: "Monorepo Template",
            }}
          />
        </Stack>
      </NavigationProvider>
    </QueryClientProvider>
  );
}
