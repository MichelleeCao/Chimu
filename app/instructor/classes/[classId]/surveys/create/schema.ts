import { z } from "zod";

export const defaultSurveyQuestions: { question_text: string; type: 'likert' }[] = [
  { question_text: "Members provide timely response to communications", type: "likert" },
  { question_text: "Members are present at scheduled meetings", type: "likert" },
  { question_text: "Members have equitable workload distribution", type: "likert" },
  { question_text: "Our team has good morale and energy", type: "likert" },
  { question_text: "Our team is making good progress on our project", type: "likert" },
];

export const createSurveySchema = z.object({
  releaseDate: z.date(),
  dueDate: z.date(),
  questions: z.array(z.object({
    question_text: z.string().min(1),
    type: z.literal("likert"),
  })),
});

export type CreateSurveyFormValues = z.infer<typeof createSurveySchema>;
