import type { ReactNode } from "react";
import { NavigationContext } from "./context";
import type { NavigationContextValue } from "./types";

interface NavigationProviderProps {
  value: NavigationContextValue;
  children: ReactNode;
}

/** Wraps the app tree to provide platform-specific navigation to feature packages. */
export function NavigationProvider({ value, children }: NavigationProviderProps) {
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}
