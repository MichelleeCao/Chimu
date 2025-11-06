"use server";

import { createClient } from "@/lib/supabase/server";
import { type ActionResponse } from "@/types/actions";
import { revalidatePath } from "next/cache";

// Helper to check if the user is an instructor or TA for the given class
async function isAuthorizedToManageTeams(supabase: ReturnType<typeof createClient>, userId: string, classId: string): Promise<boolean> {
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

export async function addTeamMemberAction(teamId: string, studentId: string): Promise<ActionResponse> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to add team members." };
  }

  // Get classId from teamId to check authorization
  const { data: teamData, error: teamFetchError } = await supabase
    .from("teams")
    .select("class_id")
    .eq("id", teamId)
    .single();

  if (teamFetchError || !teamData) {
    console.error("Error fetching team or team not found:", teamFetchError);
    return { error: "Team not found." };
  }

  const classId = teamData.class_id;

  if (!(await isAuthorizedToManageTeams(supabase, user.id, classId))) {
    return { error: "You are not authorized to manage members in this team." };
  }

  // Fetch all team_ids for the current class
  const { data: classTeams, error: classTeamsError } = await supabase
    .from("teams")
    .select("id")
    .eq("class_id", classId);

  if (classTeamsError) {
    console.error("Error fetching teams for class:", classTeamsError);
    return { error: "Failed to check for existing team membership." };
  }

  const classTeamIds = classTeams.map(team => team.id);

  const { data: existingTeamMember, error: existingMemberError } = await supabase
    .from("team_members")
    .select("id")
    .eq("user_id", studentId)
    .in("team_id", classTeamIds);

  if (existingMemberError) {
    console.error("Error checking for existing team member:", existingMemberError);
    return { error: "Failed to check for existing team membership." };
  }

  if (existingTeamMember && existingTeamMember.length > 0) {
    return { error: "Student is already in a team within this class." };
  }

  // Add student to the team
  const { error } = await supabase
    .from("team_members")
    .insert({
      team_id: teamId,
      user_id: studentId,
    });

  if (error) {
    console.error("Error adding team member:", error);
    return { error: "Failed to add team member." };
  }

  revalidatePath(`/instructor/classes/${classId}/teams/${teamId}`);
  revalidatePath(`/instructor/classes/${classId}`);

  return { data: undefined };
}

export async function removeTeamMemberAction(teamId: string, memberId: string): Promise<ActionResponse> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to remove team members." };
  }

  // Get classId from teamId to check authorization
  const { data: teamData, error: teamFetchError } = await supabase
    .from("teams")
    .select("class_id")
    .eq("id", teamId)
    .single();

  if (teamFetchError || !teamData) {
    console.error("Error fetching team or team not found:", teamFetchError);
    return { error: "Team not found." };
  }

  const classId = teamData.class_id;

  if (!(await isAuthorizedToManageTeams(supabase, user.id, classId))) {
    return { error: "You are not authorized to manage members in this team." };
  }

  // Remove member from the team
  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("team_id", teamId)
    .eq("user_id", memberId);

  if (error) {
    console.error("Error removing team member:", error);
    return { error: "Failed to remove team member." };
  }

  revalidatePath(`/instructor/classes/${classId}/teams/${teamId}`);
  revalidatePath(`/instructor/classes/${classId}`);

  return { data: undefined };
}

export async function moveTeamMemberAction(currentTeamId: string, newTeamId: string, memberId: string): Promise<ActionResponse> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { error: "You must be logged in to move team members." };
    }
  
    // Get classId from currentTeamId to check authorization
    const { data: currentTeamData, error: currentTeamFetchError } = await supabase
      .from("teams")
      .select("class_id")
      .eq("id", currentTeamId)
      .single();
  
    if (currentTeamFetchError || !currentTeamData) {
      console.error("Error fetching current team or team not found:", currentTeamFetchError);
      return { error: "Current team not found." };
    }
  
    const classId = currentTeamData.class_id;
  
    if (!(await isAuthorizedToManageTeams(supabase, user.id, classId))) {
      return { error: "You are not authorized to manage members in this class." };
    }
  
    // Verify new team belongs to the same class
    const { data: newTeamData, error: newTeamFetchError } = await supabase
      .from("teams")
      .select("class_id")
      .eq("id", newTeamId)
      .eq("class_id", classId) // Ensure same class
      .single();
  
    if (newTeamFetchError || !newTeamData) {
      console.error("Error fetching new team or team not found:", newTeamFetchError);
      return { error: "New team not found or does not belong to the same class." };
    }

    // Update the team_id for the member
    const { error } = await supabase
        .from("team_members")
        .update({ team_id: newTeamId })
        .eq("team_id", currentTeamId)
        .eq("user_id", memberId);

    if (error) {
        console.error("Error moving team member:", error);
        return { error: "Failed to move team member." };
    }

    revalidatePath(`/instructor/classes/${classId}/teams/${currentTeamId}`);
    revalidatePath(`/instructor/classes/${classId}/teams/${newTeamId}`);
    revalidatePath(`/instructor/classes/${classId}`);

    return { data: undefined };
}
