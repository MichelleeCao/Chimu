import { z } from "zod";

export const icebreakerQuestionSchema = z.object({
  questionText: z.string().min(1, "Question text is required").max(255, "Question text must be at most 255 characters"),
  category: z.string().optional(),
});

export type IcebreakerQuestionFormValues = z.infer<typeof icebreakerQuestionSchema>;
