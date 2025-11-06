"use server";

import { createClient } from "@/lib/supabase/server";
import { type ActionResponse } from "@/types/actions";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSurveySchema } from "./schema";

export async function createSurveyAction(classId: string, values: z.infer<typeof createSurveySchema>): Promise<ActionResponse> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to create a survey." };
  }

  // Verify user is an instructor for this class
  const { data: roleData, error: roleError } = await supabase
    .from("class_roles")
    .select("role")
    .eq("class_id", classId)
    .eq("user_id", user.id)
    .eq("role", "instructor")
    .single();

  if (roleError || !roleData) {
    console.error("Error checking user role or user is not an instructor:", roleError);
    return { error: "You are not authorized to create surveys for this class." };
  }

  const validatedFields = createSurveySchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { releaseDate, dueDate, questions } = validatedFields.data;

  const { error: insertError } = await supabase
    .from("surveys")
    .insert({
      class_id: classId,
      created_by: user.id,
      sent_date: releaseDate.toISOString(),
      due_date: dueDate.toISOString(),
      questions: questions, // Store questions as JSON
    });

  if (insertError) {
    console.error("Error creating survey:", insertError);
    return { error: "Failed to create survey." };
  }

  revalidatePath(`/instructor/classes/${classId}/surveys`);
  revalidatePath(`/instructor/classes/${classId}/dashboard`);
  revalidatePath(`/student/dashboard`);

  return { data: undefined };
}
