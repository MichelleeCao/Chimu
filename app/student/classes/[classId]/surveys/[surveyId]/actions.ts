"use server";

import { createClient } from "@/lib/supabase/server";
import { type ActionResponse } from "@/types/actions";
import { revalidatePath } from "next/cache";

export async function submitSurveyResponseAction(surveyId: string, teamId: string, answers: string[]): Promise<ActionResponse> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to submit a survey response." };
  }

  // Verify user is a student in the team and has not already responded to this survey
  const { data: existingResponse, error: responseError } = await supabase
    .from("responses")
    .select("id")
    .eq("survey_id", surveyId)
    .eq("user_id", user.id)
    .eq("team_id", teamId)
    .single();

  if (existingResponse) {
    return { error: "You have already responded to this survey." };
  }

  // Insert the new response
  const { error: insertError } = await supabase
    .from("responses")
    .insert({
      survey_id: surveyId,
      user_id: user.id,
      team_id: teamId,
      answers: answers, // Store answers as JSON array
    });

  if (insertError) {
    console.error("Error submitting survey response:", insertError);
    return { error: "Failed to submit survey response." };
  }

  revalidatePath(`/student/dashboard`);
  revalidatePath(`/student/classes/${classId}/teams/${teamId}`);

  return { data: undefined };
}
