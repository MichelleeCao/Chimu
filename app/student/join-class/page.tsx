"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { joinClassAction } from "./actions";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

const joinClassSchema = z.object({
  classCode: z.string().min(1, "Class code is required").max(12, "Class code must be at most 12 characters"),
});

type JoinClassFormValues = z.infer<typeof joinClassSchema>;

export default function JoinClassPage() {
  const router = useRouter();
  const form = useForm<JoinClassFormValues>({
    resolver: zodResolver(joinClassSchema),
    defaultValues: {
      classCode: "",
    },
  });

  const onSubmit = async (values: JoinClassFormValues) => {
    const result = await joinClassAction(values.classCode);

    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Failed to join class. Please check your class code.");
    } else {
      toast.success("Successfully joined class!");
      router.push(`/student/dashboard`); // Redirect to student dashboard after joining
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-3xl font-bold">Join Class</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="classCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter class code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>Join Class</Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
