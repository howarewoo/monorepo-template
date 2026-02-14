import { describe, expect, it, vi } from "vitest";

vi.mock("@infrastructure/api-client", () => ({
  createApiClient: vi.fn((url: string) => ({ url })),
  createOrpcUtils: vi.fn((client: unknown) => ({ client })),
}));

describe("api", () => {
  it("creates API client with default URL when env var not set", async () => {
    const { createApiClient } = await import("@infrastructure/api-client");
    const { apiClient } = await import("@/lib/api");

    expect(createApiClient).toHaveBeenCalledWith("http://localhost:3001/api");
    expect(apiClient).toBeDefined();
  });

  it("creates oRPC utils with the API client", async () => {
    const { createOrpcUtils } = await import("@infrastructure/api-client");
    const { apiClient, orpc } = await import("@/lib/api");

    expect(createOrpcUtils).toHaveBeenCalledWith(apiClient);
    expect(orpc).toBeDefined();
  });
});
