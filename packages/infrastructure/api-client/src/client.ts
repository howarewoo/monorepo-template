import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

export function createApiClient<TRouter extends Record<string, any>>(
  baseUrl: string
): RouterClient<TRouter> {
  const link = new RPCLink({
    url: baseUrl,
  });

  return createORPCClient(link);
}

export function createOrpcUtils<TClient extends Record<string, any>>(client: TClient) {
  return createTanstackQueryUtils(client);
}
