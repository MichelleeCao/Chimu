"use server";

import { createClient } from "@/lib/supabase/server";
import { type ActionResponse } from "@/types/actions";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { icebreakerQuestionSchema } from "./schema";

async function isAuthorizedToManageIcebreakers(supabase: ReturnType<typeof createClient>, userId: string, classId: string): Promise<boolean> {
  const { data: roleData, error: roleError } = await supabase
    .from("class_roles")
    .select("role")
    .eq("class_id", classId)
    .eq("user_id", userId)
    .in("role", ["instructor", "TA"]);

  if (roleError) {
    console.error("Error checking user role:", roleError);
    return false;
  }
  return roleData && roleData.length > 0;
}

export async function addIcebreakerQuestionAction(
  classId: string,
  values: z.infer<typeof icebreakerQuestionSchema>
): Promise<ActionResponse<{ questionId: string }>> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to manage icebreaker questions." };
  }

  if (!(await isAuthorizedToManageIcebreakers(supabase, user.id, classId))) {
    return { error: "You are not authorized to manage icebreaker questions for this class." };
  }

  const validatedFields = icebreakerQuestionSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { questionText, category } = validatedFields.data;

  // Check if the question already exists globally to avoid duplicates
  let questionId: string;
  const { data: existingQuestion, error: fetchQuestionError } = await supabase
    .from("icebreaker_questions")
    .select("id")
    .eq("question_text", questionText)
    .single();

  if (existingQuestion) {
    questionId = existingQuestion.id;
  } else if (fetchQuestionError && fetchQuestionError.code === 'PGRST116') {
    // Question does not exist, create it globally
    const { data: newQuestion, error: insertQuestionError } = await supabase
      .from("icebreaker_questions")
      .insert({
        question_text: questionText,
        category: category,
      })
      .select("id")
      .single();

    if (insertQuestionError) {
      console.error("Error creating new icebreaker question globally:", insertQuestionError);
      return { error: "Failed to add icebreaker question." };
    }
    questionId = newQuestion.id;
  } else if (fetchQuestionError) {
    console.error("Error checking for existing icebreaker question:", fetchQuestionError);
    return { error: "Failed to add icebreaker question." };
  } else {
      return { error: "Failed to add icebreaker question. Question already exists." };
  }

  // Link the question to the class if not already linked
  const { data: existingClassQuestion, error: fetchClassQuestionError } = await supabase
    .from("class_icebreaker_questions")
    .select("*")
    .eq("class_id", classId)
    .eq("question_id", questionId)
    .single();

  if (fetchClassQuestionError && fetchClassQuestionError.code === 'PGRST116') {
    const { error: linkError } = await supabase
      .from("class_icebreaker_questions")
      .insert({
        class_id: classId,
        question_id: questionId,
      });

    if (linkError) {
      console.error("Error linking icebreaker question to class:", linkError);
      return { error: "Failed to link icebreaker question to class." };
    }
  } else if (existingClassQuestion) {
    return { error: "This question is already added to this class." };
  } else if (fetchClassQuestionError) {
    console.error("Error checking for existing class icebreaker question:", fetchClassQuestionError);
    return { error: "Failed to add icebreaker question." };
  }

  revalidatePath(`/instructor/classes/${classId}/icebreakers`);
  revalidatePath(`/student/classes/${classId}/teams/[teamId]`); // Revalidate student team dashboard to show updates

  return { data: { questionId } };
}

export async function removeIcebreakerQuestionAction(classId: string, questionId: string): Promise<ActionResponse> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to manage icebreaker questions." };
  }

  if (!(await isAuthorizedToManageIcebreakers(supabase, user.id, classId))) {
    return { error: "You are not authorized to remove icebreaker questions from this class." };
  }

  const { error } = await supabase
    .from("class_icebreaker_questions")
    .delete()
    .eq("class_id", classId)
    .eq("question_id", questionId);

  if (error) {
    console.error("Error removing icebreaker question from class:", error);
    return { error: "Failed to remove icebreaker question from class." };
  }

  revalidatePath(`/instructor/classes/${classId}/icebreakers`);
  revalidatePath(`/student/classes/${classId}/teams/[teamId]`);

  return { data: undefined };
}
