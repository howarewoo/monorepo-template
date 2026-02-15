import { z } from "zod";

export const MessageSchema = z.object({
  message: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;
