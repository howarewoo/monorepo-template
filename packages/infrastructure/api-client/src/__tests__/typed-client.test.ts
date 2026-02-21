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

import { createTypedApiClient, createTypedOrpcUtils } from "../typed-client";

describe("createTypedApiClient", () => {
  it("creates a pre-typed client for the given base URL", () => {
    const client = createTypedApiClient("http://localhost:3001/api");
    expect(client).toBeDefined();
  });
});

describe("createTypedOrpcUtils", () => {
  it("creates pre-typed tanstack query utils from a typed client", () => {
    const client = createTypedApiClient("http://localhost:3001/api");
    const utils = createTypedOrpcUtils(client);
    expect(utils).toBeDefined();
  });
});
