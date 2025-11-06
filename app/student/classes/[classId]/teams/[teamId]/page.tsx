"use client";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ClipboardCopyIcon } from "@radix-ui/react-icons";
import { signTeamAgreementAction } from "../agreement/create/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
  const router = useRouter();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
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

  // Organize icebreaker responses by user and question
  const organizedIcebreakers = icebreakerResponses?.reduce((acc: any, response: any) => {
    if (!acc[response.user_id]) {
      acc[response.user_id] = { user: members.find(m => m.id === response.user_id), responses: [] };
    }
    acc[response.user_id].responses.push({
      question: response.icebreaker_questions?.question_text,
      answer: response.answer,
    });
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold">Team: {teamData.name}</h1>
            <p className="text-gray-600">Class: {teamData.classes?.name} ({teamData.classes?.quarter} {teamData.classes?.year} - {teamData.classes?.section})</p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/student/dashboard`}>Back to Dashboard</Link>
          </Button>
        </div>

        {/* Conditional rendering for pending items (Surveys, Team Agreement, Icebreakers) */}
        {/* <div className="mb-6 flex gap-4"> */}
          {/* {hasPendingSurvey && <Badge variant="destructive">Pending Survey</Badge>} */}
          {/* {hasPendingAgreement && <Badge variant="destructive">Pending Agreement</Badge>} */}
          {/* {hasPendingIcebreakers && <Badge variant="destructive">Pending Icebreakers</Badge>} */}
        {/* </div> */}

        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="surveys">Survey Results</TabsTrigger>
            <TabsTrigger value="agreement">Team Agreement</TabsTrigger>
            <TabsTrigger value="icebreakers">Icebreakers</TabsTrigger>
          </TabsList>
          <TabsContent value="members" className="mt-6">
            <h2 className="text-3xl font-bold mb-4">Team Members</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {members.map((member) => (
                <Card key={member.id} className="flex items-center space-x-4 p-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.avatar_url || "/avatars/01.png"} alt={member.name || "User Avatar"} />
                    <AvatarFallback>{member.name ? member.name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{member.name}</CardTitle>
                    <CardDescription className="flex items-center group">
                      <span>{member.email}</span>
                      {member.email && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                          navigator.clipboard.writeText(member.email || "");
                          toast.success("Email copied!");
                        }}>
                          <ClipboardCopyIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </CardDescription>
                    {member.phone && (
                      <CardDescription className="flex items-center group">
                        <span>{member.phone}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                          navigator.clipboard.writeText(member.phone || "");
                          toast.success("Phone copied!");
                        }}>
                          <ClipboardCopyIcon className="h-4 w-4" />
                        </Button>
                      </CardDescription>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="surveys" className="mt-6">
            <h2 className="text-3xl font-bold mb-4">Survey Results</h2>
            {surveys.length === 0 ? (
              <p>No surveys available for this class yet.</p>
            ) : (
              <div className="space-y-6">
                {surveys.map(survey => (
                  <Card key={survey.id}>
                    <CardHeader>
                      <CardTitle>Survey - {new Date(survey.responses?.[0]?.timestamp || '').toLocaleDateString()}</CardTitle>
                      <CardDescription>Status: {survey.responses?.some(res => res.user_id === user.id) ? "Completed" : "Pending"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2 font-semibold">Your Responses:</p>
                      {survey.responses?.find(res => res.user_id === user.id)?.answers ? (
                        <ul>
                          {(survey.questions as any[]).map((q: any, qIdx: number) => (
                            <li key={qIdx}>{q.question_text}: {(survey.responses?.find(res => res.user_id === user.id)?.answers as any[])[qIdx]}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>You have not responded to this survey yet.</p>
                      )}

                      <p className="mt-4 mb-2 font-semibold">Team Aggregate (Anonymous):</p>
                      {/* Placeholder for Recharts components */}
                      <div className="h-48 w-full bg-gray-200 flex items-center justify-center rounded-md text-gray-500">Chart Placeholder</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="agreement" className="mt-6">
            <h2 className="text-3xl font-bold mb-4">Team Agreement</h2>
            {teamAgreement ? (
              <Card>
                <CardHeader>
                  <CardTitle>Current Team Agreement</CardTitle>
                  <CardDescription>Status: {hasSignedAgreement ? <Badge>Signed</Badge> : <Badge variant="destructive">Pending Your Signature</Badge>}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: teamAgreement.content }}></div>
                  <div className="mt-4 flex space-x-2">
                    {!hasSignedAgreement && !teamAgreement.locked && (
                      <form action={async () => {
                        const result = await signTeamAgreementAction(classId, teamId, teamAgreement.id);
                        if (result.error) {
                          toast.error(typeof result.error === "string" ? result.error : "Failed to sign team agreement.");
                        } else {
                          toast.success("Team agreement signed successfully!");
                          router.refresh();
                        }
                      }}>
                        <Button type="submit">Sign Agreement</Button>
                      </form>
                    )}
                    {!teamAgreement.locked && (
                      <Button asChild variant="outline">
                        <Link href={`/student/classes/${classId}/teams/${teamId}/agreement/create`}>Edit Agreement</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center">
                <p className="mb-4">No team agreement has been created yet.</p>
                <Button asChild>
                  <Link href={`/student/classes/${classId}/teams/${teamId}/agreement/create`}>Create New Agreement</Link>
                </Button>
              </div>
            )}
          </TabsContent>
          <TabsContent value="icebreakers" className="mt-6">
            <h2 className="text-3xl font-bold mb-4">Icebreaker Responses</h2>
            {Object.keys(organizedIcebreakers).length === 0 ? (
              <p>No icebreaker responses available for this team yet.</p>
            ) : (
              <div className="space-y-6">
                {Object.values(organizedIcebreakers).map((userData: any) => (
                  <Card key={userData.user.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={userData.user.avatar_url || "/avatars/01.png"} alt={userData.user.name || "User Avatar"} />
                          <AvatarFallback>{userData.user.name ? userData.user.name.charAt(0).toUpperCase() : "U"}</AvatarFallback>
                        </Avatar>
                        <span>{userData.user.name || "Unknown User"}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-2">
                        {userData.responses.map((res: any, idx: number) => (
                          <li key={idx}>
                            <p className="font-semibold">Q: {res.question}</p>
                            <p>A: {res.answer}</p>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
