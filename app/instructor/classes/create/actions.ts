"use server";

import { createClient } from "@/lib/supabase/server";
import { type ActionResponse } from "@/types/actions";
import { createClassSchema } from "./schema";
import { z } from "zod";

// Helper to generate a unique alphanumeric class code
function generateClassCode(length: number = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createClassAction(values: z.infer<typeof createClassSchema>): Promise<ActionResponse<{ classId: string; classCode: string }>> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to create a class." };
  }

  const validatedFields = createClassSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, quarter, section, year, description, max_team_size, instructorEmails, taEmails } = validatedFields.data;

  let classCode = generateClassCode();
  let isUnique = false;
  while (!isUnique) {
    const { data, error } = await supabase
      .from("classes")
      .select("class_code")
      .eq("class_code", classCode)
      .single();
    
    if (error && error.code === 'PGRST116') {
        isUnique = true;
    } else if (data) {
        classCode = generateClassCode();
    } else if (error) {
        console.error("Error checking class code uniqueness:", error);
        return { error: "Failed to generate a unique class code." };
    }
  }

  const { data: newClass, error: insertError } = await supabase
    .from("classes")
    .insert({
      name,
      quarter,
      section,
      year,
      description,
      max_team_size,
      class_code: classCode,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Error creating class:", insertError);
    return { error: "Failed to create class." };
  }

  // Assign the instructor role to the creator
  const { error: creatorRoleError } = await supabase
    .from("class_roles")
    .insert({
      class_id: newClass.id,
      user_id: user.id,
      role: "instructor",
    });

  if (creatorRoleError) {
    console.error("Error assigning creator instructor role:", creatorRoleError);
    return { error: "Failed to assign instructor role to creator." };
  }

  // Handle co-instructor invitations
  for (const email of instructorEmails || []) {
    // In a real application, you'd send an email invitation here
    // For now, we'll just log and potentially create a placeholder user or role
    console.log(`Inviting co-instructor: ${email} to class ${newClass.id}`);

    // Check if user exists
    const { data: existingUser, error: fetchUserError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    let invitedUserId: string;

    if (fetchUserError && fetchUserError.code === 'PGRST116') { // User not found
      // Create a new user (or send an actual invitation email)
      const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      });

      if (signUpError) {
        console.error(`Error creating user for instructor invitation ${email}:`, signUpError);
        // Continue to next email or return error
        continue; 
      }
      invitedUserId = newUser.user.id;
    } else if (existingUser) { // User found
      invitedUserId = existingUser.id;
    } else if (fetchUserError) {
      console.error(`Error fetching user for instructor invitation ${email}:`, fetchUserError);
      continue;
    } else {
        return { error: "Failed to invite co-instructor. User already exists." };
    }

    // Assign instructor role
    const { error: assignRoleError } = await supabase
      .from("class_roles")
      .insert({
        class_id: newClass.id,
        user_id: invitedUserId,
        role: "instructor",
      });
    
    if (assignRoleError) {
        console.error(`Error assigning instructor role to ${email}:`, assignRoleError);
        // Continue to next email or return error
        continue;
    }
  }

  // Handle TA invitations (similar logic as instructors)
  for (const email of taEmails || []) {
    console.log(`Inviting TA: ${email} to class ${newClass.id}`);

    const { data: existingUser, error: fetchUserError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    let invitedUserId: string;

    if (fetchUserError && fetchUserError.code === 'PGRST116') { // User not found
        const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
            email,
            email_confirm: true,
        });

        if (signUpError) {
            console.error(`Error creating user for TA invitation ${email}:`, signUpError);
            continue;
        }
        invitedUserId = newUser.user.id;
    } else if (existingUser) { // User found
        invitedUserId = existingUser.id;
    } else if (fetchUserError) {
        console.error(`Error fetching user for TA invitation ${email}:`, fetchUserError);
        continue;
    } else {
        return { error: "Failed to invite TA. User already exists." };
    }

    const { error: assignRoleError } = await supabase
      .from("class_roles")
      .insert({
        class_id: newClass.id,
        user_id: invitedUserId,
        role: "TA",
      });

    if (assignRoleError) {
        console.error(`Error assigning TA role to ${email}:`, assignRoleError);
        continue;
    }
  }

  return { data: { classId: newClass.id, classCode } };
}
