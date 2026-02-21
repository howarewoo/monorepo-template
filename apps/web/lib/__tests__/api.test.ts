import { describe, expect, it, vi } from "vitest";

vi.mock("@infrastructure/api-client", () => ({
  createTypedApiClient: vi.fn((url: string) => ({ url })),
  createTypedOrpcUtils: vi.fn((client: unknown) => ({ client })),
}));

describe("api", () => {
  it("creates API client with default URL when env var not set", async () => {
    const { createTypedApiClient } = await import("@infrastructure/api-client");
    const { apiClient } = await import("@/lib/api");

    expect(createTypedApiClient).toHaveBeenCalledWith("http://localhost:3001/api");
    expect(apiClient).toBeDefined();
  });

  it("creates oRPC utils with the API client", async () => {
    const { createTypedOrpcUtils } = await import("@infrastructure/api-client");
    const { apiClient, orpc } = await import("@/lib/api");

    expect(createTypedOrpcUtils).toHaveBeenCalledWith(apiClient);
    expect(orpc).toBeDefined();
  });
});
