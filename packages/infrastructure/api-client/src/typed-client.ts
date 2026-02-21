import type { RouterClient } from "@orpc/server";
import { createApiClient, createOrpcUtils } from "./client";
import type { Router } from "./generated/router-types";

/** Creates an API client pre-typed with the generated Router type. */
export function createTypedApiClient(baseUrl: string): RouterClient<Router> {
  return createApiClient<Router>(baseUrl);
}

/** Creates TanStack Query utils pre-typed with the generated Router type. */
export function createTypedOrpcUtils(client: RouterClient<Router>) {
  return createOrpcUtils(client);
}
