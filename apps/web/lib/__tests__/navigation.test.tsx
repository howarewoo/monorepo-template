import { render, renderHook, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWebNavigation } from "@/lib/navigation";

const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    replace,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    replace?: boolean;
  }) => (
    <a href={href} className={className} data-replace={replace}>
      {children}
    </a>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useWebNavigation", () => {
  it("returns router with navigate, replace, and back functions", () => {
    const { result } = renderHook(() => useWebNavigation());

    expect(result.current.router).toBeDefined();
    expect(typeof result.current.router.navigate).toBe("function");
    expect(typeof result.current.router.replace).toBe("function");
    expect(typeof result.current.router.back).toBe("function");
    expect(result.current.Link).toBeDefined();
  });

  it("navigate calls nextRouter.push", () => {
    const { result } = renderHook(() => useWebNavigation());

    result.current.router.navigate("/test");

    expect(mockPush).toHaveBeenCalledWith("/test");
  });

  it("replace calls nextRouter.replace", () => {
    const { result } = renderHook(() => useWebNavigation());

    result.current.router.replace("/test");

    expect(mockReplace).toHaveBeenCalledWith("/test");
  });

  it("back calls nextRouter.back", () => {
    const { result } = renderHook(() => useWebNavigation());

    result.current.router.back();

    expect(mockBack).toHaveBeenCalled();
  });
});

describe("WebLink", () => {
  it("renders NextLink with href, className, and replace props", () => {
    const { result } = renderHook(() => useWebNavigation());
    const { Link } = result.current;

    render(
      <Link href="/about" className="nav-link" replace>
        About
      </Link>
    );

    const link = screen.getByText("About");
    expect(link).toBeDefined();
    expect(link.getAttribute("href")).toBe("/about");
    expect(link.getAttribute("class")).toBe("nav-link");
    expect(link.getAttribute("data-replace")).toBe("true");
  });
});
