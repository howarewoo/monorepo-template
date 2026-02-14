import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { Link } from "../Link";
import { NavigationProvider } from "../NavigationProvider";
import type { NavigationContextValue } from "../types";
import { useNavigation } from "../useNavigation";

function createMockNavValue(): NavigationContextValue {
  return {
    router: {
      navigate: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
    },
    Link: ({
      href,
      children,
      className,
    }: {
      href: string;
      children: ReactNode;
      className?: string;
    }) => (
      <a href={href} className={className}>
        {children}
      </a>
    ),
  };
}

function createWrapper(value: NavigationContextValue) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <NavigationProvider value={value}>{children}</NavigationProvider>;
  };
}

describe("useNavigation", () => {
  it("returns router from context", () => {
    const mockValue = createMockNavValue();
    const { result } = renderHook(() => useNavigation(), {
      wrapper: createWrapper(mockValue),
    });

    expect(result.current).toBe(mockValue.router);
  });

  it("throws when used outside NavigationProvider", () => {
    expect(() => {
      renderHook(() => useNavigation());
    }).toThrow("useNavigation must be used within a NavigationProvider");
  });

  it("calls navigate on the router", () => {
    const mockValue = createMockNavValue();
    const { result } = renderHook(() => useNavigation(), {
      wrapper: createWrapper(mockValue),
    });

    result.current.navigate("/dashboard");
    expect(mockValue.router.navigate).toHaveBeenCalledWith("/dashboard");
  });

  it("calls replace on the router", () => {
    const mockValue = createMockNavValue();
    const { result } = renderHook(() => useNavigation(), {
      wrapper: createWrapper(mockValue),
    });

    result.current.replace("/login");
    expect(mockValue.router.replace).toHaveBeenCalledWith("/login");
  });

  it("calls back on the router", () => {
    const mockValue = createMockNavValue();
    const { result } = renderHook(() => useNavigation(), {
      wrapper: createWrapper(mockValue),
    });

    result.current.back();
    expect(mockValue.router.back).toHaveBeenCalled();
  });
});

describe("Link", () => {
  it("throws when used outside NavigationProvider", () => {
    expect(() => {
      renderHook(() => null, {
        wrapper: ({ children }) => <Link href="/test">{children}</Link>,
      });
    }).toThrow("Link must be used within a NavigationProvider");
  });
});
