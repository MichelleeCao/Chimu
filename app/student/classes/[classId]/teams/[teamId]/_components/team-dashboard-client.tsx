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
    <div>
      <p>Loading...</p>
    </div>
  );
}
