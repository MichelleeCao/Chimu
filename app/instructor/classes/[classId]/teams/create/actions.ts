"use server";

import { createClient } from "@/lib/supabase/server";
import { type ActionResponse } from "@/types/actions";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createTeamSchema } from "./schema";

export async function createTeamAction(classId: string, values: z.infer<typeof createTeamSchema>): Promise<ActionResponse<{ teamId: string }>> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to create a team." };
  }

  // Verify that the user is an instructor or TA for this class
  const { data: roleData, error: roleError } = await supabase
    .from("class_roles")
    .select("role")
    .eq("class_id", classId)
    .eq("user_id", user.id)
    .in("role", ["instructor", "TA"]);

  if (roleError || !roleData || roleData.length === 0) {
    console.error("Error checking user role or user is not instructor/TA:", roleError);
    return { error: "You are not authorized to create teams in this class." };
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
      creator_id: user.id,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Error creating team:", insertError);
    return { error: "Failed to create team." };
  }

  // Add the creator as a member of the new team
  const { error: memberError } = await supabase
    .from("team_members")
    .insert({
      team_id: newTeam.id,
      user_id: user.id,
    });

  if (memberError) {
    console.error("Error adding creator to team:", memberError);
    // Consider rolling back team creation if adding member fails
    return { error: "Failed to add creator to the team." };
  }

  revalidatePath(`/instructor/classes/${classId}`); // Revalidate the class details page

  return { data: { teamId: newTeam.id } };
}
