import { useContext } from "react";
import { NavigationContext } from "./context";
import type { Router } from "./types";

/** Returns the platform-specific Router for imperative navigation. */
export function useNavigation(): Router {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return ctx.router;
}
