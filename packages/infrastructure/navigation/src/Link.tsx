import { useContext } from "react";
import { NavigationContext } from "./context";
import type { LinkProps } from "./types";

/** Platform-agnostic Link that delegates to the app-provided Link component. */
export function Link(props: LinkProps) {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error("Link must be used within a NavigationProvider");
  }
  const PlatformLink = ctx.Link;
  return <PlatformLink {...props} />;
}
