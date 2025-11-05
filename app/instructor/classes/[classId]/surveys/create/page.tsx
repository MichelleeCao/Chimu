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
import { createSurveyAction } from "./actions";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";

const defaultSurveyQuestions = [
  { question_text: "Members provide timely response to communications", type: "likert" },
  { question_text: "Members are present at scheduled meetings", type: "likert" },
  { question_text: "Members have equitable workload distribution", type: "likert" },
  { question_text: "Our team has good morale and energy", type: "likert" },
  { question_text: "Our team is making good progress on our project", type: "likert" },
];

const createSurveySchema = z.object({
  releaseDate: z.date({
    required_error: "A release date is required.",
  }),
  dueDate: z.date({
    required_error: "A due date is required.",
  }),
  questions: z.array(z.object({
    question_text: z.string().min(1),
    type: z.literal("likert"),
  })),
});

type CreateSurveyFormValues = z.infer<typeof createSurveySchema>;

export default function CreateSurveyPage({ params }: { params: { classId: string } }) {
  const classId = params.classId;
  const router = useRouter();
  const form = useForm<CreateSurveyFormValues>({
    resolver: zodResolver(createSurveySchema),
    defaultValues: {
      releaseDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Default to 7 days from now
      questions: defaultSurveyQuestions,
    },
  });

  const onSubmit = async (values: CreateSurveyFormValues) => {
    const result = await createSurveyAction(classId, values);

    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Failed to create survey. Please check your inputs.");
    } else {
      toast.success("Survey created successfully!");
      router.push(`/instructor/classes/${classId}/surveys`); // Redirect to surveys list page
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-3xl font-bold">Create New Survey</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="releaseDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Release Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel>Survey Questions</FormLabel>
              <FormDescription className="mb-4">These are the standard questions for the pulse survey and cannot be edited.</FormDescription>
              <div className="space-y-4">
                {defaultSurveyQuestions.map((q, index) => (
                  <Card key={index} className="p-4">
                    <p className="font-semibold">Question {index + 1}:</p>
                    <p>{q.question_text}</p>
                    <p className="text-sm text-gray-600">Type: Likert Scale</p>
                  </Card>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>Create Survey</Button>
          </form>
        </Form>
        <p className="mt-4 text-center text-sm">
          <Link href={`/instructor/classes/${classId}/dashboard`} className="text-blue-500 hover:underline">
            Back to Class Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
