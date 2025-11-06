import { z } from "zod";

export const teamAgreementSchema = z.object({
  content: z.string().min(10, "Agreement content must be at least 10 characters."),
});

export type TeamAgreementFormValues = z.infer<typeof teamAgreementSchema>;
