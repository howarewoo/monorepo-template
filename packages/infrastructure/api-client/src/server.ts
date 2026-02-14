import { os } from "@orpc/server";
import { CreateUserSchema, GetUserSchema, MessageSchema, UserSchema } from "./contract";

const pub = os.$context<{ requestId?: string }>();

export const router = {
  health: pub.output(MessageSchema).handler(() => {
    return { message: "OK" };
  }),

  users: {
    list: pub.output(UserSchema.array()).handler(() => {
      return [
        {
          id: "1",
          name: "John Doe",
          email: "john@example.com",
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          name: "Jane Smith",
          email: "jane@example.com",
          createdAt: new Date().toISOString(),
        },
      ];
    }),

    get: pub
      .input(GetUserSchema)
      .output(UserSchema.nullable())
      .handler(({ input }) => {
        if (input.id === "1") {
          return {
            id: "1",
            name: "John Doe",
            email: "john@example.com",
            createdAt: new Date().toISOString(),
          };
        }
        return null;
      }),

    create: pub
      .input(CreateUserSchema)
      .output(UserSchema)
      .handler(({ input }) => {
        const id = Math.random().toString(36).substring(2, 15);
        return {
          id,
          name: input.name,
          email: input.email,
          createdAt: new Date().toISOString(),
        };
      }),
  },
};

export type Router = typeof router;
