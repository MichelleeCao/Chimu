"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { toast } from "sonner";
import { createClassAction } from "./actions";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const createClassSchema = z.object({
  name: z.string().min(1, "Class name is required").max(100, "Class name must be at most 100 characters"),
  quarter: z.string().min(1, "Quarter is required").max(50, "Quarter must be at most 50 characters"),
  section: z.string().min(1, "Section is required").max(50, "Section must be at most 50 characters"),
  year: z.number().int().min(1900, "Invalid year").max(2100, "Invalid year"),
  description: z.string().max(500, "Description must be at most 500 characters").optional(),
  max_team_size: z.number().int().min(2, "Minimum team size is 2").max(20, "Maximum team size is 20").optional(),
  instructorEmails: z.array(z.string().email("Invalid email address")).optional().default([]),
  taEmails: z.array(z.string().email("Invalid email address")).optional().default([]),
});

type CreateClassFormValues = z.infer<typeof createClassSchema>;

export default function CreateClassPage() {
  const router = useRouter();
  const form = useForm<CreateClassFormValues>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      name: "",
      quarter: "",
      section: "",
      year: new Date().getFullYear(),
      description: "",
      max_team_size: 5,
      instructorEmails: [],
      taEmails: [],
    },
  });

  const onSubmit = async (values: CreateClassFormValues) => {
    const result = await createClassAction(values);

    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Failed to create class. Please check your inputs.");
    } else {
      toast.success("Class created successfully!");
      router.push(`/instructor/classes/${result.data?.classId}`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-3xl font-bold">Create New Class</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., CS101 - Introduction to Programming" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quarter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quarter</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Fall" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="section"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} onChange={event => field.onChange(+event.target.value)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A brief description of the class" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="max_team_size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Team Size (Optional, default 5)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} onChange={event => field.onChange(+event.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="instructorEmails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invite Co-Instructors (comma-separated emails)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="instructor1@example.com, instructor2@example.com" 
                      value={field.value?.join(", ") || ""}
                      onChange={(e) => field.onChange(e.target.value.split(",").map(email => email.trim()))}
                    />
                  </FormControl>
                  <FormDescription>Emails of co-instructors to invite to this class.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taEmails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invite TAs (comma-separated emails)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="ta1@example.com, ta2@example.com" 
                      value={field.value?.join(", ") || ""}
                      onChange={(e) => field.onChange(e.target.value.split(",").map(email => email.trim()))}
                    />
                  </FormControl>
                  <FormDescription>Emails of TAs to invite to this class.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>Create Class</Button>
          </form>
        </Form>
        <p className="mt-4 text-center text-sm">
          <Link href="/instructor/dashboard" className="text-blue-500 hover:underline">
            Back to Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
