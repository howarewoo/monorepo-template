import { describe, expect, it, vi } from "vitest";

vi.mock("@orpc/client", () => ({
  createORPCClient: vi.fn(() => ({ mocked: true })),
}));

vi.mock("@orpc/client/fetch", () => ({
  RPCLink: class {
    constructor(public options: { url: string }) {}
  },
}));

vi.mock("@orpc/tanstack-query", () => ({
  createTanstackQueryUtils: vi.fn((client: unknown) => ({
    client,
    utils: true,
  })),
}));

import { createApiClient, createOrpcUtils } from "../client";

describe("createApiClient", () => {
  it("creates a typed client for the given base URL", () => {
    type TestRouter = { health: { message: string } };
    const client = createApiClient<TestRouter>("http://localhost:3001/api");
    expect(client).toBeDefined();
  });
});

describe("createOrpcUtils", () => {
  it("creates tanstack query utils from a client", () => {
    const mockClient = { users: {} };
    const utils = createOrpcUtils(mockClient);
    expect(utils).toBeDefined();
  });
});
