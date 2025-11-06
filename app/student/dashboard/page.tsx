import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { EnrolledClass } from "@/types/supabase";

export default async function StudentDashboardPage({ searchParams }: { searchParams: { status?: string } }) {
  const supabase = createClient();
  const router = useRouter();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  const filterStatus = searchParams.status || "active"; // Default to active

  let enrolledClassesQuery = supabase
    .from("class_roles")
    .select(`
      class_id,
      classes (id, name, quarter, section, year, archived),
      teams!team_members_team_id_fkey(id, name),
      surveys:surveys!class_roles_class_id_fkey(
        id,
        questions,
        responses!responses_survey_id_fkey(id, user_id)
      ),
      team_agreements:team_agreements!class_roles_class_id_fkey(
        id,
        agreement_signatures!agreement_signatures_agreement_id_fkey(id, user_id)
      ),
      icebreaker_questions:icebreaker_questions!class_roles_class_id_fkey(
        id,
        icebreaker_responses!icebreaker_responses_question_id_fkey(id, user_id)
      )
    `)
    .eq("user_id", user.id)
    .eq("role", "student")
    .eq("active", true);

  if (filterStatus === "active") {
    enrolledClassesQuery = enrolledClassesQuery.eq("classes.archived", false);
  } else if (filterStatus === "archived") {
    enrolledClassesQuery = enrolledClassesQuery.eq("classes.archived", true);
  }

  const { data: rawEnrolledClasses, error } = await enrolledClassesQuery.order("created_at", { foreignTable: "classes", ascending: false });

  if (error) {
    console.error("Error fetching enrolled classes:", error);
    return <p className="text-red-500">Error loading enrolled classes.</p>;
  }

  const enrolledClasses: EnrolledClass[] = rawEnrolledClasses || [];

  // Calculate pending items
  let totalPendingSurveys = 0;
  let totalPendingIcebreakers = 0;
  let totalPendingAgreements = 0;

  const classesWithPending = enrolledClasses.map(enrollment => {
    const classId = enrollment.class_id;
    const teamId = enrollment.teams?.[0]?.id;

    const pendingSurveys = (enrollment.surveys || []).filter(survey => {
      const hasResponded = survey.responses?.some(response => response.user_id === user.id);
      return !hasResponded;
    }).length;

    const pendingIcebreakers = (enrollment.icebreaker_questions || []).filter(question => {
      const hasResponded = question.icebreaker_responses?.some(response => response.user_id === user.id);
      return !hasResponded;
    }).length;

    const pendingAgreements = (enrollment.team_agreements || []).filter(agreement => {
      const hasSigned = agreement.agreement_signatures?.some(signature => signature.user_id === user.id);
      return !hasSigned;
    }).length;

    totalPendingSurveys += pendingSurveys;
    totalPendingIcebreakers += pendingIcebreakers;
    totalPendingAgreements += pendingAgreements;

    return {
      ...enrollment,
      pendingSurveys,
      pendingIcebreakers,
      pendingAgreements,
    };
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto py-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Student Dashboard</h1>
            <p className="text-base md:text-lg text-gray-700">
              You have:
              {totalPendingSurveys > 0 && <span className="ml-2 text-red-600">{totalPendingSurveys} pending surveys</span>}
              {totalPendingIcebreakers > 0 && <span className="ml-2 text-red-600">{totalPendingIcebreakers} pending icebreakers</span>}
              {totalPendingAgreements > 0 && <span className="ml-2 text-red-600">{totalPendingAgreements} pending team agreements</span>}
              {(totalPendingSurveys + totalPendingIcebreakers + totalPendingAgreements === 0) && <span className="ml-2 text-green-600">No pending items!</span>}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full md:w-auto mt-4 md:mt-0">
            <Select value={filterStatus} onValueChange={(value) => {
              const newSearchParams = new URLSearchParams(searchParams as Record<string, string>);
              newSearchParams.set("status", value);
              router.push(`/student/dashboard?${newSearchParams.toString()}`);
            }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active Classes</SelectItem>
                <SelectItem value="archived">Archived Classes</SelectItem>
                <SelectItem value="all">All Classes</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/student/join-class">Join New Class</Link>
            </Button>
          </div>
        </div>

        {classesWithPending && classesWithPending.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classesWithPending.map((enrollment) => (
              <Card key={enrollment.class_id}>
                <CardHeader>
                  <CardTitle>{enrollment.classes?.name}</CardTitle>
                  <CardDescription>
                    {enrollment.classes?.quarter} {enrollment.classes?.year} - {enrollment.classes?.section}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">
                    Team: {enrollment.teams && enrollment.teams.length > 0 ? enrollment.teams[0]?.name : "Not assigned"}
                  </p>
                  {enrollment.classes?.archived && (
                    <Badge variant="secondary" className="mt-2">Archived</Badge>
                  )}
                  <div className="mt-2 space-y-1">
                    {enrollment.pendingSurveys > 0 && (
                      <p className="text-sm text-red-600">{enrollment.pendingSurveys} Pending Survey{enrollment.pendingSurveys > 1 ? "s" : ""}</p>
                    )}
                    {enrollment.pendingIcebreakers > 0 && (
                      <p className="text-sm text-red-600">{enrollment.pendingIcebreakers} Pending Icebreaker{enrollment.pendingIcebreakers > 1 ? "s" : ""}</p>
                    )}
                    {enrollment.pendingAgreements > 0 && (
                      <p className="text-sm text-red-600">{enrollment.pendingAgreements} Pending Team Agreement{enrollment.pendingAgreements > 1 ? "s" : ""}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  {enrollment.teams && enrollment.teams.length > 0 ? (
                    <Button asChild>
                      <Link href={`/student/classes/${enrollment.class_id}/teams/${enrollment.teams[0]?.id}`}>Go to Team</Link>
                    </Button>
                  ) : (enrollment.classes && !enrollment.classes.archived) ? (
                    <Button asChild variant="outline">
                      <Link href={`/student/classes/${enrollment.class_id}/teams`}>Browse Teams</Link>
                    </Button>
                  ) : (
                    <Button disabled variant="outline">Class Archived</Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-600">You are not enrolled in any classes yet. Click "Join New Class" to get started!</p>
        )}
      </div>
    </div>
  );
}
