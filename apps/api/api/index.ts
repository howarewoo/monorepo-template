import { router } from "@infrastructure/api-client/server";
import { RPCHandler } from "@orpc/server/fetch";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { handle } from "hono/vercel";

const app = new Hono().basePath("/api");

app.use("*", cors());

const handler = new RPCHandler(router);

app.all("/*", async (c) => {
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace(/^\/api/, "");

  const request = new Request(url, c.req.raw);

  const result = await handler.handle(request, {
    prefix: "/",
    context: { requestId: c.req.header("x-request-id") },
  });

  if (result.matched) {
    return result.response;
  }

  return c.notFound();
});

app.get("/", (c) => {
  return c.json({ message: "Monorepo API is running!" });
});

export default handle(app);
