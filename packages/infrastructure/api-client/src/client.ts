import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

// biome-ignore lint/suspicious/noExplicitAny: oRPC's AnyRouter type requires `any` constraint — using `unknown` causes TS2344/TS2345
export function createApiClient<TRouter extends Record<string, any>>(
  baseUrl: string
): RouterClient<TRouter> {
  const link = new RPCLink({
    url: baseUrl,
  });

  return createORPCClient(link);
}

// biome-ignore lint/suspicious/noExplicitAny: oRPC's NestedClient type requires `any` constraint — using `unknown` causes TS2345
export function createOrpcUtils<TClient extends Record<string, any>>(client: TClient) {
  return createTanstackQueryUtils(client);
}
