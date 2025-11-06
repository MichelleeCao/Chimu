"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ClipboardCopyIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { signTeamAgreementAction } from "@/app/student/classes/[classId]/teams/[teamId]/agreement/create/actions";
import Link from "next/link";
import type { TablesWith } from "@/types/supabase";

interface TeamMemberDetails {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface SurveyQuestion {
  question_text: string;
  type: "likert";
}

interface TeamDashboardProps {
  classId: string;
  teamId: string;
  teamData: any; // Replace with specific type later
  members: TeamMemberDetails[];
  teamAgreement: any; // Replace with specific type later
  surveys: any[]; // Replace with specific type later
  icebreakerResponses: any[]; // Replace with specific type later
  hasSignedAgreement: boolean;
  userId: string;
}

export function TeamDashboardClient({
  classId,
  teamId,
  teamData,
  members,
  teamAgreement,
  surveys,
  icebreakerResponses,
  hasSignedAgreement,
  userId,
}: TeamDashboardProps) {
  const router = useRouter();
  const supabase = createClient();

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

  const handleSignAgreement = async (agreementId: string) => {
    const result = await signTeamAgreementAction(classId, teamId, agreementId);
    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Failed to sign team agreement.");
    } else {
      toast.success("Team agreement signed successfully!");
      router.refresh();
    }
  };

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
                      )}
                    </CardDescription>
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
                      <CardDescription>Status: {survey.responses?.some((res: any) => res.user_id === userId) ? "Completed" : "Pending"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2 font-semibold">Your Responses:</p>
                      {survey.responses?.find((res: any) => res.user_id === userId)?.answers ? (
                        <ul>
                          {(survey.questions as any[]).map((q: any, qIdx: number) => (
                            <li key={qIdx}>{q.question_text}: {(survey.responses?.find((res: any) => res.user_id === userId)?.answers as any[])[qIdx]}</li>
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
                      <form action={async () => handleSignAgreement(teamAgreement.id)}>
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
