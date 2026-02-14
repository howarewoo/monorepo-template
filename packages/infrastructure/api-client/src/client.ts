import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { Router } from "./server";

export type Client = RouterClient<Router>;

export function createApiClient(baseUrl: string): Client {
  const link = new RPCLink({
    url: baseUrl,
  });

  return createORPCClient<Client>(link);
}

export type ApiClient = ReturnType<typeof createApiClient>;

export function createOrpcUtils(client: Client) {
  return createTanstackQueryUtils(client);
}
