"use server";

import { createClient } from "@/lib/supabase/server";
import { type ActionResponse } from "@/types/actions";
import { revalidatePath } from "next/cache";

export async function joinClassAction(classCode: string): Promise<ActionResponse<{ classId: string }>> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to join a class." };
  }

  // Find the class by class code
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("id")
    .eq("class_code", classCode)
    .eq("archived", false) // Only allow joining active classes
    .single();

  if (classError || !classData) {
    console.error("Error fetching class by code or class not found:", classError);
    return { error: "Invalid class code or class is not active." };
  }

  // Check if student is already in this class
  const { data: existingRole, error: roleError } = await supabase
    .from("class_roles")
    .select("id")
    .eq("class_id", classData.id)
    .eq("user_id", user.id)
    .single();

  if (existingRole) {
    return { error: "You are already enrolled in this class." };
  }

  // Enroll student in the class with 'student' role
  const { error: insertRoleError } = await supabase
    .from("class_roles")
    .insert({
      class_id: classData.id,
      user_id: user.id,
      role: "student",
    });

  if (insertRoleError) {
    console.error("Error enrolling student in class:", insertRoleError);
    return { error: "Failed to enroll in class." };
  }

  revalidatePath("/student/dashboard"); // Revalidate student dashboard

  return { data: { classId: classData.id } };
}
