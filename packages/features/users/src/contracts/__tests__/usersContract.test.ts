import { describe, expect, it } from "vitest";
import { CreateUserSchema, GetUserSchema, UserSchema } from "../usersContract";

describe("usersContract", () => {
  describe("UserSchema", () => {
    it("accepts a valid user", () => {
      const result = UserSchema.safeParse({
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        createdAt: new Date().toISOString(),
      });
      expect(result.success).toBe(true);
    });

    it("rejects a user with invalid email", () => {
      const result = UserSchema.safeParse({
        id: "1",
        name: "John Doe",
        email: "not-an-email",
        createdAt: new Date().toISOString(),
      });
      expect(result.success).toBe(false);
    });

    it("rejects a user with missing fields", () => {
      const result = UserSchema.safeParse({ id: "1" });
      expect(result.success).toBe(false);
    });
  });

  describe("CreateUserSchema", () => {
    it("accepts valid create input", () => {
      const result = CreateUserSchema.safeParse({
        name: "Jane",
        email: "jane@example.com",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty name", () => {
      const result = CreateUserSchema.safeParse({
        name: "",
        email: "jane@example.com",
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email", () => {
      const result = CreateUserSchema.safeParse({
        name: "Jane",
        email: "bad",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("GetUserSchema", () => {
    it("accepts valid id", () => {
      const result = GetUserSchema.safeParse({ id: "1" });
      expect(result.success).toBe(true);
    });

    it("rejects missing id", () => {
      const result = GetUserSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
