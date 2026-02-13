"use client";

import { NavigationProvider } from "@infrastructure/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { useWebNavigation } from "../lib/navigation";

export function Providers({ children }: { children: React.ReactNode }) {
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

  const navigationValue = useWebNavigation();

  return (
    <QueryClientProvider client={queryClient}>
      <NavigationProvider value={navigationValue}>{children}</NavigationProvider>
    </QueryClientProvider>
  );
}
