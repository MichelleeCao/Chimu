"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { toast } from "sonner";
import { createStudentTeamAction } from "./actions";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

export const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(100, "Team name must be at most 100 characters"),
});

type CreateTeamFormValues = z.infer<typeof createTeamSchema>;

export default function CreateStudentTeamPage({ params }: { params: { classId: string } }) {
  const classId = params.classId;
  const router = useRouter();
  const form = useForm<CreateTeamFormValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = async (values: CreateTeamFormValues) => {
    const result = await createStudentTeamAction(classId, values);

    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Failed to create team. Please check your inputs.");
    } else {
      toast.success("Team created successfully!");
      router.push(`/student/classes/${classId}/teams/${result.data?.teamId}`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-3xl font-bold">Create New Team</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Team Alpha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>Create Team</Button>
          </form>
        </Form>
        <p className="mt-4 text-center text-sm">
          <Link href={`/student/classes/${classId}/teams`} className="text-blue-500 hover:underline">
            Back to Browse Teams
          </Link>
        </p>
      </div>
    </div>
  );
}
