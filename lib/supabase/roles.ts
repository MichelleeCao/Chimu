import { createClient } from "./server";

export async function getUserClassRoles(userId: string, classId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("class_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("class_id", classId);

  if (error) {
    console.error("Error fetching user class roles:", error);
    return [];
  }

  return data.map((row) => row.role);
}
