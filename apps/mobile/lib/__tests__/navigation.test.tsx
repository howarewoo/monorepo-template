import { renderHook } from "@testing-library/react-native";
import { useMobileNavigation } from "@/lib/navigation";

// Create mock functions for expo-router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

// Override the global mock for this test file
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
  Link: ({ children }: { children: React.ReactNode }) => children,
}));

describe("useMobileNavigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return router and Link", () => {
    const { result } = renderHook(() => useMobileNavigation());
    expect(result.current.router).toBeDefined();
    expect(result.current.router.navigate).toBeDefined();
    expect(result.current.router.replace).toBeDefined();
    expect(result.current.router.back).toBeDefined();
    expect(result.current.Link).toBeDefined();
  });

  it("should call expoRouter.push when navigate is called", () => {
    const { result } = renderHook(() => useMobileNavigation());
    result.current.router.navigate("/test-path");
    expect(mockPush).toHaveBeenCalledWith("/test-path");
  });

  it("should call expoRouter.replace when replace is called", () => {
    const { result } = renderHook(() => useMobileNavigation());
    result.current.router.replace("/test-path");
    expect(mockReplace).toHaveBeenCalledWith("/test-path");
  });

  it("should call expoRouter.back when back is called", () => {
    const { result } = renderHook(() => useMobileNavigation());
    result.current.router.back();
    expect(mockBack).toHaveBeenCalled();
  });
});
