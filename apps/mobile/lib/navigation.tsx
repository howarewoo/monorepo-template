import type { LinkProps, NavigationContextValue } from "@infrastructure/navigation";
import { Link as ExpoLink, useRouter } from "expo-router";
import { useMemo } from "react";

function MobileLink({ href, children, replace }: LinkProps) {
  return (
    <ExpoLink href={href as never} replace={replace}>
      {children}
    </ExpoLink>
  );
}

/** Creates a NavigationContextValue backed by Expo Router. */
export function useMobileNavigation(): NavigationContextValue {
  const expoRouter = useRouter();

  return useMemo(
    () => ({
      router: {
        navigate: (href: string) => expoRouter.push(href as never),
        replace: (href: string) => expoRouter.replace(href as never),
        back: () => expoRouter.back(),
      },
      Link: MobileLink,
    }),
    [expoRouter]
  );
}
