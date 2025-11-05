"use server";

import { createClient } from "@/lib/supabase/server";
import { type ActionResponse } from "@/types/actions";
import { revalidatePath } from "next/cache";

export async function joinTeamAction(classId: string, teamId: string): Promise<ActionResponse> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to join a team." };
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
    return { error: "You are not authorized to join teams for this class." };
  }

  if (roleData.team_id) {
    return { error: "You are already on a team in this class." };
  }

  // Check if the team is full (optional, based on max_team_size in classes table)
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("max_team_size")
    .eq("id", classId)
    .single();

  if (classError) {
    console.error("Error fetching class max team size:", classError);
    return { error: "Failed to check team capacity." };
  }

  if (classData.max_team_size) {
    const { count, error: teamCountError } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId);

    if (teamCountError) {
      console.error("Error fetching team member count:", teamCountError);
      return { error: "Failed to check team capacity." };
    }

    if (count !== null && count >= classData.max_team_size) {
      return { error: "This team is full." };
    }
  }

  // Insert into team_members
  const { error: insertMemberError } = await supabase
    .from("team_members")
    .insert({
      team_id: teamId,
      user_id: user.id,
    });

  if (insertMemberError) {
    console.error("Error adding student to team_members:", insertMemberError);
    return { error: "Failed to join team." };
  }

  // Update class_roles to link student to the team
  const { error: updateRoleError } = await supabase
    .from("class_roles")
    .update({ team_id: teamId, updated_at: new Date().toISOString() })
    .eq("id", roleData.id);

  if (updateRoleError) {
    console.error("Error updating class_roles with team_id:", updateRoleError);
    // Consider rolling back team_members insert if this fails
    return { error: "Failed to update your class role with team information." };
  }

  revalidatePath(`/student/dashboard`);
  revalidatePath(`/student/classes/${classId}/teams`);

  return { data: undefined };
}
