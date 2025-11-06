import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { addTeamMemberAction, removeTeamMemberAction, moveTeamMemberAction } from "./actions";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default async function ManageTeamPage({ params }: { params: { classId: string; teamId: string } }) {
  const { classId, teamId } = params;
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Verify user is an instructor or TA for the class
  const { data: roleData, error: roleError } = await supabase
    .from("class_roles")
    .select("role")
    .eq("class_id", classId)
    .eq("user_id", user.id)
    .in("role", ["instructor", "TA"]);

  if (roleError || !roleData || roleData.length === 0) {
    console.error("Error checking user role or user is not instructor/TA:", roleError);
    return <p className="text-red-500">You are not authorized to manage teams in this class.</p>;
  }

  // Fetch team details
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id, name, class_id, classes!id(name, quarter, year, section)")
    .eq("id", teamId)
    .eq("class_id", classId)
    .single();

  if (teamError || !team) {
    console.error("Error fetching team details:", teamError);
    return <p className="text-red-500">Team not found or does not belong to this class.</p>;
  }

  // Fetch current team members
  const { data: teamMembers, error: teamMembersError } = await supabase
    .from("team_members")
    .select("*, users(id, name, email)")
    .eq("team_id", teamId);

  if (teamMembersError) {
    console.error("Error fetching team members:", teamMembersError);
    return <p className="text-red-500">Error loading team members.</p>;
  }

  // Fetch all students in the class who are not yet in a team or are in a different team
  const { data: availableStudents, error: availableStudentsError } = await supabase
    .from("class_roles")
    .select("user_id, users(id, name, email)")
    .eq("class_id", classId)
    .eq("role", "student");

  if (availableStudentsError) {
    console.error("Error fetching available students:", availableStudentsError);
    return <p className="text-red-500">Error loading available students.</p>;
  }

  const currentMemberIds = new Set(teamMembers.map(member => member.user_id));
  const studentsNotInTeam = availableStudents.filter(student => 
    student.users && !currentMemberIds.has(student.user_id)
  ).map(student => student.users);

  // Fetch all other teams in the same class for moving members
  const { data: otherTeams, error: otherTeamsError } = await supabase
    .from("teams")
    .select("id, name")
    .eq("class_id", classId)
    .neq("id", teamId); // Exclude the current team

  if (otherTeamsError) {
    console.error("Error fetching other teams:", otherTeamsError);
    return <p className="text-red-500">Error loading other teams.</p>;
  }

  const handleAddMember = async (studentId: string) => {
    const result = await addTeamMemberAction(teamId, studentId);
    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Failed to add member.");
    } else {
      toast.success("Member added successfully!");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    const result = await removeTeamMemberAction(teamId, memberId);
    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Failed to remove member.");
    } else {
      toast.success("Member removed successfully!");
    }
  };

  const handleMoveMember = async (memberId: string, newTeamId: string) => {
    if (!newTeamId) return;
    const result = await moveTeamMemberAction(teamId, newTeamId, memberId);
    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Failed to move member.");
    } else {
      toast.success("Member moved successfully!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold">Manage Team: {team.name}</h1>
            <p className="text-gray-600">Class: {team.classes?.name} ({team.classes?.quarter} {team.classes?.year} - {team.classes?.section})</p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/instructor/classes/${classId}`}>Back to Class</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-3xl font-bold mb-4">Current Members</h2>
            {teamMembers.length > 0 ? (
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <Card key={member.user_id} className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/avatars/01.png" alt={member.users?.name || "User"} />
                        <AvatarFallback>{member.users?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{member.users?.name || "Unknown User"}</CardTitle>
                        <CardDescription>{member.users?.email}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {otherTeams && otherTeams.length > 0 && (
                        <Select onValueChange={(newTeamId) => handleMoveMember(member.user_id, newTeamId)}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Move to team..." />
                          </SelectTrigger>
                          <SelectContent>
                            {otherTeams.map((otherTeam) => (
                              <SelectItem key={otherTeam.id} value={otherTeam.id}>{otherTeam.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <form action={handleRemoveMember.bind(null, member.user_id)}>
                        <Button variant="destructive" size="sm" type="submit">Remove</Button>
                      </form>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No members in this team yet.</p>
            )}
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-4">Add Members</h2>
            {studentsNotInTeam && studentsNotInTeam.length > 0 ? (
              <div className="space-y-4">
                {studentsNotInTeam.map((student) => (
                  <Card key={student?.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/avatars/01.png" alt={student?.name || "User"} />
                        <AvatarFallback>{student?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{student?.name || "Unknown User"}</CardTitle>
                        <CardDescription>{student?.email}</CardDescription>
                      </div>
                    </div>
                    <form action={handleAddMember.bind(null, student?.id || "")}>
                      <Button size="sm" type="submit">Add</Button>
                    </form>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No more students available to add to this team in this class.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
