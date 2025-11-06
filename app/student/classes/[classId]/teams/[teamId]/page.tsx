import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import type { TablesWith } from "@/types/supabase";
import { TeamDashboardClient } from "./_components/team-dashboard-client";

interface TeamMemberDetails {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export default async function StudentTeamDashboardPage({ params }: { params: { classId: string; teamId: string } }) {
  const classId = params.classId;
  const teamId = params.teamId;
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Verify user is a member of this team in this class
  const { data: roleData, error: roleError } = await supabase
    .from("class_roles")
    .select("role, team_id")
    .eq("class_id", classId)
    .eq("user_id", user.id)
    .eq("role", "student")
    .single();

  if (roleError || !roleData || roleData.team_id !== teamId) {
    console.error("Error checking user role or user is not a student in this team:", roleError);
    redirect(`/student/classes/${classId}/teams`); // Redirect if not authorized or not in this team
  }

  // Fetch team details
  const { data: teamData, error: teamError } = await supabase
    .from("teams")
    .select("id, name, classes(name, quarter, year, section)")
    .eq("id", teamId)
    .eq("class_id", classId)
    .single();

  if (teamError || !teamData) {
    console.error("Error fetching team details:", teamError);
    return <p className="text-red-500">Error loading team details.</p>;
  }

  // Fetch team members
  const { data: teamMembers, error: membersError } = await supabase
    .from("team_members")
    .select(`
      user_id,
      users (id, name, email, phone, user_metadata)
    `)
    .eq("team_id", teamId);

  if (membersError) {
    console.error("Error fetching team members:", membersError);
    return <p className="text-red-500">Error loading team members.</p>;
  }

  const members: TeamMemberDetails[] = (teamMembers || []).map((member: any) => {
    const userMetadata = member.users?.user_metadata || {};
    return {
      id: member.user_id,
      name: member.users?.name || userMetadata.name || member.users?.email,
      email: member.users?.email,
      phone: member.users?.phone || userMetadata.phone,
      avatar_url: userMetadata.avatar_url ? supabase.storage.from('profile_photos').getPublicUrl(userMetadata.avatar_url).data.publicUrl : null,
    };
  });

  // Fetch team agreement and signatures
  const { data: teamAgreement, error: agreementError } = await supabase
    .from("team_agreements")
    .select(`
      id,
      content,
      agreement_signatures(user_id),
      locked
    `)
    .eq("team_id", teamId)
    .order("created_date", { ascending: false })
    .limit(1)
    .single();

  if (agreementError && agreementError.code !== 'PGRST116') {
    console.error("Error fetching team agreement:", agreementError);
    return <p className="text-red-500">Error loading team agreement.</p>;
  }

  const hasSignedAgreement = teamAgreement?.agreement_signatures?.some(sig => sig.user_id === user.id);

  // Fetch surveys and responses for this team
  const { data: surveys, error: surveysError } = await supabase
    .from("surveys")
    .select(`
      id,
      questions,
      responses!responses_survey_id_fkey(user_id, answers, timestamp)
    `)
    .eq("class_id", classId) // Only surveys for this class
    .order("sent_date", { ascending: false });

  if (surveysError) {
    console.error("Error fetching surveys:", surveysError);
    return <p className="text-red-500">Error loading surveys.</p>;
  }

  // Fetch icebreaker questions and responses for this team
  const { data: icebreakerResponses, error: icebreakerError } = await supabase
    .from("icebreaker_responses")
    .select(`
      user_id,
      answer,
      icebreaker_questions(id, question_text, category)
    `)
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });

  if (icebreakerError) {
    console.error("Error fetching icebreaker responses:", icebreakerError);
    return <p className="text-red-500">Error loading icebreaker responses.</p>;
  }

  return (
    <TeamDashboardClient
      classId={classId}
      teamId={teamId}
      teamData={teamData}
      members={members}
      teamAgreement={teamAgreement}
      surveys={surveys || []}
      icebreakerResponses={icebreakerResponses || []}
      hasSignedAgreement={hasSignedAgreement || false}
      userId={user.id}
    />
  );
}
