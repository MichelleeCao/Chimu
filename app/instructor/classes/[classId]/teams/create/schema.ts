import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100, "Team name must be at most 100 characters"),
});

export type CreateTeamFormValues = z.infer<typeof createTeamSchema>;
