import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { joinTeamAction } from "./actions";
import { Badge } from "@/components/ui/badge";

export default async function BrowseTeamsPage({ params }: { params: { classId: string } }) {
  const classId = params.classId;
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Verify user is a student in this class
  const { data: roleData, error: roleError } = await supabase
    .from("class_roles")
    .select("role, team_id")
    .eq("class_id", classId)
    .eq("user_id", user.id)
    .eq("role", "student")
    .single();

  if (roleError || !roleData) {
    console.error("Error checking user role or user is not a student in this class:", roleError);
    return <p className="text-red-500">You are not authorized to browse teams for this class.</p>;
  }

  // If the student is already in a team, redirect to their team dashboard
  if (roleData.team_id) {
    redirect(`/student/classes/${classId}/teams/${roleData.team_id}`);
  }

  // Fetch class details
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("id, name, quarter, year, section, max_team_size")
    .eq("id", classId)
    .single();

  if (classError || !classData) {
    console.error("Error fetching class details:", classError);
    return <p className="text-red-500">Error loading class details.</p>;
  }

  // Fetch all teams in this class with their member counts
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, team_members(count)")
    .eq("class_id", classId)
    .order("name", { ascending: true });

  if (teamsError) {
    console.error("Error fetching teams:", teamsError);
    return <p className="text-red-500">Error loading teams.</p>;
  }

  const handleJoinTeam = async (teamId: string) => {
    const result = await joinTeamAction(classId, teamId);
    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Failed to join team.");
    } else {
      toast.success("Successfully joined team!");
      // No explicit redirect here, as the page itself will redirect if roleData.team_id is updated
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold">Browse Teams for {classData.name}</h1>
            <p className="text-gray-600">{classData.quarter} {classData.year} - {classData.section}</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/student/dashboard">Back to Dashboard</Link>
          </Button>
        </div>

        <h2 className="text-3xl font-bold mb-4">Available Teams</h2>

        {teams && teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <CardTitle>{team.name}</CardTitle>
                  <CardDescription>
                    Members: {team.team_members.length || 0}
                    {classData.max_team_size && team.team_members.length >= classData.max_team_size && (
                      <Badge variant="destructive" className="ml-2">Full</Badge>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Optional: display team description or other info */}
                </CardContent>
                <CardFooter className="flex justify-end">
                  {classData.max_team_size && team.team_members.length >= classData.max_team_size ? (
                    <Button disabled>Team Full</Button>
                  ) : (
                    <form action={handleJoinTeam.bind(null, team.id)}>
                      <Button type="submit">Join Team</Button>
                    </form>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600">No teams available for this class yet.</p>
        )}

        <Button asChild className="mt-8">
          <Link href={`/student/classes/${classId}/teams/create`}>Create New Team</Link>
        </Button>
      </div>
    </div>
  );
}
