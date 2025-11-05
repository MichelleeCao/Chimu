"use server";

import { createClient } from "@/lib/supabase/server";
import { type ActionResponse } from "@/types/actions";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createTeamSchema } from "./page";

export async function createStudentTeamAction(classId: string, values: z.infer<typeof createTeamSchema>): Promise<ActionResponse<{ teamId: string }>> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to create a team." };
  }

  // Verify user is a student in this class and not already on a team
  const { data: roleData, error: roleError } = await supabase
    .from("class_roles")
    .select("id, team_id")
    .eq("class_id", classId)
    .eq("user_id", user.id)
    .eq("role", "student")
    .single();

  if (roleError || !roleData) {
    console.error("Error fetching user role or user is not a student in this class:", roleError);
    return { error: "You are not authorized to create teams for this class." };
  }

  if (roleData.team_id) {
    return { error: "You are already on a team in this class." };
  }

  const validatedFields = createTeamSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name } = validatedFields.data;

  // Insert the new team
  const { data: newTeam, error: insertError } = await supabase
    .from("teams")
    .insert({
      name,
      class_id: classId,
      creator_id: user.id, // Student creating the team is the creator
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Error creating team:", insertError);
    return { error: "Failed to create team." };
  }

  // Add the student to the new team
  const { error: memberError } = await supabase
    .from("team_members")
    .insert({
      team_id: newTeam.id,
      user_id: user.id,
    });

  if (memberError) {
    console.error("Error adding student to team_members:", memberError);
    // Consider rolling back team creation if adding member fails
    return { error: "Failed to add you to the new team." };
  }

  // Update class_roles to link student to the new team
  const { error: updateRoleError } = await supabase
    .from("class_roles")
    .update({ team_id: newTeam.id, updated_at: new Date().toISOString() })
    .eq("id", roleData.id);

  if (updateRoleError) {
    console.error("Error updating class_roles with team_id:", updateRoleError);
    // Consider rolling back team_members insert and team creation if this fails
    return { error: "Failed to update your class role with new team information." };
  }

  revalidatePath(`/student/dashboard`);
  revalidatePath(`/student/classes/${classId}/teams`);

  return { data: { teamId: newTeam.id } };
}
