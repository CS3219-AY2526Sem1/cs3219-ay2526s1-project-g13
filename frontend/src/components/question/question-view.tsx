import {
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Question } from "@/types/question";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type ViewQuestionProps = {
  question: Question;
  onEdit: () => void;
};

export function QuestionView({ question, onEdit }: ViewQuestionProps) {
  const router = useRouter();

  return (
    <>
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
        <p>{question.details}</p>
      </CardContent>

      <CardContent>
        <p>{question.suggestedSolution}</p>
      </CardContent>
    </>
  );
}
