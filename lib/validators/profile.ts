import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name must be at most 50 characters").optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
