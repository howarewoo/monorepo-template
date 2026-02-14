import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  createdAt: z.iso.datetime(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const GetUserSchema = z.object({
  id: z.string(),
});

export const MessageSchema = z.object({
  message: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;
