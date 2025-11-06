"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { submitSurveyResponseAction } from "./actions";

interface SurveyQuestion {
  question_text: string;
  type: "likert";
}

export default function CompleteSurveyPage({ params }: { params: { classId: string; surveyId: string } }) {
  const classId = params.classId;
  const surveyId = params.surveyId;
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSurveyData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Get student's team_id for this class
      const { data: roleData, error: roleError } = await supabase
        .from("class_roles")
        .select("team_id")
        .eq("user_id", user.id)
        .eq("class_id", classId)
        .eq("role", "student")
        .single();

      if (roleError || !roleData || !roleData.team_id) {
        console.error("Error fetching student's team or student not in a team for this class:", roleError);
        toast.error("You must be part of a team to complete this survey.");
        router.push(`/student/classes/${classId}/teams`);
        setLoading(false);
        return;
      }
      setTeamId(roleData.team_id);

      // Fetch survey details
      const { data: surveyData, error: surveyError } = await supabase
        .from("surveys")
        .select("id, questions, due_date, responses(id, user_id)")
        .eq("id", surveyId)
        .eq("class_id", classId)
        .single();

      if (surveyError || !surveyData) {
        console.error("Error fetching survey:", surveyError);
        toast.error("Survey not found or you don't have access.");
        router.push(`/student/dashboard`);
        setLoading(false);
        return;
      }

      // Check if already responded
      const hasResponded = surveyData.responses.some((response: any) => response.user_id === user.id);
      if (hasResponded) {
        toast.info("You have already completed this survey.");
        router.push(`/student/classes/${classId}/teams/${roleData.team_id}`);
        setLoading(false);
        return;
      }

      // Check if survey is due
      if (new Date(surveyData.due_date) < new Date()) {
        toast.info("This survey is past its due date and can no longer be completed.");
        router.push(`/student/classes/${classId}/teams/${roleData.team_id}`);
        setLoading(false);
        return;
      }

      setSurvey(surveyData);
      setAnswers(Array((surveyData.questions as SurveyQuestion[]).length).fill(""));
      setLoading(false);
    }

    fetchSurveyData();
  }, [classId, surveyId, router, supabase]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p>Loading survey...</p>
      </div>
    );
  }

  if (!survey || !teamId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-red-500">Could not load survey. Please try again later.</p>
      </div>
    );
  }

  const questions = survey.questions as SurveyQuestion[];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (answers[currentQuestionIndex] === "") {
      toast.error("Please select an answer before proceeding.");
      return;
    }
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (answers.some(answer => answer === "")) {
      toast.error("Please answer all questions before submitting.");
      return;
    }

    if (!teamId) {
        toast.error("Team information is missing. Cannot submit survey.");
        return;
    }

    const result = await submitSurveyResponseAction(surveyId, teamId, answers);

    if (result.error) {
      toast.error(typeof result.error === "string" ? result.error : "Failed to submit survey. Please try again.");
    } else {
      toast.success("Survey submitted successfully! Thank you for your feedback.");
      router.push(`/student/classes/${classId}/teams/${teamId}`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-3xl font-bold">Weekly Pulse Survey</h2>
        
        <Progress value={progress} className="w-full mb-6" />
        <p className="text-center text-sm text-gray-600 mb-6">Question {currentQuestionIndex + 1} of {totalQuestions}</p>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{currentQuestion.question_text}</CardTitle>
            <CardDescription>Select your response:</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup onValueChange={handleAnswerChange} value={answers[currentQuestionIndex]}>
              <div className="flex items-center space-x-2 mb-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="1" id="option-1" className="peer" />
                <Label htmlFor="option-1" className="flex-1 py-1">😞 Strongly Disagree</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="2" id="option-2" className="peer" />
                <Label htmlFor="option-2" className="flex-1 py-1">😕 Disagree</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="3" id="option-3" className="peer" />
                <Label htmlFor="option-3" className="flex-1 py-1">😐 Neutral</Label>
              </div>
              <div className="flex items-center space-x-2 mb-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="4" id="option-4" className="peer" />
                <Label htmlFor="option-4" className="flex-1 py-1">🙂 Agree</Label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="5" id="option-5" className="peer" />
                <Label htmlFor="option-5" className="flex-1 py-1">😄 Strongly Agree</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button onClick={handlePrevious} disabled={currentQuestionIndex === 0} variant="outline">Previous</Button>
          <Button onClick={handleNext}>
            {currentQuestionIndex < totalQuestions - 1 ? "Next" : "Submit Survey"}
          </Button>
        </div>
      </div>
    </div>
  );
}
