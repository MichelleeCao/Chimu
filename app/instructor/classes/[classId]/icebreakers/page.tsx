"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircledIcon } from "@radix-ui/react-icons";
import { addIcebreakerQuestionAction, removeIcebreakerQuestionAction } from "./actions";
import { icebreakerQuestionSchema, type IcebreakerQuestionFormValues } from "./schema";

const defaultIcebreakerQuestions = [
  { question_text: "What is your favorite holiday tradition?", category: "fun facts" },
  { question_text: "What is a skill or talent you have that you are proud of?", category: "fun facts" },
  { question_text: "What do you love most about the city or town you are from?", category: "fun facts" },
  { question_text: "What is something you bought or received recently that made you happy?", category: "fun facts" },
  { question_text: "What is something people wouldn’t guess about you?", category: "fun facts" },
  { question_text: "If you could swap roles or lives with anyone for one day, who would it be?", category: "fun facts" },
  { question_text: "Do you prefer to work in the morning or evenings?", category: "work styles" },
  { question_text: "What role do you typically like to have on a team? (Example: leader, organizer, researcher, designer, etc.)", category: "work styles" },
  { question_text: "What is something you struggle with when working in a team? (Example: procrastination, communication, etc.)", category: "work styles" },
  { question_text: "What is your worst team/group project experience?", category: "work styles" },
  { question_text: "How do you prefer to communicate (text, call, in-person)?", category: "preferences" },
  { question_text: "What's your ideal work schedule/time of day?", category: "preferences" },
  { question_text: "What's a skill you have that might surprise your teammates?", category: "skills" },
  { question_text: "What's your approach to handling disagreements?", category: "work styles" },
  { question_text: "What's a goal you have for this team/project?", category: "goals" },
];

export default function ManageIcebreakersPage({ params }: { params: { classId: string } }) {
  const classId = params.classId;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [icebreakerQuestions, setIcebreakerQuestions] = useState<any[]>([]);
  const [classIcebreakerQuestions, setClassIcebreakerQuestions] = useState<any[]>([]);

  const form = useForm<IcebreakerQuestionFormValues>({
    resolver: zodResolver(icebreakerQuestionSchema),
    defaultValues: {
      questionText: "",
      category: "",
    },
  });

  useEffect(() => {
    async function fetchIcebreakers() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Verify user is an instructor or TA for this class
      const { data: roleData, error: roleError } = await supabase
        .from("class_roles")
        .select("role")
        .eq("class_id", classId)
        .eq("user_id", user.id)
        .in("role", ["instructor", "TA"]);

      if (roleError || !roleData || roleData.length === 0) {
        console.error("Error checking user role or user is not authorized:", roleError);
        toast.error("You are not authorized to manage icebreakers for this class.");
        router.push(`/instructor/classes/${classId}`);
        setLoading(false);
        return;
      }

      // Fetch all global icebreaker questions
      const { data: globalQuestions, error: globalError } = await supabase
        .from("icebreaker_questions")
        .select("id, question_text, category")
        .order("created_at", { ascending: false });

      if (globalError) {
        console.error("Error fetching global icebreaker questions:", globalError);
        toast.error("Error loading global icebreaker questions.");
        setLoading(false);
        return;
      }
      setIcebreakerQuestions(globalQuestions || []);

      // Fetch icebreaker questions specifically assigned to this class
      const { data: classQuestions, error: classQuestionsError } = await supabase
        .from("class_icebreaker_questions") // Assuming a linking table
        .select(`
          question_id,
          icebreaker_questions(id, question_text, category)
        `)
        .eq("class_id", classId);

      if (classQuestionsError) {
        console.error("Error fetching class icebreaker questions:", classQuestionsError);
        toast.error("Error loading class-specific icebreaker questions.");
        setLoading(false);
        return;
      }
      setClassIcebreakerQuestions(classQuestions?.map(cq => cq.icebreaker_questions) || []);

      setLoading(false);
    }

    fetchIcebreakers();
  }, [classId, router, supabase]);

  const onSubmit = async (values: IcebreakerQuestionFormValues) => {
    const result = await addIcebreakerQuestionAction(classId, values);

    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Failed to add icebreaker question.");
    } else {
      toast.success("Icebreaker question added successfully!");
      form.reset();
      router.refresh();
    }
  };

  const handleRemoveQuestion = async (questionId: string) => {
    const result = await removeIcebreakerQuestionAction(classId, questionId);
    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Failed to remove icebreaker question.");
    } else {
      toast.success("Icebreaker question removed successfully!");
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p>Loading icebreakers...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold">Manage Icebreakers</h1>
            <p className="text-gray-600">Class ID: {classId}</p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/instructor/classes/${classId}`}>Back to Class Details</Link>
          </Button>
        </div>

        <h2 className="text-3xl font-bold mb-4">Add New Icebreaker Question</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mb-8">
            <FormField
              control={form.control}
              name="questionText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Text</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., What's your favorite coding language?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Fun Facts" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <PlusCircledIcon className="mr-2 h-4 w-4" /> Add Question
            </Button>
          </form>
        </Form>

        <h2 className="text-3xl font-bold mb-4">Class-Specific Icebreaker Questions</h2>
        {classIcebreakerQuestions.length === 0 ? (
          <p className="text-gray-600 mb-8">No icebreaker questions selected for this class yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {classIcebreakerQuestions.map((question) => (
              <Card key={question.id}>
                <CardHeader>
                  <CardTitle>{question.question_text}</CardTitle>
                  <CardDescription>{question.category || "General"}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-end">
                  <Button variant="destructive" size="sm" onClick={() => handleRemoveQuestion(question.id)}>
                    Remove from Class
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <h2 className="text-3xl font-bold mb-4">Available Global Icebreaker Questions</h2>
        {icebreakerQuestions.length === 0 ? (
          <p className="text-gray-600">No global icebreaker questions available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {icebreakerQuestions.map((question) => (
              <Card key={question.id}>
                <CardHeader>
                  <CardTitle>{question.question_text}</CardTitle>
                  <CardDescription>{question.category || "General"}</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-end">
                  {classIcebreakerQuestions.some(cq => cq.id === question.id) ? (
                    <Button variant="outline" disabled>
                      Added to Class
                    </Button>
                  ) : (
                    <Button onClick={() => onSubmit({ questionText: question.question_text, category: question.category })}>
                      Add to Class
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
