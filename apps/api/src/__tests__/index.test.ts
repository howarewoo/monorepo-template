import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock @hono/node-server BEFORE importing app
vi.mock("@hono/node-server", () => ({
  serve: vi.fn(),
}));

// Mock the router
vi.mock("@infrastructure/api-client/server", () => ({
  router: {},
}));

// Mock RPCHandler - create a shared mock handle function
const createMockHandle = () => vi.fn();
let mockHandle = createMockHandle();

vi.mock("@orpc/server/fetch", () => ({
  RPCHandler: vi.fn(() => ({
    get handle() {
      return mockHandle;
    },
  })),
}));

// Now import app
import app from "../index";

describe("API Server", () => {
  beforeEach(() => {
    mockHandle = createMockHandle();
  });

  it("should return welcome message on GET /", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ message: "Monorepo API is running!" });
  });

  it("should call oRPC handler and return response when matched", async () => {
    const mockResponse = new Response("ok");
    mockHandle.mockResolvedValueOnce({
      matched: true,
      response: mockResponse,
    });

    const res = await app.request("/api/users");
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toBe("ok");
    expect(mockHandle).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({
        prefix: "/",
        context: expect.objectContaining({ requestId: undefined }),
      })
    );
  });

  it("should return 404 when oRPC handler does not match", async () => {
    mockHandle.mockResolvedValueOnce({
      matched: false,
    });

    const res = await app.request("/api/nonexistent");
    expect(res.status).toBe(404);
  });

  it("should include CORS headers", async () => {
    const res = await app.request("/");
    expect(res.headers.get("access-control-allow-origin")).toBeTruthy();
  });
});
