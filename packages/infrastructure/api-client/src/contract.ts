import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const GetUserSchema = z.object({
  id: z.string(),
});

export const MessageSchema = z.object({
  message: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;
