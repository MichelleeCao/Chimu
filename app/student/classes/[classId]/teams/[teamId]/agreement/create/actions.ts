"use server";

import { createClient } from "@/lib/supabase/server";
import { type ActionResponse } from "@/types/actions";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { teamAgreementSchema } from "./schema";

async function isAuthorizedToManageAgreement(supabase: ReturnType<typeof createClient>, userId: string, classId: string, teamId: string): Promise<boolean> {
  // For students, they must be in the team to manage the agreement
  const { data: teamMemberData, error: teamMemberError } = await supabase
    .from("team_members")
    .select("*")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .single();

  if (teamMemberError || !teamMemberData) {
    // Also allow instructors/TAs to manage agreements in their classes
    const { data: roleData, error: roleError } = await supabase
      .from("class_roles")
      .select("role")
      .eq("class_id", classId)
      .eq("user_id", userId)
      .in("role", ["instructor", "TA"]);

    if (roleError || !roleData || roleData.length === 0) {
      console.error("Authorization check failed:", teamMemberError || roleError);
      return false;
    }
  }
  return true;
}

export async function createUpdateTeamAgreementAction(
  classId: string,
  teamId: string,
  agreementId: string | null,
  values: z.infer<typeof teamAgreementSchema>
): Promise<ActionResponse<{ agreementId: string }>> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to create/update a team agreement." };
  }

  if (!(await isAuthorizedToManageAgreement(supabase, user.id, classId, teamId))) {
    return { error: "You are not authorized to manage team agreements for this team." };
  }

  const validatedFields = teamAgreementSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { content } = validatedFields.data;

  if (agreementId) {
    // Check if the existing agreement is locked
    const { data: existingAgreement, error: fetchAgreementError } = await supabase
      .from("team_agreements")
      .select("locked")
      .eq("id", agreementId)
      .single();

    if (fetchAgreementError || existingAgreement?.locked) {
      return { error: "This agreement is locked and cannot be updated." };
    }

    // Update existing agreement
    const { data, error: updateError } = await supabase
      .from("team_agreements")
      .update({ content, updated_at: new Date().toISOString() })
      .eq("id", agreementId)
      .select("id")
      .single();

    if (updateError) {
      console.error("Error updating team agreement:", updateError);
      return { error: "Failed to update team agreement." };
    }
    revalidatePath(`/student/classes/${classId}/teams/${teamId}/agreement/create`);
    revalidatePath(`/student/classes/${classId}/teams/${teamId}`);
    return { data: { agreementId: data.id } };
  } else {
    // Create new agreement
    const { data, error: insertError } = await supabase
      .from("team_agreements")
      .insert({
        team_id: teamId,
        content,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error creating team agreement:", insertError);
      return { error: "Failed to create team agreement." };
    }

    // Automatically sign the agreement for the creator
    const { error: signError } = await supabase
      .from("agreement_signatures")
      .insert({
        agreement_id: data.id,
        user_id: user.id,
      });

    if (signError) {
      console.error("Error auto-signing agreement for creator:", signError);
      // Don't block creation, but log the error
    }

    revalidatePath(`/student/classes/${classId}/teams/${teamId}/agreement/create`);
    revalidatePath(`/student/classes/${classId}/teams/${teamId}`);
    return { data: { agreementId: data.id } };
  }
}

export async function signTeamAgreementAction(classId: string, teamId: string, agreementId: string): Promise<ActionResponse> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to sign a team agreement." };
  }

  if (!(await isAuthorizedToManageAgreement(supabase, user.id, classId, teamId))) {
    return { error: "You are not authorized to sign team agreements for this team." };
  }

  // Check if already signed
  const { data: existingSignature, error: signatureError } = await supabase
    .from("agreement_signatures")
    .select("id")
    .eq("agreement_id", agreementId)
    .eq("user_id", user.id)
    .single();

  if (existingSignature) {
    return { error: "You have already signed this agreement." };
  }

  const { error: insertError } = await supabase
    .from("agreement_signatures")
    .insert({
      agreement_id: agreementId,
      user_id: user.id,
    });

  if (insertError) {
    console.error("Error signing team agreement:", insertError);
    return { error: "Failed to sign team agreement." };
  }

  revalidatePath(`/student/classes/${classId}/teams/${teamId}/agreement/create`);
  revalidatePath(`/student/classes/${classId}/teams/${teamId}`);

  return { data: undefined };
}
