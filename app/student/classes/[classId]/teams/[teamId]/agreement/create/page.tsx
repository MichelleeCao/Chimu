"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css"; // Import Quill styles
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { createUpdateTeamAgreementAction, signTeamAgreementAction } from "./actions";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

const teamAgreementSchema = z.object({
  content: z.string().min(10, "Agreement content must be at least 10 characters."),
});

type TeamAgreementFormValues = z.infer<typeof teamAgreementSchema>;

export default function CreateEditTeamAgreementPage({ params }: { params: { classId: string; teamId: string } }) {
  const classId = params.classId;
  const teamId = params.teamId;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [agreementExists, setAgreementExists] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [agreementId, setAgreementId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const form = useForm<TeamAgreementFormValues>({
    resolver: zodResolver(teamAgreementSchema),
    defaultValues: {
      content: "",
    },
  });

  useEffect(() => {
    async function fetchAgreementData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch existing agreement
      const { data: agreementData, error: agreementError } = await supabase
        .from("team_agreements")
        .select(`
          id, content, locked,
          agreement_signatures(user_id)
        `)
        .eq("team_id", teamId)
        .order("created_date", { ascending: false })
        .limit(1)
        .single();

      if (agreementError && agreementError.code !== 'PGRST116') {
        console.error("Error fetching team agreement:", agreementError);
        toast.error("Error loading team agreement.");
        setLoading(false);
        return;
      }

      if (agreementData) {
        setAgreementExists(true);
        setAgreementId(agreementData.id);
        form.reset({ content: agreementData.content });
        setIsLocked(agreementData.locked);
        setHasSigned(agreementData.agreement_signatures?.some(sig => sig.user_id === user.id) || false);
      }
      setLoading(false);
    }

    fetchAgreementData();
  }, [teamId, supabase, router, form]);

  const onSubmit = async (values: TeamAgreementFormValues) => {
    const result = await createUpdateTeamAgreementAction(classId, teamId, agreementId, values);

    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Failed to save team agreement.");
    } else {
      toast.success("Team agreement saved successfully!");
      setAgreementId(result.data?.agreementId || agreementId);
      setAgreementExists(true);
      // After saving, consider if it should automatically redirect or allow signing
      router.push(`/student/classes/${classId}/teams/${teamId}`);
    }
  };

  const handleSignAgreement = async () => {
    if (!agreementId) {
      toast.error("No agreement found to sign.");
      return;
    }
    const result = await signTeamAgreementAction(classId, teamId, agreementId);

    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Failed to sign team agreement.");
    } else {
      toast.success("Team agreement signed successfully!");
      setHasSigned(true);
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p>Loading team agreement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold">{agreementExists ? "Edit Team Agreement" : "Create Team Agreement"}</h1>
            <p className="text-gray-600">Class ID: {classId}, Team ID: {teamId}</p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/student/classes/${classId}/teams/${teamId}`}>Back to Team Dashboard</Link>
          </Button>
        </div>

        {isLocked && (
          <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded-md">
            <p className="font-semibold">This agreement is locked and cannot be edited.</p>
            {!hasSigned && (
                <p className="mt-2">You still need to sign this agreement.</p>
            )}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agreement Content</FormLabel>
                  <FormControl>
                    <ReactQuill
                      theme="snow"
                      value={field.value}
                      onChange={field.onChange}
                      readOnly={isLocked}
                      className="min-h-[300px] bg-white"
                    />
                  </FormControl>
                  <FormDescription>Outline your team's working agreements and expectations.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center space-x-4">
              <Button type="submit" disabled={form.formState.isSubmitting || isLocked}>
                {agreementExists ? "Update Agreement" : "Create Agreement"}
              </Button>
              {agreementExists && !hasSigned && !isLocked && (
                <Button type="button" variant="secondary" onClick={handleSignAgreement}>
                  Sign Agreement
                </Button>
              )}
              {agreementExists && hasSigned && (
                <Badge className="bg-green-500 hover:bg-green-500">You have signed this agreement</Badge>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
