import type { ComponentType, ReactNode } from "react";

/** Imperative navigation interface matching common router APIs. */
export interface Router {
  navigate(href: string): void;
  replace(href: string): void;
  back(): void;
}

/** Props accepted by the platform-agnostic Link component. */
export interface LinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  replace?: boolean;
}

/** Value provided to NavigationContext by each app's adapter. */
export interface NavigationContextValue {
  router: Router;
  Link: ComponentType<LinkProps>;
}
