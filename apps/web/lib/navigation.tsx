"use client";

import type { NavigationContextValue } from "@infrastructure/navigation";
import type { LinkProps } from "@infrastructure/navigation";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

function WebLink({ href, children, className, replace }: LinkProps) {
  return (
    <NextLink href={href} className={className} replace={replace}>
      {children}
    </NextLink>
  );
}

/** Creates a NavigationContextValue backed by Next.js routing. */
export function useWebNavigation(): NavigationContextValue {
  const nextRouter = useRouter();

  return useMemo(
    () => ({
      router: {
        navigate: (href: string) => nextRouter.push(href),
        replace: (href: string) => nextRouter.replace(href),
        back: () => nextRouter.back(),
      },
      Link: WebLink,
    }),
    [nextRouter]
  );
}
