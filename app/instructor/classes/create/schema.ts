import { z } from "zod";

export const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required").max(100, "Class name must be at most 100 characters"),
  quarter: z.string().min(1, "Quarter is required").max(50, "Quarter must be at most 50 characters"),
  section: z.string().min(1, "Section is required").max(50, "Section must be at most 50 characters"),
  year: z.number().int().min(1900, "Invalid year").max(2100, "Invalid year"),
  description: z.string().max(500, "Description must be at most 500 characters").optional(),
  max_team_size: z.number().int().min(2, "Minimum team size is 2").max(20, "Maximum team size is 20").optional(),
  instructorEmails: z.array(z.string().email("Invalid email address")).optional().default([]),
  taEmails: z.array(z.string().email("Invalid email address")).optional().default([]),
});

export type CreateClassFormValues = z.infer<typeof createClassSchema>;
