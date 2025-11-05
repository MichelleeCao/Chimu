"use server";

import { createClient } from "@/lib/supabase/server";
import { type ActionResponse } from "@/types/actions";
import { revalidatePath } from "next/cache";

export async function toggleClassArchiveStatus(classId: string, currentStatus: boolean): Promise<ActionResponse> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to archive classes." };
  }

  // Verify that the user is an instructor for this class
  const { data: roleData, error: roleError } = await supabase
    .from("class_roles")
    .select("role")
    .eq("class_id", classId)
    .eq("user_id", user.id)
    .eq("role", "instructor")
    .single();

  if (roleError || !roleData) {
    console.error("Error checking instructor role or user is not instructor:", roleError);
    return { error: "You are not authorized to archive this class." };
  }

  const { error } = await supabase
    .from("classes")
    .update({ archived: !currentStatus, updated_at: new Date().toISOString() })
    .eq("id", classId)
    .eq("created_by", user.id); // Ensure only the creator can archive/unarchive

  if (error) {
    console.error("Error toggling class archive status:", error);
    return { error: "Failed to update class archive status." };
  }

  revalidatePath("/instructor/dashboard"); // Revalidate the dashboard to show updated status
  revalidatePath(`/instructor/classes/${classId}`); // Revalidate the class details page

  return { data: undefined };
}
