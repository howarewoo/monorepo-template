import { createRouterClient } from "@orpc/server";
import { describe, expect, it } from "vitest";
import { usersRouter } from "../usersORPCRouter";

const client = createRouterClient(usersRouter);

describe("usersORPCRouter", () => {
  describe("list", () => {
    it("returns an array of users", async () => {
      const result = await client.list({});
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("id");
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("email");
      expect(result[0]).toHaveProperty("createdAt");
    });
  });

  describe("get", () => {
    it("returns a user when id matches", async () => {
      const result = await client.get({ id: "1" });
      expect(result).not.toBeNull();
      expect(result?.id).toBe("1");
      expect(result?.name).toBe("John Doe");
    });

    it("returns null when id does not match", async () => {
      const result = await client.get({ id: "999" });
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("creates a user with provided name and email", async () => {
      const result = await client.create({
        name: "New User",
        email: "new@example.com",
      });
      expect(result.name).toBe("New User");
      expect(result.email).toBe("new@example.com");
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
    });
  });
});
