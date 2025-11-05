"use server";

import { createClient } from "@/lib/supabase/server";
import { type ActionResponse } from "@/types/actions";
import { revalidatePath } from "next/cache";

export async function deleteTeamAction(classId: string, teamId: string): Promise<ActionResponse> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to delete teams." };
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
    return { error: "You are not authorized to delete teams in this class." };
  }

  // Verify that the team belongs to the class
  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .select("id")
    .eq("id", teamId)
    .eq("class_id", classId)
    .single();

  if (teamError || !teamData) {
    console.error("Error fetching team or team does not belong to class:", teamError);
    return { error: "Team not found or does not belong to this class." };
  }

  // Delete the team (RLS will handle cascade delete of team_members)
  const { error: deleteError } = await supabase
    .from("teams")
    .delete()
    .eq("id", teamId);

  if (deleteError) {
    console.error("Error deleting team:", deleteError);
    return { error: "Failed to delete team." };
  }

  revalidatePath(`/instructor/classes/${classId}`); // Revalidate the class details page

  return { data: undefined };
}
