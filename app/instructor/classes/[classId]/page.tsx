import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toggleClassArchiveStatus } from "./actions";
import { toast } from "sonner";
import { deleteTeamAction } from "./teams/actions";
import { TablesWith } from "@/types/supabase";

interface ClassDetails extends TablesWith<'classes', { users: { name: string | null } | null }> {}
interface TeamDetails extends TablesWith<'teams', { team_members: { count: number }[] }> {}

export default async function ClassDetailsPage({ params }: { params: { classId: string } }) {
  const classId = params.classId;
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch class details
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select("*, users(name)") // Select class and created_by user's name
    .eq("id", classId)
    .single();

  if (classError || !classData) {
    console.error("Error fetching class details:", classError);
    return <p className="text-red-500">Error loading class details.</p>;
  }

  // Fetch teams for this class
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name, created_at, team_members(count)") // Select teams and count of members
    .eq("class_id", classId)
    .order("name", { ascending: true });

  if (teamsError) {
    console.error("Error fetching teams:", teamsError);
    return <p className="text-red-500">Error loading teams.</p>;
  }

  const handleToggleArchive = async (currentStatus: boolean) => {
    const result = await toggleClassArchiveStatus(classId, currentStatus);
    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Failed to update class status.");
    } else {
      toast.success(`Class ${currentStatus ? "unarchived" : "archived"} successfully!`);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    const result = await deleteTeamAction(classId, teamId);
    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Failed to delete team.");
    } else {
      toast.success("Team deleted successfully!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold">{(classData as ClassDetails).name} ({(classData as ClassDetails).quarter} {(classData as ClassDetails).year} - {(classData as ClassDetails).section})</h1>
            <p className="text-gray-600">Created by: {(classData as ClassDetails).users?.name || "Unknown"}</p>
            <p className="text-gray-600">Class Code: <Badge variant="secondary" className="font-mono text-base">{(classData as ClassDetails).class_code}</Badge></p>
            {(classData as ClassDetails).description && <p className="mt-2 text-gray-700">{(classData as ClassDetails).description}</p>}
          </div>
          <div className="flex items-center space-x-4">
            <form action={handleToggleArchive.bind(null, (classData as ClassDetails).archived)}>
              <Button variant="outline" type="submit">
                {(classData as ClassDetails).archived ? "Unarchive Class" : "Archive Class"}
              </Button>
            </form>
            {/* More actions like Edit Class, Manage Instructors/TAs */}
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-4">Teams</h2>
        <Button asChild className="mb-6">
          <Link href={`/instructor/classes/${classId}/teams/create`}>Create New Team</Link>
        </Button>

        {teams && teams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Card key={team.id}>
                <CardHeader>
                  <CardTitle>{team.name}</CardTitle>
                  <CardDescription>Members: {(team as TeamDetails).team_members.length || 0}</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Display more team info here */}
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <form action={handleDeleteTeam.bind(null, team.id)}>
                    <Button variant="destructive" type="submit" size="sm">
                      Delete
                    </Button>
                  </form>
                  <Button variant="outline" asChild>
                    <Link href={`/instructor/classes/${classId}/teams/${team.id}`}>Manage Team</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600">No teams created for this class yet. Click "Create New Team" to get started!</p>
        )}
      </div>
    </div>
  );
}
