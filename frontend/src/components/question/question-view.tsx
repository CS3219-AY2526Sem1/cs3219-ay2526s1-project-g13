import {
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Question } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SolutionView } from "./solution-view";

type ViewQuestionProps = {
  question: Question;
  onEdit: () => void;
};

export function QuestionView({ question, onEdit }: ViewQuestionProps) {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  return (
    <Tabs defaultValue="question">
      <TabsList className="flex justify-center items-center gap-4 mx-auto w-auto">
        <TabsTrigger value="question">Question</TabsTrigger>
        <TabsTrigger value="solution">Solution</TabsTrigger>
      </TabsList>

      {/* Question Tab */}
      <TabsContent value="question">
        <CardHeader>
          <CardAction>
            <Button variant="link" onClick={() => router.push("/question")}>
              Back
            </Button>
            <Button variant="link" onClick={onEdit}>
              Edit
            </Button>
          </CardAction>

          <CardTitle>{question.title}</CardTitle>
          <CardDescription>
            {question.topic} • {question.difficulty}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <p>{question.description}</p>
        </CardContent>
      </TabsContent>

      {/* Solution Tab */}
      <TabsContent value="solution">
        <CardHeader>
          <CardTitle>Solutions</CardTitle>
          <CardDescription>View solutions here</CardDescription>
        </CardHeader>

        <CardContent>
          <SolutionView questionId={id} />
        </CardContent>
      </TabsContent>
    </Tabs>
  );
}
